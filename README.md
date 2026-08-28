# Nest Admin Server (NestJS 11 + TypeORM + Redis + MySQL)

基于 NestJS 11 框架构建的企业级通用后台管理系统服务端（RBAC 权限管理架构），包含认证中心、用户管理、角色权限、部门管理、菜单管理、字典管理、参数配置、操作日志以及验证码、限流、安全防护等完整基础设施。

---

## 🌟 核心特性

- **架构设计**：采用模块化（Modular）分层设计，低耦合高内聚
- **鉴权安全**：JWT Access Token + Refresh Token 双令牌续期机制，基于 CASL 的声明式细粒度权限控制
- **数据持久化**：TypeORM 配合 MySQL，支持软删除、数据审计字段（自动记录创建人/更新人/时间）
- **高性能缓存**：Redis 存储验证码、会话状态及用户权限缓存，秒级响应
- **接口文档**：Knife4j + Swagger 交互式 API 文档，带基础身份验证保护
- **全链路日志**：集成 Winston 实现控制台与按天切分的日志归档，拦截器自动捕获记录操作与访问日志
- **安全与防护**：Helmet 安全头、Throttler 防刷限流、全局异常捕获过滤与统一响应数据格式包装

---

## 🗂 模块概览

```text
src/
├── common/             # 全局公共模块
│   ├── constants/      # 常量定义 (Redis Key、全局配置)
│   ├── decorators/     # 自定义装饰器 (@CurrentUser, @Public, @CheckPolicies, @Log)
│   ├── enums/          # 全局枚举
│   ├── filters/        # 全局异常过滤器 (AllExceptionsFilter)
│   ├── guards/         # 守卫 (JwtAuthGuard, PoliciesGuard, LocalThrottlerGuard)
│   ├── interceptors/   # 拦截器 (TransformInterceptor, LoggingInterceptor)
│   ├── interfaces/     # 通用接口定义
│   └── pipes/          # 自定义管道 (ValidationPipe)
├── config/             # 配置管理 (app, database, redis, jwt, swagger)
├── database/           # 数据库核心基础实体 (BaseEntity)
└── modules/            # 业务功能模块
    ├── auth/           # 登录、登出、验证码、Token刷新、用户信息
    ├── casl/           # CASL 权限规则构建与校验
    ├── tools/          # 基础工具 (文件上传等)
    └── system/         # 系统管理模块
        ├── user/       # 用户管理 (CRUD、状态切换、重置密码、导出等)
        ├── role/       # 角色管理 (CRUD、菜单分配、权限绑定)
        ├── dept/       # 部门管理 (树形结构维护、物化路径)
        ├── menu/       # 菜单管理 (路由树、动态权限按钮)
        ├── dict/       # 字典管理 (字典类型与字典数据)
        ├── param-config/ # 系统参数配置
        └── log/        # 访问日志与操作日志管理
```

---

## 🚀 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/eggCodedmb/nest-admin-server.git
cd nest-admin-server
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并根据实际环境调整：

```bash
cp .env.example .env
```

### 4. 运行数据库初始化脚本（可选）

```bash
# 初始化表结构与初始种子数据（超级管理员账号：admin / admin123）
node scripts/init-db.js
node scripts/seed-db.js
```

### 5. 启动服务

```bash
# 开发模式 (带热更新)
npm run start:dev

# 生产构建与启动
npm run build
npm run start:prod
```

服务默认运行在 `http://localhost:3000`。

---

## 📖 API 接口文档

启动后访问 Swagger / Knife4j 文档：
- 文档地址：`http://localhost:3000/api-docs`
- 默认登录账号：`admin`
- 默认登录密码：`admin123`

---

## 🛠 常用脚本

| 脚本命令 | 描述 |
| --- | --- |
| `npm run start:dev` | 开发模式运行 |
| `npm run build` | 编译构建生产代码 |
| `npm run lint` | ESLint 自动检查与修复 |
| `npm run format` | Prettier 代码格式化 |
| `npm test` | 执行单元测试 |
