terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

resource "google_compute_network" "direct" {
  name                    = "${var.project}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "direct" {
  name          = "${var.project}-subnet"
  ip_cidr_range = var.subnet_cidr
  network       = google_compute_network.direct.id
  region        = var.gcp_region
}

resource "google_storage_bucket" "assets" {
  name                        = var.storage_bucket
  location                    = var.gcp_region
  uniform_bucket_level_access = true
}

resource "google_secret_manager_secret" "app_secrets" {
  secret_id = "${var.project}-app-secrets"
  replication {
    auto {}
  }
}

resource "google_cloud_run_v2_service" "platform_api" {
  name     = "${var.project}-platform-api"
  location = var.gcp_region

  template {
    containers {
      image = var.container_image
      env {
        name  = "MONGO_URI"
        value = var.mongo_uri
      }
      env {
        name  = "REDIS_URL"
        value = var.redis_url
      }
      env {
        name  = "RABBITMQ_URL"
        value = var.rabbitmq_url
      }
    }
  }
}
