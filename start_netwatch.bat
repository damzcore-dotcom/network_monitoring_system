@echo off
title NetWatch System Launcher
color 0B
echo ========================================================
echo   NetWatch Monitoring System - Startup Script
echo   Local Address: http://192.168.13.221:5174
echo ========================================================
echo.

echo [1/2] Menjalankan Backend Server (Port 8000)...
start "NetWatch Backend API" cmd /k "cd backend && py -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Menjalankan Frontend Web (IP 192.168.13.221, Port 5174)...
start "NetWatch Frontend UI" cmd /k "cd frontend && npm run dev -- --host 192.168.13.221 --port 5174"

echo.
echo Selesai! Server telah berjalan di latar belakang.
echo Browser akan otomatis membuka panel NetWatch dalam 3 detik...
timeout /t 3 /nobreak >nul

start http://192.168.13.221:5174
exit
