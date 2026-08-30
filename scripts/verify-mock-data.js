require('dotenv').config();
const mysql = require('mysql2/promise');

async function verify() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  const [deptTree] = await conn.query('SELECT id, parent_id, mpath, dept_name, leader, phone, status FROM sys_dept ORDER BY id ASC LIMIT 12');
  const [userSample] = await conn.query(`
    SELECT u.id, u.username, u.nickname, u.phone, u.sex, u.status, d.dept_name, r.role_name 
    FROM sys_user u 
    LEFT JOIN sys_dept d ON u.dept_id = d.id 
    LEFT JOIN sys_user_role ur ON u.id = ur.user_id 
    LEFT JOIN sys_role r ON ur.role_id = r.id 
    ORDER BY u.id DESC 
    LIMIT 12
  `);

  console.log('=== [DEPT SAMPLE] ===');
  console.table(deptTree);

  console.log('=== [USER SAMPLE] ===');
  console.table(userSample);

  const [deptStats] = await conn.query(`
    SELECT d.dept_name, COUNT(u.id) as user_count 
    FROM sys_dept d 
    LEFT JOIN sys_user u ON d.id = u.dept_id AND u.deleted_at IS NULL 
    WHERE d.deleted_at IS NULL 
    GROUP BY d.id, d.dept_name 
    ORDER BY user_count DESC
    LIMIT 10
  `);
  console.log('=== [TOP 10 DEPT USER DISTRIBUTION] ===');
  console.table(deptStats);

  await conn.end();
}

verify().catch(console.error);
