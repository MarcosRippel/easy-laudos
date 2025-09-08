@echo off
REM ==========================================================
REM INICIALIZACAO HTTPS GARANTIDA - NAO FECHA AUTOMATICAMENTE
REM ==========================================================

setlocal enabledelayedexpansion

title SISTEMA EMISSOR DE LAUDOS - HTTPS GARANTIDO

REM Define diretório base
set "BASE_DIR=d:\General Truck System\5. Emissor de Laudos - Inspetor"

REM Força diretório correto com caminho absoluto
cd /d "%BASE_DIR%" 2>nul

REM Verifica se está no diretório correto
if not exist "package.json" (
    echo ====================================================
    echo    ERRO: DIRETORIO DO PROJETO NAO ENCONTRADO
    echo ====================================================
    echo.
    echo Diretorio esperado:
    echo d:\General Truck System\5. Emissor de Laudos - Inspetor
    echo.
    echo Diretorio atual: %CD%
    echo.
    echo Por favor, verifique o caminho do projeto.
    echo.
    pause
    exit /b 1
)

echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS
echo ============================================
echo.
echo Diretorio: %CD%
echo Data/Hora: %DATE% %TIME%
echo ============================================
echo.

REM Verifica se é admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] SEM PRIVILEGIOS DE ADMINISTRADOR
    echo.
    echo Algumas funcionalidades podem nao funcionar:
    echo - IP Virtual 177.126.153.190
    echo - Configuracao de Firewall
    echo.
    echo Deseja continuar mesmo assim? (S/N)
    choice /C SN /T 10 /D S
    if errorlevel 2 (
        echo.
        echo Saindo...
        pause
        exit /b
    )
) else (
    echo [OK] Executando como ADMINISTRADOR
    echo.
    
    REM Configura IP Virtual
    echo Configurando IP Virtual...
    netsh interface ip delete address "Loopback Pseudo-Interface 1" 177.126.153.190 >nul 2>&1
    netsh interface ip add address "Loopback Pseudo-Interface 1" 177.126.153.190 255.255.255.255 >nul 2>&1
    
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
    
    echo [OK] Configuracoes de admin aplicadas!
    echo.
)

REM Verifica Node.js
echo Verificando Node.js...
cd /d "%BASE_DIR%"
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao instalado!
    echo.
    echo Baixe em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
echo [OK] Node.js: %NODE_VERSION%

REM Verifica NPM e FORÇA diretório novamente
cd /d "%BASE_DIR%"
echo Verificando NPM...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] NPM nao encontrado!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
echo [OK] NPM: %NPM_VERSION%

REM FORÇA diretório NOVAMENTE após NPM
cd /d "%BASE_DIR%"
echo.

REM Instala dependências (garantindo diretório correto)
cd /d "%BASE_DIR%"
if not exist "node_modules" (
    echo ====================================
    echo    INSTALANDO DEPENDENCIAS
    echo ====================================
    echo.
    echo Diretorio atual: %CD%
    echo Isso pode demorar alguns minutos...
    echo.
    
    cd /d "%BASE_DIR%"
    call npm install
    
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao instalar dependencias!
        echo.
        echo Tentando limpar cache...
        cd /d "%BASE_DIR%"
        call npm cache clean --force
        cd /d "%BASE_DIR%"
        call npm install
        
        if errorlevel 1 (
            echo.
            echo [ERRO CRITICO] Impossivel instalar!
            echo.
            pause
            exit /b 1
        )
    )
    
    echo.
    echo [OK] Dependencias instaladas!
) else (
    echo [OK] Dependencias ja instaladas
)
echo.

REM FORÇA diretório antes de verificar certificados
cd /d "%BASE_DIR%"

REM Verifica certificados SSL
echo ====================================
echo    VERIFICANDO CERTIFICADOS SSL
echo ====================================
echo.
echo Diretorio atual: %CD%
echo.

set "SSL_DIR=%BASE_DIR%\ssl"
set "SSL_CERT=%SSL_DIR%\inspetor.terpens.com.br.crt"
set "SSL_KEY=%SSL_DIR%\inspetor.terpens.com.br.key"

if not exist "%SSL_DIR%" mkdir "%SSL_DIR%"

if exist "%SSL_CERT%" (
    echo [OK] Certificado SSL encontrado
    echo      %SSL_CERT%
) else (
    echo [!] Certificado SSL nao encontrado
    echo.
    echo Para HTTPS completo, adicione:
    echo - %SSL_CERT%
    echo - %SSL_KEY%
)
echo.

REM Build do projeto (garantindo diretório)
cd /d "%BASE_DIR%"
if not exist ".next" (
    echo ====================================
    echo    COMPILANDO PROJETO
    echo ====================================
    echo.
    echo Diretorio atual: %CD%
    echo Executando build...
    echo.
    
    cd /d "%BASE_DIR%"
    call npm run build
    
    if errorlevel 1 (
        echo.
        echo [AVISO] Build falhou, usando modo dev
    ) else (
        echo.
        echo [OK] Build concluido!
    )
) else (
    echo [OK] Build ja existe
)
echo.

REM Inicia servidor (FORÇA diretório final)
cd /d "%BASE_DIR%"
echo ============================================
echo    INICIANDO SERVIDOR
echo ============================================
echo.
echo Diretorio de execucao: %CD%
echo.

if exist "start-https-local.js" (
    echo Modo: HTTPS Habilitado
    echo.
    echo URLs de acesso:
    echo.
    echo HTTP (redireciona para HTTPS):
    echo - http://localhost:3000
    echo - http://177.126.153.190:3000
    echo.
    echo HTTPS:
    echo - https://localhost:9443
    echo - https://177.126.153.190:9443
    echo - https://inspetor.terpens.com.br
    echo.
    echo ============================================
    echo.
    echo Servidor iniciando...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Inicia servidor HTTPS (garantindo diretório)
    cd /d "%BASE_DIR%"
    call node start-https-local.js
    
) else (
    echo Modo: HTTP Padrao (sem HTTPS)
    echo.
    echo URLs de acesso:
    echo - http://localhost:3000
    echo - http://177.126.153.190:3000
    echo.
    echo Para HTTPS, certifique-se que existe:
    echo - start-https-local.js
    echo - ssl\*.crt e ssl\*.key
    echo.
    echo ============================================
    echo.
    echo Servidor iniciando...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Inicia servidor padrão (garantindo diretório)
    cd /d "%BASE_DIR%"
    call npm run dev
)

echo.
echo ============================================
echo    SERVIDOR PARADO
echo ============================================
echo.

REM Mantém janela aberta
echo Pressione qualquer tecla para fechar...
pause >nul