$paths = @(
    "c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\core\src",
    "c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\dom\src",
    "c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\utils\src",
    "c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\kinetic\src"
);

foreach ($rootPath in $paths) {
    if (Test-Path $rootPath) {
        $files = Get-ChildItem -Path $rootPath -Recurse -Include *.ts, *.tsx;
        foreach ($file in $files) {
            $content = [System.IO.File]::ReadAllText($file.FullName);
            
            # Simple replace: find strings starting with ./ or ../ and lowercase them
            # This is safer than complex regex in PS
            $newContent = [regex]::Replace($content, "(['\"])(\.\.?\/[^'\"]+)(['\"])", {
                param($m)
                return $m.Groups[1].Value + $m.Groups[2].Value.ToLower() + $m.Groups[3].Value
            })
            
            if ($content -ne $newContent) {
                [System.IO.File]::WriteAllText($file.FullName, $newContent);
                Write-Output ("Updated: " + $file.FullName);
            }
        }
    }
}
