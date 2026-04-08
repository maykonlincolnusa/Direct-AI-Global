# DIRECT - 統合ビジネスコンテキストプラットフォーム

DIRECT はコンテキスト中心のプラットフォームです。クライアント向けに Web サイトを制作する製品ではありません。複数のデータソースからビジネスコンテキストを取り込み、販売、財務、オペレーション、デジタル活動を IA が一体で理解できるようにします。

## 対応業界

DIRECT は次の業界で利用できます。

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

## 実装済み機能

1. ソースコネクタ: Website Reader、Google Business Profile、CRM、ERP、Financial、Social、Manual Upload
2. コンテキスト取り込みパイプライン: ペイロード検証、生データと正規化データ保存、冪等 fingerprint、コンテキスト版管理、監査ログ
3. 正規化モデル: Customer、Lead、Company、Product、Order、Payment、FinancialRecord、OperationalEvent、Message、WebsitePage、SocialPost、BusinessProfile、Document、FileAsset、Review、Campaign
4. Website Reader モジュール: ホームページ、sitemap、SEO metadata、見出し、CTA、ナビゲーション、社会的証明、キーワード、トーン、ポジショニング信号
5. ナレッジベースと検索: chunking、embeddings、tenant 単位のセマンティック検索
6. コンテキスト IA エンジン: 要約、機会検出、不整合検出、提案、文脈 QA
7. 統合レジストリ: 状態、cursor、優先度、ヘルス、環境変数ベースの資格情報参照
8. HTTP API: 登録、同期、要約、提案、質問

## 実行方法

```bash
npm install
npm run direct:build
npm run direct:start
```

デフォルト URL: `http://localhost:4300`

## 主要 API ルート

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/context/summary`
6. `GET /api/tenants/:tenantId/context/suggestions`
7. `POST /api/tenants/:tenantId/context/ask`

## ドキュメント

メインアーキテクチャ資料: `docs/direct-context-architecture.md`
