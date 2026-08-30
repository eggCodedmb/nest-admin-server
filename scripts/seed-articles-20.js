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

const categoriesData = [
  {
    name: '前端开发',
    slug: 'frontend',
    orderNum: 1,
    description: '现代前端工程化、框架与核心语言实践',
    children: [
      { name: 'Vue3 生态', slug: 'vue3', orderNum: 1, description: 'Vue 3, Pinia, Vue Router 及周边生态' },
      { name: 'React 与 Next.js', slug: 'react', orderNum: 2, description: 'React 19, Hooks, Next.js 全栈方案' },
      { name: 'TypeScript 进阶', slug: 'typescript', orderNum: 3, description: '类型编程、装饰器与工程化类型安全' },
    ],
  },
  {
    name: '后端架构',
    slug: 'backend',
    orderNum: 2,
    description: '服务端开发、高可用微服务与架构设计',
    children: [
      { name: 'NestJS 全栈实战', slug: 'nestjs', orderNum: 1, description: 'NestJS 企业级脚手架与服务开发' },
      { name: '高并发与微服务', slug: 'microservices', orderNum: 2, description: '消息队列、负载均衡与分布式事务' },
      { name: '数据库与缓存', slug: 'database', orderNum: 3, description: 'MySQL 调优、Redis 缓存与持久化' },
    ],
  },
  {
    name: '云原生与运维',
    slug: 'devops',
    orderNum: 3,
    description: '容器化、持续集成与自动化发布体系',
    children: [
      { name: 'Docker 与 K8s', slug: 'docker-k8s', orderNum: 1, description: 'Docker 镜像构建与 K8s 集群编排' },
      { name: 'CI/CD 流水线', slug: 'cicd', orderNum: 2, description: 'GitHub Actions, GitLab CI 自动化运维' },
    ],
  },
  {
    name: '人工智能与前沿',
    slug: 'ai',
    orderNum: 4,
    description: '大语言模型、智能体 Agent 与 AIGC 技术实践',
    children: [
      { name: 'LLM 与 Agent 架构', slug: 'llm-agent', orderNum: 1, description: 'Prompt 工程、RAG 与自主智能体开发' },
    ],
  },
];

const articlesData = [
  {
    categorySlug: 'vue3',
    title: 'Vue 3.5 响应式原理与核心性能优化深度解析',
    summary: '深入剖析 Vue 3.5 响应式系统重构、内存优化及组合式 API 最佳实践。',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    tags: 'Vue3,TypeScript,源码解析',
    sourceType: 1,
    status: 2, // 已发布
    isTop: 1,
    isRecommend: 1,
    viewCount: 3820,
    likeCount: 245,
    content: `# Vue 3.5 响应式原理与核心性能优化深度解析

## 1. Vue 3.5 核心变更总览
Vue 3.5 带来了重大的响应式引擎重构，内存占用降低了 56%，大型数组遍历性能提升近 10 倍。

### 1.1 双向链表版本的依赖追踪
在旧版响应式系统中，依赖关系通过 \`Set\` 与 \`Map\` 维护，3.5 版本引入了双向链表结构：
\`\`\`typescript
export class ReactiveEffect<T = any> {
  active = true;
  deps: Link[] = [];
  fn: () => T;
}
\`\`\`

### 1.2 SSR 性能优化
服务端渲染中对 Teleport 与 Async Component 进行了专门优化，首屏生成速度显著加快。

## 2. 组合式 API 实用技巧
- \`useTemplateRef\` 的类型安全绑定
- \`onWatcherCleanup\` 自动清理副作用

## 3. 生产环境性能调优建议
避免在响应式对象中存放超大非响应式数据，合理使用 \`shallowRef\` 与 \`markRaw\`。`,
  },
  {
    categorySlug: 'nestjs',
    title: 'NestJS 11 企业级架构实战：从模块解耦到 CASL 权限管控',
    summary: '基于 NestJS 11 + TypeORM + Redis 打造高可用、细粒度权限控制的企业级后台服务。',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    tags: 'NestJS,CASL,架构设计',
    sourceType: 1,
    status: 2, // 已发布
    isTop: 1,
    isRecommend: 1,
    viewCount: 4210,
    likeCount: 310,
    content: `# NestJS 11 企业级架构实战：从模块解耦到 CASL 权限管控

## 1. 架构理念与分层设计
NestJS 提供了开箱即用的 IoC 容器与模块化架构，有助于大型项目的长期维护。

### 1.1 控制器与服务分层
- **Controller**：负责协议解析、DTO 校验与路由分发；
- **Service**：封装核心领域逻辑与事务管理。

## 2. CASL 细粒度权限系统集成
结合 RBAC 与 ABAC 权限模型：
\`\`\`typescript
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    if (user.isAdmin) {
      can(Action.Manage, 'all');
    }
    return build();
  }
}
\`\`\`

## 3. 缓存策略与 Redis 集成
采用全局 CacheManager 与 Redis 键过期淘汰机制，保障高并发读取性能。`,
  },
  {
    categorySlug: 'typescript',
    title: 'TypeScript 5.x 高级类型体操与泛型模式指南',
    summary: '探索 Conditional Types, Template Literal Types, Mapped Types 及元组类型推导高级技巧。',
    coverImage: 'https://images.unsplash.com/photo-1516116211227-bbc8040d7c71?w=600&auto=format&fit=crop&q=80',
    tags: 'TypeScript,类型编程,进阶',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 1980,
    likeCount: 128,
    content: `# TypeScript 5.x 高级类型体操与泛型模式指南

## 1. 条件类型与 infer 关键字
条件类型允许我们根据类型关系动态推导结果：
\`\`\`typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
\`\`\`

## 2. 模板字面量类型与字符串模式匹配
\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ClickEvent = EventName<'click'>; // 'onClick'
\`\`\`

## 3. 递归类型与深度只读
实现 DeepReadonly 与递归深层属性提取。`,
  },
  {
    categorySlug: 'microservices',
    title: '微服务架构下的分布式事务解决方案：Saga vs 2PC',
    summary: '对比两阶段提交、Saga 编排模式、TCC 及基于本地消息表最终一致性方案优劣。',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    tags: '微服务,分布式事务,高并发',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 2890,
    likeCount: 189,
    content: `# 微服务架构下的分布式事务解决方案

## 1. 分布式事务的由来 (CAP与BASE理论)
微服务拆分后，单体数据库的 ACID 特性失效，需要在可用性与一致性之间取得平衡。

## 2. 核心解决方案对比
### 2.1 2PC (两阶段提交)
强一致性，但存在同步阻塞和单点故障问题。

### 2.2 Saga 编排模式
通过补偿机制实现最终一致性，适合长事务业务。

### 2.3 本地消息表 + 消息队列 (MQ)
性能最高、侵入性最小的推荐落地方案。`,
  },
  {
    categorySlug: 'database',
    title: 'MySQL 8 亿级数据分库分表与索引优化实战',
    summary: 'B+树底层原理剖析、覆盖索引设计、慢 SQL 诊断与 Sharding 策略落地。',
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    tags: 'MySQL,数据库,SQL调优',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 3120,
    likeCount: 220,
    content: `# MySQL 8 亿级数据分库分表与索引优化实战

## 1. 索引底层原理：为什么是 B+ 树？
B+ 树只有叶子节点存储数据，保证了非叶子节点能容纳更多索引项，大幅降低磁盘 I/O 次数。

## 2. 避免索引失效的经典陷阱
- 最左前缀匹配原则
- 不要在索引列上进行函数运算
- 避免隐式类型转换

## 3. EXPLAIN 执行计划关键字段
重点关注 \`type\` (ref/range/index/ALL) 与 \`Extra\` (Using index / Using filesort)。`,
  },
  {
    categorySlug: 'docker-k8s',
    title: 'Kubernetes 生产级集群搭建与灰度发布 (Canary) 实践',
    summary: '基于 Ingress Nginx 与 Istio 实现微服务平滑滚动更新与灰度金丝雀发布。',
    coverImage: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80',
    tags: 'Kubernetes,Docker,云原生',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 1650,
    likeCount: 112,
    content: `# Kubernetes 生产级集群搭建与灰度发布实践

## 1. 为什么需要灰度发布？
灰度发布允许将新版本先暴露给 5%~10% 的生产流量，验证业务指标后再全量推广。

## 2. 基于 Nginx Ingress 的权重分流配置
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
\`\`\`

## 3. 监控与自动回滚
结合 Prometheus 告警指标，异常时自动执行 \`kubectl rollout undo\`。`,
  },
  {
    categorySlug: 'llm-agent',
    title: '基于 LangChain 与 AutoGen 构建多智能体 (Multi-Agent) 协同系统',
    summary: '探索 LLM Agent 的规划、记忆、工具调用及多角色协作模式设计。',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
    tags: 'AI,LLM,Agent,LangChain',
    sourceType: 1,
    status: 2,
    isTop: 1,
    isRecommend: 1,
    viewCount: 5200,
    likeCount: 460,
    content: `# 基于 LangChain 与 AutoGen 构建多智能体协同系统

## 1. Agent 核心架构四要素
1. **Planning (规划)**：思维链 CoT、自省与任务拆解；
2. **Memory (记忆)**：短时上下文与长时向量数据库检索；
3. **Tools (工具)**：Web 搜索、API 调用、代码执行沙箱；
4. **Action (执行)**：状态机流转与决策输出。

## 2. Multi-Agent 协作对话流
通过定义 Programmer、Reviewer、Manager 多个角色，实现自动化代码生成与审查闭环。

## 3. 落地难点与应对
- 幻觉抑制 (Grounding)
- 上下文窗口管理与上下文压缩算法`,
  },
  {
    categorySlug: 'react',
    title: 'React 19 Server Components 与 Actions 完整实战指南',
    summary: '深入理解 RSC 渲染流水线、Server Actions 表单处理与 useOptimistic 乐观更新。',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    tags: 'React,RSC,NextJS',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 2150,
    likeCount: 140,
    content: `# React 19 Server Components 与 Actions 完整实战指南

## 1. React Server Components (RSC) 的本质
RSC 将组件渲染逻辑迁移到服务端执行，零客户端 JS 打包体积，直连数据库。

## 2. Server Actions 表单提交
\`\`\`tsx
async function updateUserAction(formData: FormData) {
  'use server';
  const name = formData.get('name');
  await db.user.update({ name });
}
\`\`\`

## 3. 乐观 UI 更新：useOptimistic
在服务端响应前立即更新用户界面，提升操作流畅感。`,
  },
  {
    categorySlug: 'cicd',
    title: '现代前端自动化构建与 GitHub Actions 流水线搭建',
    summary: '实现代码 Lint、自动化测试、Docker 镜像构建与阿里云远程服务器自动部署。',
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
    tags: 'CI/CD,GitHubActions,DevOps',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 1430,
    likeCount: 95,
    content: `# 现代前端自动化构建与 GitHub Actions 流水线搭建

## 1. 流水线核心阶段
- **Lint & TypeCheck**：ESLint + vue-tsc 静态扫描；
- **Unit Test**：Vitest / Jest 单元测试覆盖率；
- **Build & Package**：Vite 产物打包；
- **Deploy**：SSH 同步产物至 Nginx 静态目录。

## 2. GitHub Actions YAML 配置模板
\`\`\`yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
\`\`\`

## 3. 缓存优化策略
利用 actions/cache 缓存 pnpm store，将构建耗时缩短 60%。`,
  },
  {
    categorySlug: 'database',
    title: 'Redis 深度历险：缓存穿透、击穿、雪崩三防方案与分布式锁',
    summary: '解析布隆过滤器、互斥锁、逻辑过期以及 Redlock 分布式锁核心实现。',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    tags: 'Redis,缓存,分布式锁',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 3450,
    likeCount: 260,
    content: `# Redis 深度历险：缓存三大问题与分布式锁

## 1. 缓存穿透与布隆过滤器
大量查询不存在的 key 导致请求穿透到 DB。
- 方案 1：缓存空对象 (TTL 较短)；
- 方案 2：前置布隆过滤器 (Bloom Filter)。

## 2. 缓存击穿与热点数据保护
热点 key 过期瞬间引发高并发压垮 DB：
- 方案 1：互斥锁 (\`SETNX\`) 重建缓存；
- 方案 2：逻辑不过期 + 异步刷新。

## 3. 缓存雪崩与打散过期时间
大量 key 同一时刻过期，通过在过期时间上增加随机扰动值 (1~5分钟) 解决。`,
  },
  {
    categorySlug: 'vue3',
    title: 'Vite 插件开发与打包产物精细化分包优化实践',
    summary: '揭秘 Vite 插件生命周期，Rollup manualChunks 配置技巧与代码瘦身实践。',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop&q=80',
    tags: 'Vite,性能优化,前端工程化',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 1870,
    likeCount: 135,
    content: `# Vite 插件开发与打包产物精细化分包优化实践

## 1. Vite 插件基础结构
\`\`\`typescript
export default function myPlugin() {
  return {
    name: 'vite-plugin-my-custom',
    transform(code, id) {
      if (id.endsWith('.vue')) {
        // 自定义 AST 转换
      }
      return code;
    }
  }
}
\`\`\`

## 2. manualChunks 代码分割避坑
避免粗粒度匹配导致全量第三方库打包进同一 Chunk，善用正则精确定位 node_modules 目录。`,
  },
  {
    categorySlug: 'llm-agent',
    title: 'RAG 检索增强生成系统落地方案：向量数据库与重排技术',
    summary: '深入解析文档分块 (Chunking)、Embedding 向量嵌入、Milvus/Pinecone 索引与 Rerank 模型。',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80',
    tags: 'RAG,向量检索,AI应用',
    sourceType: 1,
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 2980,
    likeCount: 215,
    content: `# RAG 检索增强生成系统落地方案

## 1. RAG 核心三部曲
1. **Indexing (索引构建)**：文档清洗、分块、向量化入库；
2. **Retrieval (召回检索)**：余弦相似度与混合搜索 (Hybrid Search)；
3. **Generation (增强生成)**：结合上下文注入 Prompt 生成答案。

## 2. 提升召回精度的关键措施
- 引入 BM25 关键词匹配与稠密向量混合搜索；
- 使用 BGE-Reranker 对 Top-20 候选进行二次重排。`,
  },

  // === 4篇待审核文章 (status: 1) ===
  {
    categorySlug: 'vue3',
    title: '【待审】Vue 3 虚拟列表 (Virtual List) 渲染百万级数据方案',
    summary: '针对长列表 DOM 过多卡顿问题，通过只渲染可视区域节点实现丝滑滚动。',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    tags: 'Vue3,虚拟列表,性能优化',
    sourceType: 1,
    status: 1, // 待审核
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# Vue 3 虚拟列表渲染百万级数据方案

## 1. 传统长列表的性能瓶颈
当页面存在 10,000+ DOM 节点时，重排重绘开销将严重阻塞主线程导致白屏掉帧。

## 2. 定高虚拟列表数学公式
- \`startIndex = Math.floor(scrollTop / itemHeight)\`
- \`endIndex = startIndex + visibleCount\`
- \`offsetY = startIndex * itemHeight\`

## 3. 不定高动态虚拟列表实现
利用 ResizeObserver 或预估高度 + 真实渲染后修正高度索引表。`,
  },
  {
    categorySlug: 'nestjs',
    title: '【待审】基于 NestJS 实现 SSE (Server-Sent Events) 与大模型打字机流式响应',
    summary: '使用 RxJS Subject 与 Observable 实现服务端向前端流式吐字输出。',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    tags: 'NestJS,SSE,大模型流式输出',
    sourceType: 1,
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# 基于 NestJS 实现 SSE 与大模型打字机流式响应

## 1. 为什么选择 SSE 而不是 WebSocket？
SSE 专为单向数据流设计，天然基于 HTTP 协议，支持自动重连，非常适合 AI 对话场景。

## 2. NestJS @Sse 装饰器实战
\`\`\`typescript
@Sse('chat/stream')
streamChat(@Query('prompt') prompt: string): Observable<MessageEvent> {
  return new Observable((observer) => {
    // 调用 LLM 流式 API
    observer.next({ data: { chunk: 'Hello' } });
  });
}
\`\`\`

## 3. 前端 EventSource 与 Fetch ReadableStream 对接
结合 fetch 和 Response.body.getReader() 灵活处理带自定义 Header 的流式请求。`,
  },
  {
    categorySlug: 'microservices',
    title: '【待审】RabbitMQ 消息可靠性投递与死信队列 (DLX) 实践',
    summary: 'Producer 确认机制、Consumer 手动 ACK、死信交换机与消息幂等消费方案。',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    tags: 'RabbitMQ,消息队列,分布式',
    sourceType: 1,
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# RabbitMQ 消息可靠性投递与死信队列实践

## 1. 消息丢失的三大节点与应对
1. **生产者到 Broker 丢失**：开启 Confirm 确认模式；
2. **Broker 宕机丢失**：Exchange、Queue 及 Message 必须设置持久化 (\`durable: true\`)；
3. **消费者处理失败丢失**：关闭自动 ACK，改用手动 \`channel.ack(deliveryTag)\`。

## 2. 死信队列应用场景
- 消息被拒绝 (\`basic.reject\` / \`basic.nack\`) 且 \`requeue = false\`；
- 消息超过 TTL 存活时间；
- 队列达到最大长度。`,
  },
  {
    categorySlug: 'typescript',
    title: '【待审】TypeScript 装饰器 (Stage 3) 与元数据反射深度探究',
    summary: '从 ECMAScript 阶段3 标准装饰器解析 Class, Method, Field Decorator 核心原理。',
    coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
    tags: 'TypeScript,装饰器,元编程',
    sourceType: 1,
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# TypeScript 装饰器与元数据反射深度探究

## 1. Stage 3 装饰器新标准概述
新标准无需开启 \`experimentalDecorators\`，拥有更规范的上下文对象 (\`ClassDecoratorContext\`)。

## 2. 方法装饰器与自动性能统计
\`\`\`typescript
function logged(target: any, context: ClassMethodDecoratorContext) {
  return function(...args: any[]) {
    console.log(\`Calling \${String(context.name)}\`);
    return target.call(this, ...args);
  };
}
\`\`\`

## 3. reflect-metadata 在依赖注入框架中的应用
分析 NestJS 内部如何通过 \`Reflect.defineMetadata\` 存储路由与守卫信息。`,
  },

  // === 2篇草稿文章 (status: 0) ===
  {
    categorySlug: 'vue3',
    title: '【草稿】Vue 3 渲染器架构与跨端开发探索',
    summary: '自定义 Renderer API 实现将 Vue 渲染到 Canvas / WebGL / 小程序。',
    coverImage: '',
    tags: 'Vue3,跨端,Canvas',
    sourceType: 1,
    status: 0, // 草稿
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# Vue 3 渲染器架构与跨端开发探索

## 1. createRenderer 工厂函数
通过自定义 \`nodeOps\` 与 \`patchProp\`，可以实现非 DOM 环境的节点映射。

## 2. 待补充章节
- Canvas 场景图节点管理
- 事件系统的合成与分发`,
  },
  {
    categorySlug: 'backend',
    title: '【草稿】DDD 领域驱动设计在 NestJS 中的分层落地总结',
    summary: '贫血模型 vs 充血模型、聚合根、实体、值对象与防腐层设计。',
    coverImage: '',
    tags: 'DDD,架构设计',
    sourceType: 1,
    status: 0,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# DDD 领域驱动设计在 NestJS 中的分层落地总结

## 1. 战略设计：通用语言与限界上下文
（正在撰写中...）`,
  },

  // === 1篇已驳回文章 (status: 3) ===
  {
    categorySlug: 'react',
    title: '【已驳回】前端微前端框架 qiankun 实战避坑指南',
    summary: '主应用与子应用通信、样式隔离沙箱、静态资源跨域与路由冲突解决。',
    coverImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=80',
    tags: '微前端,qiankun,架构',
    sourceType: 2, // 转载
    sourceUrl: 'https://example.com/qiankun-guide',
    status: 3, // 已驳回
    isTop: 0,
    isRecommend: 0,
    viewCount: 45,
    likeCount: 2,
    content: `# 前端微前端框架 qiankun 实战避坑指南

## 1. 样式隔离与 Shadow DOM 踩坑
qiankun 的 experimentalStyleIsolation 会导致 el-dialog 等挂载在 body 上的弹窗样式失效。

## 2. 跨域与 Cookie 丢失问题
子应用静态资源服务器必须配置 \`Access-Control-Allow-Origin: *\`。`,
  },

  // === 1篇已下架文章 (status: 4) ===
  {
    categorySlug: 'frontend',
    title: '【已下架】Webpack 4 到 Webpack 5 迁移实践回顾（旧方案归档）',
    summary: '针对老旧 Webpack 4 项目的升级与构建提速总结，已被 Vite 现代方案替代。',
    coverImage: '',
    tags: 'Webpack,构建工具,归档',
    sourceType: 1,
    status: 4, // 已下架
    isTop: 0,
    isRecommend: 0,
    viewCount: 120,
    likeCount: 5,
    content: `# Webpack 4 到 Webpack 5 迁移实践回顾

## 1. 模块联邦 (Module Federation)
（该文章技术方案已落后，目前项目已全面切换至 Vite，故做下架归档处理。）`,
  },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '39.108.137.45',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1234@Dong',
    database: process.env.DB_DATABASE || 'nest_admin',
    multipleStatements: true,
  });

  console.log('Connected to MySQL. Seeding 20 realistic articles and category tree...');

  // 1. 插入分类树
  const categoryMap = {}; // slug -> id

  for (const parent of categoriesData) {
    const [existParent] = await conn.query('SELECT id FROM art_category WHERE slug = ? AND deleted_at IS NULL LIMIT 1', [parent.slug]);
    let parentId;
    if (existParent && existParent.length > 0) {
      parentId = existParent[0].id;
    } else {
      const [res] = await conn.query(
        'INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (0, ?, ?, ?, 1, ?)',
        [parent.name, parent.slug, parent.orderNum, parent.description]
      );
      parentId = res.insertId;
    }
    categoryMap[parent.slug] = parentId;

    if (parent.children) {
      for (const child of parent.children) {
        const [existChild] = await conn.query('SELECT id FROM art_category WHERE slug = ? AND deleted_at IS NULL LIMIT 1', [child.slug]);
        let childId;
        if (existChild && existChild.length > 0) {
          childId = existChild[0].id;
        } else {
          const [cRes] = await conn.query(
            'INSERT INTO art_category (parent_id, name, slug, order_num, status, description) VALUES (?, ?, ?, ?, 1, ?)',
            [parentId, child.name, child.slug, child.orderNum, child.description]
          );
          childId = cRes.insertId;
        }
        categoryMap[child.slug] = childId;
      }
    }
  }
  console.log('Categories initialized successfully.');

  // 2. 插入 20 篇全结构文章
  for (const art of articlesData) {
    const catId = categoryMap[art.categorySlug] || Object.values(categoryMap)[0];
    const tocData = parseMarkdownToc(art.content);
    const publishedAt = art.status === 2 ? new Date() : null;

    // 检查是否已有同名文章
    const [existArt] = await conn.query('SELECT id FROM art_article WHERE title = ? AND deleted_at IS NULL LIMIT 1', [art.title]);
    let articleId;

    if (existArt && existArt.length > 0) {
      articleId = existArt[0].id;
      await conn.query(
        `UPDATE art_article SET 
          category_id = ?, author_id = 1, summary = ?, cover_image = ?, content = ?, 
          toc_data = ?, tags = ?, source_type = ?, source_url = ?, status = ?, is_top = ?, is_recommend = ?, 
          view_count = ?, like_count = ?, published_at = ?
         WHERE id = ?`,
        [
          catId, art.summary, art.coverImage, art.content, JSON.stringify(tocData),
          art.tags, art.sourceType, art.sourceUrl || null, art.status, art.isTop, art.isRecommend,
          art.viewCount, art.likeCount, publishedAt, articleId
        ]
      );
    } else {
      const [res] = await conn.query(
        `INSERT INTO art_article (
          category_id, author_id, title, summary, cover_image, content, 
          toc_data, tags, source_type, source_url, status, is_top, is_recommend, 
          view_count, like_count, published_at
        ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          catId, art.title, art.summary, art.coverImage, art.content,
          JSON.stringify(tocData), art.tags, art.sourceType, art.sourceUrl || null,
          art.status, art.isTop, art.isRecommend, art.viewCount, art.likeCount, publishedAt
        ]
      );
      articleId = res.insertId;
    }

    // 3. 为已发布或驳回的文章生成审计记录
    if (art.status === 2) {
      const [logExist] = await conn.query('SELECT id FROM art_audit_log WHERE article_id = ? LIMIT 1', [articleId]);
      if (!logExist || logExist.length === 0) {
        await conn.query(
          `INSERT INTO art_audit_log (article_id, auditor_id, previous_status, current_status, audit_result, audit_comment, created_at)
           VALUES (?, 1, 1, 2, 1, '内容翔实，技术点阐述清晰，审核通过。', NOW(3))`,
          [articleId]
        );
      }
    } else if (art.status === 3) {
      const [logExist] = await conn.query('SELECT id FROM art_audit_log WHERE article_id = ? LIMIT 1', [articleId]);
      if (!logExist || logExist.length === 0) {
        await conn.query(
          `INSERT INTO art_audit_log (article_id, auditor_id, previous_status, current_status, audit_result, audit_comment, created_at)
           VALUES (?, 1, 1, 3, 2, '部分配图加载失败，且部分代码块未指定语言高亮，请修正后重新提交。', NOW(3))`,
          [articleId]
        );
      }
    }
  }

  console.log(`Successfully seeded ${articlesData.length} articles across all categories!`);
  await conn.end();
}

seed().catch((err) => {
  console.error('Failed to seed articles:', err);
  process.exit(1);
});
