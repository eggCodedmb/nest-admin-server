require('dotenv').config({ path: '.env.development' });
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '39.108.137.45',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1234@Dong',
    database: process.env.DB_DATABASE || 'nest_admin',
    multipleStatements: true,
  });

  console.log('Connected to MySQL successfully. Initializing article module tables and menus...');

  const ddl = `
  -- 1. 文章分类表 (art_category)
  CREATE TABLE IF NOT EXISTS \`art_category\` (
    \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    \`parent_id\` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父分类ID (0为顶级)',
    \`mpath\` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '物化路径 (TypeORM Tree)',
    \`name\` VARCHAR(50) NOT NULL COMMENT '分类名称',
    \`slug\` VARCHAR(60) DEFAULT NULL COMMENT '分类英文别名/Slug',
    \`icon\` VARCHAR(255) DEFAULT NULL COMMENT '分类图标或图片',
    \`order_num\` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
    \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 (0停用 1启用)',
    \`description\` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
    \`created_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者ID',
    \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    \`updated_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新者ID',
    \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    \`deleted_at\` DATETIME(3) DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (\`id\`),
    KEY \`idx_parent_id\` (\`parent_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文章分类表';

  -- 2. 文章主表 (art_article)
  CREATE TABLE IF NOT EXISTS \`art_article\` (
    \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文章ID',
    \`category_id\` BIGINT UNSIGNED NOT NULL COMMENT '所属分类ID',
    \`author_id\` BIGINT UNSIGNED NOT NULL COMMENT '作者用户ID',
    \`title\` VARCHAR(200) NOT NULL COMMENT '文章标题',
    \`slug\` VARCHAR(200) DEFAULT NULL COMMENT '文章自定义Slug',
    \`summary\` VARCHAR(500) DEFAULT NULL COMMENT '文章摘要',
    \`cover_image\` VARCHAR(500) DEFAULT NULL COMMENT '封面图片URL',
    \`content\` LONGTEXT NOT NULL COMMENT 'Markdown 源码',
    \`content_html\` LONGTEXT DEFAULT NULL COMMENT '渲染后的 HTML 内容',
    \`toc_data\` JSON DEFAULT NULL COMMENT '文章目录树 (JSON)',
    \`tags\` VARCHAR(255) DEFAULT NULL COMMENT '文章标签 (逗号分隔)',
    \`source_type\` TINYINT NOT NULL DEFAULT 1 COMMENT '来源 (1原创 2转载 3翻译)',
    \`source_url\` VARCHAR(500) DEFAULT NULL COMMENT '原文链接',
    \`status\` TINYINT NOT NULL DEFAULT 0 COMMENT '文章状态 (0草稿 1待审 2发布 3驳回 4下架)',
    \`is_top\` TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶 (0否 1是)',
    \`is_recommend\` TINYINT NOT NULL DEFAULT 0 COMMENT '是否推荐 (0否 1是)',
    \`allow_comment\` TINYINT NOT NULL DEFAULT 1 COMMENT '是否允许评论 (0否 1是)',
    \`view_count\` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览阅读量',
    \`like_count\` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
    \`published_at\` DATETIME(3) DEFAULT NULL COMMENT '正式发布时间',
    \`created_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者ID',
    \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    \`updated_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新者ID',
    \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    \`deleted_at\` DATETIME(3) DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (\`id\`),
    KEY \`idx_category_id\` (\`category_id\`),
    KEY \`idx_author_id\` (\`author_id\`),
    KEY \`idx_status\` (\`status\`),
    KEY \`idx_published_at\` (\`published_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文章主表';

  -- 3. 文章审核记录表 (art_audit_log)
  CREATE TABLE IF NOT EXISTS \`art_audit_log\` (
    \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审核记录ID',
    \`article_id\` BIGINT UNSIGNED NOT NULL COMMENT '文章ID',
    \`auditor_id\` BIGINT UNSIGNED NOT NULL COMMENT '审核人ID',
    \`previous_status\` TINYINT NOT NULL COMMENT '流转前状态',
    \`current_status\` TINYINT NOT NULL COMMENT '流转后状态',
    \`audit_result\` TINYINT NOT NULL COMMENT '审核动作 (1通过 2驳回 3下架)',
    \`audit_comment\` VARCHAR(1000) DEFAULT NULL COMMENT '审核批注/驳回原因',
    \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '审核时间',
    PRIMARY KEY (\`id\`),
    KEY \`idx_article_id\` (\`article_id\`),
    KEY \`idx_auditor_id\` (\`auditor_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文章审核历史表';
  `;

  await connection.query(ddl);
  console.log('Tables created successfully.');

  // 初始化菜单与权限
  const [existingMenu] = await connection.query("SELECT id FROM sys_menu WHERE path = 'article' LIMIT 1");
  let articleMenuId;

  if (existingMenu && existingMenu.length > 0) {
    articleMenuId = existingMenu[0].id;
    console.log(`Article menu already exists with ID: ${articleMenuId}`);
  } else {
    const [res] = await connection.query(
      `INSERT INTO sys_menu (parent_id, menu_name, order_num, path, component, menu_type, visible, status, perms, icon)
       VALUES (0, '文章管理', 6, 'article', 'Layout', 'M', 1, 1, '', 'Document')`
    );
    articleMenuId = res.insertId;
    console.log(`Created Article menu with ID: ${articleMenuId}`);
  }

  // 子菜单及按钮定义
  const subMenus = [
    {
      name: '文章分类',
      order: 1,
      path: 'category',
      component: 'article/category/index',
      perms: 'article:category:list',
      icon: 'Folder',
      buttons: [
        { name: '分类查询', perms: 'article:category:query' },
        { name: '分类新增', perms: 'article:category:create' },
        { name: '分类修改', perms: 'article:category:update' },
        { name: '分类删除', perms: 'article:category:delete' },
      ],
    },
    {
      name: '文章管理',
      order: 2,
      path: 'post',
      component: 'article/post/index',
      perms: 'article:post:list',
      icon: 'EditPen',
      buttons: [
        { name: '文章查询', perms: 'article:post:query' },
        { name: '文章新增', perms: 'article:post:create' },
        { name: '文章修改', perms: 'article:post:update' },
        { name: '文章删除', perms: 'article:post:delete' },
        { name: '文章发布', perms: 'article:post:publish' },
        { name: '提交审核', perms: 'article:post:submit' },
      ],
    },
    {
      name: '文章审核',
      order: 3,
      path: 'audit',
      component: 'article/audit/index',
      perms: 'article:audit:list',
      icon: 'Checked',
      buttons: [
        { name: '待审查询', perms: 'article:audit:query' },
        { name: '审核通过', perms: 'article:audit:approve' },
        { name: '审核驳回', perms: 'article:audit:reject' },
        { name: '审核日志', perms: 'article:audit:log' },
      ],
    },
  ];

  for (const sub of subMenus) {
    const [subExists] = await connection.query(
      "SELECT id FROM sys_menu WHERE parent_id = ? AND path = ? LIMIT 1",
      [articleMenuId, sub.path]
    );
    let subMenuId;
    if (subExists && subExists.length > 0) {
      subMenuId = subExists[0].id;
    } else {
      const [subRes] = await connection.query(
        `INSERT INTO sys_menu (parent_id, menu_name, order_num, path, component, menu_type, visible, status, perms, icon)
         VALUES (?, ?, ?, ?, ?, 'C', 1, 1, ?, ?)`,
        [articleMenuId, sub.name, sub.order, sub.path, sub.component, sub.perms, sub.icon]
      );
      subMenuId = subRes.insertId;
      console.log(`Created Submenu: ${sub.name} (ID: ${subMenuId})`);
    }

    for (const btn of sub.buttons) {
      const [btnExists] = await connection.query(
        "SELECT id FROM sys_menu WHERE parent_id = ? AND perms = ? LIMIT 1",
        [subMenuId, btn.perms]
      );
      if (!btnExists || btnExists.length === 0) {
        await connection.query(
          `INSERT INTO sys_menu (parent_id, menu_name, order_num, path, component, menu_type, visible, status, perms, icon)
           VALUES (?, ?, 0, '', NULL, 'F', 1, 1, ?, '#')`,
          [subMenuId, btn.name, btn.perms]
        );
        console.log(`Created button perm: ${btn.name} (${btn.perms})`);
      }
    }
  }

  // 绑定超级管理员角色 (role_id = 1)
  const [allMenus] = await connection.query(
    "SELECT id FROM sys_menu WHERE path = 'article' OR parent_id = ? OR parent_id IN (SELECT id FROM sys_menu WHERE parent_id = ?)",
    [articleMenuId, articleMenuId]
  );
  for (const m of allMenus) {
    await connection.query(
      "INSERT IGNORE INTO sys_role_menu (role_id, menu_id) VALUES (1, ?)",
      [m.id]
    );
  }

  // 插入初始默认分类与示例文章
  const [catCount] = await connection.query("SELECT COUNT(*) as cnt FROM art_category");
  if (catCount[0].cnt === 0) {
    const [c1] = await connection.query(
      "INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (0, '前端技术', 'frontend', 1, 1, 'Vue3, React, TypeScript 等前端开发技术')"
    );
    const [c2] = await connection.query(
      "INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (0, '后端架构', 'backend', 2, 1, 'NestJS, Node.js, 微服务与高并发架构')"
    );
    await connection.query(
      "INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (?, 'Vue 生态', 'vue', 1, 1, 'Vue 3, Pinia, Vue Router 相关')",
      [c1.insertId]
    );

    const sampleMd = `# NestJS 与 Vue3 企业级管理后台架构实践

## 1. 架构总览
本项目采用 NestJS 11 + TypeORM + Redis 作为后端基础架构，前端采用 Vue 3.5 + Element Plus 构建。

### 1.1 后端技术亮点
- 模块化架构设计
- CASL 细粒度权限管控
- TypeORM 自动事务与树形实体

### 1.2 前端技术亮点
- 基于 ProTable 快速构建管理列表
- 集成 md-editor-v3 提供极致 Markdown 写作与大纲目录体验

## 2. 文章管理与审核流程
文章支持草稿保存、提交审核、审批通过与驳回反馈。

### 2.1 审核状态机
- 草稿 -> 待审核 -> 已发布 / 已驳回 -> 已下架

## 3. 总结
全栈一体化开发方案能够显著提高开发效率与系统稳定性。`;

    const sampleToc = [
      {
        id: "heading-1",
        text: "1. 架构总览",
        level: 2,
        children: [
          { id: "heading-2", text: "1.1 后端技术亮点", level: 3, children: [] },
          { id: "heading-3", text: "1.2 前端技术亮点", level: 3, children: [] }
        ]
      },
      {
        id: "heading-4",
        text: "2. 文章管理与审核流程",
        level: 2,
        children: [
          { id: "heading-5", text: "2.1 审核状态机", level: 3, children: [] }
        ]
      },
      {
        id: "heading-6",
        text: "3. 总结",
        level: 2,
        children: []
      }
    ];

    await connection.query(
      `INSERT INTO art_article (category_id, author_id, title, summary, content, toc_data, tags, status, is_top, is_recommend, view_count, published_at)
       VALUES (?, 1, 'NestJS 与 Vue3 企业级管理后台架构实践', '全栈一体化文章管理模块与高效开发实践', ?, ?, 'NestJS,Vue3,Markdown', 2, 1, 1, 128, NOW(3))`,
      [c2.insertId, sampleMd, JSON.stringify(sampleToc)]
    );

    console.log('Inserted default categories and sample article.');
  }

  console.log('Database initialization completed successfully!');
  await connection.end();
}

main().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
