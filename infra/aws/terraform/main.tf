terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "direct" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "${var.project}-vpc"
  }
}

resource "aws_subnet" "direct_public_a" {
  vpc_id                  = aws_vpc.direct.id
  cidr_block              = var.public_subnet_cidr_a
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project}-public-a"
  }
}

resource "aws_ecs_cluster" "direct" {
  name = "${var.project}-cluster"
}

resource "aws_cloudwatch_log_group" "platform_api" {
  name              = "/ecs/${var.project}-platform-api"
  retention_in_days = 30
}

resource "aws_s3_bucket" "assets" {
  bucket = var.storage_bucket
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project}-app-secrets"
}

resource "aws_ssm_parameter" "mongo_uri" {
  name  = "/${var.project}/mongo_uri"
  type  = "SecureString"
  value = var.mongo_uri
}

resource "aws_ssm_parameter" "redis_url" {
  name  = "/${var.project}/redis_url"
  type  = "SecureString"
  value = var.redis_url
}

resource "aws_ssm_parameter" "rabbitmq_url" {
  name  = "/${var.project}/rabbitmq_url"
  type  = "SecureString"
  value = var.rabbitmq_url
}
