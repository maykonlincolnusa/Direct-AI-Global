# DIRECT - 统一业务上下文平台

DIRECT 是一个以上下文为核心的平台。它**不是**用于给客户搭建网站的产品。平台会从多个数据源采集并统一业务上下文，让 IA 能在销售、财务、运营和数字渠道上进行整体推理。

## 适用行业

DIRECT 适用于以下行业场景：

1. B2B 服务与咨询公司
2. SaaS 与科技公司
3. 零售与电商运营
4. 诊所与私营医疗服务
5. 教育与培训机构
6. 房地产中介与经纪机构
7. 酒店餐饮与本地连锁服务
8. 美容、健康与个人护理品牌
9. 汽车销售与售后服务
10. 制造与分销团队

## 已实现能力

1. 数据连接器：Website Reader、Google Business Profile、CRM、ERP、Financial、Social、Manual Upload
2. 上下文摄取流水线：payload 校验、原始与标准化数据持久化、幂等 fingerprint、上下文版本管理、审计日志
3. 标准数据模型：Customer、Lead、Company、Product、Order、Payment、FinancialRecord、OperationalEvent、Message、WebsitePage、SocialPost、BusinessProfile、Document、FileAsset、Review、Campaign
4. Website Reader 模块：首页、sitemap 页面、SEO metadata、标题结构、CTA、导航、社会证明、关键词、语气与定位信号
5. 知识库与检索：chunking、embeddings、按 tenant 隔离的语义检索
6. 上下文 IA 引擎：摘要、机会识别、不一致检测、行动建议、上下文问答
7. 集成注册中心：状态、cursor、优先级、健康度、环境变量凭证引用
8. HTTP API：注册、同步、摘要、建议与问答

## 运行方式

```bash
npm install
npm run direct:build
npm run direct:start
```

默认地址：`http://localhost:4300`

## 关键 API 路由

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/context/summary`
6. `GET /api/tenants/:tenantId/context/suggestions`
7. `POST /api/tenants/:tenantId/context/ask`

## 文档

主架构文档：`docs/direct-context-architecture.md`
