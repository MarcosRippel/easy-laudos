@echo off
REM ==========================================================
REM VERIFICADOR DE STATUS HTTPS - SISTEMA EMISSOR DE LAUDOS
REM ==========================================================

title VERIFICADOR STATUS HTTPS

echo ============================================
echo    VERIFICADOR DE STATUS HTTPS
echo ============================================
echo.
echo Data/Hora: %DATE% %TIME%
echo ============================================
echo.

REM Força diretório correto
cd /d "d:\General Truck System\5. Emissor de Laudos - Inspetor"

REM ====================================
REM VERIFICACAO 1: CERTIFICADOS SSL
REM ====================================
echo [1] CERTIFICADOS SSL
echo ------------------------------------
set "SSL_DIR=%CD%\ssl"
set "SSL_CERT=%SSL_DIR%\inspetor.terpens.com.br.crt"
set "SSL_KEY=%SSL_DIR%\inspetor.terpens.com.br.key"

if exist "%SSL_CERT%" (
    echo [OK] Certificado encontrado:
    echo      %SSL_CERT%
    for %%I in ("%SSL_CERT%") do echo      Tamanho: %%~zI bytes
    for %%I in ("%SSL_CERT%") do echo      Modificado: %%~tI
) else (
    echo [X] Certificado NAO encontrado!
    echo     Esperado em: %SSL_CERT%
)

if exist "%SSL_KEY%" (
    echo [OK] Chave privada encontrada:
    echo      %SSL_KEY%
    for %%I in ("%SSL_KEY%") do echo      Tamanho: %%~zI bytes
) else (
    echo [X] Chave privada NAO encontrada!
    echo     Esperado em: %SSL_KEY%
)
echo.

REM ====================================
REM VERIFICACAO 2: IP VIRTUAL
REM ====================================
echo [2] IP VIRTUAL (177.126.153.190)
echo ------------------------------------
ping -n 1 177.126.153.190 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] IP Virtual respondendo ao ping
    
    REM Verifica se está configurado
    netsh interface ip show address "Loopback Pseudo-Interface 1" | findstr "177.126.153.190" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] IP Virtual configurado na interface
    ) else (
        echo [!] IP responde mas nao esta na interface
    )
) else (
    echo [X] IP Virtual NAO responde
    echo     Execute: INICIAR-SISTEMA-HTTPS-COMPLETO.bat como admin
)
echo.

REM ====================================
REM VERIFICACAO 3: PORTAS ABERTAS
REM ====================================
echo [3] PORTAS DE SERVICO
echo ------------------------------------
echo Verificando portas abertas...

REM Porta 80 (HTTP)
netstat -an | findstr ":80 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Porta 80 (HTTP) - ABERTA
) else (
    echo [X] Porta 80 (HTTP) - FECHADA
)

REM Porta 443 (HTTPS)
netstat -an | findstr ":443 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Porta 443 (HTTPS) - ABERTA
) else (
    echo [X] Porta 443 (HTTPS) - FECHADA
)

REM Porta 3000 (Next.js)
netstat -an | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Porta 3000 (Next.js) - ABERTA
) else (
    echo [X] Porta 3000 (Next.js) - FECHADA
)

REM Porta 9443 (HTTPS Alternativo)
netstat -an | findstr ":9443 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Porta 9443 (HTTPS Alt) - ABERTA
) else (
    echo [X] Porta 9443 (HTTPS Alt) - FECHADA
)
echo.

REM ====================================
REM VERIFICACAO 4: SERVICOS
REM ====================================
echo [4] SERVICOS EM EXECUCAO
echo ------------------------------------

REM Node.js
tasklist | findstr /i "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js em execucao
    for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node.exe"') do (
        echo      PID: %%i
    )
) else (
    echo [X] Node.js NAO esta rodando
)

REM Nginx
tasklist | findstr /i "nginx.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Nginx em execucao
    for /f "tokens=2" %%i in ('tasklist ^| findstr /i "nginx.exe"') do (
        echo      PID: %%i
    )
) else (
    echo [!] Nginx NAO esta rodando
    echo     (Opcional para proxy reverso)
)
echo.

REM ====================================
REM VERIFICACAO 5: FIREWALL
REM ====================================
echo [5] REGRAS DE FIREWALL
echo ------------------------------------
netsh advfirewall firewall show rule name="Sistema Emissor HTTP" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Regra HTTP configurada
) else (
    echo [X] Regra HTTP NAO encontrada
)

netsh advfirewall firewall show rule name="Sistema Emissor HTTPS" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Regra HTTPS configurada
) else (
    echo [X] Regra HTTPS NAO encontrada
)

netsh advfirewall firewall show rule name="Sistema Emissor Dev" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Regra Dev (3000) configurada
) else (
    echo [X] Regra Dev NAO encontrada
)

netsh advfirewall firewall show rule name="Sistema Emissor HTTPS Alt" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Regra HTTPS Alt (9443) configurada
) else (
    echo [X] Regra HTTPS Alt NAO encontrada
)
echo.

REM ====================================
REM VERIFICACAO 6: TESTE DE CONECTIVIDADE
REM ====================================
echo [6] TESTE DE CONECTIVIDADE
echo ------------------------------------
echo Testando conexoes locais...

REM Teste HTTP local
curl -s -o nul -w "HTTP localhost:3000 - %%{http_code}\n" http://localhost:3000 2>nul
if %errorlevel% neq 0 (
    echo [X] Falha ao conectar em http://localhost:3000
)

REM Teste HTTPS local
curl -k -s -o nul -w "HTTPS localhost:9443 - %%{http_code}\n" https://localhost:9443 2>nul
if %errorlevel% neq 0 (
    echo [!] Falha ao conectar em https://localhost:9443
)

REM Teste IP Virtual
curl -s -o nul -w "HTTP IP Virtual - %%{http_code}\n" http://177.126.153.190:3000 2>nul
if %errorlevel% neq 0 (
    echo [!] Falha ao conectar no IP virtual
)
echo.

REM ====================================
REM VERIFICACAO 7: ARQUIVOS DO SISTEMA
REM ====================================
echo [7] ARQUIVOS DO SISTEMA
echo ------------------------------------
if exist "package.json" (
    echo [OK] package.json encontrado
) else (
    echo [X] package.json NAO encontrado!
)

if exist "node_modules" (
    echo [OK] node_modules instalado
    for /f %%i in ('dir /b "node_modules" ^| find /c /v ""') do echo      Pacotes: %%i
) else (
    echo [X] node_modules NAO instalado
)

if exist ".next" (
    echo [OK] Build do Next.js existe
) else (
    echo [!] Build do Next.js NAO existe
)

if exist "start-https-local.js" (
    echo [OK] Script HTTPS configurado
) else (
    echo [!] Script HTTPS NAO encontrado
)
echo.

REM ====================================
REM RESUMO E RECOMENDACOES
REM ====================================
echo ============================================
echo    RESUMO DO STATUS
echo ============================================
echo.

set HTTPS_OK=1

REM Verifica condições mínimas para HTTPS
if not exist "%SSL_CERT%" set HTTPS_OK=0
if not exist "%SSL_KEY%" set HTTPS_OK=0

netstat -an | findstr ":9443 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    netstat -an | findstr ":443 " | findstr "LISTENING" >nul 2>&1
    if %errorlevel% neq 0 set HTTPS_OK=0
)

if %HTTPS_OK% equ 1 (
    echo [HTTPS DISPONIVEL]
    echo.
    echo URLs de acesso:
    echo - https://localhost:9443
    echo - https://177.126.153.190:9443
    echo - https://inspetor.terpens.com.br (se DNS configurado)
) else (
    echo [HTTPS NAO DISPONIVEL]
    echo.
    echo Para habilitar HTTPS:
    echo 1. Execute como ADMINISTRADOR:
    echo    INICIAR-SISTEMA-HTTPS-COMPLETO.bat
    echo.
    echo 2. Se usar Nginx (opcional):
    echo    CONFIGURAR-NGINX-HTTPS.bat
)

echo.
echo ============================================
echo    ACOES RECOMENDADAS
echo ============================================

REM Recomendações baseadas no status
tasklist | findstr /i "node.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Sistema NAO esta rodando
    echo     Execute: INICIAR-SISTEMA-HTTPS-COMPLETO.bat
)

if not exist "%SSL_CERT%" (
    echo.
    echo [!] Certificados SSL ausentes
    echo     Coloque os arquivos em:
    echo     - %SSL_CERT%
    echo     - %SSL_KEY%
)

ping -n 1 177.126.153.190 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] IP Virtual nao configurado
    echo     Execute como admin: INICIAR-SISTEMA-HTTPS-COMPLETO.bat
)

echo.
echo ============================================
echo Verificacao concluida: %DATE% %TIME%
echo ============================================
echo.
pause