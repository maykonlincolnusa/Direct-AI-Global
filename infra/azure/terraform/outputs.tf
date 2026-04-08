output "resource_group_name" {
  value = azurerm_resource_group.direct.name
}

output "container_app_environment_id" {
  value = azurerm_container_app_environment.direct.id
}

output "storage_account_name" {
  value = azurerm_storage_account.assets.name
}
