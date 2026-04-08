# Azure deployment

## Compute
- Azure Container Apps for platform-api
- Azure Container Registry for image storage

## Stateful dependencies
- MongoDB Atlas
- Azure Cache for Redis
- RabbitMQ managed externally
- Azure Blob Storage
- Azure Key Vault for secrets

## IaC
- Container Apps manifest: `infra/azure/containerapps/platform-api.containerapp.yaml`
- Terraform baseline: `infra/azure/terraform`
