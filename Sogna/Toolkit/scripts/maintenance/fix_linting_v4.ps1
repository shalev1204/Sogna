$filePath = "Sogna/Toolkit/engines/sentinel/reports/THREAD_INTEL.md"
$content = Get-Content $filePath -Encoding UTF8

$newLines = New-Object System.Collections.Generic.List[string]

foreach ($line in $content) {
    # 1. Replace tabs with 4 spaces
    $line = $line -replace "`t", "    "
    
    # 2. Heading standards: Convert H3 to H2 for consistency
    # Using wildcard for accented character
    if ($line -match "^### (EVENTO|INTRUSI.N DETECTADA):") {
        $line = $line -replace "^###", "##"
    }

    # 3. Trailing punctuation in headings: Remove trailing '.' from any heading
    if ($line -match "^#{1,6}\s+.*?\.\s*$") {
        $line = $line.TrimEnd().TrimEnd('.')
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

    # Prevent multiple blank lines
    if ($isBlank) {
        if ($lastWasBlank) { continue }
        $lastWasBlank = $true
        $finalLines.Add("")
        continue
    }
    
    # If it's a header or HR, ensure blank line above
    if ($isHeader -or $isHR) {
        if ($finalLines.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($finalLines[$finalLines.Count-1])) {
            $finalLines.Add("")
        }
    }

    $finalLines.Add($line)
    
    # If it's a header or HR, ensure blank line below
    if ($isHeader -or $isHR) {
        if ($i + 1 -lt $newLines.Count -and -not [string]::IsNullOrWhiteSpace($newLines[$i+1])) {
            $finalLines.Add("")
            $lastWasBlank = $true
        } else {
            $lastWasBlank = $false # Next line is already blank or handled
        }
    } else {
        $lastWasBlank = $false
    }
}

$finalLines | Set-Content $filePath -Encoding UTF8
