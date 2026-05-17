Set WshShell = CreateObject("WScript.Shell")
' Detecta dinámicamente en qué carpeta está instalado el script
rutaProyecto = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Ejecuta el .bat de arranque en modo 0 (100% Invisible)
WshShell.Run chr(34) & rutaProyecto & "\Sogna.bat" & chr(34), 0
Set WshShell = Nothing
