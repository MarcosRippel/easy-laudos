@echo off
REM Garante que abre com CMD /K
if "%1"=="" (
    cmd /k "%~f0" running
    exit
)

title SISTEMA HTTPS - CMD /K

echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS
echo ============================================
echo.
echo Esta janela NAO pode fechar sozinha!
echo CMD /K garante isso!
echo.

d:
cd "General Truck System\5. Emissor de Laudos - Inspetor"

echo Diretorio: %CD%
echo.

if not exist package.json (
    echo [ERRO] package.json nao encontrado!
    echo.
    goto end
)

echo [OK] Projeto encontrado
echo.

if not exist node_modules (
    echo Instalando dependencias...
    npm install
    echo.
)

echo [OK] Sistema pronto
echo.

if exist start-https-local.js (
    echo Iniciando HTTPS na porta 9444...
    echo.
    echo URLs:
    echo - https://localhost:9444
    echo - https://177.126.153.190:9444
    echo.
    node start-https-local.js
) else (
    echo Iniciando HTTP na porta 3001...
    echo.
    echo URLs:
    echo - http://localhost:3001
    echo.
    npm run dev
)

:end
echo.
echo ============================================
echo    FIM DA EXECUCAO
echo ============================================
echo.
echo Digite EXIT para fechar esta janela
echo.