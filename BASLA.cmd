@echo off
setlocal
where py.exe >nul 2>nul
if errorlevel 1 (
    python.exe "%~dp0scripts\start_local.py" %*
) else (
    py.exe -3 "%~dp0scripts\start_local.py" %*
)
exit /b %errorlevel%
