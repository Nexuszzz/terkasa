$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
  python -m venv .venv
}
& '.venv\Scripts\python.exe' -m pip install -q -r requirements.txt --disable-pip-version-check
if ($LASTEXITCODE -ne 0) { throw 'Instalasi dependency gateway gagal.' }
$stateDir = Join-Path $PSScriptRoot '.state'
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
$accountSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls $stateDir /inheritance:r /grant:r "*${accountSid}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' /Q | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Izin folder sesi privat tidak dapat disiapkan.' }
if (@(Get-ChildItem -LiteralPath $stateDir -Force).Count -gt 0) {
  & icacls (Join-Path $stateDir '*') /reset /T /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Izin berkas sesi privat tidak dapat disiapkan.' }
}
& '.venv\Scripts\python.exe' -m uvicorn app:app --host 127.0.0.1 --port 8008 --no-access-log
