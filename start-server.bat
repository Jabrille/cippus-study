@echo off
echo Starting CIPP/US Study Hub at http://localhost:8765
echo Press Ctrl+C to stop.
cd /d "%~dp0"
where node >nul 2>&1
if %errorlevel% equ 0 (
  npx --yes serve -l 8765 .
) else (
  echo Node.js not found. Open index.html in Chrome/Edge after enabling a local server,
  echo or install Node from https://nodejs.org
  pause
)
