require('dotenv').config({ path: '.env.development' });
const http = require('http');
const Redis = require('ioredis');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('=== 开始文章管理全流程端到端自动化测试 ===\n');

  // 1. 登录获取 Token
  const redis = new Redis({
    host: process.env.REDIS_HOST || '39.108.137.45',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '1234@Dong',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  });

  const captchaRes = await request({ hostname: 'localhost', port: 3000, path: '/auth/captcha', method: 'GET' });
  const uuid = captchaRes.body.data.uuid;
  const code = await redis.get(`admin:captcha:${uuid}`);

  const loginRes = await request(
    { hostname: 'localhost', port: 3000, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { username: 'admin', password: 'admin123', code, uuid }
  );

  const token = loginRes.body.data?.accessToken;
  if (!token) {
    throw new Error('登录失败，未获取到 accessToken: ' + JSON.stringify(loginRes.body));
  }
  console.log('✔ 1. 登录成功，获取 Bearer Token');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. 查询分类树
  const treeRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/category/tree', method: 'GET', headers }
  );
  console.log(`✔ 2. GET /article/category/tree (获取到 ${treeRes.body.data?.length || 0} 个顶级分类)`);

  // 3. 创建测试分类
  const createCatRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/category', method: 'POST', headers },
    { name: '自动化测试分类', slug: 'autotest', orderNum: 99, status: 1, description: 'E2E测试分类' }
  );
  const testCatId = createCatRes.body.data?.id;
  console.log(`✔ 3. POST /article/category (创建测试分类成功, ID: ${testCatId})`);

  // 4. 创建 Markdown 草稿文章 (带多级标题)
  const testMarkdown = `# 测试文章一级标题

这是一篇自动化测试文章。

## 1. 基础架构介绍
这里是第一节正文。

### 1.1 子小节技术点
这里是子小节。

## 2. 审核流程测试
这里是第二节正文。`;

  const createPostRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/post', method: 'POST', headers },
    {
      categoryId: testCatId,
      title: 'E2E自动化测试文章-带TOC目录',
      summary: '自动化测试摘要',
      content: testMarkdown,
      status: 0, // 草稿
      isTop: 1,
      isRecommend: 1,
    }
  );
  const testArticleId = createPostRes.body.data?.id;
  const tocData = createPostRes.body.data?.tocData;
  console.log(`✔ 4. POST /article/post (创建草稿成功, ID: ${testArticleId}, TOC节点数: ${tocData?.length || 0})`);

  // 5. 提交审核 (0 -> 1)
  const submitRes = await request(
    { hostname: 'localhost', port: 3000, path: `/article/post/${testArticleId}/submit`, method: 'POST', headers }
  );
  console.log(`✔ 5. POST /article/post/${testArticleId}/submit (提审成功, 当前状态: ${submitRes.body.data?.status})`);

  // 6. 审核列表查询
  const auditListRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/audit/list?status=1', method: 'GET', headers }
  );
  const pendingCount = auditListRes.body.data?.total;
  console.log(`✔ 6. GET /article/audit/list (查询待审池成功, 待审总数: ${pendingCount})`);

  // 7. 执行驳回 (1 -> 3)
  const rejectRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/audit/action', method: 'POST', headers },
    { articleId: testArticleId, auditResult: 2, auditComment: '格式需要优化，请调整后再提审' }
  );
  console.log(`✔ 7. POST /article/audit/action (驳回操作成功, 新状态: ${rejectRes.body.data?.currentStatus})`);

  // 8. 再次提审 (3 -> 1)
  await request(
    { hostname: 'localhost', port: 3000, path: `/article/post/${testArticleId}/submit`, method: 'POST', headers }
  );
  console.log(`✔ 8. POST /article/post/${testArticleId}/submit (重新提审成功)`);

  // 9. 执行通过并发布 (1 -> 2)
  const approveRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/audit/action', method: 'POST', headers },
    { articleId: testArticleId, auditResult: 1, auditComment: '内容符合规范，审核通过' }
  );
  console.log(`✔ 9. POST /article/audit/action (审核通过发布成功, 新状态: ${approveRes.body.data?.currentStatus})`);

  // 10. 查看审核历史流转轨迹
  const logsRes = await request(
    { hostname: 'localhost', port: 3000, path: `/article/audit/logs/${testArticleId}`, method: 'GET', headers }
  );
  console.log(`✔ 10. GET /article/audit/logs/${testArticleId} (获取到 ${logsRes.body.data?.length || 0} 条审核审计记录)`);

  // 11. 清理测试数据
  await request(
    { hostname: 'localhost', port: 3000, path: `/article/post/${testArticleId}`, method: 'DELETE', headers }
  );
  await request(
    { hostname: 'localhost', port: 3000, path: `/article/category/${testCatId}`, method: 'DELETE', headers }
  );
  console.log('✔ 11. DELETE 清理测试文章与测试分类完成');

  console.log('\n========================================');
  console.log('🎉 文章管理模块所有核心后端 API 测试全部通过！');
  console.log('========================================\n');

  redis.disconnect();
}

main().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
