@echo off
rem Qarip local admin (Windows): double-click to start. See scripts/local-admin.mjs.
chcp 65001 >nul
cd /d "%~dp0"
title Qarip admin
where node >nul 2>nul || (echo Node.js not found. Install it from https://nodejs.org and run again. & pause & exit /b 1)
node scripts\local-admin.mjs
pause
