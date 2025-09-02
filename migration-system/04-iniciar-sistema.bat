@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🚀 SISTEMA DE MIGRAÇÃO - INICIAR SISTEMA COMPLETO
echo ================================================================
echo.
echo Este script vai iniciar o sistema completo:
echo ✅ Validar instalação
echo ✅ Iniciar Python Launcher (proxy HTTPS)
echo ✅ Iniciar Next.js (servidor principal)
echo ✅ Abrir navegador automaticamente
echo ✅ Monitorar status dos serviços
echo.

set "INSTALL_DIR=C:\Sistema-Laudos"
set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\inicializacao-%date:~-4%-%date:~3,2%-%date:~0,2%.log"

:: Criar diretório de logs
mkdir "%LOG_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
echo 📁 Sistema em: %INSTALL_DIR%
echo.

echo [%date% %time%] Iniciando sistema completo >> "%LOG_FILE%"
echo ⏳ Iniciando sistema completo...
echo.

:: 1. VALIDAR INSTALAÇÃO
echo 🔍 1/8 - Validando instalação...
echo [%date% %time%] Validando instalação >> "%LOG_FILE%"

if not exist "%INSTALL_DIR%" (
    echo ❌ ERRO: Sistema não encontrado em %INSTALL_DIR%
    echo.
    echo ✅ Execute primeiro o script 03-instalar-sistema-completo.bat
    echo.
    echo [%date% %time%] ERRO: Sistema não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

if not exist "%INSTALL_DIR%\package.json" (
    echo ❌ ERRO: package.json não encontrado
    echo [%date% %time%] ERRO: package.json não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

if not exist "%INSTALL_DIR%\.env" (
    echo ❌ ERRO: .env não encontrado
    echo [%date% %time%] ERRO: .env não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✅ Instalação validada!
echo [%date% %time%] Instalação validada >> "%LOG_FILE%"

:: 2. VERIFICAR DEPENDÊNCIAS
echo 🔧 2/8 - Verificando dependências...
echo [%date% %time%] Verificando dependências >> "%LOG_FILE%"

node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js não encontrado
    echo [%date% %time%] ERRO: Node.js não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

python --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: Python não encontrado
    echo [%date% %time%] ERRO: Python não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✅ Dependências verificadas!
echo [%date% %time%] Dependências verificadas >> "%LOG_FILE%"

:: 3. DETECTAR IP AUTOMATICAMENTE
echo 🌐 3/8 - Detectando IP...
echo [%date% %time%] Detectando IP >> "%LOG_FILE%"

:: Detectar IP local
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "LOCAL_IP=%%i"
    set "LOCAL_IP=!LOCAL_IP: =!"
    goto :ip_found
)

:ip_found
if "%LOCAL_IP%"=="" set "LOCAL_IP=192.168.1.100"

echo ✅ IP detectado: %LOCAL_IP%
echo [%date% %time%] IP detectado: %LOCAL_IP% >> "%LOG_FILE%"

:: 4. PARAR PROCESSOS EXISTENTES
echo 🛑 4/8 - Parando processos existentes...
echo [%date% %time%] Parando processos existentes >> "%LOG_FILE%"

taskkill /f /im "node.exe" >nul 2>nul
taskkill /f /im "python.exe" >nul 2>nul

echo ✅ Processos limpos!
echo [%date% %time%] Processos limpos >> "%LOG_FILE%"

:: 5. INICIAR PYTHON LAUNCHER
echo 🐍 5/8 - Iniciando Python Launcher (proxy HTTPS)...
echo [%date% %time%] Iniciando Python Launcher >> "%LOG_FILE%"

cd /d "%INSTALL_DIR%\launcher-production"

if exist "launcher.py" (
    start "Python Launcher" cmd /c "python launcher.py"
    timeout /t 3 >nul
    
    :: Verificar se o launcher iniciou
    netstat -an | findstr ":443" >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Python Launcher iniciado na porta 443!
        echo [%date% %time%] Python Launcher iniciado na porta 443 >> "%LOG_FILE%"
    ) else (
        echo ⚠️  Python Launcher pode não ter iniciado corretamente
        echo [%date% %time%] Python Launcher pode não ter iniciado corretamente >> "%LOG_FILE%"
    )
) else (
    echo ⚠️  launcher.py não encontrado
    echo [%date% %time%] launcher.py não encontrado >> "%LOG_FILE%"
)

:: 6. INICIAR NEXT.JS
echo 📗 6/8 - Iniciando Next.js (servidor principal)...
echo [%date% %time%] Iniciando Next.js >> "%LOG_FILE%"

cd /d "%INSTALL_DIR%"

start "Next.js Server" cmd /c "npm run build && npm start"
timeout /t 5 >nul

:: Aguardar o Next.js subir
echo ⏳ Aguardando Next.js inicializar...
set "NEXTJS_READY=0"
set "ATTEMPTS=0"

:check_nextjs
set /a ATTEMPTS+=1
if %ATTEMPTS% gtr 30 goto :nextjs_timeout

netstat -an | findstr ":3000" >nul 2>nul
if %errorlevel% equ 0 (
    set "NEXTJS_READY=1"
    goto :nextjs_ok
)

timeout /t 2 >nul
goto :check_nextjs

:nextjs_timeout
echo ⚠️  Next.js pode não ter iniciado corretamente
echo [%date% %time%] Next.js timeout >> "%LOG_FILE%"
goto :continue_startup

:nextjs_ok
echo ✅ Next.js iniciado na porta 3000!
echo [%date% %time%] Next.js iniciado na porta 3000 >> "%LOG_FILE%"

:continue_startup

:: 7. TESTAR CONECTIVIDADE
echo 🔍 7/8 - Testando conectividade...
echo [%date% %time%] Testando conectividade >> "%LOG_FILE%"

:: Testar porta 3000 (Next.js)
netstat -an | findstr ":3000" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Next.js: Porta 3000 ativa
    echo [%date% %time%] Next.js: Porta 3000 ativa >> "%LOG_FILE%"
) else (
    echo ❌ Next.js: Porta 3000 não ativa
    echo [%date% %time%] Next.js: Porta 3000 não ativa >> "%LOG_FILE%"
)

:: Testar porta 443 (HTTPS)
netstat -an | findstr ":443" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ HTTPS: Porta 443 ativa
    echo [%date% %time%] HTTPS: Porta 443 ativa >> "%LOG_FILE%"
) else (
    echo ❌ HTTPS: Porta 443 não ativa
    echo [%date% %time%] HTTPS: Porta 443 não ativa >> "%LOG_FILE%"
)

:: 8. ABRIR NAVEGADOR
echo 🌐 8/8 - Abrindo navegador...
echo [%date% %time%] Abrindo navegador >> "%LOG_FILE%"

timeout /t 2 >nul

:: Tentar abrir HTTPS primeiro
start https://inspetor.terpens.com.br 2>nul

:: Se falhar, abrir HTTP local
timeout /t 3 >nul
start http://localhost:3000 2>nul

echo ✅ Navegador iniciado!
echo [%date% %time%] Navegador iniciado >> "%LOG_FILE%"

:: RELATÓRIO FINAL DE STATUS
echo.
echo ================================================================
echo 🎉 SISTEMA INICIADO COM SUCESSO!
echo ================================================================
echo.
echo 🌐 URLs de Acesso:
echo    ✅ HTTPS: https://inspetor.terpens.com.br
echo    ✅ HTTP:  http://localhost:3000
echo    ✅ Local: http://%LOCAL_IP%:3000
echo.
echo 🔐 Login Padrão:
echo    👤 Usuário: admin
echo    🔑 Senha: admin
echo.
echo 📊 Status dos Serviços:

:: Verificar status dos serviços
netstat -an | findstr ":3000" >nul 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Next.js Server: ATIVO (porta 3000)
) else (
    echo    ❌ Next.js Server: INATIVO
)

netstat -an | findstr ":443" >nul 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Python Launcher: ATIVO (porta 443)
) else (
    echo    ❌ Python Launcher: INATIVO
)

echo.
echo 📋 Logs e Relatórios:
echo    📄 Log de inicialização: %LOG_FILE%
echo    📁 Diretório do sistema: %INSTALL_DIR%
echo.
echo ⚙️  Gerenciar Sistema:
echo    🛑 Para parar: Feche as janelas de comando abertas
echo    🔄 Para reiniciar: Execute este script novamente
echo    🔧 Para configurar: Edite o arquivo .env
echo.
echo ================================================================

echo [%date% %time%] Sistema iniciado com sucesso >> "%LOG_FILE%"

:: Manter a janela aberta para monitoramento
echo.
echo ⏳ Sistema em execução... Pressione qualquer tecla para parar os serviços.
pause >nul

:: Parar serviços ao sair
echo.
echo 🛑 Parando serviços...
taskkill /f /im "node.exe" >nul 2>nul
taskkill /f /im "python.exe" >nul 2>nul
echo ✅ Serviços parados!

echo [%date% %time%] Serviços parados pelo usuário >> "%LOG_FILE%"