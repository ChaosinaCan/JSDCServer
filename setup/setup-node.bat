@echo off
REM Updates all Node modules and compiles all .ts and .less files

cd ..\node
call update.bat nopause
call compile.bat nopause
cd ..\setup
pause