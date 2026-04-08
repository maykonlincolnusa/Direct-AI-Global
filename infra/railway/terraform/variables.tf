variable "service_name" {
  type    = string
  default = "direct-platform-api"
}

variable "dockerfile_path" {
  type    = string
  default = "Dockerfile"
}

variable "port" {
  type    = number
  default = 3000
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

variable "jwt_secret" {
  type = string
}
