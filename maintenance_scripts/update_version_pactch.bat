@echo off
SETLOCAL ENABLEEXTENSIONS
SET me=%~n0
SET current_folder=%~dp0
SET parent_folder=%current_folder:\maintenance_scripts\=\%
cd %parent_folder%
npm version patch -m "Upgrade to latest version of dependant packages"
