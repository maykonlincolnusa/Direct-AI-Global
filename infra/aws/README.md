# AWS deployment

## Compute
- ECS/Fargate for platform-api
- ALB in front of ECS service
- ECR for container image

## Stateful dependencies
- MongoDB Atlas (or DocumentDB when applicable)
- ElastiCache Redis
- RabbitMQ managed via Amazon MQ or CloudAMQP
- S3 for files and knowledge assets
- Secrets Manager or SSM Parameter Store

## IaC
- ECS task definition: `infra/aws/ecs/platform-api-task-definition.json`
- Terraform baseline: `infra/aws/terraform`
