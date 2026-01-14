@echo off
setlocal enabledelayedexpansion

echo ============================================
echo Remove NUL files from file system
echo ============================================
echo.

:: Default to current directory if no argument provided
set "SEARCH_PATH=%~1"
if "%SEARCH_PATH%"=="" set "SEARCH_PATH=%CD%"

echo Searching for 'nul' files in: %SEARCH_PATH%
echo.

set /a count=0

:: Find all files named "nul" (case insensitive)
for /r "%SEARCH_PATH%" %%F in (nul) do (
    if exist "%%F" (
        echo Found: %%F

        :: Use \\?\ prefix to delete reserved filename
        del "\\?\%%F" 2>nul

        if not exist "%%F" (
            echo   [DELETED] %%F
            set /a count+=1
        ) else (
            echo   [FAILED] Could not delete %%F
        )
    )
)

:: Also check for nul in the root of search path
if exist "%SEARCH_PATH%\nul" (
    echo Found: %SEARCH_PATH%\nul
    del "\\?\%SEARCH_PATH%\nul" 2>nul
    if not exist "%SEARCH_PATH%\nul" (
        echo   [DELETED] %SEARCH_PATH%\nul
        set /a count+=1
    ) else (
        echo   [FAILED] Could not delete %SEARCH_PATH%\nul
    )
)

echo.
echo ============================================
echo Removed %count% nul file(s)
echo ============================================

endlocal
