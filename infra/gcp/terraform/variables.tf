variable "project" {
  type    = string
  default = "direct"
}

variable "gcp_project_id" {
  type = string
}

variable "gcp_region" {
  type    = string
  default = "us-central1"
}

variable "subnet_cidr" {
  type    = string
  default = "10.50.0.0/24"
}

variable "storage_bucket" {
  type    = string
  default = "direct-assets-gcp"
}

variable "container_image" {
  type = string
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
