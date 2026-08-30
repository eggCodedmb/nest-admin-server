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

async function testSubmit() {
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
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. 获取第一篇文章
  const listRes = await request({ hostname: 'localhost', port: 3000, path: '/article/post/list', method: 'GET', headers });
  const firstArt = listRes.body.data.rows[0];
  console.log('Testing with Article ID:', firstArt.id, firstArt.title);

  // 2. PUT 更新文章 (带 id, string categoryId 等)
  const putPayload = {
    id: String(firstArt.id),
    title: firstArt.title,
    categoryId: String(firstArt.categoryId),
    summary: firstArt.summary,
    coverImage: firstArt.coverImage,
    content: firstArt.content,
    contentHtml: '<h1>' + firstArt.title + '</h1>',
    tags: firstArt.tags,
    slug: '',
    isTop: 1,
    isRecommend: 1,
    allowComment: 1,
    sourceType: 1,
    sourceUrl: '',
    status: 0,
  };

  console.log('Sending PUT /article/post/' + firstArt.id + ' ...');
  const putRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/post/' + firstArt.id, method: 'PUT', headers },
    putPayload
  );
  console.log('PUT Response Status:', putRes.status);
  console.log('PUT Response Body:', JSON.stringify(putRes.body, null, 2));

  // 3. POST 提交审核
  console.log('Sending POST /article/post/' + firstArt.id + '/submit ...');
  const submitRes = await request(
    { hostname: 'localhost', port: 3000, path: '/article/post/' + firstArt.id + '/submit', method: 'POST', headers }
  );
  console.log('Submit Response Status:', submitRes.status);
  console.log('Submit Response Body:', JSON.stringify(submitRes.body, null, 2));

  redis.disconnect();
}

testSubmit().catch(console.error);
