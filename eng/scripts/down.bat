@echo off
setlocal

echo ============================================
echo Stopping ReverseProxy Development Environment
echo ============================================
echo.

echo Stopping .NET processes...
taskkill /FI "WINDOWTITLE eq Vehicle Worker*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Telemetry Service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq API - *" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq API Gateway*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Angular Frontend*" /F >nul 2>&1

echo Stopping dotnet processes on known ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5200 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping Angular dev server on port 4200...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4200 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping any remaining node processes for Angular...
taskkill /IM "node.exe" /FI "WINDOWTITLE eq Angular*" /F >nul 2>&1

echo.
echo ============================================
echo All services stopped!
echo ============================================
