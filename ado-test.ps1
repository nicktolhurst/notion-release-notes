param(
    [Parameter(Mandatory=$true)]
    $Version,
    [Parameter()]
    $ADOPatToken = $env:AZURE_DEVOPS_EXT_PAT,
    [Parameter()]
    $ADOProjectName = "Awesome Project",
    [Parameter()]
    $ADORepositoryName = "Awesome Project",
    [Parameter()]
    $ADOUserName = "nictolhurst",
    [Parameter()]
    $ADOOrgName = "nictolhurst"
)

$ErrorActionPreference = "Stop"
az config set extension.use_dynamic_install=yes_without_prompt

$urlSafeProjectName = $ADOProjectName -replace " ","%20"
$urlSafeRepositoryName = $ADORepositoryName -replace " ","%20"
$branch = "test/$version"
$orgUrl = "https://dev.azure.com/${ADOOrgName}/"

# Clone Project & move to that location
$prjDir = './.tmp/'; git clone https://${ADOUserName}:${ADOPatToken}@dev.azure.com/${ADOUserName}/${urlSafeProjectName}/_git/${urlSafeRepositoryName} $prjDir; 

if(!(Test-Path $prjDir))
{
    throw "GIT CLONE FAILED"
}
else
{
    Push-Location $prjDir
}

# # Checkout, Commit & Push
git checkout -b $branch; 
git commit -m "testing notion-release-notes version $version" --allow-empty; 
git push origin $branch

# Create PR
$pr = az repos pr create `
        --org $orgUrl `
        --source-branch $branch `
        --target-branch main `
        --title "Test PR for notion-release-notes-qa - version: $version" `
        --project $ADOProjectName `
        --repository $ADORepositoryName | ConvertFrom-Json

$prUrl = "$orgUrl/${urlSafeProjectName}/_git/${urlSafeRepositoryName}/pullrequest/$($pr.pullRequestId)"

$allPolicies = az repos pr policy list --id $pr.pullRequestId --org $orgUrl | ConvertFrom-Json

$policy = $allPolicies | Where-Object  { $_.configuration.type.id -eq "0609b952-1397-4640-95ec-e00a01b2c241" }

az repos pr policy queue --evaluation-id $policy.evaluationId --id $pr.pullRequestId --org $orgUrl

Pop-Location
if(Test-Path $prjDir)
{
    rm -Recurse -Force $prjDir
}

return $prUrl