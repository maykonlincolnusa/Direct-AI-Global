output "network_id" {
  value = google_compute_network.direct.id
}

output "cloud_run_service" {
  value = google_cloud_run_v2_service.platform_api.name
}

output "storage_bucket" {
  value = google_storage_bucket.assets.name
}
