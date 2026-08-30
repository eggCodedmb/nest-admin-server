require('dotenv').config({ path: '.env.development' });
const mysql = require('mysql2/promise');

async function seedArticleDicts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'nest_admin',
  });

  console.log('Connected to MySQL. Seeding article system dictionaries...');

  const dictTypes = [
    {
      dictName: '文章发布状态',
      dictType: 'art_post_status',
      status: 1,
      remark: '文章生命周期状态字典 (0草稿 1待审核 2已发布 3已驳回 4已下架)',
      data: [
        { dictSort: 1, dictLabel: '草稿', dictValue: '0', listClass: 'info', isDefault: 1, status: 1 },
        { dictSort: 2, dictLabel: '待审核', dictValue: '1', listClass: 'warning', isDefault: 0, status: 1 },
        { dictSort: 3, dictLabel: '已发布', dictValue: '2', listClass: 'success', isDefault: 0, status: 1 },
        { dictSort: 4, dictLabel: '已驳回', dictValue: '3', listClass: 'danger', isDefault: 0, status: 1 },
        { dictSort: 5, dictLabel: '已下架', dictValue: '4', listClass: 'info', isDefault: 0, status: 1 },
      ],
    },
    {
      dictName: '文章来源类型',
      dictType: 'art_source_type',
      status: 1,
      remark: '文章原创或转载类型字典 (1原创 2转载 3翻译)',
      data: [
        { dictSort: 1, dictLabel: '原创', dictValue: '1', listClass: 'primary', isDefault: 1, status: 1 },
        { dictSort: 2, dictLabel: '转载', dictValue: '2', listClass: 'info', isDefault: 0, status: 1 },
        { dictSort: 3, dictLabel: '翻译', dictValue: '3', listClass: 'warning', isDefault: 0, status: 1 },
      ],
    },
    {
      dictName: '文章审核结果',
      dictType: 'art_audit_result',
      status: 1,
      remark: '文章审核决策结果 (1通过 2驳回)',
      data: [
        { dictSort: 1, dictLabel: '审核通过', dictValue: '1', listClass: 'success', isDefault: 1, status: 1 },
        { dictSort: 2, dictLabel: '审核驳回', dictValue: '2', listClass: 'danger', isDefault: 0, status: 1 },
      ],
    },
  ];

  for (const item of dictTypes) {
    // 1. 插入或更新 dict_type
    const [existing] = await connection.query('SELECT id FROM sys_dict_type WHERE dict_type = ?', [item.dictType]);
    if (existing.length === 0) {
      await connection.query(
        'INSERT INTO sys_dict_type (dict_name, dict_type, status, remark, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(3), NOW(3))',
        [item.dictName, item.dictType, item.status, item.remark]
      );
      console.log(`+ Inserted dict_type: ${item.dictType}`);
    } else {
      await connection.query(
        'UPDATE sys_dict_type SET dict_name = ?, status = ?, remark = ?, updated_at = NOW(3) WHERE dict_type = ?',
        [item.dictName, item.status, item.remark, item.dictType]
      );
      console.log(`~ Updated dict_type: ${item.dictType}`);
    }

    // 2. 清理并重新插入 dict_data
    await connection.query('DELETE FROM sys_dict_data WHERE dict_type = ?', [item.dictType]);
    for (const d of item.data) {
      await connection.query(
        'INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, list_class, is_default, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))',
        [d.dictSort, d.dictLabel, d.dictValue, item.dictType, d.listClass, d.isDefault, d.status]
      );
    }
    console.log(`  -> Inserted ${item.data.length} dict_data items for ${item.dictType}`);
  }

  console.log('✅ Article system dictionaries seeded successfully.');
  await connection.end();
}

seedArticleDicts().catch((err) => {
  console.error('Error seeding dictionaries:', err);
  process.exit(1);
});
