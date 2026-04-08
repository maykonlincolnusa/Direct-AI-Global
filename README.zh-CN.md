# DIRECT - 统一业务上下文平台

DIRECT 是一个以业务上下文为核心的平台。它不是用来为客户搭建网站的产品。平台从多个来源摄取、规范化并统一业务上下文，让 AI 能把销售、财务、运营、数字渠道和知识资产作为一个整体来理解。

## 适用行业

DIRECT 适用于以下行业：

1. B2B 服务与咨询公司
2. SaaS 与科技公司
3. 零售与电商业务
4. 诊所与私营医疗服务
5. 教育与培训机构
6. 房地产中介与经纪机构
7. 酒店餐饮与本地连锁服务
8. 美容、健康与个人护理品牌
9. 汽车销售与售后服务
10. 制造与分销团队

## 已实现的基线能力

1. 数据连接器：Website Reader、Google Business Profile、HubSpot CRM、Stripe Finance、ERP REST、Social RSS/Atom、Manual Upload
2. 上下文摄取流水线：payload 校验、原始与标准化数据持久化、幂等 fingerprint、上下文版本管理、审计日志
3. 标准化模型：`Customer`、`Lead`、`Company`、`Product`、`Order`、`Payment`、`FinancialRecord`、`OperationalEvent`、`Message`、`WebsitePage`、`SocialPost`、`BusinessProfile`、`Document`、`FileAsset`、`Review`、`Campaign`
4. 知识库与 RAG 运行时：chunking、embeddings、语义 retrieval、reranking
5. 上下文 AI 引擎：模型路由、confidence score、上下文问答、使用量跟踪、按使用量计费估算
6. React 控制台：industry profile、readiness、execution plan、连接器覆盖率和 AI 使用情况仪表盘
7. 多云基线：AWS、GCP、Azure、Oracle Cloud Infrastructure (OCI) 与 Railway

## 本地运行

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

Context API 默认地址：`http://localhost:4300`

## 主要路由

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/connectors/recommendations`
6. `GET /api/tenants/:tenantId/context/summary`
7. `GET /api/tenants/:tenantId/context/industry`
8. `GET /api/tenants/:tenantId/context/readiness`
9. `GET /api/tenants/:tenantId/context/execution-plan`
10. `GET /api/tenants/:tenantId/context/usage`
11. `POST /api/tenants/:tenantId/context/ask`

## 文档

- 主架构文档：`docs/architecture.md`
- 上下文平台文档：`docs/direct-context-architecture.md`
- 生产就绪文档：`docs/production-readiness.md`
- RAG 与向量运行时：`docs/rag-vector-runtime.md`
- 多云基础设施：`infra/README.md`

