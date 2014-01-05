@echo off
REM Compiles all .ts files in the project

node compile.js
if "%1"=="nopause" goto end
	pause
:end