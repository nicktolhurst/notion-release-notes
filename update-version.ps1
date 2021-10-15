Param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Major","Minor","Build")]
    $SemanticReleaseType
)

$version = Get-Content "version.json" | ConvertFrom-Json 
Write-Output "Old Version: ${version}"

$task = Get-content "${PSScriptRoot}\NotionReleaseNotes\task.json" | ConvertFrom-Json
$manifest = Get-content "${PSScriptRoot}\vss-extension.json" | ConvertFrom-Json
$testManifest = Get-content "${PSScriptRoot}\vss-extension.test.json" | ConvertFrom-Json

$newVersion = [version]($version.version)
$newVersion.GetType().GetField("_${SemanticReleaseType}", 'static,nonpublic,instance').SetValue($newVersion, ($newVersion.${SemanticReleaseType} + 1))

if($SemanticReleaseType -eq "Minor")
{
    $newVersion.GetType().GetField("_Build", 'static,nonpublic,instance').SetValue($newVersion, 0)
}
if($SemanticReleaseType -eq "Major")
{
    $newVersion.GetType().GetField("_Minor", 'static,nonpublic,instance').SetValue($newVersion, 0)
    $newVersion.GetType().GetField("_Build", 'static,nonpublic,instance').SetValue($newVersion, 0)
}
$newVersionString =  "{0}.{1}.{2}" -f $newVersion.Major, $newVersion.Minor, $newVersion.Build

$task.version.Major = $newVersion.Major
$task.version.Minor = $newVersion.Minor
$task.version.Patch = $newVersion.Build

$version.version = $newVersionString
$manifest.version = $newVersionString
$testManifest.version = $newVersionString

Set-Content -Path "${PSScriptRoot}\NotionReleaseNotes\task.json"  -Value ($task | ConvertTo-Json -Depth 10) 
Set-Content -Path "${PSScriptRoot}\vss-extension.json" -Value ($manifest | ConvertTo-Json -Depth 10) 
Set-Content -Path "${PSScriptRoot}\vss-extension.test.json" -Value ($testManifest | ConvertTo-Json -Depth 10) 
Set-Content -Path "${PSScriptRoot}\version.json" -Value ($version | ConvertTo-Json -Depth 10.)

Write-Output "New Version: ${version}"