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

  console.log('Connected to MySQL. Initializing Recommend Rule table and Article fields...');

  // 1. 创建 art_recommend_rule 推荐策略规则表
  const createTableSql = `
  CREATE TABLE IF NOT EXISTS \`art_recommend_rule\` (
    \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '策略ID',
    \`name\` VARCHAR(100) NOT NULL COMMENT '策略名称',
    \`rule_code\` VARCHAR(60) NOT NULL COMMENT '策略唯一编码',
    \`algorithm_type\` VARCHAR(40) NOT NULL DEFAULT 'HYBRID' COMMENT '算法类型(HYBRID综合/HOT_DECAY时效衰减/COLD_START冷启动/CONTENT_BASED相关度)',
    \`weights\` JSON NOT NULL COMMENT '因子权重配置JSON',
    \`cold_start_config\` JSON NOT NULL COMMENT '冷启动扶持配置JSON',
    \`diversity_config\` JSON NOT NULL COMMENT '多样性与打散配置JSON',
    \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态(0停用 1启用)',
    \`is_default\` TINYINT NOT NULL DEFAULT 0 COMMENT '是否为全局默认激活策略(0否 1是)',
    \`description\` VARCHAR(500) DEFAULT NULL COMMENT '策略描述',
    \`remark\` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    \`created_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者ID',
    \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    \`updated_by\` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新者ID',
    \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    \`deleted_at\` DATETIME(3) DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uniq_rule_code\` (\`rule_code\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文章推荐算法策略规则表';
  `;
  await connection.query(createTableSql);
  console.log('Table art_recommend_rule created/verified successfully.');

  // 2. 为 art_article 扩展推荐控制字段
  const [columns] = await connection.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'art_article'
  `);
  const colNames = columns.map((c) => c.COLUMN_NAME);

  if (!colNames.includes('recommend_weight')) {
    await connection.query(`
      ALTER TABLE \`art_article\`
      ADD COLUMN \`recommend_weight\` INT NOT NULL DEFAULT 0 COMMENT '人工推荐干预权重分值(-100~+100)' AFTER \`is_recommend\`
    `);
    console.log('Added column recommend_weight to art_article.');
  }

  if (!colNames.includes('recommend_factor')) {
    await connection.query(`
      ALTER TABLE \`art_article\`
      ADD COLUMN \`recommend_factor\` TINYINT NOT NULL DEFAULT 0 COMMENT '推荐干预模式(0默认算法 1强制强推 2算法屏蔽禁推 3冷启动强制扶持)' AFTER \`recommend_weight\`
    `);
    console.log('Added column recommend_factor to art_article.');
  }

  if (!colNames.includes('recommend_expire_at')) {
    await connection.query(`
      ALTER TABLE \`art_article\`
      ADD COLUMN \`recommend_expire_at\` DATETIME(3) DEFAULT NULL COMMENT '推荐提权有效期截止时间' AFTER \`recommend_factor\`
    `);
    console.log('Added column recommend_expire_at to art_article.');
  }

  // 3. 预置默认算法策略
  const [existingRules] = await connection.query('SELECT COUNT(*) as cnt FROM art_recommend_rule');
  if (existingRules[0].cnt === 0) {
    const defaultRules = [
      {
        name: '综合多因子平衡推荐 (默认全局策略)',
        rule_code: 'DEFAULT_HYBRID',
        algorithm_type: 'HYBRID',
        weights: JSON.stringify({
          viewWeight: 20,
          likeWeight: 40,
          commentWeight: 30,
          timeDecayRate: 1.5, // 半衰期指数 Gravity
          tagMatchWeight: 35,
          categoryMatchWeight: 30,
          manualBoostWeight: 50,
        }),
        cold_start_config: JSON.stringify({
          enableColdStart: true,
          boostDays: 7,
          boostScoreMultiplier: 1.6,
          minImpressionsThreshold: 200,
        }),
        diversity_config: JSON.stringify({
          maxPerCategory: 3,
          exploreRate: 0.1, // 10% 探索随机池
          dedupHistoryDays: 7,
        }),
        status: 1,
        is_default: 1,
        description: '兼顾文章互动热度、发布时效衰减、冷启动保量扶持与人工精选权重的全能推荐算法。',
      },
      {
        name: '热门时效衰减模型 (Hacker News 模型)',
        rule_code: 'HOT_DECAY_GRAVITY',
        algorithm_type: 'HOT_DECAY',
        weights: JSON.stringify({
          viewWeight: 15,
          likeWeight: 50,
          commentWeight: 35,
          timeDecayRate: 1.8,
          tagMatchWeight: 10,
          categoryMatchWeight: 10,
          manualBoostWeight: 30,
        }),
        cold_start_config: JSON.stringify({
          enableColdStart: false,
          boostDays: 3,
          boostScoreMultiplier: 1.2,
          minImpressionsThreshold: 50,
        }),
        diversity_config: JSON.stringify({
          maxPerCategory: 2,
          exploreRate: 0.05,
          dedupHistoryDays: 3,
        }),
        status: 1,
        is_default: 0,
        description: '侧重近期高互动爆款文章，重力衰减速度较快，适合新闻与热点资讯场景。',
      },
      {
        name: '新文冷启动保量扶持模型',
        rule_code: 'COLD_START_BOOSTER',
        algorithm_type: 'COLD_START',
        weights: JSON.stringify({
          viewWeight: 20,
          likeWeight: 30,
          commentWeight: 20,
          timeDecayRate: 1.0,
          tagMatchWeight: 40,
          categoryMatchWeight: 40,
          manualBoostWeight: 40,
        }),
        cold_start_config: JSON.stringify({
          enableColdStart: true,
          boostDays: 14,
          boostScoreMultiplier: 2.2,
          minImpressionsThreshold: 500,
        }),
        diversity_config: JSON.stringify({
          maxPerCategory: 4,
          exploreRate: 0.2,
          dedupHistoryDays: 14,
        }),
        status: 1,
        is_default: 0,
        description: '大幅提升近 14 天内新发布文章的基础曝光率与探索权重，激励创作者积极产出。',
      },
      {
        name: '深度互动高粘性模型',
        rule_code: 'DEEP_ENGAGEMENT',
        algorithm_type: 'HYBRID',
        weights: JSON.stringify({
          viewWeight: 10,
          likeWeight: 35,
          commentWeight: 55,
          timeDecayRate: 1.2,
          tagMatchWeight: 45,
          categoryMatchWeight: 35,
          manualBoostWeight: 40,
        }),
        cold_start_config: JSON.stringify({
          enableColdStart: true,
          boostDays: 10,
          boostScoreMultiplier: 1.4,
          minImpressionsThreshold: 200,
        }),
        diversity_config: JSON.stringify({
          maxPerCategory: 3,
          exploreRate: 0.1,
          dedupHistoryDays: 7,
        }),
        status: 1,
        is_default: 0,
        description: '极高偏重读者评论深度与标签契合度，挖掘长青硬核干货文章。',
      },
    ];

    for (const r of defaultRules) {
      await connection.query(
        `INSERT INTO art_recommend_rule (name, rule_code, algorithm_type, weights, cold_start_config, diversity_config, status, is_default, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.name,
          r.rule_code,
          r.algorithm_type,
          r.weights,
          r.cold_start_config,
          r.diversity_config,
          r.status,
          r.is_default,
          r.description,
        ]
      );
    }
    console.log('Inserted 4 default recommendation strategy rules.');
  }

  // 4. 初始化文章推荐菜单与按钮权限
  const [parentMenu] = await connection.query("SELECT id FROM sys_menu WHERE path = 'article' LIMIT 1");
  if (parentMenu && parentMenu.length > 0) {
    const parentId = parentMenu[0].id;
    const [existSub] = await connection.query(
      "SELECT id FROM sys_menu WHERE parent_id = ? AND path = 'recommend' LIMIT 1",
      [parentId]
    );

    let recommendMenuId;
    if (existSub && existSub.length > 0) {
      recommendMenuId = existSub[0].id;
      console.log(`Recommend menu exists with ID: ${recommendMenuId}`);
    } else {
      const [res] = await connection.query(
        `INSERT INTO sys_menu (parent_id, menu_name, order_num, path, component, menu_type, visible, status, perms, icon)
         VALUES (?, '文章推荐', 4, 'recommend', 'article/recommend/index', 'C', 1, 1, 'article:recommend:list', 'TrendCharts')`,
        [parentId]
      );
      recommendMenuId = res.insertId;
      console.log(`Created Recommend menu with ID: ${recommendMenuId}`);
    }

    const buttons = [
      { name: '推荐查询', perms: 'article:recommend:query' },
      { name: '策略配置', perms: 'article:recommend:config' },
      { name: '策略修改', perms: 'article:recommend:update' },
      { name: '沙盘试算', perms: 'article:recommend:simulate' },
      { name: '干预控制', perms: 'article:recommend:control' },
    ];

    for (const btn of buttons) {
      const [btnExists] = await connection.query(
        'SELECT id FROM sys_menu WHERE parent_id = ? AND perms = ? LIMIT 1',
        [recommendMenuId, btn.perms]
      );
      if (!btnExists || btnExists.length === 0) {
        await connection.query(
          `INSERT INTO sys_menu (parent_id, menu_name, order_num, path, component, menu_type, visible, status, perms, icon)
           VALUES (?, ?, 0, '', NULL, 'F', 1, 1, ?, '#')`,
          [recommendMenuId, btn.name, btn.perms]
        );
        console.log(`Created recommend button perm: ${btn.name} (${btn.perms})`);
      }
    }

    // 绑定超级管理员角色 (role_id = 1)
    const [allRecommendMenus] = await connection.query(
      'SELECT id FROM sys_menu WHERE id = ? OR parent_id = ?',
      [recommendMenuId, recommendMenuId]
    );
    for (const m of allRecommendMenus) {
      await connection.query(
        'INSERT IGNORE INTO sys_role_menu (role_id, menu_id) VALUES (1, ?)',
        [m.id]
      );
    }
    console.log('Bound recommend permissions to admin role.');
  }

  console.log('Article recommendation database initialization completed successfully!');
  await connection.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
