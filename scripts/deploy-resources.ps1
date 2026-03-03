# Azure Resource Setup for Weekly Planner
param(
    [string]$resourceGroup = "WeeklyPlannerRG",
    [string]$location = "eastus",
    [string]$appNamePrefix = "weeklyplanner"
)

$apiName = "$appNamePrefix-api-$([guid]::NewGuid().ToString().Substring(0,8))"
$uiName = "$appNamePrefix-ui-$([guid]::NewGuid().ToString().Substring(0,8))"
$planName = "$appNamePrefix-plan"

Write-Host "Creating App Service Plan: $planName"
az appservice plan create --name $planName --resource-group $resourceGroup --location $location --sku B1 --is-linux

Write-Host "Creating API Web App: $apiName"
az webapp create --name $apiName --resource-group $resourceGroup --plan $planName --runtime "DOTNETCORE|8.0"

Write-Host "Creating UI Web App: $uiName"
az webapp create --name $uiName --resource-group $resourceGroup --plan $planName --runtime "NODE|20-lts"

Write-Host "---------------------------------------------------"
Write-Host "Resources Created Successfully!"
Write-Host "API App Name: $apiName"
Write-Host "UI App Name: $uiName"
Write-Host "---------------------------------------------------"
Write-Host "Add these as GitHub Secrets:"
Write-Host "AZURE_WEBAPP_API_NAME: $apiName"
Write-Host "AZURE_WEBAPP_UI_NAME: $uiName"
