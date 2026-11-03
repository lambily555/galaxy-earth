$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$downloadRoot = Join-Path $PSScriptRoot 'downloads'
New-Item -ItemType Directory -Force $downloadRoot | Out-Null
& "$PSScriptRoot/准备素材.ps1"
if (!(Test-Path "$PSScriptRoot/desktop/Python世界地图.exe")) {
 $electronZip = Join-Path $downloadRoot 'electron-v37.10.3-win32-x64.zip'
 Invoke-WebRequest 'https://github.com/electron/electron/releases/download/v37.10.3/electron-v37.10.3-win32-x64.zip' -OutFile $electronZip
 Expand-Archive -LiteralPath $electronZip -DestinationPath "$PSScriptRoot/desktop" -Force
 Rename-Item -LiteralPath "$PSScriptRoot/desktop/electron.exe" -NewName 'Python世界地图.exe'
}
$pythonRoot = Join-Path $PSScriptRoot 'runtime/python'
if (!(Test-Path "$pythonRoot/python.exe")) {
 New-Item -ItemType Directory -Force $pythonRoot | Out-Null
 $pythonZip = Join-Path $downloadRoot 'python-3.12.10-embed-amd64.zip'
 Invoke-WebRequest 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-embed-amd64.zip' -OutFile $pythonZip
 Expand-Archive -LiteralPath $pythonZip -DestinationPath $pythonRoot -Force
 $pth = Join-Path $pythonRoot 'python312._pth'
 (Get-Content -LiteralPath $pth) -replace '^#import site','import site' | Set-Content -LiteralPath $pth -Encoding utf8
 $pipInstaller = Join-Path $downloadRoot 'get-pip.py'
 Invoke-WebRequest 'https://bootstrap.pypa.io/get-pip.py' -OutFile $pipInstaller
 & "$pythonRoot/python.exe" $pipInstaller --no-cache-dir
 if ($LASTEXITCODE -ne 0) { throw 'Python pip setup failed' }
 & "$pythonRoot/python.exe" -m pip install --no-cache-dir pandas numpy openpyxl matplotlib seaborn
 if ($LASTEXITCODE -ne 0) { throw 'Python dependencies failed to install' }
}
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Python世界地图.lnk'))
$shortcut.TargetPath = Join-Path $PSScriptRoot 'desktop/Python世界地图.exe'
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.IconLocation = Join-Path $PSScriptRoot 'app-icon.ico'
$shortcut.Save()
Write-Output '准备完成。请从桌面 Python世界地图 图标启动。'
