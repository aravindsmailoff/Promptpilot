Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir

' ─── Register in Windows Startup ───
startupPath = WshShell.SpecialFolders("Startup")
shortcutFile = startupPath & "\PromptPilot.lnk"

If Not fso.FileExists(shortcutFile) Then
    On Error Resume Next
    Set shortcut = WshShell.CreateShortcut(shortcutFile)
    shortcut.TargetPath = "wscript.exe"
    shortcut.Arguments = """" & scriptDir & "\START_SILENT.vbs"""
    shortcut.WorkingDirectory = scriptDir
    shortcut.Description = "PromptPilot Background Launcher"
    shortcut.Save
    On Error GoTo 0
End If

' ─── Start Next.js + Daemon Silently ───
' 0 hides the window, false returns control immediately without waiting
WshShell.Run "cmd.exe /c npm run dev", 0, false
