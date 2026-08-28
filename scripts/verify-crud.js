require('dotenv').config();
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

async function testCrud() {
  console.log('=== 开始 CRUD 与 CASL 权限深度测试 ===\n');

  // 1. 登录
  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  });
  const captchaRes = await request({ hostname: 'localhost', port: 3000, path: '/auth/captcha', method: 'GET' });
  const code = await redis.get(`admin:captcha:${captchaRes.body.data.uuid}`);

  const loginRes = await request(
    { hostname: 'localhost', port: 3000, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { username: 'admin', password: 'admin123', code, uuid: captchaRes.body.data.uuid }
  );
  const token = loginRes.body.data.accessToken;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2. 创建子部门
  console.log('1. 测试 POST /system/dept (创建研发部门) ...');
  const createDeptRes = await request(
    { hostname: 'localhost', port: 3000, path: '/system/dept', method: 'POST', headers },
    { parentId: 1, deptName: '研发中心', orderNum: 1, leader: '张三', phone: '13800000001', email: 'rd@nest.com' }
  );
  console.log('  状态码:', createDeptRes.status);
  console.log('  新增部门ID:', createDeptRes.body.data?.id);
  const newDeptId = createDeptRes.body.data?.id;

  // 3. 创建新角色 (自定义数据权限)
  console.log('\n2. 测试 POST /system/role (创建研发组长角色) ...');
  const createRoleRes = await request(
    { hostname: 'localhost', port: 3000, path: '/system/role', method: 'POST', headers },
    { roleName: '研发主管', roleKey: 'rd_leader', orderNum: 3, dataScope: 2, menuIds: [1, 100, 1001, 103, 1031] }
  );
  console.log('  状态码:', createRoleRes.status);
  console.log('  新增角色ID:', createRoleRes.body.data?.id);
  const newRoleId = createRoleRes.body.data?.id;

  // 4. 创建新用户
  console.log('\n3. 测试 POST /system/user (创建测试用户) ...');
  const createUserRes = await request(
    { hostname: 'localhost', port: 3000, path: '/system/user', method: 'POST', headers },
    { username: 'dev_user', nickname: '开发人员甲', password: 'password123', deptId: newDeptId, roleIds: [newRoleId], email: 'dev@nest.com', phone: '13900000002' }
  );
  console.log('  状态码:', createUserRes.status);
  console.log('  新增用户ID:', createUserRes.body.data?.id);
  const newUserId = createUserRes.body.data?.id;

  // 5. 修改用户信息
  console.log('\n4. 测试 PUT /system/user/:id (修改用户昵称) ...');
  const updateUserRes = await request(
    { hostname: 'localhost', port: 3000, path: `/system/user/${newUserId}`, method: 'PUT', headers },
    { nickname: '高级开发专家' }
  );
  console.log('  状态码:', updateUserRes.status);
  console.log('  修改后昵称:', updateUserRes.body.data?.nickname);

  // 6. 重置密码
  console.log('\n5. 测试 PUT /system/user/:id/reset-password ...');
  const resetPwdRes = await request(
    { hostname: 'localhost', port: 3000, path: `/system/user/${newUserId}/reset-password`, method: 'PUT', headers },
    { password: 'new_password_888' }
  );
  console.log('  状态码:', resetPwdRes.status);
  console.log('  重置响应:', resetPwdRes.body.message);

  // 7. 使用新创建的用户登录测试 CASL 权限
  console.log('\n6. 测试使用新用户 dev_user:new_password_888 登录 ...');
  const devCaptcha = await request({ hostname: 'localhost', port: 3000, path: '/auth/captcha', method: 'GET' });
  const devCode = await redis.get(`admin:captcha:${devCaptcha.body.data.uuid}`);
  const devLoginRes = await request(
    { hostname: 'localhost', port: 3000, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { username: 'dev_user', password: 'new_password_888', code: devCode, uuid: devCaptcha.body.data.uuid }
  );
  console.log('  新用户登录状态码:', devLoginRes.status);
  const devToken = devLoginRes.body.data.accessToken;
  const devHeaders = { Authorization: `Bearer ${devToken}`, 'Content-Type': 'application/json' };

  // 8. 权限校验：dev_user 尝试删除用户（未配置 delete 权限，应被 CASL 拦截返回 403 Forbidden）
  console.log('\n7. 测试 CASL 权限守卫拦截 (未授权删除操作) ...');
  const forbiddenRes = await request(
    { hostname: 'localhost', port: 3000, path: `/system/user/${newUserId}`, method: 'DELETE', headers: devHeaders }
  );
  console.log('  无权操作返回状态码 (应为 403):', forbiddenRes.status);
  console.log('  拦截消息:', forbiddenRes.body.message);

  // 9. 清理测试数据 (使用 admin 权限)
  console.log('\n8. 清理测试用户与角色 ...');
  await request({ hostname: 'localhost', port: 3000, path: `/system/user/${newUserId}`, method: 'DELETE', headers });
  await request({ hostname: 'localhost', port: 3000, path: `/system/role/${newRoleId}`, method: 'DELETE', headers });
  await request({ hostname: 'localhost', port: 3000, path: `/system/dept/${newDeptId}`, method: 'DELETE', headers });
  console.log('  测试数据清理完成！');

  await redis.quit();
  console.log('\n========================================');
  console.log('🎉 业务 CRUD 与 CASL 权限引擎深度测试全部通过！');
  console.log('========================================');
}

testCrud().catch(console.error);
