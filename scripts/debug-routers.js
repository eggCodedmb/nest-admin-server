require('dotenv').config({ path: '.env.development' });
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

async function check() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || '39.108.137.45',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '1234@Dong',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  });

  const captchaRes = await request({ hostname: 'localhost', port: 3000, path: '/auth/captcha', method: 'GET' });
  const uuid = captchaRes.body.data.uuid;
  const code = await redis.get(`admin:captcha:${uuid}`);

  const loginRes = await request(
    { hostname: 'localhost', port: 3000, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { username: 'admin', password: 'admin123', code, uuid }
  );

  const token = loginRes.body.data?.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('Testing GET /system/menu/routers ...');
  const routersRes = await request({ hostname: 'localhost', port: 3000, path: '/system/menu/routers', method: 'GET', headers });
  console.log('Routers count:', routersRes.body.data?.length);
  const articleRouter = routersRes.body.data?.find((r) => r.path === '/article' || r.path === 'article');
  console.log('Article router:', JSON.stringify(articleRouter, null, 2));

  redis.disconnect();
}

check().catch(console.error);
