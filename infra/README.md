# Multi-Cloud Infrastructure

This folder keeps provider-specific infrastructure contracts while application code remains cloud-agnostic.

## Layout

```txt
infra/
  aws/
    ecs/
    terraform/
  gcp/
    cloud-run/
    terraform/
  azure/
    containerapps/
    terraform/
  railway/
    terraform/
  sql/
```

## Runtime contract

All providers must inject the same runtime variables used by `@direct/config`:

- `MONGO_URI`
- `REDIS_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENROUTER_API_KEY`
- `VECTOR_STORE_PROVIDER`
- `STORAGE_PROVIDER`

## Environments

- Development: local docker compose
- Staging: same container image, isolated cloud resources
- Production: region-aware deployment with managed secrets and telemetry

## Apply examples

```bash
cd infra/aws/terraform && terraform init && terraform plan
cd infra/gcp/terraform && terraform init && terraform plan
cd infra/azure/terraform && terraform init && terraform plan
cd infra/railway/terraform && terraform init && terraform plan
```
