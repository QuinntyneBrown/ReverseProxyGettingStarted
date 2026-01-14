@echo off
setlocal

echo ============================================
echo Starting ReverseProxy Development Environment
echo ============================================
echo.

set ROOT_DIR=%~dp0..\..
pushd %ROOT_DIR%

echo Starting Vehicle Worker...
start "Vehicle Worker" cmd /k "cd /d %ROOT_DIR%\src\ReverseProxy.Vehicle && dotnet run"
timeout /t 2 /nobreak >nul

echo Starting Telemetry Service (Port 5100)...
start "Telemetry Service" cmd /k "cd /d %ROOT_DIR%\src\ReverseProxy.TelemetryService && dotnet run"
timeout /t 2 /nobreak >nul

echo Starting API (Port 5200)...
start "API" cmd /k "cd /d %ROOT_DIR%\src\ReverseProxy.Api && dotnet run"
timeout /t 2 /nobreak >nul

echo Starting API Gateway (Port 5000)...
start "API Gateway" cmd /k "cd /d %ROOT_DIR%\src\ReverseProxy.ApiGateway && dotnet run"
timeout /t 2 /nobreak >nul

echo Starting Angular Frontend (Port 4200)...
start "Angular Frontend" cmd /k "cd /d %ROOT_DIR%\src\ReverseProxy.Workspace && npm start"

popd

echo.
echo ============================================
echo All services started!
echo ============================================
echo.
echo Services:
echo   - Vehicle Worker     (Background)
echo   - Telemetry Service  (http://localhost:5100)
echo   - API                (http://localhost:5200)
echo   - API Gateway        (http://localhost:5000)
echo   - Angular Frontend   (http://localhost:4200)
echo.
echo Use down.bat to stop all services.
echo ============================================
