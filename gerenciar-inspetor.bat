@echo off
title GENERAL INSPETOR - Gerenciamento PM2
color 0B

:MENU
cls
echo.
echo ================================================================================
echo          GENERAL INSPETOR - GERENCIAMENTO DO SERVICO
echo ================================================================================
echo.
echo  [1] Ver STATUS do servico
echo  [2] REINICIAR servico
echo  [3] Ver LOGS em tempo real (Ctrl+C para sair)
echo  [4] PARAR servico
echo  [5] INICIAR servico
echo  [6] MONITORAMENTO completo (dashboard PM2)
echo  [7] SAIR
echo.
echo ================================================================================
echo.
set /p choice=Escolha uma opcao: 

if "%choice%"=="1" goto STATUS
if "%choice%"=="2" goto RESTART
if "%choice%"=="3" goto LOGS
if "%choice%"=="4" goto STOP
if "%choice%"=="5" goto START
if "%choice%"=="6" goto MONITOR
if "%choice%"=="7" exit /b

echo [ERRO] Opcao invalida!
timeout /t 2 >nul
goto MENU

:STATUS
echo.
pm2 status
echo.
pause
goto MENU

:RESTART
echo.
echo [INFO] Reiniciando Easy Laudos...
pm2 restart easy-laudos
echo [OK] Servico reiniciado!
echo.
pm2 status
echo.
pause
goto MENU

:LOGS
echo.
echo [INFO] Mostrando logs em tempo real (Ctrl+C para voltar ao menu)...
echo.
pm2 logs easy-laudos --lines 50
goto MENU

:STOP
echo.
echo [AVISO] Parando Easy Laudos...
pm2 stop easy-laudos
echo [OK] Servico parado.
echo.
pm2 status
echo.
pause
goto MENU

:START
echo.
echo [INFO] Iniciando Easy Laudos...
cd /d "D:\General Truck System\CLOUDFLARED\5. Emissor de Laudos - Inspetor"
pm2 start ecosystem.config.js
echo [OK] Servico iniciado!
echo.
pm2 status
echo.
pause
goto MENU

:MONITOR
echo.
echo [INFO] Abrindo dashboard PM2 (pressione Q para sair)...
pm2 monit
goto MENU
