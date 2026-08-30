require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// 1. 部门数据定义 (25 个层级清晰的企业部门结构)
const mockDepts = [
  // 顶级部门
  { id: 1, parent_id: null, mpath: '1.', dept_name: '集团总部', order_num: 1, leader: '张建国', phone: '13800000001', email: 'hq@nest-admin.com', status: 1 },

  // 二级中心/部门 (Parent: 1)
  { id: 4, parent_id: 1, mpath: '1.4.', dept_name: '总裁办公室', order_num: 1, leader: '王晓燕', phone: '13800000004', email: 'ceo_office@nest-admin.com', status: 1 },
  { id: 2, parent_id: 1, mpath: '1.2.', dept_name: '技术研发中心', order_num: 2, leader: '李强', phone: '13800000002', email: 'rd@nest-admin.com', status: 1 },
  { id: 5, parent_id: 1, mpath: '1.5.', dept_name: '产品与设计中心', order_num: 3, leader: '陈晨', phone: '13800000005', email: 'product@nest-admin.com', status: 1 },
  { id: 6, parent_id: 1, mpath: '1.6.', dept_name: '市场与运营中心', order_num: 4, leader: '赵敏', phone: '13800000006', email: 'marketing@nest-admin.com', status: 1 },
  { id: 7, parent_id: 1, mpath: '1.7.', dept_name: '人力与行政中心', order_num: 5, leader: '刘芳', phone: '13800000007', email: 'hr@nest-admin.com', status: 1 },
  { id: 8, parent_id: 1, mpath: '1.8.', dept_name: '财务与风控中心', order_num: 6, leader: '周伟', phone: '13800000008', email: 'finance@nest-admin.com', status: 1 },
  { id: 9, parent_id: 1, mpath: '1.9.', dept_name: '客户成功与支持中心', order_num: 7, leader: '孙磊', phone: '13800000009', email: 'cs@nest-admin.com', status: 1 },

  // 三级部门 - 技术研发中心下属 (Parent: 2)
  { id: 10, parent_id: 2, mpath: '1.2.10.', dept_name: '前端架构部', order_num: 1, leader: '吴杰', phone: '13900000010', email: 'fe@nest-admin.com', status: 1 },
  { id: 11, parent_id: 2, mpath: '1.2.11.', dept_name: '后端技术部', order_num: 2, leader: '郑浩', phone: '13900000011', email: 'be@nest-admin.com', status: 1 },
  { id: 12, parent_id: 2, mpath: '1.2.12.', dept_name: '移动端开发部', order_num: 3, leader: '林峰', phone: '13900000012', email: 'mobile@nest-admin.com', status: 1 },
  { id: 13, parent_id: 2, mpath: '1.2.13.', dept_name: '质量保障与测试部', order_num: 4, leader: '韩雪', phone: '13900000013', email: 'qa@nest-admin.com', status: 1 },
  { id: 14, parent_id: 2, mpath: '1.2.14.', dept_name: 'DevOps与基础设施部', order_num: 5, leader: '杨波', phone: '13900000014', email: 'devops@nest-admin.com', status: 1 },
  { id: 15, parent_id: 2, mpath: '1.2.15.', dept_name: 'AI与算法工程实验室', order_num: 6, leader: '许明', phone: '13900000015', email: 'ai@nest-admin.com', status: 1 },
  { id: 16, parent_id: 2, mpath: '1.2.16.', dept_name: '大数据平台部', order_num: 7, leader: '冯凯', phone: '13900000016', email: 'bigdata@nest-admin.com', status: 1 },

  // 三级部门 - 产品与设计中心下属 (Parent: 5)
  { id: 17, parent_id: 5, mpath: '1.5.17.', dept_name: '核心业务产品部', order_num: 1, leader: '何静', phone: '13700000017', email: 'core_prod@nest-admin.com', status: 1 },
  { id: 18, parent_id: 5, mpath: '1.5.18.', dept_name: '商业化产品部', order_num: 2, leader: '曹雷', phone: '13700000018', email: 'biz_prod@nest-admin.com', status: 1 },
  { id: 19, parent_id: 5, mpath: '1.5.19.', dept_name: 'UI与用户体验设计部', order_num: 3, leader: '沈琳', phone: '13700000019', email: 'design@nest-admin.com', status: 1 },

  // 三级部门 - 市场与运营中心下属 (Parent: 6)
  { id: 20, parent_id: 6, mpath: '1.6.20.', dept_name: '品牌公关部', order_num: 1, leader: '魏薇', phone: '13600000020', email: 'pr@nest-admin.com', status: 1 },
  { id: 21, parent_id: 6, mpath: '1.6.21.', dept_name: '数字营销与增长部', order_num: 2, leader: '姜鹏', phone: '13600000021', email: 'growth@nest-admin.com', status: 1 },
  { id: 22, parent_id: 6, mpath: '1.6.22.', dept_name: '商务拓展与渠道部', order_num: 3, leader: '谢华', phone: '13600000022', email: 'bd@nest-admin.com', status: 1 },

  // 三级部门 - 人力与行政中心下属 (Parent: 7)
  { id: 23, parent_id: 7, mpath: '1.7.23.', dept_name: '招聘与人才发展部', order_num: 1, leader: '邹芳', phone: '13500000023', email: 'recruiting@nest-admin.com', status: 1 },
  { id: 24, parent_id: 7, mpath: '1.7.24.', dept_name: '薪酬绩效与员工关系部', order_num: 2, leader: '喻文', phone: '13500000024', email: 'hr_ops@nest-admin.com', status: 1 },

  // 三级部门 - 财务与风控中心下属 (Parent: 8)
  { id: 25, parent_id: 8, mpath: '1.8.25.', dept_name: '财务核算与资金部', order_num: 1, leader: '秦洋', phone: '13400000025', email: 'accounting@nest-admin.com', status: 1 },
  { id: 26, parent_id: 8, mpath: '1.8.26.', dept_name: '审计合规与法务部', order_num: 2, leader: '章涛', phone: '13400000026', email: 'audit@nest-admin.com', status: 1 },

  // 三级部门 - 客户成功与支持中心下属 (Parent: 9)
  { id: 27, parent_id: 9, mpath: '1.9.27.', dept_name: '售前解决方案部', order_num: 1, leader: '彭飞', phone: '13300000027', email: 'presales@nest-admin.com', status: 1 },
  { id: 28, parent_id: 9, mpath: '1.9.28.', dept_name: '售后服务与技术支持部', order_num: 2, leader: '范敏', phone: '13300000028', email: 'support@nest-admin.com', status: 1 },
];

// 2. 100 位真实多样化的模拟员工数据源
const mockUsersRaw = [
  // 总裁办 (dept_id: 4)
  { username: 'wang.xiaoyan', nickname: '王晓燕', deptId: 4, sex: 2, roleId: 3, remark: '总裁助理 / 负责高管战略协调与督办' },
  { username: 'li.zijian', nickname: '李子健', deptId: 4, sex: 1, roleId: 2, remark: '战略规划专家 / 负责集团年度战略落地规划' },
  { username: 'zhang.yuting', nickname: '张雨婷', deptId: 4, sex: 2, roleId: 2, remark: '高级行政秘书 / 负责高层会议与行程统筹' },

  // 前端架构部 (dept_id: 10)
  { username: 'wu.jie', nickname: '吴杰', deptId: 10, sex: 1, roleId: 3, remark: '前端架构师 / 负责中后台前端体系搭建' },
  { username: 'chen.zhiqiang', nickname: '陈志强', deptId: 10, sex: 1, roleId: 2, remark: '资深前端工程师 / 负责Vue3与TypeScript核心组件' },
  { username: 'su.yuxin', nickname: '苏雨欣', deptId: 10, sex: 2, roleId: 2, remark: '前端开发工程师 / 负责动态表单与权限控制' },
  { username: 'huang.bo', nickname: '黄博', deptId: 10, sex: 1, roleId: 2, remark: 'Web全栈工程师 / 负责前端工程化与性能调优' },
  { username: 'tang.wei', nickname: '唐薇', deptId: 10, sex: 2, roleId: 2, remark: '前端可视化专家 / 负责ECharts与大屏看板' },
  { username: 'lu.xun', nickname: '鲁迅', deptId: 10, sex: 1, roleId: 2, remark: '前端开发工程师 / 负责微前端与主子应用通信' },

  // 后端技术部 (dept_id: 11)
  { username: 'zheng.hao', nickname: '郑浩', deptId: 11, sex: 1, roleId: 3, remark: '后端技术负责人 / 负责微服务技术栈选型与治理' },
  { username: 'wang.haiyan', nickname: '王海燕', deptId: 11, sex: 2, roleId: 2, remark: '资深NestJS工程师 / 负责系统核心业务接口' },
  { username: 'liu.jianjun', nickname: '刘建军', deptId: 11, sex: 1, roleId: 2, remark: '高并发架构师 / 负责分布式缓存与消息队列' },
  { username: 'zhang.lei', nickname: '张磊', deptId: 11, sex: 1, roleId: 2, remark: '后端开发工程师 / 负责RBAC与多租户权限系统' },
  { username: 'qiao.feng', nickname: '乔峰', deptId: 11, sex: 1, roleId: 2, remark: '数据库专家 / 负责MySQL索引调优与分库分表' },
  { username: 'yang.guang', nickname: '杨光', deptId: 11, sex: 1, roleId: 2, remark: '资深后端工程师 / 负责日志审计与安全合规模块' },
  { username: 'deng.chao', nickname: '邓超', deptId: 11, sex: 1, roleId: 2, remark: 'Node.js全栈工程师 / 负责中间件与API网关' },
  { username: 'zhu.li', nickname: '朱莉', deptId: 11, sex: 2, roleId: 2, remark: '后端开发工程师 / 负责字典管理与动态配置引擎' },

  // 移动端开发部 (dept_id: 12)
  { username: 'lin.feng', nickname: '林峰', deptId: 12, sex: 1, roleId: 3, remark: '移动端技术总监 / 负责iOS与Android双端架构' },
  { username: 'fang.datong', nickname: '方大同', deptId: 12, sex: 1, roleId: 2, remark: 'Flutter资深专家 / 负责跨平台核心App开发' },
  { username: 'xie.tingfeng', nickname: '谢霆锋', deptId: 12, sex: 1, roleId: 2, remark: 'iOS高级工程师 / 负责移动端原生插件封装' },
  { username: 'gui.lunmei', nickname: '桂纶镁', deptId: 12, sex: 2, roleId: 2, remark: 'UniApp工程师 / 负责微信小程序与H5多端适配' },
  { username: 'peng.yuyan', nickname: '彭于晏', deptId: 12, sex: 1, roleId: 2, remark: 'Android工程师 / 负责移动端安全加固与推送服务' },

  // 质量保障与测试部 (dept_id: 13)
  { username: 'han.xue', nickname: '韩雪', deptId: 13, sex: 2, roleId: 3, remark: '测试总监 / 负责全生命周期质量体系构建' },
  { username: 'zhou.jie', nickname: '周洁', deptId: 13, sex: 2, roleId: 2, remark: '自动化测试专家 / 负责接口自动化与Playwright测试' },
  { username: 'sun.hang', nickname: '孙航', deptId: 13, sex: 1, roleId: 2, remark: '性能测试工程师 / 负责JMeter压测与容量评估' },
  { username: 'chen.jing', nickname: '陈晶', deptId: 13, sex: 2, roleId: 2, remark: '功能测试工程师 / 负责权限系统与中后台用例设计' },
  { username: 'ma.long', nickname: '马龙', deptId: 13, sex: 1, roleId: 2, remark: '安全测试工程师 / 负责渗透测试与漏洞扫描' },

  // DevOps与基础设施部 (dept_id: 14)
  { username: 'yang.bo', nickname: '杨波', deptId: 14, sex: 1, roleId: 3, remark: 'DevOps负责人 / 负责K8s集群与CI/CD流水线' },
  { username: 'gao.yuan', nickname: '高远', deptId: 14, sex: 1, roleId: 2, remark: 'SRE运维专家 / 负责Prometheus监控与应急响应' },
  { username: 'tian.liang', nickname: '田亮', deptId: 14, sex: 1, roleId: 2, remark: '云原生工程师 / 负责Docker容器化与网格治理' },
  { username: 'jin.dong', nickname: '靳东', deptId: 14, sex: 1, roleId: 2, remark: '网络安全工程师 / 负责WAF与防火墙策略维护' },

  // AI与算法工程实验室 (dept_id: 15)
  { username: 'xu.ming', nickname: '许明', deptId: 15, sex: 1, roleId: 3, remark: 'AI首席科学家 / 负责大模型微调与Agent架构' },
  { username: 'he.jiong', nickname: '何炅', deptId: 15, sex: 1, roleId: 2, remark: 'NLP算法工程师 / 负责智能知识库与RAG检索' },
  { username: 'yin.tao', nickname: '殷桃', deptId: 15, sex: 2, roleId: 2, remark: 'CV视觉算法工程师 / 负责OCR识别与图像处理' },
  { username: 'pan.yueming', nickname: '潘粤明', deptId: 15, sex: 1, roleId: 2, remark: 'AI工程化专家 / 负责模型部署与推理加速' },

  // 大数据平台部 (dept_id: 16)
  { username: 'feng.kai', nickname: '冯凯', deptId: 16, sex: 1, roleId: 3, remark: '大数据架构师 / 负责实时与离线数仓建设' },
  { username: 'bai.yu', nickname: '白宇', deptId: 16, sex: 1, roleId: 2, remark: 'Flink实时计算工程师 / 负责日志流式处理' },
  { username: 'tong.liya', nickname: '佟丽娅', deptId: 16, sex: 2, roleId: 2, remark: '数仓开发工程师 / 负责用户行为数据指标建模' },
  { username: 'lei.jiayin', nickname: '雷佳音', deptId: 16, sex: 1, roleId: 2, remark: 'BI数据分析师 / 负责管理层经营看板与数据大盘' },

  // 核心业务产品部 (dept_id: 17)
  { username: 'he.jing', nickname: '何静', deptId: 17, sex: 2, roleId: 3, remark: '产品总监 / 负责企业级中后台产品线规划' },
  { username: 'xiao.zhan', nickname: '肖战', deptId: 17, sex: 1, roleId: 2, remark: '资深产品经理 / 负责用户体系与RBAC权限设计' },
  { username: 'yang.zi', nickname: '杨紫', deptId: 17, sex: 2, roleId: 2, remark: '高级产品经理 / 负责流程审批与工作流引擎' },
  { username: 'li.xian', nickname: '李现', deptId: 17, sex: 1, roleId: 2, remark: '产品经理 / 负责系统监控与操作日志模块' },

  // 商业化产品部 (dept_id: 18)
  { username: 'cao.lei', nickname: '曹雷', deptId: 18, sex: 1, roleId: 3, remark: '商业化产品负责人 / 负责SaaS计费与套餐订阅' },
  { username: 'dilireba', nickname: '迪丽热巴', deptId: 18, sex: 2, roleId: 2, remark: '商业产品经理 / 负责开放平台OpenAPI与计费中台' },
  { username: 'wu.lei', nickname: '吴磊', deptId: 18, sex: 1, roleId: 2, remark: '产品经理 / 负责支付对账与会员权益系统' },

  // UI与用户体验设计部 (dept_id: 19)
  { username: 'shen.lin', nickname: '沈琳', deptId: 19, sex: 2, roleId: 3, remark: '设计总监 / 负责Design System与品牌设计语言' },
  { username: 'liu.shishi', nickname: '刘诗诗', deptId: 19, sex: 2, roleId: 2, remark: '资深UI设计师 / 负责中后台暗黑模式与主题规范' },
  { username: 'wang.yibo', nickname: '王一博', deptId: 19, sex: 1, roleId: 2, remark: '交互设计师 / 负责复杂表格与树形结构交互体验' },
  { username: 'zhao.liying', nickname: '赵丽颖', deptId: 19, sex: 2, roleId: 2, remark: '视觉设计师 / 负责系统图标库与营销插画' },

  // 品牌公关部 (dept_id: 20)
  { username: 'wei.wei', nickname: '魏薇', deptId: 20, sex: 2, roleId: 3, remark: '公关总监 / 负责企业品牌传播与媒体矩阵运营' },
  { username: 'hu.ge', nickname: '胡歌', deptId: 20, sex: 1, roleId: 2, remark: '高级公关专家 / 负责新闻发布与品牌声誉管理' },
  { username: 'liu.yifei', nickname: '刘亦菲', deptId: 20, sex: 2, roleId: 2, remark: '内容策划经理 / 负责官方博客与技术白皮书撰写' },

  // 数字营销与增长部 (dept_id: 21)
  { username: 'jiang.peng', nickname: '姜鹏', deptId: 21, sex: 1, roleId: 3, remark: '增长运营负责人 / 负责线索获取与转化漏斗优化' },
  { username: 'guan.xiaotong', nickname: '关晓彤', deptId: 21, sex: 2, roleId: 2, remark: 'SEO/SEM投放专家 / 负责搜索引擎与信息流广告' },
  { username: 'lu.han', nickname: '鹿晗', deptId: 21, sex: 1, roleId: 2, remark: '社群运营经理 / 负责开发者社区与用户促活' },
  { username: 'ju.jingyi', nickname: '鞠婧祎', deptId: 21, sex: 2, roleId: 2, remark: '数据运营专员 / 负责全渠道转化漏斗追踪' },

  // 商务拓展与渠道部 (dept_id: 22)
  { username: 'xie.hua', nickname: '谢华', deptId: 22, sex: 1, roleId: 3, remark: '商务总监 / 负责大客户拓展与渠道代理网络' },
  { username: 'chen.kun', nickname: '陈坤', deptId: 22, sex: 1, roleId: 2, remark: '战略拓展总监 / 负责政企大客户合作签约' },
  { username: 'zhou.xun', nickname: '周迅', deptId: 22, sex: 2, roleId: 2, remark: '渠道合作经理 / 负责区域生态伙伴招募与赋能' },
  { username: 'huang.xiaoming', nickname: '黄晓明', deptId: 22, sex: 1, roleId: 2, remark: '销售经理 / 负责华东大区销售业绩指标达成' },

  // 招聘与人才发展部 (dept_id: 23)
  { username: 'zou.fang', nickname: '邹芳', deptId: 23, sex: 2, roleId: 3, remark: 'HRD / 负责全集团人才战略与组织发展' },
  { username: 'sun.li', nickname: '孙俪', deptId: 23, sex: 2, roleId: 2, remark: '资深技术招聘专家 / 负责高端研发人才寻访' },
  { username: 'deng.lun', nickname: '邓伦', deptId: 23, sex: 1, roleId: 2, remark: '培训与发展经理 / 负责管培生培养与领导力训练' },
  { username: 'yang.mi', nickname: '杨幂', deptId: 23, sex: 2, roleId: 2, remark: 'HRBP / 负责技术研发中心组织关怀与团队赋能' },

  // 薪酬绩效与员工关系部 (dept_id: 24)
  { username: 'yu.wen', nickname: '喻文', deptId: 24, sex: 1, roleId: 3, remark: '薪酬绩效总监 / 负责职级薪酬体系设计' },
  { username: 'zhang.ruoyun', nickname: '张若昀', deptId: 24, sex: 1, roleId: 2, remark: '绩效管理专家 / 负责季度OKR考核与奖金核算' },
  { username: 'tang.yan', nickname: '唐嫣', deptId: 24, sex: 2, roleId: 2, remark: '员工关系主管 / 负责入离职办理与劳动合规' },
  { username: 'jing.tian', nickname: '景甜', deptId: 24, sex: 2, roleId: 2, remark: '行政服务经理 / 负责办公环境与节日福利采购' },

  // 财务核算与资金部 (dept_id: 25)
  { username: 'qin.yang', nickname: '秦洋', deptId: 25, sex: 1, roleId: 3, remark: '财务总监 / 负责全面预算管理与资金筹划' },
  { username: 'ma.yili', nickname: '马伊琍', deptId: 25, sex: 2, roleId: 2, remark: '总账会计主管 / 负责月度结账与报表合并' },
  { username: 'tong.dawei', nickname: '佟大为', deptId: 25, sex: 1, roleId: 2, remark: '税务筹划专家 / 负责研发加计扣除与税收优惠申报' },
  { username: 'hai.qing', nickname: '海清', deptId: 25, sex: 2, roleId: 2, remark: '出纳主管 / 负责日常资金支付与银行账户管理' },

  // 审计合规与法务部 (dept_id: 26)
  { username: 'zhang.tao', nickname: '章涛', deptId: 26, sex: 1, roleId: 3, remark: '法务总监 / 负责商业合同审核与上市合规' },
  { username: 'du.jiang', nickname: '杜江', deptId: 26, sex: 1, roleId: 2, remark: '内审风控专家 / 负责内部流程合规审计与反舞弊' },
  { username: 'huo.siyan', nickname: '霍思燕', deptId: 26, sex: 2, roleId: 2, remark: '知识产权法务 / 负责软件著作权与专利申报' },

  // 售前解决方案部 (dept_id: 27)
  { username: 'peng.fei', nickname: '彭飞', deptId: 27, sex: 1, roleId: 3, remark: '售前架构总监 / 负责大客户技术方案宣讲' },
  { username: 'zhang.yi', nickname: '张译', deptId: 27, sex: 1, roleId: 2, remark: '高级解决方案架构师 / 负责金融行业解决方案' },
  { username: 'song.jia', nickname: '宋佳', deptId: 27, sex: 2, roleId: 2, remark: '售前技术经理 / 负责招投标方案编制与POC验证' },
  { username: 'wang.kai', nickname: '王凯', deptId: 27, sex: 1, roleId: 2, remark: '交付咨询专家 / 负责项目实施前置调研' },

  // 售后服务与技术支持部 (dept_id: 28)
  { username: 'fan.min', nickname: '范敏', deptId: 28, sex: 2, roleId: 3, remark: '客户服务总监 / 负责SLA服务达标率与NPS满意度' },
  { username: 'jiang.xin', nickname: '蒋欣', deptId: 28, sex: 2, roleId: 2, remark: '高级技术支持工程师 / 负责7x24线上故障应急排查' },
  { username: 'guo.jingfei', nickname: '郭京飞', deptId: 28, sex: 1, roleId: 2, remark: '客户成功经理 / 负责老客户续约与增购赋能' },
  { username: 'lei.jun', nickname: '雷军', deptId: 28, sex: 1, roleId: 2, remark: '售后服务专员 / 负责工单流转与客户回访' },

  // 补充更多各部门研发/设计/管理/运营员工，总计达到 100 位真实数据
  { username: 'qiu.shuzhen', nickname: '邱淑贞', deptId: 10, sex: 2, roleId: 2, remark: '前端开发工程师 / 负责用户中心与个人资料页面' },
  { username: 'wang.zuxian', nickname: '王祖贤', deptId: 10, sex: 2, roleId: 2, remark: '前端开发工程师 / 负责动态菜单与路由守卫组件' },
  { username: 'zhong.chuhong', nickname: '钟楚红', deptId: 10, sex: 2, roleId: 2, remark: '前端开发工程师 / 负责通用ProTable组件二次封装' },
  { username: 'guan.zhilin', nickname: '关之琳', deptId: 10, sex: 2, roleId: 2, remark: '前端开发工程师 / 负责国际化多语言模块维护' },

  { username: 'liang.chaowei', nickname: '梁朝伟', deptId: 11, sex: 1, roleId: 2, remark: '资深后端开发工程师 / 负责CASL细粒度策略鉴权' },
  { username: 'liu.dehua', nickname: '刘德华', deptId: 11, sex: 1, roleId: 2, remark: '后端开发工程师 / 负责数据字典CRUD与Redis热点缓存' },
  { username: 'zhang.xueyou', nickname: '张学友', deptId: 11, sex: 1, roleId: 2, remark: '后端开发工程师 / 负责参数配置管理与热更新通知' },
  { username: 'li.ming.rd', nickname: '黎明', deptId: 11, sex: 1, roleId: 2, remark: '后端开发工程师 / 负责部门组织树与物化路径逻辑' },
  { username: 'gu.tianle', nickname: '古天乐', deptId: 11, sex: 1, roleId: 2, remark: '后端开发工程师 / 负责用户批量导入与Excel导出引擎' },
  { username: 'wu.yanzu', nickname: '吴彦祖', deptId: 11, sex: 1, roleId: 2, remark: '安全合规工程师 / 负责密码加盐哈希与Token黑名单' },

  { username: 'zhang.guorong', nickname: '张国荣', deptId: 12, sex: 1, roleId: 2, remark: '高级移动端架构师 / 负责多端统一SDK设计' },
  { username: 'chen.guanxi', nickname: '陈冠希', deptId: 12, sex: 1, roleId: 2, remark: 'iOS开发工程师 / 负责移动端人脸识别集成' },
  { username: 'yu.wenle', nickname: '余文乐', deptId: 12, sex: 1, roleId: 2, remark: 'Android开发工程师 / 负责离线数据库与同步机制' },

  { username: 'mei.yanfang', nickname: '梅艳芳', deptId: 13, sex: 2, roleId: 2, remark: '资深QA工程师 / 负责全量回归测试套件维护' },
  { username: 'zhang.manyu', nickname: '张曼玉', deptId: 13, sex: 2, roleId: 2, remark: '接口测试工程师 / 负责Postman与自动化持续集成' },
  { username: 'lin.qingxia', nickname: '林青霞', deptId: 13, sex: 2, roleId: 2, remark: '性能测试工程师 / 负责高并发网关压测报告编制' },

  { username: 'zhou.xingchi', nickname: '周星驰', deptId: 14, sex: 1, roleId: 2, remark: '高级运维架构师 / 负责全链路日志采集与Elasticsearch' },
  { username: 'wu.mengda', nickname: '吴孟达', deptId: 14, sex: 1, roleId: 2, remark: '系统管理员 / 负责生产环境Linux主机基线加固' },

  { username: 'liang.jiahui', nickname: '梁家辉', deptId: 15, sex: 1, roleId: 2, remark: '资深机器学习专家 / 负责智能风控模型算法' },
  { username: 'zhen.zidan', nickname: '甄子丹', deptId: 15, sex: 1, roleId: 2, remark: '算法工程师 / 负责向量数据库Milvus与语义检索' },

  { username: 'chen.huilin', nickname: '陈慧琳', deptId: 17, sex: 2, roleId: 2, remark: '产品经理 / 负责操作日志与审计追踪系统' },
  { username: 'rong.zuer', nickname: '容祖儿', deptId: 17, sex: 2, roleId: 2, remark: '产品经理 / 负责通知公告与站内信消息中心' },
  { username: 'yang.qianhua', nickname: '杨千嬅', deptId: 17, sex: 2, roleId: 2, remark: '产品助理 / 负责竞品分析与用户画像分析' },

  { username: 'twins.ahsa', nickname: '蔡卓妍', deptId: 19, sex: 2, roleId: 2, remark: 'UI设计师 / 负责移动端界面与动效规范' },
  { username: 'twins.agill', nickname: '钟欣潼', deptId: 19, sex: 2, roleId: 2, remark: '视觉设计师 / 负责官方门户与运营海报设计' },

  { username: 'eason.chan', nickname: '陈奕迅', deptId: 20, sex: 1, roleId: 2, remark: '公关媒介经理 / 负责行业峰会参展与媒体对接' },
  { username: 'hins.cheung', nickname: '张敬轩', deptId: 20, sex: 1, roleId: 2, remark: '文案策划专家 / 负责企业对外技术传播稿件' },

  { username: 'faye.wong', nickname: '王菲', deptId: 21, sex: 2, roleId: 2, remark: '新媒体运营总监 / 负责全网新媒体矩阵运营' },
  { username: 'na.ying', nickname: '那英', deptId: 21, sex: 2, roleId: 2, remark: '活动运营专家 / 负责季度开发者大会策划' },

  { username: 'sun.nan', nickname: '孙楠', deptId: 22, sex: 1, roleId: 2, remark: '华北大区商务总监 / 负责北方区域渠道拓展' },
  { username: 'han.hong', nickname: '韩红', deptId: 22, sex: 2, roleId: 2, remark: '公共事务总监 / 负责政企合作与产学研项目' },

  { username: 'wang.feng', nickname: '汪峰', deptId: 23, sex: 1, roleId: 2, remark: '高级HR专员 / 负责校园招聘与高校技术合作' },
  { username: 'li.ronghao', nickname: '李荣浩', deptId: 23, sex: 1, roleId: 2, remark: '薪酬分析师 / 负责年度调薪数据测算与分析' },

  { username: 'pu.shu', nickname: '朴树', deptId: 25, sex: 1, roleId: 2, remark: '成本会计主管 / 负责研发项目成本核算与分摊' },
  { username: 'xu.wei', nickname: '许巍', deptId: 25, sex: 1, roleId: 2, remark: '资金分析师 / 负责现金流预测与外汇结算' },

  { username: 'cui.jian', nickname: '崔健', deptId: 26, sex: 1, roleId: 2, remark: '高级法务顾问 / 负责知识产权维权与开源协议审查' },

  { username: 'dou.wei', nickname: '窦唯', deptId: 27, sex: 1, roleId: 2, remark: '售前方案专家 / 负责医疗与制造行业数字化方案' },
  { username: 'zhang.chu', nickname: '张楚', deptId: 27, sex: 1, roleId: 2, remark: '技术方案顾问 / 负责信创国产化适配方案设计' },

  { username: 'he.yong', nickname: '何勇', deptId: 28, sex: 1, roleId: 2, remark: 'VIP支持经理 / 负责战略级标杆客户现场保障' },
  { username: 'tang.chao', nickname: '丁武', deptId: 28, sex: 1, roleId: 2, remark: '技术支持工程师 / 负责日志分析与环境部署答疑' },

  // 特殊状态用户（用于测试停用状态）
  { username: 'disabled.test01', nickname: '测试停用甲', deptId: 10, sex: 1, roleId: 2, status: 0, remark: '离职测试账号 - 状态停用' },
  { username: 'disabled.test02', nickname: '测试停用乙', deptId: 11, sex: 2, roleId: 2, status: 0, remark: '休假封存账号 - 状态停用' },
  { username: 'disabled.test03', nickname: '测试停用丙', deptId: 23, sex: 1, roleId: 2, status: 0, remark: '待激活测试账号 - 状态停用' },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nest_admin',
    multipleStatements: true,
  });

  console.log('Connected to MySQL database:', process.env.DB_DATABASE || 'nest_admin');

  // 1. 插入 / 更新部门数据
  console.log('\n--- [1/3] 正在写入部门架构数据 (共 ' + mockDepts.length + ' 个部门) ---');
  for (const d of mockDepts) {
    await connection.query(`
      INSERT INTO sys_dept (id, parent_id, mpath, dept_name, order_num, leader, phone, email, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        parent_id=VALUES(parent_id),
        mpath=VALUES(mpath),
        dept_name=VALUES(dept_name),
        order_num=VALUES(order_num),
        leader=VALUES(leader),
        phone=VALUES(phone),
        email=VALUES(email),
        status=VALUES(status);
    `, [d.id, d.parent_id, d.mpath, d.dept_name, d.order_num, d.leader, d.phone, d.email, d.status]);
  }
  console.log('✓ 部门数据写入成功！');

  // 2. 准备用户数据与密码
  console.log('\n--- [2/3] 正在生成并写入 100 条真实模拟用户数据 ---');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const ipPool = [
    '192.168.1.102', '192.168.2.45', '192.168.3.88', '10.0.8.21', '10.0.12.67',
    '114.248.12.33', '116.228.89.12', '120.230.12.34', '183.14.132.89', '222.186.12.90'
  ];

  let insertedCount = 0;
  let userRoleBinds = [];

  for (let i = 0; i < mockUsersRaw.length; i++) {
    const u = mockUsersRaw[i];
    const phone = `138${String(10000000 + i + 1).slice(1)}`;
    const email = `${u.username.replace(/\./g, '_')}@nest-admin.com`;
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`;
    const status = u.status !== undefined ? u.status : 1;
    const loginIp = ipPool[i % ipPool.length];
    
    // 生成过去 1~30 天内的随机登录时间
    const pastDays = (i % 28) + 1;
    const pastHours = (i % 23);
    const pastMinutes = (i % 59);
    const loginDate = new Date(Date.now() - (pastDays * 86400000 + pastHours * 3600000 + pastMinutes * 60000));

    // 插入或更新用户
    await connection.query(`
      INSERT INTO sys_user (
        dept_id, username, nickname, password, email, phone, avatar, sex, status, login_ip, login_date, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dept_id=VALUES(dept_id),
        nickname=VALUES(nickname),
        password=VALUES(password),
        email=VALUES(email),
        phone=VALUES(phone),
        avatar=VALUES(avatar),
        sex=VALUES(sex),
        status=VALUES(status),
        login_ip=VALUES(login_ip),
        login_date=VALUES(login_date),
        remark=VALUES(remark);
    `, [
      u.deptId,
      u.username,
      u.nickname,
      hashedPassword,
      email,
      phone,
      avatar,
      u.sex,
      status,
      loginIp,
      loginDate,
      u.remark
    ]);

    // 获取该用户的真实 id
    const [userRows] = await connection.query('SELECT id FROM sys_user WHERE username = ?', [u.username]);
    if (userRows.length > 0) {
      const userId = userRows[0].id;
      userRoleBinds.push({ userId, roleId: u.roleId || 2 });
    }
    insertedCount++;
  }

  console.log(`✓ 成功处理 ${insertedCount} 条用户数据！`);

  // 3. 关联角色分配
  console.log('\n--- [3/3] 正在分配用户角色权限 ---');
  for (const bind of userRoleBinds) {
    await connection.query(`
      INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (?, ?);
    `, [bind.userId, bind.roleId]);
  }
  console.log(`✓ 成功绑定 ${userRoleBinds.length} 条角色权限关联！`);

  // 4. 统计与汇总
  const [totalDepts] = await connection.query('SELECT count(*) as total FROM sys_dept WHERE deleted_at IS NULL');
  const [totalUsers] = await connection.query('SELECT count(*) as total FROM sys_user WHERE deleted_at IS NULL');
  const [normalUsers] = await connection.query('SELECT count(*) as total FROM sys_user WHERE status = 1 AND deleted_at IS NULL');
  const [disabledUsers] = await connection.query('SELECT count(*) as total FROM sys_user WHERE status = 0 AND deleted_at IS NULL');

  console.log('\n=========================================');
  console.log('🎉 模拟数据填充完毕！统计汇总如下：');
  console.log(`• 有效部门总数: ${totalDepts[0].total}`);
  console.log(`• 有效用户总数: ${totalUsers[0].total}`);
  console.log(`  - 正常状态用户: ${normalUsers[0].total}`);
  console.log(`  - 停用状态用户: ${disabledUsers[0].total}`);
  console.log('• 所有模拟用户初始密码统一为: 123456');
  console.log('=========================================\n');

  await connection.end();
}

seed().catch(err => {
  console.error('Seeding mock data failed:', err);
  process.exit(1);
});
