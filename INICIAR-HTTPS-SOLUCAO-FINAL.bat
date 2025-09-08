@echo off
REM ==========================================================
REM SOLUCAO FINAL - HTTPS COM PROTECAO DE DIRETORIO
REM ==========================================================

setlocal enabledelayedexpansion

title SISTEMA EMISSOR DE LAUDOS - HTTPS FINAL

REM Define diretório do projeto como constante
set "PROJECT_DIR=d:\General Truck System\5. Emissor de Laudos - Inspetor"

REM Usa pushd para garantir diretório (mais robusto que cd)
pushd "%PROJECT_DIR%" || (
    echo ====================================================
    echo    ERRO: NAO FOI POSSIVEL ACESSAR O PROJETO
    echo ====================================================
    echo.
    echo Diretorio esperado: %PROJECT_DIR%
    echo.
    echo Verifique se o caminho esta correto.
    echo.
    pause
    exit /b 1
)

REM Verifica se está no projeto correto
if not exist "package.json" (
    echo ====================================================
    echo    ERRO: PROJETO NAO ENCONTRADO
    echo ====================================================
    echo.
    echo Arquivo package.json nao encontrado em:
    echo %CD%
    echo.
    popd
    pause
    exit /b 1
)

echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS
echo ============================================
echo.
echo Projeto: %CD%
echo Data/Hora: %DATE% %TIME%
echo ============================================
echo.

REM ====================================
REM ETAPA 1: VERIFICAR PRIVILEGIOS
REM ====================================
echo [ETAPA 1] Verificando privilegios...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Executando SEM privilegios de administrador
    echo.
    echo Funcionalidades limitadas:
    echo - IP Virtual nao sera configurado
    echo - Firewall nao sera atualizado
    echo.
    echo Continuar mesmo assim? (S/N)
    choice /C SN /T 10 /D S >nul
    if errorlevel 2 (
        popd
        exit /b
    )
) else (
    echo [OK] Executando como ADMINISTRADOR
    echo.
    
    REM Configura IP Virtual
    echo Configurando IP Virtual 177.126.153.190...
    netsh interface ip delete address "Loopback Pseudo-Interface 1" 177.126.153.190 >nul 2>&1
    netsh interface ip add address "Loopback Pseudo-Interface 1" 177.126.153.190 255.255.255.255 >nul 2>&1
    
    REM Testa IP
    ping -n 1 177.126.153.190 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] IP Virtual configurado
    ) else (
        echo [!] IP Virtual nao responde
    )
    
    REM Configura Firewall
    echo Configurando Firewall...
    netsh advfirewall firewall delete rule name="Sistema Emissor HTTP" >nul 2>&1
    netsh advfirewall firewall delete rule name="Sistema Emissor HTTPS" >nul 2>&1
    netsh advfirewall firewall delete rule name="Sistema Emissor Dev" >nul 2>&1
    netsh advfirewall firewall delete rule name="Sistema Emissor HTTPS Alt" >nul 2>&1
    
    netsh advfirewall firewall add rule name="Sistema Emissor HTTP" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema Emissor HTTPS" dir=in action=allow protocol=TCP localport=443 >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema Emissor Dev" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema Emissor HTTPS Alt" dir=in action=allow protocol=TCP localport=9443 >nul 2>&1
    echo [OK] Firewall configurado
)
echo.

REM ====================================
REM ETAPA 2: VERIFICAR NODE E NPM
REM ====================================
echo [ETAPA 2] Verificando ambiente...

REM Verifica Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Instale em: https://nodejs.org/
    popd
    pause
    exit /b 1
)

REM Captura versão em subshell para não mudar diretório
for /f "tokens=*" %%i in ('cmd /c "node --version 2>nul"') do set NODE_VERSION=%%i
echo [OK] Node.js: %NODE_VERSION%

REM Verifica NPM
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERRO] NPM nao encontrado!
    popd
    pause
    exit /b 1
)

REM Captura versão em subshell para não mudar diretório
for /f "tokens=*" %%i in ('cmd /c "npm --version 2>nul"') do set NPM_VERSION=%%i
echo [OK] NPM: %NPM_VERSION%

REM IMPORTANTE: Retorna ao diretório do projeto após verificações
pushd "%PROJECT_DIR%"
popd
pushd "%PROJECT_DIR%"

echo.

REM ====================================
REM ETAPA 3: INSTALAR DEPENDENCIAS
REM ====================================
if not exist "node_modules" (
    echo [ETAPA 3] Instalando dependencias...
    echo.
    echo Isso pode demorar alguns minutos...
    echo.
    
    REM Executa npm com prefix para garantir local correto
    cmd /c "cd /d "%PROJECT_DIR%" && npm install"
    
    REM Verifica se instalou
    pushd "%PROJECT_DIR%"
    if not exist "node_modules" (
        echo [ERRO] Falha ao instalar dependencias!
        echo.
        echo Tentando com cache limpo...
        cmd /c "cd /d "%PROJECT_DIR%" && npm cache clean --force && npm install"
        
        if not exist "node_modules" (
            echo [ERRO CRITICO] Impossivel instalar dependencias!
            popd
            pause
            exit /b 1
        )
    )
    popd
    pushd "%PROJECT_DIR%"
    
    echo [OK] Dependencias instaladas!
) else (
    echo [ETAPA 3] Dependencias ja instaladas
)
echo.

REM ====================================
REM ETAPA 4: VERIFICAR CERTIFICADOS SSL
REM ====================================
echo [ETAPA 4] Verificando certificados SSL...

set "SSL_DIR=%PROJECT_DIR%\ssl"
set "SSL_CERT=%SSL_DIR%\inspetor.terpens.com.br.crt"
set "SSL_KEY=%SSL_DIR%\inspetor.terpens.com.br.key"

if not exist "%SSL_DIR%" mkdir "%SSL_DIR%"

set SSL_OK=1
if exist "%SSL_CERT%" (
    echo [OK] Certificado SSL encontrado
) else (
    echo [!] Certificado SSL ausente: %SSL_CERT%
    set SSL_OK=0
)

if exist "%SSL_KEY%" (
    echo [OK] Chave privada encontrada
) else (
    echo [!] Chave privada ausente: %SSL_KEY%
    set SSL_OK=0
)

if %SSL_OK% equ 0 (
    echo.
    echo Para HTTPS completo, adicione os certificados em:
    echo - %SSL_CERT%
    echo - %SSL_KEY%
)
echo.

REM ====================================
REM ETAPA 5: BUILD DO PROJETO
REM ====================================
pushd "%PROJECT_DIR%"
if not exist ".next" (
    echo [ETAPA 5] Compilando projeto...
    echo.
    
    REM Executa build em subshell
    cmd /c "cd /d "%PROJECT_DIR%" && npm run build"
    
    if not exist ".next" (
        echo [!] Build falhou, continuando em modo dev
    ) else (
        echo [OK] Build concluido!
    )
) else (
    echo [ETAPA 5] Build ja existe
)
popd
pushd "%PROJECT_DIR%"
echo.

REM ====================================
REM ETAPA 6: INICIAR SERVIDOR
REM ====================================
echo ============================================
echo    INICIANDO SERVIDOR
echo ============================================
echo.
echo Diretorio de execucao: %CD%
echo.

if exist "start-https-local.js" (
    echo ===========================================
    echo    MODO: HTTPS HABILITADO
    echo ===========================================
    echo.
    echo URLs de acesso disponiveis:
    echo.
    echo HTTP (redireciona para HTTPS):
    echo   - http://localhost:3000
    echo   - http://177.126.153.190:3000
    echo.
    echo HTTPS:
    echo   - https://localhost:9443
    echo   - https://177.126.153.190:9443
    echo   - https://inspetor.terpens.com.br
    echo.
    echo ===========================================
    echo.
    echo Servidor iniciando com HTTPS...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Executa servidor HTTPS mantendo diretório
    cmd /c "cd /d "%PROJECT_DIR%" && node start-https-local.js"
    
) else (
    echo ===========================================
    echo    MODO: HTTP PADRAO
    echo ===========================================
    echo.
    echo URLs de acesso disponiveis:
    echo   - http://localhost:3000
    echo   - http://177.126.153.190:3000
    echo.
    echo Para habilitar HTTPS:
    echo   1. Adicione certificados em ssl\
    echo   2. Certifique-se que start-https-local.js existe
    echo.
    echo ===========================================
    echo.
    echo Servidor iniciando...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Executa servidor HTTP mantendo diretório
    cmd /c "cd /d "%PROJECT_DIR%" && npm run dev"
)

echo.
echo ============================================
echo    SERVIDOR ENCERRADO
echo ============================================
echo.

REM Retorna ao diretório original
popd

echo Pressione qualquer tecla para fechar...
pause >nul