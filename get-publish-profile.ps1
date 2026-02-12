# Get Azure App Service publish profile
param(
    [string]$ResourceGroup = "AdminSphere",
    [string]$AppName = "AdminSphere",
    [string]$OutputFile = "AdminSphere.publishsettings"
)

Write-Host "Retrieving publish profile for $AppName..."

# Get the publish profile
$profile = az webapp deployment list-publishing-profiles `
    --resource-group $ResourceGroup `
    --name $AppName `
    --query "[0]" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to retrieve publish profile"
    exit 1
}

# Save to file
$profile | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "Done! Profile saved to: $OutputFile"
Write-Host "Copy contents to GitHub secrets: AZURE_APP_SERVICE_PUBLISH_PROFILE"
