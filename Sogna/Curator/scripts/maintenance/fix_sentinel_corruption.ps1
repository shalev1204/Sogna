# Universal Sentinel Corruption Fixer
# Replaces JS-style comments with Python-style comments in .py files

Get-ChildItem -Path . -Filter "*.py" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "// @sentinel-ignore") {
        Write-Host "Repairing: $($_.FullName)"
        $newContent = $content -replace "// @sentinel-ignore", "# @sentinel-ignore"
        Set-Content -Path $_.FullName -Value $newContent -Encoding utf8
    }
}

Write-Host "--- REPAIR COMPLETE ---"
