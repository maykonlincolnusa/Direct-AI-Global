# DIRECT - 統合ビジネスコンテキストプラットフォーム

DIRECT はコンテキスト中心のプラットフォームです。クライアント向けに Web サイトを制作するための製品ではありません。複数のソースからビジネスコンテキストを取り込み、正規化し、統合することで、AI が営業、財務、オペレーション、デジタル施策、ナレッジ資産をひとつの事業として理解できるようにします。

## 対応業界

DIRECT は次の業界に対応します。

1. B2B サービスおよびコンサルティング
2. SaaS およびテクノロジー企業
3. 小売および EC 事業
4. クリニックや民間医療サービス
5. 教育およびトレーニング事業
6. 不動産会社および仲介業
7. ホスピタリティ、飲食、地域サービスチェーン
8. 美容、ウェルネス、パーソナルケアブランド
9. 自動車販売およびアフターサービス
10. 製造および流通チーム

## 実装済みベースライン

1. ソースコネクタ: Website Reader、Google Business Profile、HubSpot CRM、Stripe Finance、ERP REST、Social RSS/Atom、Manual Upload
2. コンテキスト取り込みパイプライン: payload 検証、生データと正規化データの保存、冪等 fingerprint、コンテキストのバージョン管理、監査ログ
3. 正規化モデル: `Customer`、`Lead`、`Company`、`Product`、`Order`、`Payment`、`FinancialRecord`、`OperationalEvent`、`Message`、`WebsitePage`、`SocialPost`、`BusinessProfile`、`Document`、`FileAsset`、`Review`、`Campaign`
4. ナレッジベースと RAG ランタイム: chunking、embeddings、セマンティック retrieval、reranking
5. コンテキスト AI エンジン: モデルルーティング、confidence score、文脈 QA、利用量追跡、従量課金推定
6. React コンソール: industry profile、readiness、execution plan、コネクタカバレッジ、AI usage のダッシュボード
7. マルチクラウド基盤: AWS、GCP、Azure、Oracle Cloud Infrastructure (OCI)、Railway

## ローカル実行

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

Context API のデフォルト URL: `http://localhost:4300`

## 主要ルート

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

## ドキュメント

- メインアーキテクチャ: `docs/architecture.md`
- コンテキストプラットフォーム: `docs/direct-context-architecture.md`
- 本番運用準備: `docs/production-readiness.md`
- RAG とベクターランタイム: `docs/rag-vector-runtime.md`
- マルチクラウド infra: `infra/README.md`

