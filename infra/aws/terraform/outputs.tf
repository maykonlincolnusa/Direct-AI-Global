output "vpc_id" {
  value = aws_vpc.direct.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.direct.name
}

output "storage_bucket" {
  value = aws_s3_bucket.assets.bucket
}

output "secrets_manager_secret_arn" {
  value = aws_secretsmanager_secret.app_secrets.arn
}
