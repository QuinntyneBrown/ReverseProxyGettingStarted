@echo off
setlocal enabledelayedexpansion

echo ============================================
echo Remove tmpclaude temp files from file system
echo ============================================
echo.

:: Default to current directory if no argument provided
set "SEARCH_PATH=%~1"
if "%SEARCH_PATH%"=="" set "SEARCH_PATH=%CD%"

echo Searching for 'tmpclaude-*-cwd' files in: %SEARCH_PATH%
echo.

set /a count=0

:: Find and delete all tmpclaude temp files
for /r "%SEARCH_PATH%" %%F in (tmpclaude-*-cwd) do (
    if exist "%%F" (
        echo Deleting: %%F
        del /f /q "%%F" 2>nul
        if not exist "%%F" (
            set /a count+=1
        ) else (
            echo   [FAILED] Could not delete %%F
        )
    )
)

:: Also handle directories with tmpclaude pattern
for /d /r "%SEARCH_PATH%" %%D in (tmpclaude-*-cwd) do (
    if exist "%%D" (
        echo Deleting directory: %%D
        rmdir /s /q "%%D" 2>nul
        if not exist "%%D" (
            set /a count+=1
        ) else (
            echo   [FAILED] Could not delete %%D
        )
    )
)

echo.
echo ============================================
echo Removed %count% tmpclaude file(s)/folder(s)
echo ============================================

endlocal
