$filePath = "Sogna/Toolkit/engines/sentinel/reports/THREAD_INTEL.md"
$content = Get-Content $filePath

$newContent = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $content.Count; $i++) {
    $line = $content[$i]
    
    # Replace tabs with 4 spaces
    $line = $line -replace "\t", "    "
    
    # Heading Fix: H1
    if ($i -eq 0 -and $line -match "^# ") {
        $newContent.Add($line)
        $newContent.Add("")
        continue
    }
    
    # Heading Fix: H2 (Level increment and blank lines)
    if ($line -match "^#{2,3} EVENTO:") {
        # Fix level if H3
        $line = $line -replace "^### EVENTO:", "## EVENTO:"
        
        # Ensure blank line ABOVE
        if ($newContent.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($newContent[$newContent.Count-1])) {
            $newContent.Add("")
        }
        
        $newContent.Add($line)
        
        # Ensure blank line BELOW (check next line)
        if ($i + 1 -lt $content.Count -and -not [string]::IsNullOrWhiteSpace($content[$i+1])) {
            $newContent.Add("")
        }
        continue
    }
    
    $newContent.Add($line)
}

$newContent | Set-Content $filePath
