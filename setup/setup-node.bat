@echo OFF

cd ..\node
call update.bat nopause
call compile.bat nopause
cd ..\setup
pause