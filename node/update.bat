@echo off
REM Installs the latest versions of required Node modules

call npm install
if "%1"=="nopause" goto end
	pause
:end
