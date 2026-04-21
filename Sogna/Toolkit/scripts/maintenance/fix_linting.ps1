$filePath = "Sogna/Toolkit/engines/sentinel/reports/THREAD_INTEL.md"
$content = Get-Content $filePath

$newContent = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $content.Count; $i++) {
    $line = $content[$i]
    
    # Replace tabs with 4 spaces
    $line = $line -replace "\t", "    "
    
    if ($i -eq 0 -and $line -match "^# ") {
        $newContent.Add($line)
        $newContent.Add("") # Add blank line after H1
        continue
    }
    
    if ($line -match "^### EVENTO:") {
        $line = $line -replace "^### EVENTO:", "## EVENTO:"
    }
    
    # Avoid quadruple empty lines if my logic adds too many
    if ([string]::IsNullOrWhiteSpace($line) -and $newContent.Count -gt 0 -and [string]::IsNullOrWhiteSpace($newContent[$newContent.Count-1])) {
        # skip consecutive empty lines if needed, but MD022 just wants ONE
    }
    
    $newContent.Add($line)
}

$newContent | Set-Content $filePath
