variable "project" {
  type    = string
  default = "direct"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "public_subnet_cidr_a" {
  type    = string
  default = "10.40.1.0/24"
}

variable "storage_bucket" {
  type    = string
  default = "direct-assets-prod"
}

variable "mongo_uri" {
  type = string
}

variable "redis_url" {
  type = string
}

variable "rabbitmq_url" {
  type = string
}
