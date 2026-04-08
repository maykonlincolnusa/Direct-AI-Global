# Oracle Cloud Infrastructure deployment

## Compute
- OCI Container Instances or OKE for `platform-api` and background workloads
- OCIR for container image storage

## Stateful dependencies
- MongoDB Atlas or OCI-compatible Mongo deployment
- OCI Cache with Redis
- RabbitMQ managed externally
- OCI Object Storage for files and knowledge assets
- OCI Vault for runtime secrets

## IaC
- Terraform baseline: `infra/oci/terraform`

## Runtime notes
- Set `CLOUD_PROVIDER=oci`
- Set `STORAGE_PROVIDER=oci` when Object Storage is the active file backend
- Keep the same runtime contract used by the other clouds:
  - `MONGO_URI`
  - `REDIS_URL`
  - `RABBITMQ_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `OPENROUTER_API_KEY`
