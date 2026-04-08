terraform {
  required_version = ">= 1.6.0"
}

locals {
  deployment_contract = {
    service_name = var.service_name
    dockerfile   = var.dockerfile_path
    environment = {
      NODE_ENV     = "production"
      CLOUD_PROVIDER = "railway"
      PORT         = tostring(var.port)
      MONGO_URI    = var.mongo_uri
      REDIS_URL    = var.redis_url
      RABBITMQ_URL = var.rabbitmq_url
      JWT_SECRET   = var.jwt_secret
    }
  }
}

resource "terraform_data" "railway_contract" {
  input = local.deployment_contract
}
