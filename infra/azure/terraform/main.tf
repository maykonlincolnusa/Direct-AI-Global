terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "direct" {
  name     = "${var.project}-rg"
  location = var.azure_location
}

resource "azurerm_virtual_network" "direct" {
  name                = "${var.project}-vnet"
  location            = azurerm_resource_group.direct.location
  resource_group_name = azurerm_resource_group.direct.name
  address_space       = [var.vnet_cidr]
}

resource "azurerm_subnet" "direct" {
  name                 = "${var.project}-subnet"
  resource_group_name  = azurerm_resource_group.direct.name
  virtual_network_name = azurerm_virtual_network.direct.name
  address_prefixes     = [var.subnet_cidr]
}

resource "azurerm_storage_account" "assets" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.direct.name
  location                 = azurerm_resource_group.direct.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "assets" {
  name                  = var.storage_container_name
  storage_account_name  = azurerm_storage_account.assets.name
  container_access_type = "private"
}

resource "azurerm_key_vault" "direct" {
  name                       = var.key_vault_name
  location                   = azurerm_resource_group.direct.location
  resource_group_name        = azurerm_resource_group.direct.name
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
}

resource "azurerm_container_app_environment" "direct" {
  name                       = "${var.project}-cae"
  location                   = azurerm_resource_group.direct.location
  resource_group_name        = azurerm_resource_group.direct.name
  log_analytics_workspace_id = var.log_analytics_workspace_id
}
