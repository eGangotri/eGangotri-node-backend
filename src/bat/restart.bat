@echo off
setlocal

REM Usage: restart.bat [serverUrl] [machineName]
REM Defaults: serverUrl=http://localhost:8000, machineName=%COMPUTERNAME%

set "SERVER_URL=%~1"
if "%SERVER_URL%"=="" set "SERVER_URL=http://localhost:8000"

set "MACHINE_NAME=%~2"
if "%MACHINE_NAME%"=="" set "MACHINE_NAME=%COMPUTERNAME%"

echo Polling %SERVER_URL%/restart/check/%MACHINE_NAME% every 60 seconds...

:loop
for /f "delims=" %%R in ('curl -s "%SERVER_URL%/restart/check/%MACHINE_NAME%"') do set "RESPONSE=%%R"
echo [%date% %time%] Response: %RESPONSE%

echo %RESPONSE% | findstr /c:"\"restart\":true" >nul
if %errorlevel%==0 (
    echo Restart flag detected. Restarting in 15 seconds...
    shutdown /r /t 15 /c "Remote restart requested via eGangotri backend"
    exit /b 0
)

timeout /t 60 /nobreak >nul
goto loop
