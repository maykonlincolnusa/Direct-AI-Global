output "runtime_provider" {
  value = terraform_data.oci_contract.output.provider
}

output "oci_region" {
  value = terraform_data.oci_contract.output.region
}

output "storage_bucket" {
  value = terraform_data.oci_contract.output.storage.bucket
}

output "runtime_env" {
  value = terraform_data.oci_contract.output.runtime_env
}
