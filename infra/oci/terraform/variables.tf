variable "project" {
  type    = string
  default = "direct"
}

variable "oci_region" {
  type    = string
  default = "sa-saopaulo-1"
}

variable "compartment_ocid" {
  type = string
}

variable "availability_domain" {
  type = string
}

variable "vcn_cidr" {
  type    = string
  default = "10.60.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.60.1.0/24"
}

variable "storage_bucket" {
  type    = string
  default = "direct-assets-oci"
}

variable "platform_api_image" {
  type = string
}

variable "platform_api_ocpus" {
  type    = number
  default = 1
}

variable "platform_api_memory_gb" {
  type    = number
  default = 4
}
