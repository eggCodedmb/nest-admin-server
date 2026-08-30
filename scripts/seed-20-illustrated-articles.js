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

const illustratedArticles = [
  {
    categorySlug: 'vue3',
    title: 'Vue 3.5 响应式引擎重构全景图解与渲染流水线',
    summary: '通过双向链表依赖追踪图解、内存快照对比与 SSR 流式渲染图示，全方位拆解 Vue 3.5 架构演进。',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    tags: 'Vue3,响应式原理,图解源码,性能调优',
    status: 2,
    isTop: 1,
    isRecommend: 1,
    viewCount: 6520,
    likeCount: 430,
    content: `# Vue 3.5 响应式引擎重构全景图解与渲染流水线

![Vue 3.5 响应式架构总览](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80)

## 1. 响应式依赖追踪从 Set 到双向链表
在 Vue 3.4 及以前版本中，响应式依赖通过 \`WeakMap<Target, Map<Key, Set<Effect>>>\` 进行多层嵌套维护。

![依赖关系映射拓扑](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80)

### 1.1 双向链表 Link 结构
\`\`\`typescript
export interface Link {
  dep: Dep;
  sub: Subscriber;
  prevSub?: Link;
  nextSub?: Link;
  prevDep?: Link;
  nextDep?: Link;
}
\`\`\`

### 1.2 内存对比实测
| 指标项 | Vue 3.4 (Set/Map) | Vue 3.5 (Link链表) | 优化幅度 |
| :--- | :--- | :--- | :--- |
| **基础依赖内存开销** | ~142 字节/节点 | ~64 字节/节点 | **降低 55%** |
| **批量清理耗时** | O(N) 遍历 Set | O(1) 指针直接断开 | **提升 800%** |

## 2. 虚拟 DOM Diff 算法优化
![Diff 算法标记比较图](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80)

通过静态提升 (Static Hoisting) 与补丁标记 (PatchFlag)，仅对具有动态绑定值的节点执行精准更新。

## 3. 生产实践总结
在企业级中后台开发中，组合式 API 配合 \`shallowRef\` 能够最大程度释放单机前端性能。`,
  },
  {
    categorySlug: 'nestjs',
    title: 'NestJS 11 企业级微服务网关与分布式调用链路图解',
    summary: '图文并茂讲解 NestJS 11 网关拦截器、CASL 细粒度权限守卫、分布式追踪与 Redis 缓存拓扑。',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    tags: 'NestJS,架构图解,微服务,CASL',
    status: 2,
    isTop: 1,
    isRecommend: 1,
    viewCount: 5890,
    likeCount: 388,
    content: `# NestJS 11 企业级微服务网关与分布式调用链路图解

![企业级微服务分布式架构](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80)

## 1. 系统分层与流量流转拓扑
客户端请求进入集群后，经过 Nginx 负载均衡 -> NestJS API Gateway -> 业务领域子服务。

![请求处理生命周期](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80)

### 1.1 中间件与守卫调用链
1. **ClsMiddleware**：初始化请求上下文 Tracing ID；
2. **JwtAuthGuard**：校验 Bearer Token 并在 Request 中注入用户信息；
3. **PoliciesGuard**：基于 CASL 进行策略授权校验；
4. **TransformInterceptor**：统一响应结果封装。

## 2. CASL 细粒度策略决策矩阵
\`\`\`typescript
@Injectable()
export class PoliciesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ability = this.caslAbilityFactory.createForUser(user);
    return handlers.every((handler) => handler.handle(ability));
  }
}
\`\`\`

![权限策略匹配逻辑](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80)

## 3. 监控看板与分布式追踪
集成 Prometheus 与 OpenTelemetry，实现微秒级接口耗时下钻分析。`,
  },
  {
    categorySlug: 'llm-agent',
    title: '图解多智能体协同 (Multi-Agent) 架构设计与自主任务规划',
    summary: '深入剖析 ReAct 范式、Plan-and-Solve 架构、记忆检索与 Agent 间通信协议。',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80',
    tags: 'AI,Agent,LLM,LangChain,系统设计',
    status: 2,
    isTop: 1,
    isRecommend: 1,
    viewCount: 8900,
    likeCount: 650,
    content: `# 图解多智能体协同架构设计与自主任务规划

![Multi-Agent 智能体协作网络](https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1000&auto=format&fit=crop&q=80)

## 1. 智能体核心脑部中枢：ReAct 循环
ReAct (Reasoning + Acting) 让大模型在生成答案前执行“思考-行动-观察”闭环。

![ReAct 循环执行流程图](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80)

### 1.1 状态机模型
- **Thought (思考)**：根据当前输入分析缺少的关键信息；
- **Action (行动)**：选择并调用对应工具 (如数据库查询 / Web 搜索)；
- **Observation (观察)**：解析工具返回的输出并存入工作记忆。

## 2. 多角色协作模式 (Supervisor vs Peer-to-Peer)
![Agent 角色编排拓扑](https://images.unsplash.com/photo-1516116211227-bbc8040d7c71?w=1000&auto=format&fit=crop&q=80)

## 3. 向量记忆库与 RAG 融合
利用 Milvus/Qdrant 存储对话历史和领域知识库，解决上下文超长遗忘问题。`,
  },
  {
    categorySlug: 'react',
    title: 'React 19 全栈架构图解：Server Components 与流式渲染',
    summary: '用架构图拆解 RSC 服务端组件流式传输、Suspense 占位、客户端水合与 Server Actions 执行全过程。',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&auto=format&fit=crop&q=80',
    tags: 'React,RSC,Next.js,架构图解',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 4120,
    likeCount: 310,
    content: `# React 19 全栈架构图解：Server Components 与流式渲染

![React 19 流式渲染图](https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1000&auto=format&fit=crop&q=80)

## 1. 客户端渲染 (CSR) vs 服务端组件 (RSC)
传统的 SSR 需要在客户端执行全量 JS 水合 (Hydration)，而 RSC 允许部分组件仅在服务端执行。

![水合流水线对比](https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1000&auto=format&fit=crop&q=80)

## 2. Server Actions 与表单提交
\`\`\`tsx
export default function CommentForm({ postId }: { postId: string }) {
  async function addComment(formData: FormData) {
    'use server';
    await saveComment(postId, formData.get('text'));
  }
  return <form action={addComment}>...</form>;
}
\`\`\`

## 3. 性能测试数据
打包体积减少 45%，首屏可交互时间 (TTI) 提前近 1.2 秒。`,
  },
  {
    categorySlug: 'docker-k8s',
    title: 'Kubernetes 生产级集群流量拓扑与多级 Ingress 架构',
    summary: '图解 K8s Service Mesh、Ingress-Nginx 负载均衡、Pod 自动伸缩 HPA 与零停机滚动更新流程。',
    coverImage: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&auto=format&fit=crop&q=80',
    tags: 'K8s,Docker,云原生,架构图解',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 3780,
    likeCount: 290,
    content: `# Kubernetes 生产级集群流量拓扑与多级 Ingress 架构

![K8s 生产集群流量走向](https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1000&auto=format&fit=crop&q=80)

## 1. 外部流量进入集群的多级路由
外部用户请求经过 DNS -> 云厂商 SLB -> NodePort -> Ingress Controller -> ClusterIP Service -> Pod。

![Pod 调度与服务发现](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80)

## 2. 金丝雀灰度发布 (Canary) 配置
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: article-service-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "15"
\`\`\`

## 3. 容灾与故障自愈
配置合理的 \`livenessProbe\` 和 \`readinessProbe\` 实现不健康 Pod 的自动驱逐与重建。`,
  },
  {
    categorySlug: 'database',
    title: 'MySQL 8.0 B+ 树索引结构与百万级慢查询调优实录',
    summary: '页分裂图解、聚簇索引 vs 二级索引、回表查询与 Covering Index 优化实战案例剖析。',
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&auto=format&fit=crop&q=80',
    tags: 'MySQL,索引优化,图解数据库',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 4600,
    likeCount: 350,
    content: `# MySQL 8.0 B+ 树索引结构与百万级慢查询调优实录

![InnoDB 索引存储结构](https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1000&auto=format&fit=crop&q=80)

## 1. InnoDB 页结构与 B+ 树分裂图解
InnoDB 数据以 16KB 的数据页 (Page) 为基本 I/O 单元。

![页目录与双向链表结构](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80)

### 1.1 覆盖索引与回表代价
- **聚簇索引**：叶子节点直接存放行完整数据；
- **二级索引**：叶子节点存放主键 ID，命中后需回表查询。

## 2. EXPLAIN 关键指标速查
| type 级别 | 含义 | 优化建议 |
| :--- | :--- | :--- |
| **system / const** | 主键或唯一索引等值匹配 | 最优状态 |
| **ref** | 非唯一索引等值匹配 | 良好 |
| **range** | 索引范围扫描 (BETWEEN, IN) | 合理使用 |
| **ALL** | 全表扫描 | 必须优化建索引 |

## 3. 分区表与只读从库读写分离
利用 ShardingSphere 或主从复制分摊高并发读负载。`,
  },
  {
    categorySlug: 'database',
    title: 'Redis 7.0 内存模型图解与分布式高可用哨兵集群',
    summary: '图解 SDS 动态字符串、SkipList 跳表、AOF 增量持久化及 Sentinel 自动故障切换过程。',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    tags: 'Redis,分布式缓存,哨兵模式,高可用',
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 3900,
    likeCount: 280,
    content: `# Redis 7.0 内存模型图解与分布式高可用哨兵集群

![Redis 哨兵与主从架构](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80)

## 1. Redis 底层核心数据结构图解
- **SDS**：预分配空间，杜绝缓冲区溢出；
- **Dict**：渐进式 rehash 保证单线程不会长时间卡顿；
- **SkipList**：跳表实现 ZSet 范围查询，复杂度稳定在 O(logN)。

![跳表层级索引图](https://images.unsplash.com/photo-1516116211227-bbc8040d7c71?w=1000&auto=format&fit=crop&q=80)

## 2. 哨兵集群 (Sentinel) 选主与切换
1. 主观下线 (sdown)；
2. 客观下线 (odown) 并发起 Raft 投票选出 Leader；
3. 从健康从节点中选出新 Master 并通知客户端。`,
  },
  {
    categorySlug: 'typescript',
    title: 'TypeScript 5.x 现代类型系统与 AST 抽象语法树剖析',
    summary: '图解 TypeScript 编译器 Pipeline：Scanner -> Parser -> Binder -> Checker -> Emitter。',
    coverImage: 'https://images.unsplash.com/photo-1516116211227-bbc8040d7c71?w=1200&auto=format&fit=crop&q=80',
    tags: 'TypeScript,AST,编译器,进阶',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 2950,
    likeCount: 210,
    content: `# TypeScript 5.x 现代类型系统与 AST 抽象语法树剖析

![TS 编译流水线架构](https://images.unsplash.com/photo-1516116211227-bbc8040d7c71?w=1000&auto=format&fit=crop&q=80)

## 1. 编译器核心五个阶段
1. **Scanner 词法分析**：将代码字符串切分为 Tokens；
2. **Parser 语法分析**：生成 AST 抽象语法树；
3. **Binder 符号绑定**：构建 Symbol 符号表与作用域链；
4. **Checker 类型检查**：推导类型并校验约束；
5. **Emitter 代码发射**：输出 JavaScript 与 .d.ts 声明文件。

![AST 树形节点层级](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80)

## 2. 高阶泛型推导实战
\`\`\`typescript
type DeepPartial<T> = T extends Function ? T : T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
\`\`\``,
  },
  {
    categorySlug: 'cicd',
    title: '现代化前端 DevOps 流水线：从 Git Commit 到 K8s 自动化部署',
    summary: '图解包含 Commitlint, SonarQube 代码质量门禁, Docker 镜像多阶段构建与 ArgoCD GitOps 交付。',
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&auto=format&fit=crop&q=80',
    tags: 'CI/CD,DevOps,GitOps,ArgoCD',
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 3200,
    likeCount: 240,
    content: `# 现代化前端 DevOps 流水线实战

![DevOps 自动化流水线流程图](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1000&auto=format&fit=crop&q=80)

## 1. GitOps 声明式发布拓扑
代码推送到仓库后，自动触发 GitHub Actions 编译产物，随后由 ArgoCD 监控 Git 仓库配置并同步至 K8s 集群。

![Docker 多阶段构建优化](https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1000&auto=format&fit=crop&q=80)

## 2. 多阶段 Dockerfile 减重
\`\`\`dockerfile
# 阶段 1: 构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

# 阶段 2: 运行时
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
\`\`\``,
  },
  {
    categorySlug: 'microservices',
    title: '高并发消息队列 Kafka vs RabbitMQ 架构选型与吞吐对比',
    summary: '图解顺序写磁盘、Zero-Copy 零拷贝技术、Partition 分区机制与消息幂等消费设计。',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    tags: 'Kafka,RabbitMQ,消息队列,高并发',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 4800,
    likeCount: 360,
    content: `# 高并发消息队列 Kafka vs RabbitMQ 架构选型

![消息队列核心架构图](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80)

## 1. Kafka 极致吞吐的秘密：零拷贝 (Zero-Copy)
传统读取需要 4 次上下文切换与 4 次数据拷贝，Kafka 利用 \`sendfile\` 系统调用直接在内核空间完成网络数据转发。

![零拷贝与页缓存原理](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80)

## 2. 选型对比决策表
- **Kafka**：适合日志收集、流计算、超高吞吐大数据场景 (百万级/秒)；
- **RabbitMQ**：适合业务解耦、延时队列、强事务与灵活路由场景。`,
  },
  {
    categorySlug: 'vue3',
    title: 'Vue 3 + Vite 5 企业级 Monorepo 大型前端工程架构实战',
    summary: '基于 pnpm workspace 构建核心组件库、管理后台、H5 端与公用 SDK 的多包架构图解。',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&auto=format&fit=crop&q=80',
    tags: 'Monorepo,Vite,Vue3,pnpm',
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 3400,
    likeCount: 260,
    content: `# Vue 3 + Vite 5 企业级 Monorepo 大型工程架构

![Monorepo 仓库拓扑结构](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1000&auto=format&fit=crop&q=80)

## 1. 目录设计与依赖隔离
\`\`\`text
├── apps/
│   ├── admin-web/      # 管理后台
│   └── mobile-web/     # 移动端
├── packages/
│   ├── ui-components/  # 通用组件库
│   ├── utils/          # 工具函数库
│   └── tsconfig/       # 基础类型配置
\`\`\`

![公共包引用拓扑](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80)

## 2. 优势总结
- 跨项目组件一处修改，全局实时生效；
- 统一代码规范 (ESLint, Prettier, Commitlint)。`,
  },
  {
    categorySlug: 'llm-agent',
    title: '图解 RAG 向量检索全流程：Chunking 切分、Embedding 嵌入与重排',
    summary: '知识库问答核心架构：文档解析清洗、文本切块策略、余弦相似度计算与 Cross-Encoder 重排图解。',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
    tags: 'RAG,向量检索,AI知识库,大模型',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 5100,
    likeCount: 420,
    content: `# 图解 RAG 向量检索全流程

![RAG 检索增强流水线](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80)

## 1. 为什么大模型需要 RAG？
解决 LLM 固有的“知识截止”与“幻觉”问题，让大模型回答企业私有专业数据。

![Embedding 高维向量空间示意图](https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1000&auto=format&fit=crop&q=80)

## 2. 混合检索策略 (Hybrid Search)
结合 BM25 关键词精确匹配与密集向量语义检索，大幅提升首轮召回率。`,
  },
  {
    categorySlug: 'frontend',
    title: 'WebAssembly (Wasm) 与 WebGL 图形渲染：浏览器端图像算法加速',
    summary: '利用 C++ / Rust 编写核心图像滤镜算法，编译为 Wasm 并在浏览器中实现 60FPS 实时渲染。',
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
    tags: 'WebAssembly,WebGL,图形图像,性能优化',
    status: 2,
    isTop: 0,
    isRecommend: 0,
    viewCount: 2780,
    likeCount: 195,
    content: `# WebAssembly 与 WebGL 图形渲染实战

![Wasm 与 JS 引擎交互架构](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1000&auto=format&fit=crop&q=80)

## 1. 为什么在前端使用 WebAssembly？
对于高计算密度的矩阵变换、音视频转码与图像特效，Wasm 能够接近原生机器码执行速度。

![帧率与渲染对比](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80)

## 2. 线性内存共享机制
通过 \`WebAssembly.Memory\` 直接与 TypedArray 进行二进制内存交换，零拷贝传递海量像素数据。`,
  },
  {
    categorySlug: 'backend',
    title: '领域驱动设计 (DDD) 在 NestJS 中的六边形架构 (Hexagonal) 落地',
    summary: '图解聚合根 (Aggregate Root)、值对象 (Value Object)、仓储接口与防腐层 (ACL) 代码组织。',
    coverImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&auto=format&fit=crop&q=80',
    tags: 'DDD,架构设计,NestJS,领域建模',
    status: 2,
    isTop: 0,
    isRecommend: 1,
    viewCount: 4300,
    likeCount: 325,
    content: `# DDD 在 NestJS 中的六边形架构落地

![六边形端口与适配器架构](https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1000&auto=format&fit=crop&q=80)

## 1. 核心领域层与外部依赖解耦
核心领域模型不依赖 TypeORM、HTTP 框架等任何基础设施，只通过抽象接口 (Ports) 与外部适配器通信。

![防腐层 ACL 转换图](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80)

## 2. 领域事件驱动业务流转
利用 \`AggregateRoot.apply(new UserRegisteredEvent())\` 实现发布-订阅解耦。`,
  },

  // === 4篇待审核图文文章 (status: 1) ===
  {
    categorySlug: 'vue3',
    title: '【待审】图解 Vue 3 自定义渲染器 (Custom Renderer) 与 Canvas 跨端引擎',
    summary: '通过扩展 nodeOps 与 patchProp 实现将 Vue 模板渲染至 PixiJS 与 2D Canvas 画布。',
    coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
    tags: 'Vue3,渲染器,Canvas,跨端',
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# Vue 3 自定义渲染器与 Canvas 跨端引擎

![自定义渲染器架构拓扑](https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80)

## 1. createRenderer 接口剖析
\`\`\`typescript
const { render, createApp } = createRenderer<Node, Element>({
  createElement(type) { /* 创建 Canvas 节点 */ },
  insert(el, parent) { /* 挂载场景树 */ },
  patchProp(el, key, prev, next) { /* 更新坐标/颜色 */ },
});
\`\`\`

![Canvas 场景树更新示意](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1000&auto=format&fit=crop&q=80)

## 2. 性能与帧率保障
使用虚拟节点缓冲与批处理 Dirty 标记，避免每帧全量重绘。`,
  },
  {
    categorySlug: 'nestjs',
    title: '【待审】NestJS 结合 SSE 与 RxJS 实现 AI 大模型打字机流式长文本输出',
    summary: '服务端 Server-Sent Events 流式推送配合前端 TextDecoder 与 Markdown 实时增量渲染。',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    tags: 'NestJS,SSE,大模型,RxJS',
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# NestJS 结合 SSE 与 RxJS 实现 AI 流式长文本输出

![SSE 流式数据单向通道图](https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80)

## 1. SSE 握手协议与心跳保持
客户端发起 \`Accept: text/event-stream\` 请求，服务端保持长连接并持续写入 \`data: chunk\\n\\n\`。

![流式分块解析时序图](https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1000&auto=format&fit=crop&q=80)

## 2. NestJS 控制器端代码
\`\`\`typescript
@Sse('chat/stream')
stream(@Query('prompt') prompt: string): Observable<MessageEvent> {
  return this.aiService.createStream(prompt);
}
\`\`\``,
  },
  {
    categorySlug: 'docker-k8s',
    title: '【待审】图解 Docker 容器底层核心：Namespaces 隔离与 Cgroups 资源限制',
    summary: '从 Linux 内核视角拆解 PID/Mount/Network 命名空间与 CPU/内存带宽配额控制机制。',
    coverImage: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&auto=format&fit=crop&q=80',
    tags: 'Docker,Linux内核,Cgroups,容器原理',
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# 图解 Docker 容器底层核心原理

![Namespaces 与 Cgroups 架构图](https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1000&auto=format&fit=crop&q=80)

## 1. 六大命名空间隔离
- **PID Namespace**：进程编号隔离；
- **NET Namespace**：独立网络协议栈与虚拟网卡；
- **MNT Namespace**：文件系统挂载点隔离。

![UnionFS 联合文件系统分层](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80)

## 2. Overlay2 存储驱动
只读镜像层 (LowerDir) + 读写容器层 (UpperDir) + 统一合并视图 (MergedDir)。`,
  },
  {
    categorySlug: 'microservices',
    title: '【待审】微服务限流熔断与降级体系：Sentinel 与令牌桶算法实战',
    summary: '图解漏桶算法 (Leaky Bucket)、令牌桶算法 (Token Bucket) 与滑动窗口在高并发网关中的落地。',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    tags: '微服务,限流熔断,高可用,Sentinel',
    status: 1,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# 微服务限流熔断与降级体系

![限流熔断保护拓扑](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80)

## 1. 经典限流算法对比
- **固定窗口计数器**：实现简单但在窗口切换临界点存在双倍突发流量问题；
- **滑动时间窗口**：解决临界跳跃；
- **令牌桶算法**：允许一定程度的突发流量平滑通过。

![熔断器状态机 (Closed -> Open -> Half-Open)](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80)

## 2. 降级兜底策略
当依赖的下游服务超时时，自动返回本地降级 Mock 缓存数据，避免雪崩效应。`,
  },

  // === 1篇草稿 (status: 0) ===
  {
    categorySlug: 'react',
    title: '【草稿】React 19 Hooks 核心源码：useTransition 与 useOptimistic 状态机',
    summary: '图文梳理并发模式下优先级调度 (Lane Models) 与低优先级任务打断机制。',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&auto=format&fit=crop&q=80',
    tags: 'React,Hooks,并发模式',
    status: 0,
    isTop: 0,
    isRecommend: 0,
    viewCount: 0,
    likeCount: 0,
    content: `# React 19 Hooks 核心源码与状态机

![React 调度器 Lane 优先级模型](https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1000&auto=format&fit=crop&q=80)

## 1. 什么是 Lane 赛道模型？
React 将 31 位二进制数映射为不同的优先级赛道 (SyncLane, InputContinuousLane, DefaultLane, IdleLane)。

## 2. 待补充章节
- useOptimistic 内部回滚栈
- Server Actions 错误边界捕获`,
  },

  // === 1篇已驳回 (status: 3) ===
  {
    categorySlug: 'ai',
    title: '【已驳回】大模型微调 (Fine-Tuning) 实战：LoRA 与 QLoRA 显存优化指南',
    summary: '低秩适应矩阵 (Low-Rank Adaptation) 数学原理、4-bit 量化与消费级单卡微调 7B 模型。',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80',
    tags: 'AI,LoRA,大模型微调,深度学习',
    status: 3,
    isTop: 0,
    isRecommend: 0,
    viewCount: 88,
    likeCount: 6,
    content: `# 大模型微调实战：LoRA 与 QLoRA 显存优化指南

![LoRA 矩阵低秩分解示意图](https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1000&auto=format&fit=crop&q=80)

## 1. LoRA 数学原理
冻结原预训练权重矩阵 W0 (d×k)，仅训练两个低秩矩阵 A (d×r) 与 B (r×k)，其中 r << min(d, k)。
\`\`\`text
h = W0 * x + (B * A) * x * (alpha / r)
\`\`\`

![QLoRA 4-bit 量化流水线](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80)

## 2. 显存开销对比
单卡 RTX 4090 (24GB) 即可完成 Llama-3-8B 的高效全参数适配微调。`,
  },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '39.108.137.45',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1234@Dong',
    database: process.env.DB_DATABASE || 'nest_admin',
  });

  console.log('Connected to MySQL. Inserting 20 illustrated technical articles with Markdown images...');

  // 1. 获取现有分类映射
  const [cats] = await conn.query('SELECT id, slug FROM art_category WHERE deleted_at IS NULL');
  const catMap = {};
  cats.forEach((c) => {
    catMap[c.slug] = Number(c.id);
  });
  const defaultCatId = cats.length > 0 ? Number(cats[0].id) : 1;

  // 2. 清理旧文章（如需要保留干净的 20 篇精选）或直接插入
  await conn.query('DELETE FROM art_audit_log');
  await conn.query('DELETE FROM art_article');

  for (const art of illustratedArticles) {
    const categoryId = catMap[art.categorySlug] || defaultCatId;
    const tocData = parseMarkdownToc(art.content);
    const publishedAt = art.status === 2 ? new Date() : null;

    const [res] = await conn.query(
      `INSERT INTO art_article (
        category_id, author_id, title, summary, cover_image, content,
        toc_data, tags, source_type, status, is_top, is_recommend,
        allow_comment, view_count, like_count, published_at, created_at, updated_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?, ?, NOW(3), NOW(3))`,
      [
        categoryId,
        art.title,
        art.summary,
        art.coverImage,
        art.content,
        JSON.stringify(tocData),
        art.tags,
        art.status,
        art.isTop,
        art.isRecommend,
        art.viewCount,
        art.likeCount,
        publishedAt,
      ]
    );

    const articleId = res.insertId;

    // 审核日志记录
    if (art.status === 2) {
      await conn.query(
        `INSERT INTO art_audit_log (article_id, auditor_id, previous_status, current_status, audit_result, audit_comment, created_at)
         VALUES (?, 1, 1, 2, 1, '图文排版规范，图解架构详实，审核通过并发布。', NOW(3))`,
        [articleId]
      );
    } else if (art.status === 3) {
      await conn.query(
        `INSERT INTO art_audit_log (article_id, auditor_id, previous_status, current_status, audit_result, audit_comment, created_at)
         VALUES (?, 1, 1, 3, 2, '部分数学公式推导缺少符号定义，图表建议补充标注后重新提交。', NOW(3))`,
        [articleId]
      );
    }
  }

  console.log(`Successfully seeded ${illustratedArticles.length} illustrated articles with rich embedded images and TOC!`);
  await conn.end();
}

seed().catch((err) => {
  console.error('Failed to seed illustrated articles:', err);
  process.exit(1);
});
