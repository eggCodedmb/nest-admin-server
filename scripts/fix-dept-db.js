require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nest_admin',
  });

  await conn.query('ALTER TABLE sys_dept MODIFY parent_id BIGINT UNSIGNED NULL DEFAULT NULL');
  await conn.query('UPDATE sys_dept SET parent_id = NULL WHERE parent_id = 0');
  console.log('sys_dept parent_id updated to allow NULL and roots set to NULL');

  const [rows] = await conn.query('SELECT id, parent_id, mpath, dept_name FROM sys_dept');
  console.log('sys_dept rows:', rows);

  await conn.end();
}

fix().catch(console.error);
