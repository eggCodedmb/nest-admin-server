require('dotenv').config({ path: '.env.development' });
const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '39.108.137.45',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1234@Dong',
    database: process.env.DB_DATABASE || 'nest_admin',
  });

  const [cats] = await conn.query('SELECT * FROM art_category WHERE deleted_at IS NULL');
  console.log('Categories count:', cats.length);

  let categoryId;
  if (cats.length === 0) {
    const [c1] = await conn.query(
      "INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (0, '前端开发', 'frontend', 1, 1, 'Vue3, React, TypeScript 等前端技术')"
    );
    const [c2] = await conn.query(
      "INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (0, '后端架构', 'backend', 2, 1, 'NestJS, 微服务与高并发架构')"
    );
    await conn.query(
      "INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (?, 'Vue 生态', 'vue', 1, 1, 'Vue 3, Pinia, Vue Router 相关')",
      [c1.insertId]
    );
    categoryId = c2.insertId;
    console.log('Added default categories.');
  } else {
    categoryId = cats[0].id;
  }

  const [arts] = await conn.query('SELECT * FROM art_article WHERE deleted_at IS NULL');
  console.log('Articles count:', arts.length);

  if (arts.length === 0) {
    const sampleMd = `# NestJS 与 Vue3 企业级管理后台架构实践

## 1. 架构总览
本项目采用 NestJS 11 + TypeORM + Redis 作为后端基础架构，前端采用 Vue 3.5 + Element Plus 构建。

### 1.1 后端技术亮点
- 模块化高内聚设计
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
        id: 'heading-1',
        text: '1. 架构总览',
        level: 2,
        children: [
          { id: 'heading-2', text: '1.1 后端技术亮点', level: 3, children: [] },
          { id: 'heading-3', text: '1.2 前端技术亮点', level: 3, children: [] },
        ],
      },
      {
        id: 'heading-4',
        text: '2. 文章管理与审核流程',
        level: 2,
        children: [
          { id: 'heading-5', text: '2.1 审核状态机', level: 3, children: [] },
        ],
      },
      {
        id: 'heading-6',
        text: '3. 总结',
        level: 2,
        children: [],
      },
    ];

    await conn.query(
      `INSERT INTO art_article (category_id, author_id, title, summary, content, toc_data, tags, status, is_top, is_recommend, view_count, published_at)
       VALUES (?, 1, 'NestJS 与 Vue3 企业级管理后台架构实践', '全栈一体化文章管理模块与高效开发实践', ?, ?, 'NestJS,Vue3,Markdown', 2, 1, 1, 168, NOW(3))`,
      [categoryId, sampleMd, JSON.stringify(sampleToc)]
    );
    console.log('Added sample published article.');
  }

  await conn.end();
}

seed().catch(console.error);
