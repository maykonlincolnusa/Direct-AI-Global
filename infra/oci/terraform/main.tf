terraform {
  required_version = ">= 1.6.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

provider "oci" {
  region = var.oci_region
}

locals {
  runtime_env = {
    CLOUD_PROVIDER   = "oci"
    STORAGE_PROVIDER = "oci"
    STORAGE_BUCKET   = var.storage_bucket
    STORAGE_REGION   = var.oci_region
  }
}

resource "terraform_data" "oci_contract" {
  input = {
    provider           = "oci"
    region             = var.oci_region
    compartment_ocid   = var.compartment_ocid
    availability_domain = var.availability_domain
    network = {
      vcn_cidr           = var.vcn_cidr
      public_subnet_cidr = var.public_subnet_cidr
    }
    compute = {
      runtime            = "oci-container-instances"
      image              = var.platform_api_image
      cpu                = var.platform_api_ocpus
      memory_gb          = var.platform_api_memory_gb
      autoscaling_target = "oke"
    }
    storage = {
      provider = "oci-object-storage"
      bucket   = var.storage_bucket
    }
    secrets = {
      backend = "oci-vault"
    }
    runtime_env = local.runtime_env
  }
}
