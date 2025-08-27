@echo off
title Sistema Emissor de Laudos - Launcher Parrudo
color 0A

echo.
echo  ==========================================
echo   🚀 GENERAL TRUCK SYSTEM
echo   Sistema Emissor de Laudos - Launcher
echo  ==========================================
echo.

cd /d "%~dp0"

echo ⚙️  Iniciando Launcher PowerShell...
echo.

powershell -ExecutionPolicy Bypass -File "launcher-parrudo.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao executar o launcher!
    echo.
    echo 💡 Soluções possíveis:
    echo    1. Executar como Administrador
    echo    2. Liberar Execution Policy:
    echo       Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo    3. Verificar se PowerShell 5.1+ está instalado
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Launcher encerrado normalmente
pause