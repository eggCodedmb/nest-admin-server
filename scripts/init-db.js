require('dotenv').config();
const mysql = require('mysql2/promise');

const ddl = `
CREATE DATABASE IF NOT EXISTS \`nest_admin\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE \`nest_admin\`;

-- 1. 部门表 (sys_dept)
CREATE TABLE IF NOT EXISTS \`sys_dept\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '部门ID',
  \`parent_id\` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父部门ID (0为顶级)',
  \`mpath\` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '物化路径 (TypeORM Tree 自动维护)',
  \`dept_name\` VARCHAR(50) NOT NULL COMMENT '部门名称',
  \`order_num\` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  \`leader\` VARCHAR(30) DEFAULT NULL COMMENT '负责人',
  \`phone\` VARCHAR(11) DEFAULT NULL COMMENT '联系电话',
  \`email\` VARCHAR(50) DEFAULT NULL COMMENT '邮箱',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '部门状态 (0停用 1正常)',
  \`created_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者ID',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  \`updated_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新者ID',
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  \`deleted_at\` DATETIME(3) DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_parent_id\` (\`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='部门表';

-- 2. 用户表 (sys_user)
CREATE TABLE IF NOT EXISTS \`sys_user\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  \`dept_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT '部门ID',
  \`username\` VARCHAR(30) NOT NULL COMMENT '用户账号',
  \`nickname\` VARCHAR(30) NOT NULL COMMENT '用户昵称',
  \`password\` VARCHAR(100) NOT NULL COMMENT '加密密码',
  \`email\` VARCHAR(50) DEFAULT NULL COMMENT '用户邮箱',
  \`phone\` VARCHAR(11) DEFAULT NULL COMMENT '手机号码',
  \`avatar\` VARCHAR(255) DEFAULT NULL COMMENT '头像地址',
  \`sex\` TINYINT DEFAULT 0 COMMENT '用户性别 (0未知 1男 2女)',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '帐号状态 (0停用 1正常)',
  \`login_ip\` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  \`login_date\` DATETIME(3) DEFAULT NULL COMMENT '最后登录时间',
  \`remark\` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  \`created_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者ID',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  \`updated_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新者ID',
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  \`deleted_at\` DATETIME(3) DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_username\` (\`username\`),
  KEY \`idx_dept_id\` (\`dept_id\`),
  KEY \`idx_phone\` (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户信息表';

-- 3. 角色表 (sys_role)
CREATE TABLE IF NOT EXISTS \`sys_role\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  \`role_name\` VARCHAR(30) NOT NULL COMMENT '角色名称',
  \`role_key\` VARCHAR(100) NOT NULL COMMENT '角色权限字符 (如: admin, common)',
  \`order_num\` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  \`data_scope\` TINYINT NOT NULL DEFAULT 1 COMMENT '数据范围 (1全部 2本部门及以下 3本部门 4仅本人 5自定义)',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '角色状态 (0停用 1正常)',
  \`remark\` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  \`created_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者ID',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  \`updated_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新者ID',
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  \`deleted_at\` DATETIME(3) DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_role_key\` (\`role_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色信息表';

-- 4. 菜单权限表 (sys_menu)
CREATE TABLE IF NOT EXISTS \`sys_menu\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  \`parent_id\` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父菜单ID',
  \`mpath\` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '物化路径',
  \`menu_name\` VARCHAR(50) NOT NULL COMMENT '菜单名称',
  \`order_num\` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  \`path\` VARCHAR(200) DEFAULT '' COMMENT '路由地址',
  \`component\` VARCHAR(255) DEFAULT NULL COMMENT '组件路径',
  \`is_frame\` TINYINT NOT NULL DEFAULT 0 COMMENT '是否为外链 (0否 1是)',
  \`is_cache\` TINYINT NOT NULL DEFAULT 1 COMMENT '是否缓存 (0不缓存 1缓存)',
  \`menu_type\` CHAR(1) NOT NULL COMMENT '菜单类型 (M目录 C菜单 F按钮)',
  \`visible\` TINYINT NOT NULL DEFAULT 1 COMMENT '显示状态 (0隐藏 1显示)',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '菜单状态 (0停用 1正常)',
  \`perms\` VARCHAR(100) DEFAULT NULL COMMENT '权限标识 (如: sys:user:add)',
  \`icon\` VARCHAR(100) DEFAULT '#' COMMENT '菜单图标',
  \`remark\` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_parent_id\` (\`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='菜单权限表';

-- 5. 关联表
CREATE TABLE IF NOT EXISTS \`sys_user_role\` (
  \`user_id\` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  \`role_id\` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  PRIMARY KEY (\`user_id\`, \`role_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户和角色关联表';

CREATE TABLE IF NOT EXISTS \`sys_role_menu\` (
  \`role_id\` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  \`menu_id\` BIGINT UNSIGNED NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (\`role_id\`, \`menu_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色和菜单关联表';

CREATE TABLE IF NOT EXISTS \`sys_role_dept\` (
  \`role_id\` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  \`dept_id\` BIGINT UNSIGNED NOT NULL COMMENT '部门ID',
  PRIMARY KEY (\`role_id\`, \`dept_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色和部门关联表';

-- 6. 数据字典表
CREATE TABLE IF NOT EXISTS \`sys_dict_type\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '字典主键',
  \`dict_name\` VARCHAR(100) NOT NULL COMMENT '字典名称',
  \`dict_type\` VARCHAR(100) NOT NULL COMMENT '字典类型唯一标识',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 (0停用 1正常)',
  \`remark\` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_dict_type\` (\`dict_type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典类型表';

CREATE TABLE IF NOT EXISTS \`sys_dict_data\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '字典编码',
  \`dict_sort\` INT NOT NULL DEFAULT 0 COMMENT '字典排序',
  \`dict_label\` VARCHAR(100) NOT NULL COMMENT '字典标签',
  \`dict_value\` VARCHAR(100) NOT NULL COMMENT '字典键值',
  \`dict_type\` VARCHAR(100) NOT NULL COMMENT '字典类型',
  \`css_class\` VARCHAR(100) DEFAULT NULL COMMENT '样式属性',
  \`list_class\` VARCHAR(100) DEFAULT NULL COMMENT '回显样式 (default/primary/danger)',
  \`is_default\` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认 (1是 0否)',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 (0停用 1正常)',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`idx_dict_type\` (\`dict_type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典数据表';

-- 7. 操作日志表 (sys_oper_log)
CREATE TABLE IF NOT EXISTS \`sys_oper_log\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志主键',
  \`title\` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '模块标题',
  \`business_type\` TINYINT NOT NULL DEFAULT 0 COMMENT '业务类型 (1新增 2修改 3删除 4导出 5导入 0其他)',
  \`method\` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '方法名称',
  \`request_method\` VARCHAR(10) NOT NULL DEFAULT '' COMMENT '请求方式',
  \`oper_user_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人员ID',
  \`oper_name\` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '操作人员账号',
  \`dept_name\` VARCHAR(50) DEFAULT NULL COMMENT '部门名称',
  \`oper_url\` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '请求URL',
  \`oper_ip\` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '主机地址',
  \`oper_location\` VARCHAR(255) DEFAULT '' COMMENT '操作地点',
  \`oper_param\` JSON DEFAULT NULL COMMENT '请求参数 (JSON)',
  \`json_result\` JSON DEFAULT NULL COMMENT '返回参数 (JSON)',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '操作状态 (1正常 0异常)',
  \`error_msg\` TEXT DEFAULT NULL COMMENT '错误消息',
  \`cost_time\` BIGINT NOT NULL DEFAULT 0 COMMENT '消耗时间(ms)',
  \`oper_time\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '操作时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_oper_time\` (\`oper_time\`),
  KEY \`idx_oper_user_id\` (\`oper_user_id\`),
  KEY \`idx_business_type\` (\`business_type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='操作日志记录';

-- 8. 参数配置表 (sys_config)
CREATE TABLE IF NOT EXISTS \`sys_config\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参数主键',
  \`config_name\` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '参数名称',
  \`config_key\` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '参数键名',
  \`config_value\` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '参数键值',
  \`config_type\` TINYINT NOT NULL DEFAULT 1 COMMENT '系统内置 (1是 0否)',
  \`remark\` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_config_key\` (\`config_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='参数配置表';
`;

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL server.');
  await connection.query(ddl);
  console.log('Database and tables initialized successfully.');

  // Check tables
  const [tables] = await connection.query('SHOW TABLES FROM nest_admin;');
  console.log('Tables in nest_admin:', tables);

  await connection.end();
}

main().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
