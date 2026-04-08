# GCP deployment

## Compute
- Cloud Run for platform-api
- Artifact Registry for image storage

## Stateful dependencies
- MongoDB Atlas
- Memorystore (Redis)
- RabbitMQ managed externally (CloudAMQP)
- Cloud Storage for files
- Secret Manager for runtime secrets

## IaC
- Cloud Run service manifest: `infra/gcp/cloud-run/platform-api.service.yaml`
- Terraform baseline: `infra/gcp/terraform`
