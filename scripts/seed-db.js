require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nest_admin',
    multipleStatements: true,
  });

  console.log('Connected to nest_admin database for seeding...');

  // Check if admin user already exists
  const [users] = await connection.query('SELECT id FROM sys_user WHERE username = ?', ['admin']);
  if (users.length > 0) {
    console.log('Seed data already present, skipping.');
    await connection.end();
    return;
  }

  // 1. Insert Top Department
  const [deptResult] = await connection.query(`
    INSERT INTO sys_dept (id, parent_id, mpath, dept_name, order_num, leader, phone, email, status)
    VALUES (1, 0, '1.', '集团总部', 1, 'Admin', '15888888888', 'admin@nest-admin.com', 1)
    ON DUPLICATE KEY UPDATE dept_name=VALUES(dept_name);
  `);

  // 2. Insert Roles
  await connection.query(`
    INSERT INTO sys_role (id, role_name, role_key, order_num, data_scope, status, remark)
    VALUES 
      (1, '超级管理员', 'admin', 1, 1, 1, '超级管理员拥有所有权限'),
      (2, '普通角色', 'common', 2, 2, 1, '普通角色具有本部门及以下数据权限')
    ON DUPLICATE KEY UPDATE role_name=VALUES(role_name);
  `);

  // 3. Insert Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await connection.query(`
    INSERT INTO sys_user (id, dept_id, username, nickname, password, email, phone, avatar, sex, status, remark)
    VALUES (1, 1, 'admin', '超级管理员', ?, 'admin@nest-admin.com', '15888888888', '', 1, 1, '系统预置超级管理员')
    ON DUPLICATE KEY UPDATE password=VALUES(password);
  `, [hashedPassword]);

  // 4. Bind Admin to Admin Role
  await connection.query(`
    INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1);
  `);

  // 5. Insert Base Menus
  const menus = [
    // Top Directory
    { id: 1, parent_id: 0, mpath: '1.', name: '系统管理', order: 1, path: '/system', component: 'Layout', type: 'M', icon: 'Setting', perms: '' },
    
    // User Menu
    { id: 100, parent_id: 1, mpath: '1.100.', name: '用户管理', order: 1, path: 'user', component: 'system/user/index', type: 'C', icon: 'User', perms: 'sys:user:list' },
    { id: 1001, parent_id: 100, mpath: '1.100.1001.', name: '用户查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:user:query' },
    { id: 1002, parent_id: 100, mpath: '1.100.1002.', name: '用户新增', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:user:create' },
    { id: 1003, parent_id: 100, mpath: '1.100.1003.', name: '用户修改', order: 3, path: '', component: '', type: 'F', icon: '#', perms: 'sys:user:update' },
    { id: 1004, parent_id: 100, mpath: '1.100.1004.', name: '用户删除', order: 4, path: '', component: '', type: 'F', icon: '#', perms: 'sys:user:delete' },
    { id: 1005, parent_id: 100, mpath: '1.100.1005.', name: '用户导出', order: 5, path: '', component: '', type: 'F', icon: '#', perms: 'sys:user:export' },

    // Role Menu
    { id: 101, parent_id: 1, mpath: '1.101.', name: '角色管理', order: 2, path: 'role', component: 'system/role/index', type: 'C', icon: 'UserFilled', perms: 'sys:role:list' },
    { id: 1011, parent_id: 101, mpath: '1.101.1011.', name: '角色查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:role:query' },
    { id: 1012, parent_id: 101, mpath: '1.101.1012.', name: '角色新增', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:role:create' },
    { id: 1013, parent_id: 101, mpath: '1.101.1013.', name: '角色修改', order: 3, path: '', component: '', type: 'F', icon: '#', perms: 'sys:role:update' },
    { id: 1014, parent_id: 101, mpath: '1.101.1014.', name: '角色删除', order: 4, path: '', component: '', type: 'F', icon: '#', perms: 'sys:role:delete' },

    // Menu Menu
    { id: 102, parent_id: 1, mpath: '1.102.', name: '菜单管理', order: 3, path: 'menu', component: 'system/menu/index', type: 'C', icon: 'Menu', perms: 'sys:menu:list' },
    { id: 1021, parent_id: 102, mpath: '1.102.1021.', name: '菜单查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:menu:query' },
    { id: 1022, parent_id: 102, mpath: '1.102.1022.', name: '菜单新增', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:menu:create' },
    { id: 1023, parent_id: 102, mpath: '1.102.1023.', name: '菜单修改', order: 3, path: '', component: '', type: 'F', icon: '#', perms: 'sys:menu:update' },
    { id: 1024, parent_id: 102, mpath: '1.102.1024.', name: '菜单删除', order: 4, path: '', component: '', type: 'F', icon: '#', perms: 'sys:menu:delete' },

    // Dept Menu
    { id: 103, parent_id: 1, mpath: '1.103.', name: '部门管理', order: 4, path: 'dept', component: 'system/dept/index', type: 'C', icon: 'OfficeBuilding', perms: 'sys:dept:list' },
    { id: 1031, parent_id: 103, mpath: '1.103.1031.', name: '部门查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dept:query' },
    { id: 1032, parent_id: 103, mpath: '1.103.1032.', name: '部门新增', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dept:create' },
    { id: 1033, parent_id: 103, mpath: '1.103.1033.', name: '部门修改', order: 3, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dept:update' },
    { id: 1034, parent_id: 103, mpath: '1.103.1034.', name: '部门删除', order: 4, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dept:delete' },

    // Dict Menu
    { id: 104, parent_id: 1, mpath: '1.104.', name: '字典管理', order: 5, path: 'dict', component: 'system/dict/index', type: 'C', icon: 'Collection', perms: 'sys:dict:list' },
    { id: 1041, parent_id: 104, mpath: '1.104.1041.', name: '字典查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dict:query' },
    { id: 1042, parent_id: 104, mpath: '1.104.1042.', name: '字典新增', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dict:create' },
    { id: 1043, parent_id: 104, mpath: '1.104.1043.', name: '字典修改', order: 3, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dict:update' },
    { id: 1044, parent_id: 104, mpath: '1.104.1044.', name: '字典删除', order: 4, path: '', component: '', type: 'F', icon: '#', perms: 'sys:dict:delete' },

    // Param Config Menu
    { id: 105, parent_id: 1, mpath: '1.105.', name: '参数设置', order: 6, path: 'config', component: 'system/config/index', type: 'C', icon: 'Tools', perms: 'sys:config:list' },
    { id: 1051, parent_id: 105, mpath: '1.105.1051.', name: '参数查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:config:query' },
    { id: 1052, parent_id: 105, mpath: '1.105.1052.', name: '参数修改', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:config:update' },

    // Oper Log Menu
    { id: 106, parent_id: 1, mpath: '1.106.', name: '操作日志', order: 7, path: 'log', component: 'system/log/index', type: 'C', icon: 'Document', perms: 'sys:log:list' },
    { id: 1061, parent_id: 106, mpath: '1.106.1061.', name: '日志查询', order: 1, path: '', component: '', type: 'F', icon: '#', perms: 'sys:log:query' },
    { id: 1062, parent_id: 106, mpath: '1.106.1062.', name: '日志删除', order: 2, path: '', component: '', type: 'F', icon: '#', perms: 'sys:log:delete' },
  ];

  for (const m of menus) {
    await connection.query(`
      INSERT INTO sys_menu (id, parent_id, mpath, menu_name, order_num, path, component, menu_type, perms, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE menu_name=VALUES(menu_name), perms=VALUES(perms);
    `, [m.id, m.parent_id, m.mpath, m.name, m.order, m.path, m.component, m.type, m.perms, m.icon]);

    // Bind all menus to admin role
    await connection.query(`
      INSERT IGNORE INTO sys_role_menu (role_id, menu_id) VALUES (1, ?);
    `, [m.id]);
  }

  // 6. Insert Dict Types and Dict Data
  await connection.query(`
    INSERT INTO sys_dict_type (id, dict_name, dict_type, status, remark)
    VALUES 
      (1, '用户性别', 'sys_user_sex', 1, '用户性别列表'),
      (2, '系统开关', 'sys_normal_disable', 1, '系统开关列表')
    ON DUPLICATE KEY UPDATE dict_name=VALUES(dict_name);
  `);

  await connection.query(`
    INSERT INTO sys_dict_data (id, dict_sort, dict_label, dict_value, dict_type, list_class, is_default, status)
    VALUES
      (1, 1, '男', '1', 'sys_user_sex', 'primary', 1, 1),
      (2, 2, '女', '2', 'sys_user_sex', 'danger', 0, 1),
      (3, 3, '未知', '0', 'sys_user_sex', 'default', 0, 1),
      (4, 1, '正常', '1', 'sys_normal_disable', 'primary', 1, 1),
      (5, 2, '停用', '0', 'sys_normal_disable', 'danger', 0, 1)
    ON DUPLICATE KEY UPDATE dict_label=VALUES(dict_label);
  `);

  // 7. Insert Initial Configs
  await connection.query(`
    INSERT INTO sys_config (id, config_name, config_key, config_value, config_type, remark)
    VALUES
      (1, '用户管理-账号初始密码', 'sys.user.initPassword', '123456', 1, '初始化密码 123456'),
      (2, '系统验证码开关', 'sys.account.captchaEnabled', 'true', 1, '是否开启登录验证码')
    ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);
  `);

  console.log('Seed completed successfully!');
  await connection.end();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
