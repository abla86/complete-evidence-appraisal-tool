@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required.
  exit /b 1
)

if not exist "dist\server.cjs" (
  echo Production build is missing. Run npm ci and npm run build first.
  exit /b 1
)

if not exist "node_modules\express" (
  echo Installing production dependencies...
  call npm ci --omit=dev
  if errorlevel 1 exit /b 1
)

start "" "http://localhost:10000"
call npm start
