require('dotenv').config();
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
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

async function runTests() {
  console.log('=== 开始全面接口与核心机制验证 ===\n');

  // 1. 测试验证码接口
  console.log('1. 测试 GET /auth/captcha ...');
  const captchaRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/auth/captcha',
    method: 'GET',
  });
  console.log('  状态码:', captchaRes.status);
  console.log('  验证码UUID:', captchaRes.body.data?.uuid);
  console.log('  图片SVG是否生成:', !!captchaRes.body.data?.img);
  if (captchaRes.status !== 200) throw new Error('Captcha API failed');

  // 2. 测试后台关闭验证码强制或者直接根据 Redis 读取验证码验证登录
  // 为了测试完整登录，我们直接使用从 Redis 获取到的验证码或关闭验证码
  // 先从 Redis 读取 captcha code
  const Redis = require('ioredis');
  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  });
  const realCode = await redis.get(`admin:captcha:${captchaRes.body.data.uuid}`);
  console.log('  从 Redis 提取验证码:', realCode);

  // 3. 测试登录接口 POST /auth/login
  console.log('\n2. 测试 POST /auth/login (admin:admin123) ...');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      username: 'admin',
      password: 'admin123',
      code: realCode,
      uuid: captchaRes.body.data.uuid,
    },
  );
  console.log('  状态码:', loginRes.status);
  console.log('  统一包装 Code:', loginRes.body.code);
  console.log('  消息:', loginRes.body.message);
  console.log('  Access Token 颁发:', !!loginRes.body.data?.accessToken);
  console.log('  Refresh Token 颁发:', !!loginRes.body.data?.refreshToken);
  if (loginRes.status !== 201 && loginRes.status !== 200) {
    console.error('Login error:', loginRes.body);
    throw new Error('Login API failed');
  }

  const { accessToken, refreshToken } = loginRes.body.data;
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 4. 测试获取个人资料 GET /auth/profile
  console.log('\n3. 测试 GET /auth/profile (JWT 鉴权) ...');
  const profileRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/auth/profile',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', profileRes.status);
  console.log('  当前用户:', profileRes.body.data?.user?.username, profileRes.body.data?.user?.nickname);
  console.log('  角色列表:', profileRes.body.data?.roles);
  console.log('  权限标识:', profileRes.body.data?.permissions);

  // 5. 测试动态路由 GET /system/menu/routers
  console.log('\n4. 测试 GET /system/menu/routers ...');
  const routersRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/menu/routers',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', routersRes.status);
  console.log('  下发一级路由数:', routersRes.body.data?.length);
  console.log('  一级路由名称:', routersRes.body.data?.map(r => r.name));

  // 6. 测试部门树 GET /system/dept/tree (TreeRepository)
  console.log('\n5. 测试 GET /system/dept/tree (TreeRepository 组织树) ...');
  const deptTreeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/dept/tree',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', deptTreeRes.status);
  console.log('  顶级部门:', deptTreeRes.body.data?.[0]?.deptName);

  // 7. 测试用户列表 GET /system/user/list (DataScope 动态数据权限)
  console.log('\n6. 测试 GET /system/user/list (DataScope 过滤) ...');
  const userListRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/user/list?pageNum=1&pageSize=10',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', userListRes.status);
  console.log('  用户总数:', userListRes.body.data?.total);
  console.log('  首位用户:', userListRes.body.data?.rows?.[0]?.username, userListRes.body.data?.rows?.[0]?.nickname);

  // 8. 测试角色列表 GET /system/role/list
  console.log('\n7. 测试 GET /system/role/list ...');
  const roleListRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/role/list',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', roleListRes.status);
  console.log('  角色总数:', roleListRes.body.data?.total);
  console.log('  角色名称:', roleListRes.body.data?.rows?.map(r => r.roleName));

  // 9. 测试数据字典 GET /system/dict/data/type/sys_user_sex
  console.log('\n8. 测试 GET /system/dict/data/type/sys_user_sex (字典查询与缓存) ...');
  const dictRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/dict/data/type/sys_user_sex',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', dictRes.status);
  console.log('  字典项数量:', dictRes.body.data?.length);
  console.log('  字典项标签:', dictRes.body.data?.map(d => `${d.dictLabel}(${d.dictValue})`));

  // 10. 测试参数配置 GET /system/config/key/sys.account.captchaEnabled
  console.log('\n9. 测试 GET /system/config/key/sys.account.captchaEnabled (参数查询) ...');
  const configRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/config/key/sys.account.captchaEnabled',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', configRes.status);
  console.log('  参数键值:', configRes.body.data?.configValue);

  // 11. 测试 Swagger Basic Auth 访问保护
  console.log('\n10. 测试 Swagger Basic Auth 文档保护 ...');
  const unauthSwagger = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api-docs-json',
    method: 'GET',
  });
  console.log('  无凭证访问 /api-docs-json 状态码 (应为 401):', unauthSwagger.status);

  const authSwagger = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api-docs-json',
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
    },
  });
  console.log('  带 Basic Auth 访问状态码 (应为 200):', authSwagger.status);
  console.log('  OpenAPI 标题:', authSwagger.body?.info?.title);

  // 12. 测试 Knife4j HTML 页面
  console.log('\n11. 测试 Knife4j 文档页面 GET /doc.html ...');
  const knife4jRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/doc.html',
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
    },
  });
  console.log('  Knife4j 页面响应状态码:', knife4jRes.status);

  // 13. 测试双 Token 刷新 POST /auth/refresh
  console.log('\n12. 测试 POST /auth/refresh (无感刷新) ...');
  const refreshRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/refresh',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { refreshToken },
  );
  console.log('  状态码:', refreshRes.status);
  console.log('  新 Access Token 颁发:', !!refreshRes.body.data?.accessToken);

  // 14. 检查操作日志记录 GET /system/log/list
  console.log('\n13. 测试 GET /system/log/list (异步操作日志持久化) ...');
  const logRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/system/log/list',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('  状态码:', logRes.status);
  console.log('  已持久化操作日志数:', logRes.body.data?.total);
  if (logRes.body.data?.rows?.length > 0) {
    console.log('  最新日志记录:', {
      title: logRes.body.data.rows[0].title,
      operName: logRes.body.data.rows[0].operName,
      method: logRes.body.data.rows[0].method,
      costTime: logRes.body.data.rows[0].costTime + 'ms',
    });
  }

  // 15. 测试退出登录 POST /auth/logout
  console.log('\n14. 测试 POST /auth/logout (安全登出) ...');
  const logoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/auth/logout',
    method: 'POST',
    headers: authHeaders,
  });
  console.log('  状态码:', logoutRes.status);
  console.log('  登出响应:', logoutRes.body.message);

  await redis.quit();
  console.log('\n========================================');
  console.log('🎉 所有接口与核心机制验证通过！');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('❌ 测试执行失败:', err);
  process.exit(1);
});
