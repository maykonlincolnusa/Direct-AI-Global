# RAG Runtime: Embeddings + Vector Store

## Runtime providers

The knowledge layer now supports pluggable embeddings and vector adapters.

### Embeddings (`src/knowledge_base/embedding-service.ts`)
- `EMBEDDING_PROVIDER=deterministic` (default, offline-safe)
- `EMBEDDING_PROVIDER=openrouter` (real embeddings via OpenRouter `/embeddings`)

Relevant environment variables:
- `OPENROUTER_API_KEY`
- `OPENROUTER_EMBEDDINGS_URL` (default: `https://openrouter.ai/api/v1/embeddings`)
- `OPENROUTER_EMBEDDING_MODEL` (default: `openai/text-embedding-3-small`)
- `EMBEDDING_STRICT=true|false` (if `true`, fail instead of fallback)

### Vector store (`src/knowledge_base/vector-store.ts`)
- `VECTOR_STORE_PROVIDER=file` (default, persisted locally)
- `VECTOR_STORE_PROVIDER=memory` (ephemeral)
- `VECTOR_STORE_PROVIDER=http` (external vector DB adapter)
- `VECTOR_STORE_PROVIDER=faiss` (FAISS bridge with compatibility fallback)

Optional variables for `http` adapter:
- `VECTOR_DB_URL`
- `VECTOR_DB_API_KEY`

## API endpoints

Knowledge endpoints available in `src/api/server.ts`:
- `GET /api/tenants/:tenantId/knowledge/stats`
- `POST /api/tenants/:tenantId/knowledge/search`

## Frontend integration

The React console now consumes these endpoints in:
- `apps/direct-console/src/lib/dashboard.ts`
- `apps/direct-console/src/App.tsx`

It displays:
- embeddings provider
- vector store provider
- documents/chunks/vectors counters
- retrieval slices from live `knowledge/search`
