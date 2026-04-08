# Direct Global — Technical Requirements (Libraries & Dependencies)

## 1. Core Stack

### Runtime

* Node.js (>= 20.x)
* TypeScript (>= 5.x)

### Framework

* NestJS (preferred) or Fastify

---

## 2. API & Validation

* @nestjs/common
* @nestjs/core
* @nestjs/config
* @nestjs/swagger
* fastify (if using Fastify adapter)
* class-validator OR zod
* class-transformer

---

## 3. Authentication & Security

* jsonwebtoken
* passport
* passport-jwt
* bcrypt
* helmet
* rate-limiter-flexible

---

## 4. Database (MongoDB)

* mongoose OR @nestjs/mongoose
* mongodb (native driver optional)

---

## 5. Cache & Queues

### Redis

* ioredis

### Queue / Messaging

* bullmq (lightweight queues)
* amqplib (RabbitMQ)
* nats (optional alternative)

---

## 6. File Storage

* multer (upload handling)
* aws-sdk OR @aws-sdk/client-s3
* google-cloud/storage
* @azure/storage-blob

---

## 7. Observability

* pino (logging)
* pino-pretty (dev)
* @opentelemetry/api
* @opentelemetry/sdk-node
* @opentelemetry/auto-instrumentations-node
* prom-client (metrics)

---

## 8. AI / LLM Stack

* langchain
* openai (or compatible SDKs)
* tiktoken (token counting)

### Embeddings & Vector Search

* faiss-node OR faiss (via wrapper)
* alternatively:

  * chromadb
  * weaviate-client

---

## 9. Knowledge Processing (RAG Pipeline)

* pdf-parse
* mammoth (DOCX)
* csv-parser
* unstructured (optional advanced parsing)
* natural (basic NLP utilities)

---

## 10. HTTP & Integrations

* axios
* node-fetch (optional)

---

## 11. Automation / Workflows

* bullmq (job orchestration)
* eventemitter3

---

## 12. Testing

* jest
* supertest

---

## 13. Dev & Code Quality

* eslint
* prettier
* ts-node
* tsup OR esbuild

---

## 14. Environment & Config

* dotenv
* cross-env

---

## 15. Docker & Infra

(Not libraries, but required tools)

* Docker
* Docker Compose
* Terraform (for IaC)

---

## 16. CI/CD (Recommended)

* GitHub Actions
* or GitLab CI

---

## 17. Optional (Advanced / Future)

### Feature Flags

* unleash-client

### Search

* elasticsearch

### Realtime

* socket.io OR ws

### GraphQL (optional alternative)

* @nestjs/graphql

---

## 18. Frontend (if applicable)

### Core

* React
* Next.js

### UI

* Tailwind CSS
* shadcn/ui

### State & Data

* React Query (TanStack Query)
* Zustand

---

## 19. Versioning Strategy

All dependencies must:

* be locked via package.json
* use semantic versioning
* avoid unstable packages in production

---

## 20. Constraints

* Prefer lightweight and maintainable libraries
* Avoid over-engineering
* Avoid vendor lock-in where possible
* Ensure compatibility with multi-cloud deployment
