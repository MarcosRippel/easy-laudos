@echo off
REM ==========================================================
REM VERSAO MAIS SIMPLES POSSIVEL - NUNCA FECHA
REM ==========================================================

color 0A
title SISTEMA HTTPS - SIMPLES

echo.
echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS
echo ============================================
echo.

REM Muda para o diretorio
d:
cd "General Truck System\5. Emissor de Laudos - Inspetor"

echo Diretorio: %CD%
echo.

REM Verifica se tem package.json
if not exist package.json (
    echo [ERRO] Arquivo package.json nao encontrado!
    echo Verifique se esta no diretorio correto.
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit
)

echo [OK] Projeto encontrado
echo.

REM Verifica Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao instalado!
    echo Instale em: https://nodejs.org/
    echo.
    pause
    exit
)

echo [OK] Node.js instalado
echo.

REM Instala dependencias se nao existir
if not exist node_modules (
    echo Instalando dependencias (pode demorar)...
    echo.
    npm install
    echo.
)

echo [OK] Dependencias prontas
echo.

REM Verifica certificados
if exist ssl\inspetor.terpens.com.br.crt (
    echo [OK] Certificado SSL encontrado
) else (
    echo [!] Certificado SSL nao encontrado
)
echo.

REM Inicia servidor
echo ============================================
echo    INICIANDO SERVIDOR
echo ============================================
echo.

if exist start-https-local.js (
    echo MODO: HTTPS na porta 9443
    echo.
    echo URLs de acesso:
    echo - https://localhost:9443
    echo - https://177.126.153.190:9443
    echo.
    echo Iniciando...
    echo.
    node start-https-local.js
) else (
    echo MODO: HTTP na porta 3000
    echo.
    echo URLs de acesso:
    echo - http://localhost:3000
    echo.
    echo Iniciando...
    echo.
    npm run dev
)

echo.
echo ============================================
echo    SERVIDOR PARADO
echo ============================================
echo.
pause