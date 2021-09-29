# Update version in VSS manifest & task.json.
$manifest = Get-content "${PSScriptRoot}\vss-extension.json" | ConvertFrom-Json
$task = Get-content "${PSScriptRoot}\NotionReleaseNotes\task.json" | ConvertFrom-Json

### Get current version
$version = [version]($manifest| Select-Object -ExpandProperty version)

### Set the new manifest version
$manifest.version = "{0}.{1}.{2}" -f $version.Major, $version.Minor, ($version.Build + 1)
Set-Content -Path "${PSScriptRoot}\vss-extension.json" -Value ($manifest | ConvertTo-Json -Depth 10) 

### Set the new task version
$task.version.Major = $version.Major
$task.version.Minor = $version.Minor
$task.version.Patch = ($version.Build + 1)
Set-Content -Path "${PSScriptRoot}\NotionReleaseNotes\task.json"  -Value ($task | ConvertTo-Json -Depth 10) 

# Install Node Modules
push-location "${PSScriptRoot}\NotionReleaseNotes\"
npm install --production 
npm prune --production 
pop-location

# Compile
tsc -p "${PSScriptRoot}\NotionReleaseNotes\tsconfig.json"

# Package
tfx extension create --manifest-globs "${PSScriptRoot}\vss-extension.json"

# Publish
$pat = $env:TASK_DEPLOY_PAT_TOKEN

if (!$pat)
{
    $pat = Read-Host -Prompt "Enter PAT token.."
}
tfx extension publish --manifest-globs "${PSScriptRoot}\vss-extension.json" --share-with nictolhurst --token $pat