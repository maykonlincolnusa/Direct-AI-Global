# DIRECT - Context Platform Architecture

## Vision
DIRECT is a business-context platform. Its goal is not to build client websites, but to ingest, normalize and unify all relevant business signals so AI can reason over one coherent context layer.

Core principle:
- Connect once into a canonical ingestion layer.
- Normalize everything into a canonical business model.
- Treat website and digital presence as knowledge sources.
- Keep AI isolated from raw external APIs.

## Core Blocks

### 1. Source Connectors
Supported connector categories:
- CRM
- ERP
- Website Reader
- Google Business Profile
- Social
- Financial
- Manual Upload
- (Extension points for ecommerce, email and messaging)

Each connector outputs `SourceRecord` objects, not domain entities. This avoids domain leakage and keeps all integrations behind one contract.

### 2. Context Ingestion Layer
Pipeline responsibilities:
- detect source and tenant
- validate envelope and payload checksum
- persist raw data (`raw.ndjson`)
- normalize payload into canonical entities
- persist normalized entities (`canonical.ndjson`)
- generate context version and audit logs
- index normalized content in the knowledge base

Idempotency:
- each source payload is fingerprinted by source+checksum
- duplicates are skipped without data deletion

### 3. Canonical Data Model
Canonical entities:
- Customer
- Lead
- Company
- Product
- Order
- Payment
- FinancialRecord
- OperationalEvent
- Message
- WebsitePage
- SocialPost
- BusinessProfile
- Document
- FileAsset
- Review
- Campaign

Every canonical entity has:
- tenantId
- source
- version
- timestamps
- typed attributes

### 4. Website Reader Module
Website Reader collects knowledge from:
- homepage
- institutional pages
- product/service pages
- blog
- contact pages
- sitemap
- SEO metadata
- titles/descriptions/headings
- CTAs and navigation
- social proof and positioning signals

It does not generate or publish websites.

### 5. Knowledge Base / RAG
Knowledge flow:
- canonical entities -> knowledge documents
- document chunking by semantic paragraphs
- deterministic embeddings
- semantic retrieval per tenant

Current baseline implementation:
- in-memory vector index with strict tenant filtering
- pluggable interfaces for FAISS/vector DB migration

### 6. AI Context Engine
AI Context Engine reads only normalized + indexed context and provides:
- tenant summary
- opportunity detection
- inconsistency detection
- suggested actions
- Q&A over retrieved evidence

### 7. Integration Registry
Registry stores per-tenant connector metadata:
- connector id/type
- status
- priority
- env keys for credentials
- health checks
- last sync and cursor

### 8. File and Media Ingestion
Supported uploads:
- PDF
- CSV
- XLSX
- JSON
- TXT
- DOCX
- JPG
- PNG
- WebP

Binary/image files are ingested as assets; text extraction is attempted where applicable.

### 9. Security and Multi-tenancy
- strict tenant isolation in all records
- connector execution scoped by tenant
- audit trail per tenant
- schema versioning at entity level
- no secret storage in code or payloads; only env-key references

### 10. Project Structure
```
src/
  connectors/
  context/
  ingestion/
  models/
  knowledge_base/
  ai/
  registry/
  storage/
  api/
  utils/
tests/
docs/
```

## Initial Implementation Scope
Implemented as stubs + base services for:
- Website Reader
- Google Business Profile
- CRM
- ERP
- Financial
- Social
- Manual Upload

External APIs are intentionally not fully integrated yet. Connector contracts and pipeline boundaries are ready for future production adapters.
