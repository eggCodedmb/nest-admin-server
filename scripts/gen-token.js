const { JwtService } = require('@nestjs/jwt');
const jwtService = new JwtService({ secret: 'super_secret_jwt_key_2026' });
const token = jwtService.sign({
  userId: 1,
  username: 'admin',
  deptId: 1,
  deptName: '集团总部',
  roles: [{ id: 1, roleName: '超级管理员', roleKey: 'admin', dataScope: 1 }],
  permissions: ['*:*:*']
}, { expiresIn: '7d' });
console.log(token);
