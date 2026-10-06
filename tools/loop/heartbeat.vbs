' Runs heartbeat.ps1 with no window at all: a scheduled powershell.exe, even -WindowStyle Hidden,
' flashes a console every 15 minutes. wscript starts it hidden (window style 0) and returns at once.
Dim here
here = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & here & "\heartbeat.ps1""", 0, False
