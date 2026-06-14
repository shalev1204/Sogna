$filePath = "Sentinel/reports/THREAD_INTEL.md"
$content = Get-Content $filePath

$cleanedLines = New-Object System.Collections.Generic.List[string]
$headerAdded = $false

foreach ($line in $content) {
    if ($line -match "^# 🛡️") {
        if (-not $headerAdded) {
            $cleanedLines.Add("# 🛡️  SENTINEL THREAD INTEL (Apex Feed)")
            $headerAdded = $true
        }
        # skip duplicates
    } else {
        # Only add if it's not a conflict marker (just in case some were missed)
        if ($line -notmatch "^<<<<<<<" -and $line -notmatch "^=======" -and $line -notmatch "^>>>>>>>") {
             $cleanedLines.Add($line)
        }
    }
}

# Remove leading empty lines
while ($cleanedLines.Count -gt 1 -and [string]::IsNullOrWhiteSpace($cleanedLines[1])) {
    $cleanedLines.RemoveAt(1)
}

$cleanedLines | Set-Content $filePath
