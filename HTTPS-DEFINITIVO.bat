@echo off
REM ==========================================================
REM VERSAO DEFINITIVA - IMPOSSIVEL FECHAR SOZINHO
REM ==========================================================

REM Se nao foi chamado com parametro, reinicia com CMD /K
if "%1"=="" (
    start cmd /k "%~f0" running
    exit
)

title SISTEMA HTTPS - DEFINITIVO

REM Define e vai para o diretorio
set "DIR_PROJETO=d:\General Truck System\5. Emissor de Laudos - Inspetor"
cd /d "%DIR_PROJETO%" 2>nul || goto :erro_diretorio

REM Verifica se esta no lugar certo
if not exist "package.json" goto :erro_diretorio

echo ============================================
echo    SISTEMA EMISSOR DE LAUDOS - HTTPS
echo ============================================
echo.
echo Diretorio: %CD%
echo ============================================
echo.

REM Verifica admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] SEM PRIVILEGIOS DE ADMIN
    echo Algumas funcoes nao funcionarao.
    echo.
    goto :pular_admin
)

echo [OK] Executando como ADMINISTRADOR
echo.

echo Configurando IP Virtual...
netsh interface ip delete address "Loopback Pseudo-Interface 1" 177.126.153.190 >nul 2>&1
netsh interface ip add address "Loopback Pseudo-Interface 1" 177.126.153.190 255.255.255.255 >nul 2>&1

echo Configurando Firewall...
netsh advfirewall firewall delete rule name="Sistema HTTP" >nul 2>&1
netsh advfirewall firewall delete rule name="Sistema HTTPS" >nul 2>&1
netsh advfirewall firewall add rule name="Sistema HTTP" dir=in action=allow protocol=TCP localport=80,3000 >nul 2>&1
netsh advfirewall firewall add rule name="Sistema HTTPS" dir=in action=allow protocol=TCP localport=443,9443 >nul 2>&1

echo [OK] Configuracoes aplicadas!
echo.

:pular_admin

REM Verifica Node
where node >nul 2>&1 || goto :erro_node
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VER=%%i
echo [OK] Node.js: %NODE_VER%

REM Verifica NPM e VOLTA para o diretorio
where npm >nul 2>&1 || goto :erro_npm
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VER=%%i
echo [OK] NPM: %NPM_VER%

REM FORCA voltar ao diretorio
cd /d "%DIR_PROJETO%"
echo.

REM Instala dependencias se necessario
if not exist "node_modules" (
    echo Instalando dependencias...
    echo.
    
    REM Usa START /WAIT para garantir que nao muda diretorio
    start /wait /b cmd /c "cd /d "%DIR_PROJETO%" && npm install"
    
    if not exist "node_modules" (
        echo [ERRO] Falha ao instalar!
        goto :fim
    )
    echo [OK] Dependencias instaladas!
) else (
    echo [OK] Dependencias ja instaladas
)

REM FORCA diretorio novamente
cd /d "%DIR_PROJETO%"
echo.

REM Verifica SSL
echo Verificando certificados SSL...
if exist "ssl\inspetor.terpens.com.br.crt" (
    echo [OK] Certificado encontrado
) else (
    echo [!] Certificado nao encontrado
)

if exist "ssl\inspetor.terpens.com.br.key" (
    echo [OK] Chave privada encontrada
) else (
    echo [!] Chave nao encontrada
)
echo.

REM Build se necessario
if not exist ".next" (
    echo Compilando projeto...
    start /wait /b cmd /c "cd /d "%DIR_PROJETO%" && npm run build"
    if exist ".next" (
        echo [OK] Build concluido!
    ) else (
        echo [!] Build falhou, usando dev
    )
) else (
    echo [OK] Build ja existe
)

REM FORCA diretorio final
cd /d "%DIR_PROJETO%"
echo.

echo ============================================
echo    INICIANDO SERVIDOR
echo ============================================
echo.

if exist "start-https-local.js" (
    echo MODO: HTTPS
    echo.
    echo URLs disponiveis:
    echo - http://localhost:3000 (redireciona)
    echo - https://localhost:9443
    echo - https://177.126.153.190:9443
    echo.
    echo Iniciando servidor HTTPS...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Executa sem perder diretorio
    start /wait /b cmd /c "cd /d "%DIR_PROJETO%" && node start-https-local.js"
) else (
    echo MODO: HTTP
    echo.
    echo URLs disponiveis:
    echo - http://localhost:3000
    echo - http://177.126.153.190:3000
    echo.
    echo Iniciando servidor HTTP...
    echo Pressione Ctrl+C para parar
    echo.
    
    REM Executa sem perder diretorio
    start /wait /b cmd /c "cd /d "%DIR_PROJETO%" && npm run dev"
)

echo.
echo ============================================
echo    SERVIDOR PARADO
echo ============================================
goto :fim

:erro_diretorio
echo ====================================
echo    ERRO: DIRETORIO NAO ENCONTRADO
echo ====================================
echo.
echo Esperado: %DIR_PROJETO%
echo Atual: %CD%
echo.
goto :fim

:erro_node
echo [ERRO] Node.js nao instalado!
echo Baixe em: https://nodejs.org/
goto :fim

:erro_npm
echo [ERRO] NPM nao encontrado!
goto :fim

:fim
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
exit /b