$filePath = "Sogna/Toolkit/engines/sentinel/reports/THREAD_INTEL.md"
$lines = Get-Content $filePath

$headerFound = $false
$cleanedLines = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    # If it's the specific header we're looking for
    if ($line -match "^# 🛡️  SENTINEL THREAD INTEL \(Apex Feed\)") {
        if (-not $headerFound) {
            $cleanedLines.Add($line)
            $headerFound = $true
        }
        # Otherwise skip it
    } elseif ($line -match "^<<<<<<< HEAD" -or $line -match "^=======" -or $line -match "^>>>>>>> wn-main") {
        # Skip conflict markers, we'll just merge the content implicitly by keeping everything else
        continue
    } else {
        $cleanedLines.Add($line)
    }
}

$cleanedLines | Set-Content $filePath
