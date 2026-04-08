variable "project" {
  type    = string
  default = "direct"
}

variable "azure_location" {
  type    = string
  default = "eastus"
}

variable "vnet_cidr" {
  type    = string
  default = "10.60.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.60.1.0/24"
}

variable "storage_account_name" {
  type = string
}

variable "storage_container_name" {
  type    = string
  default = "direct-assets"
}

variable "key_vault_name" {
  type = string
}

variable "tenant_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}
