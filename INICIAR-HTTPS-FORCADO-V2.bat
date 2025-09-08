@echo off
REM ==========================================================
REM INICIALIZACAO HTTPS FORCADA V2 - ULTRA ROBUSTA
REM ==========================================================

setlocal enabledelayedexpansion

title SISTEMA EMISSOR DE LAUDOS - HTTPS V2

REM Define e força diretório base IMEDIATAMENTE
set "PROJECT_DIR=d:\General Truck System\5. Emissor de Laudos - Inspetor"
pushd "%PROJECT_DIR%" 2>nul || (
    echo [ERRO] Nao foi possivel acessar o diretorio do projeto!
    echo Esperado: %PROJECT_DIR%
    pause
    exit /b 1
)

REM Verifica se está no diretório correto
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo Diretorio atual: %CD%
    popd
    pause
    exit /b 1
)

echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS V2
echo ============================================
echo.
echo Diretorio: %CD%
echo Data/Hora: %DATE% %TIME%
echo ============================================
echo.

REM Verifica admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Executando SEM privilegios de admin
    echo Algumas funcoes podem nao funcionar.
    echo.
) else (
    echo [OK] Executando como ADMINISTRADOR
    echo.
    
    echo Configurando IP Virtual...
    netsh interface ip delete address "Loopback Pseudo-Interface 1" 177.126.153.190 >nul 2>&1
    netsh interface ip add address "Loopback Pseudo-Interface 1" 177.126.153.190 255.255.255.255 >nul 2>&1
    
    echo Configurando Firewall...
    netsh advfirewall firewall delete rule name="Sistema Emissor HTTP" >nul 2>&1
    netsh advfirewall firewall delete rule name="Sistema Emissor HTTPS" >nul 2>&1
    netsh advfirewall firewall delete rule name="Sistema Emissor Dev" >nul 2>&1
    netsh advfirewall firewall delete rule name="Sistema Emissor HTTPS Alt" >nul 2>&1
    
    netsh advfirewall firewall add rule name="Sistema Emissor HTTP" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema Emissor HTTPS" dir=in action=allow protocol=TCP localport=443 >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema Emissor Dev" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
    netsh advfirewall firewall add rule name="Sistema Emissor HTTPS Alt" dir=in action=allow protocol=TCP localport=9443 >nul 2>&1
    
    echo [OK] Configuracoes aplicadas!
    echo.
)

REM FORCA diretorio antes de cada comando
pushd "%PROJECT_DIR%"

echo Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao instalado!
    echo Baixe em: https://nodejs.org/
    popd
    pause
    exit /b 1
)

REM Captura versao sem mudar diretorio
for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
echo [OK] Node.js: %NODE_VERSION%

REM FORCA diretorio novamente
pushd "%PROJECT_DIR%"
popd
pushd "%PROJECT_DIR%"

echo Verificando NPM...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERRO] NPM nao encontrado!
    popd
    pause
    exit /b 1
)

REM Captura versao sem mudar diretorio
for /f "tokens=*" %%i in ('npm --version 2^>^&1') do set NPM_VERSION=%%i
echo [OK] NPM: %NPM_VERSION%

REM FORCA diretorio IMEDIATAMENTE apos NPM
pushd "%PROJECT_DIR%"
popd
pushd "%PROJECT_DIR%"

echo.
echo Diretorio apos verificacoes: %CD%
echo.

REM Instala dependencias se necessario
if not exist "node_modules" (
    echo ====================================
    echo    INSTALANDO DEPENDENCIAS
    echo ====================================
    echo.
    echo Diretorio de instalacao: %CD%
    echo.
    
    REM Usa npm com caminho completo
    pushd "%PROJECT_DIR%"
    call npm install --prefix "%PROJECT_DIR%"
    popd
    pushd "%PROJECT_DIR%"
    
    if errorlevel 1 (
        echo [ERRO] Falha na instalacao!
        echo Tentando novamente...
        
        pushd "%PROJECT_DIR%"
        call npm cache clean --force
        call npm install --prefix "%PROJECT_DIR%"
        popd
        pushd "%PROJECT_DIR%"
        
        if errorlevel 1 (
            echo [ERRO CRITICO] Impossivel instalar!
            popd
            pause
            exit /b 1
        )
    )
    
    echo [OK] Dependencias instaladas!
) else (
    echo [OK] Dependencias ja instaladas
)

echo.

REM Verifica certificados
echo ====================================
echo    VERIFICANDO CERTIFICADOS SSL
echo ====================================
echo.

set "SSL_DIR=%PROJECT_DIR%\ssl"
set "SSL_CERT=%SSL_DIR%\inspetor.terpens.com.br.crt"
set "SSL_KEY=%SSL_DIR%\inspetor.terpens.com.br.key"

if not exist "%SSL_DIR%" mkdir "%SSL_DIR%"

if exist "%SSL_CERT%" (
    echo [OK] Certificado encontrado
) else (
    echo [!] Certificado nao encontrado
    echo Adicione em: %SSL_CERT%
)

if exist "%SSL_KEY%" (
    echo [OK] Chave privada encontrada
) else (
    echo [!] Chave nao encontrada
    echo Adicione em: %SSL_KEY%
)

echo.

REM Build se necessario
pushd "%PROJECT_DIR%"
if not exist ".next" (
    echo ====================================
    echo    COMPILANDO PROJETO
    echo ====================================
    echo.
    
    call npm run build --prefix "%PROJECT_DIR%"
    
    if errorlevel 1 (
        echo [AVISO] Build falhou, usando dev
    ) else (
        echo [OK] Build concluido!
    )
) else (
    echo [OK] Build ja existe
)
popd
pushd "%PROJECT_DIR%"

echo.

REM Inicia servidor - GARANTINDO diretorio
echo ============================================
echo    INICIANDO SERVIDOR
echo ============================================
echo.
echo Diretorio final: %CD%
echo.

if exist "start-https-local.js" (
    echo Modo: HTTPS Habilitado
    echo.
    echo URLs disponiveis:
    echo - http://localhost:3000 (redireciona)
    echo - https://localhost:9443
    echo - https://177.126.153.190:9443
    echo.
    echo Iniciando servidor HTTPS...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Executa com caminho completo
    pushd "%PROJECT_DIR%"
    node "%PROJECT_DIR%\start-https-local.js"
    popd
    
) else (
    echo Modo: HTTP Padrao
    echo.
    echo URLs disponiveis:
    echo - http://localhost:3000
    echo - http://177.126.153.190:3000
    echo.
    echo Iniciando servidor HTTP...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Executa com prefix
    pushd "%PROJECT_DIR%"
    call npm run dev --prefix "%PROJECT_DIR%"
    popd
)

echo.
echo ============================================
echo    SERVIDOR ENCERRADO
echo ============================================
echo.

popd
pause