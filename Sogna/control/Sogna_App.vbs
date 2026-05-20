' Arranque automatico de Windows — modo residente (invisible)
Set WshShell = CreateObject("WScript.Shell")
controlDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c """ & controlDir & "\Sogna.bat"" on silent", 0, False
Set WshShell = Nothing
