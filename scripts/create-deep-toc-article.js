require('dotenv').config({ path: '.env.development' });
const mysql = require('mysql2/promise');

function parseMarkdownToc(markdown) {
  if (!markdown) return [];
  const flatToc = [];
  const lines = markdown.split('\n');
  let headingIndex = 0;
  const headingRegex = /^(#{1,6})\s+(.+)$/;

  for (const line of lines) {
    const match = line.trim().match(headingRegex);
    if (match) {
      headingIndex++;
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_~`]/g, '');
      const id = `heading-${headingIndex}`;
      flatToc.push({ id, text, level });
    }
  }

  const root = [];
  const stack = [];

  flatToc.forEach((item) => {
    const node = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  return root;
}

async function createDeepTocArticle() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'nest_admin',
  });

  console.log('Connected to MySQL database.');

  // 查询现有可用分类
  const [cats] = await connection.query('SELECT id, name, slug FROM art_category WHERE deleted_at IS NULL LIMIT 1');
  const categoryId = cats.length > 0 ? Number(cats[0].id) : 1;

  const content = `# 深度架构指南：现代分布式全栈与云原生高并发演进

![全栈架构全景图](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80)

本指南专为测试多层级文章大纲（TOC）、指示器平滑追踪（Indicator Tracking）与现代化数字审校工作台设计，包含 **H1 ~ H4 多级丰富章节**、架构拓扑图、代码片段与数学推导。

---

## 1. 核心架构拓扑设计与设计哲学
现代分布式系统设计的核心目标是保障高可用性（Availability）、高扩展性（Scalability）与一致性（Consistency）。

![微服务架构图](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80)

### 1.1 微服务分层与领域驱动设计 (DDD)
在业务边界划分上，通过引入战术设计模式（聚合根、实体、值对象）确保领域模型的高度内聚：
- **用户域 (User Domain)**：负责 RBAC 权限鉴定、JWT 续签与用户上下文下发；
- **文章域 (Post Domain)**：负责内容生命周期、版本溯源与自动化审核流水线；
- **存储域 (Storage Domain)**：统一对象存储抽象与多云容灾。

### 1.2 异步事件总线与 CQRS 架构解耦
读写分离模式（Command Query Responsibility Segregation）通过消息总线实现强一致性写入与高性能视图聚合：

\`\`\`typescript
interface DomainEvent<T = any> {
  eventId: string;
  aggregateId: string;
  eventType: 'ARTICLE_PUBLISHED' | 'ARTICLE_REJECTED';
  timestamp: number;
  payload: T;
}
\`\`\`

---

## 2. 高并发存储与多级缓存体系
为了应对百万级 QPS 的并发流量冲击，多级缓存架构在各层级起到了关键缓冲作用。

![缓存集群拓扑](https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80)

### 2.1 Redis 分布式集群与热点 Key 击穿防御
热点数据突然失效可能导致海量请求直接穿透到底层关系型数据库。

#### 2.1.1 互斥锁 (Mutex Lock) 与逻辑过期策略
采用逻辑过期 + 异步线程池重构数据模型：

\`\`\`typescript
export async function getWithLogicalExpire<T>(
  key: string,
  dbFallback: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const data = await redis.get(key);
  if (!data) return await dbFallback();
  
  const record = JSON.parse(data);
  if (record.expireAt > Date.now()) {
    return record.value;
  }
  
  // 异步续期
  backgroundPool.submit(async () => {
    const freshData = await dbFallback();
    await redis.set(key, JSON.stringify({ value: freshData, expireAt: Date.now() + ttlSeconds * 1000 }));
  });
  return record.value;
}
\`\`\`

#### 2.1.2 内存对齐与 Jemalloc 内存碎片优化
Redis 底层使用 Jemalloc 分配器，合理设计数据结构（例如使用 \`ziplist\` 替代 \`hashtable\`）可将内存利用率提升 40% 以上。

### 2.2 MySQL 分库分表与分布式事务 Seata
采用 Sharding-JDBC 按照 \`hash(user_id) % 32\` 路由算法将单表亿级记录切分为 32 张物理子表。

---

## 3. 云原生可观测性与全链路追踪
在复杂的微服务网格中，全链路 Trace ID 的透传是快速定界定位故障的基石。

![可观测性仪表盘](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80)

### 3.1 OpenTelemetry 指标采集流水线
服务通过统一收集链路 Span，向 Prometheus 与 Jaeger 发送链路拓扑：
- **P99 延迟监控**：严格控制在 35ms 以内；
- **吞吐量 QPS 指标**：实时聚合告警。

### 3.2 动态分布式链路监控与告警策略
当错误率突增超过 1.5% 时，告警系统将自动触发熔断降级（Circuit Breaker）并推送飞书/钉钉机器人通知。

---

## 4. 极致前端工程化与双向大纲响应机制
现代化内容平台的阅读体验依赖于低延迟的大纲目录（TOC）与精确到像素级的视口追踪。

![前端工程代码](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80)

### 4.1 基于 AST 的动态大纲解析算法
在文章写作过程中，客户端通过词法分析器即时构建多叉目录树：

$$T(n) = O(N) \quad \text{其中 } N \text{ 为 Markdown 标题节点总数}$$

### 4.2 毫秒级视口高精度坐标定位技术
通过 \`getBoundingClientRect()\` 与视口容器相对坐标矩阵计算，解决了嵌套章节 \`offsetTop\` 的历史偏差难题。

---

## 5. 架构总结与生产环境实战 Checklist
在实际部署上线前，请对照以下黄金准则完成自检：
1. **幂等性保障**：关键写接口必须携带 \`Idempotency-Key\`；
2. **连接池健康**：确保连接池最大连接数与数据库连接数匹配；
3. **熔断兜底**：核心链路必须具备本地 Mock 或降级兜底方案。
`;

  const tocTree = parseMarkdownToc(content);

  // 插入一篇待审核的文章（status = 1）供审阅与编辑完整测试
  const [insertResult] = await connection.query(
    `INSERT INTO art_article (
      category_id, author_id, title, summary, cover_image, content,
      toc_data, tags, source_type, status, is_top, is_recommend,
      allow_comment, view_count, like_count, published_at, created_at, updated_at
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1024, 88, NULL, NOW(3), NOW(3))`,
    [
      categoryId,
      '深度架构指南：现代分布式全栈与云原生高并发演进（多目录测试）',
      '专为测试多层级文章大纲（TOC）、指示器平滑追踪（Indicator Tracking）与现代化数字审校工作台设计，包含 H1~H4 多级丰富章节。',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      content,
      JSON.stringify(tocTree),
      '架构设计,高并发,分布式,云原生,目录测试',
    ]
  );

  console.log('✅ Successfully inserted multi-level TOC test article with ID:', insertResult.insertId);
  console.log('📊 Parsed TOC nodes count:', tocTree.length);

  await connection.end();
}

createDeepTocArticle().catch((err) => {
  console.error('Error inserting test article:', err);
  process.exit(1);
});
