$filePath = "Sogna/Toolkit/engines/sentinel/reports/THREAD_INTEL.md"
$content = Get-Content $filePath -Encoding UTF8

$headersSeen = @{}
$newLines = New-Object System.Collections.Generic.List[string]

foreach ($line in $content) {
    # Replace tabs
    $line = $line -replace "`t", "    "
    
    # Check if heading
    if ($line -match "^(#+)\s+(.*)$") {
        $level = $matches[1]
        $title = $matches[2].Trim().TrimEnd('.')
        
        # Standardize EVENTO/INTRUSIÓN level
        if ($title -match "^(EVENTO|INTRUSI.N DETECTADA):") {
            $level = "##"
        }
        
        # De-duplicate
        if ($headersSeen.ContainsKey($title)) {
            $headersSeen[$title]++
            $title = "$title ($($headersSeen[$title]))"
        } else {
            $headersSeen[$title] = 1
        }
        
        $line = "$level $title"
    }
    
    $newLines.Add($line)
}

# Second pass for structure and blank lines
$finalLines = New-Object System.Collections.Generic.List[string]
$lastWasBlank = $false

for ($i = 0; $i -lt $newLines.Count; $i++) {
    $line = $newLines[$i]
    $isHeader = $line -match "^#+\s"
    $isHR = $line -eq "---"
    $isBlank = [string]::IsNullOrWhiteSpace($line)

    if ($isBlank) {
        if ($lastWasBlank) { continue }
        $lastWasBlank = $true
        $finalLines.Add("")
        continue
    }
    
    if ($isHeader -or $isHR) {
        if ($finalLines.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($finalLines[$finalLines.Count-1])) {
            $finalLines.Add("")
        }
    }

    $finalLines.Add($line)
    
    if ($isHeader -or $isHR) {
        if ($i + 1 -lt $newLines.Count -and -not [string]::IsNullOrWhiteSpace($newLines[$i+1])) {
            $finalLines.Add("")
            $lastWasBlank = $true
        } else {
            $lastWasBlank = $false
        }
    } else {
        $lastWasBlank = $false
    }
}

# Final trim of multiple blanks at the end
while ($finalLines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($finalLines[$finalLines.Count-1])) {
    $finalLines.RemoveAt($finalLines.Count - 1)
}

$finalLines | Set-Content $filePath -Encoding UTF8
