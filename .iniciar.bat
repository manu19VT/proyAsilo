@echo off
echo ========================================
echo  Iniciando Sistema de Gestion de Asilo
echo ========================================
echo.

echo [1/2] Iniciando Backend...
start "Backend - ProyAsilo" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend...
start "Frontend - ProyAsilo" cmd /k "npm start"

echo.
echo ========================================
echo  Sistema iniciado!
echo ========================================
echo  Backend: http://localhost:3001
echo  Frontend: http://localhost:3000
echo ========================================
echo.
pause










