@echo off
REM ==========================================================
REM VERSAO COM LOOP INFINITO - IMPOSSIVEL FECHAR
REM ==========================================================

:inicio
cls
color 0A
title SISTEMA HTTPS - LOOP INFINITO

echo.
echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS
echo ============================================
echo.
echo Este script NAO PODE fechar sozinho!
echo.

REM Vai para o diretorio
d:
cd "General Truck System\5. Emissor de Laudos - Inspetor"

echo Diretorio: %CD%
echo.

REM Verifica package.json
if not exist package.json (
    echo [ERRO] package.json nao encontrado!
    echo.
    echo Pressione qualquer tecla para tentar novamente...
    pause >nul
    goto inicio
)

echo [OK] Projeto encontrado
echo.

REM Menu de opcoes
echo O que deseja fazer?
echo.
echo 1 - Iniciar servidor HTTPS (porta 9443)
echo 2 - Iniciar servidor HTTP (porta 3000)
echo 3 - Instalar dependencias
echo 4 - Verificar status
echo 5 - Sair
echo.

set /p opcao="Digite sua opcao (1-5): "

if "%opcao%"=="1" goto https
if "%opcao%"=="2" goto http
if "%opcao%"=="3" goto instalar
if "%opcao%"=="4" goto status
if "%opcao%"=="5" goto sair

REM Opcao invalida
echo.
echo Opcao invalida! Tente novamente.
echo.
pause
goto inicio

:https
echo.
echo ============================================
echo    INICIANDO SERVIDOR HTTPS
echo ============================================
echo.
if exist start-https-local.js (
    echo URLs de acesso:
    echo - https://localhost:9444
    echo - https://177.126.153.190:9444
    echo.
    echo Iniciando servidor HTTPS...
    echo Pressione Ctrl+C para parar
    echo.
    node start-https-local.js
) else (
    echo [ERRO] Arquivo start-https-local.js nao encontrado!
    echo.
    pause
)
goto inicio

:http
echo.
echo ============================================
echo    INICIANDO SERVIDOR HTTP
echo ============================================
echo.
echo URLs de acesso:
echo - http://localhost:3001
echo - http://177.126.153.190:3001
echo.
echo Iniciando servidor HTTP...
echo Pressione Ctrl+C para parar
echo.
npm run dev
goto inicio

:instalar
echo.
echo ============================================
echo    INSTALANDO DEPENDENCIAS
echo ============================================
echo.
npm install
echo.
echo Instalacao concluida!
echo.
pause
goto inicio

:status
echo.
echo ============================================
echo    STATUS DO SISTEMA
echo ============================================
echo.
echo Verificando Node.js...
node --version
echo.
echo Verificando NPM...
npm --version
echo.
echo Verificando dependencias...
if exist node_modules (
    echo [OK] Dependencias instaladas
) else (
    echo [!] Dependencias NAO instaladas
)
echo.
echo Verificando certificados SSL...
if exist ssl\inspetor.terpens.com.br.crt (
    echo [OK] Certificado SSL encontrado
) else (
    echo [!] Certificado SSL NAO encontrado
)
echo.
echo Verificando build...
if exist .next (
    echo [OK] Build existe
) else (
    echo [!] Build NAO existe
)
echo.
pause
goto inicio

:sair
echo.
echo Tem certeza que deseja sair? (S/N)
set /p confirma="Resposta: "
if /i "%confirma%"=="s" exit
goto inicio