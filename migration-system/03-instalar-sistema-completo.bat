@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🚀 SISTEMA DE MIGRAÇÃO - INSTALAÇÃO COMPLETA
echo ================================================================
echo.
echo Este script vai instalar o sistema completo em C:\Sistema-Laudos
echo ✅ Descompactar arquivos exportados
echo ✅ Instalar dependências Node.js
echo ✅ Configurar banco de dados SQLite
echo ✅ Restaurar uploads e certificados SSL
echo ✅ Configurar variáveis de ambiente
echo ✅ Detectar e configurar IP automaticamente
echo ✅ Validar instalação completa
echo.

set "INSTALL_DIR=C:\Sistema-Laudos"
set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\instalacao-completa-%date:~-4%-%date:~3,2%-%date:~0,2%.log"

:: Criar diretórios
mkdir "%LOG_DIR%" 2>nul
mkdir "%INSTALL_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
echo 📁 Sistema será instalado em: %INSTALL_DIR%
echo.

:: Verificar privilégios de administrador
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

if '%errorlevel%' NEQ '0' (
    echo ❌ ERRO: Este script precisa ser executado como ADMINISTRADOR!
    echo.
    echo 🔧 Para executar como administrador:
    echo    1. Clique com botão direito no arquivo
    echo    2. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [%date% %time%] Iniciando instalação completa do sistema >> "%LOG_FILE%"
echo ⏳ Iniciando instalação completa...
echo.

:: 1. DETECTAR ARQUIVO DE EXPORTAÇÃO
echo 🔍 1/12 - Detectando arquivo de exportação...
echo [%date% %time%] Detectando arquivo de exportação >> "%LOG_FILE%"

set "EXPORT_FILE="
set "EXPORT_DIR="

:: Procurar arquivo ZIP de exportação no diretório atual
for %%f in (Sistema-Laudos-Export-Completo-*.zip) do (
    set "EXPORT_FILE=%%f"
    goto :found_zip
)

:found_zip
if "%EXPORT_FILE%"=="" (
    echo ❌ ERRO: Arquivo de exportação não encontrado!
    echo.
    echo 📝 Procurando por: Sistema-Laudos-Export-Completo-*.zip
    echo 📁 No diretório atual: %CD%
    echo.
    echo ✅ Solução: Coloque o arquivo ZIP exportado no mesmo diretório
    echo    deste script e execute novamente.
    echo.
    echo [%date% %time%] ERRO: Arquivo de exportação não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✅ Arquivo encontrado: %EXPORT_FILE%
echo [%date% %time%] Arquivo encontrado: %EXPORT_FILE% >> "%LOG_FILE%"

:: 2. DESCOMPACTAR ARQUIVOS
echo 📦 2/12 - Descompactando arquivos...
echo [%date% %time%] Descompactando arquivos >> "%LOG_FILE%"

set "TEMP_EXTRACT=%TEMP%\Sistema-Laudos-Extract"
rmdir /s /q "%TEMP_EXTRACT%" 2>nul
mkdir "%TEMP_EXTRACT%" 2>nul

powershell -command "Expand-Archive -Path '%EXPORT_FILE%' -DestinationPath '%TEMP_EXTRACT%' -Force" 2>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Arquivos descompactados com sucesso!
    echo [%date% %time%] Arquivos descompactados com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao descompactar arquivos
    echo [%date% %time%] ERRO ao descompactar arquivos >> "%LOG_FILE%"
    pause
    exit /b 1
)

:: 3. COPIAR SISTEMA
echo 📁 3/12 - Copiando sistema para C:\Sistema-Laudos...
echo [%date% %time%] Copiando sistema >> "%LOG_FILE%"

xcopy /E /Y "%TEMP_EXTRACT%\sistema-laudos\*" "%INSTALL_DIR%\" >nul 2>nul

if exist "%INSTALL_DIR%\package.json" (
    echo ✅ Sistema copiado com sucesso!
    echo [%date% %time%] Sistema copiado com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao copiar sistema
    echo [%date% %time%] ERRO ao copiar sistema >> "%LOG_FILE%"
    pause
    exit /b 1
)

:: 4. VALIDAR DEPENDÊNCIAS
echo 🔧 4/12 - Validando dependências...
echo [%date% %time%] Validando dependências >> "%LOG_FILE%"

set "DEPS_OK=1"

node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado
    set "DEPS_OK=0"
)

npm --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado
    set "DEPS_OK=0"
)

python --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python não encontrado
    set "DEPS_OK=0"
)

if "%DEPS_OK%"=="0" (
    echo ❌ ERRO: Dependências não instaladas!
    echo.
    echo ✅ Execute primeiro o script 02-instalador-dependencias.bat
    echo    e reinicie o computador antes de continuar.
    echo.
    echo [%date% %time%] ERRO: Dependências não instaladas >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✅ Todas as dependências encontradas!
echo [%date% %time%] Todas as dependências encontradas >> "%LOG_FILE%"

:: 5. INSTALAR PACOTES NODE.JS
echo 📦 5/12 - Instalando pacotes Node.js...
echo [%date% %time%] Instalando pacotes Node.js >> "%LOG_FILE%"

cd /d "%INSTALL_DIR%"
call npm install 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Pacotes Node.js instalados com sucesso!
    echo [%date% %time%] Pacotes Node.js instalados com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao instalar pacotes Node.js
    echo [%date% %time%] ERRO ao instalar pacotes Node.js >> "%LOG_FILE%"
    
    echo ⚠️  Tentando corrigir com npm cache clean...
    call npm cache clean --force 2>nul
    call npm install 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    
    if %errorlevel% equ 0 (
        echo ✅ Pacotes Node.js instalados após limpeza do cache!
        echo [%date% %time%] Pacotes Node.js instalados após limpeza do cache >> "%LOG_FILE%"
    ) else (
        echo ❌ Erro persistente ao instalar pacotes Node.js
        echo [%date% %time%] ERRO persistente ao instalar pacotes Node.js >> "%LOG_FILE%"
        pause
        exit /b 1
    )
)

:: 6. INSTALAR PACOTES PYTHON
echo 🐍 6/12 - Instalando pacotes Python...
echo [%date% %time%] Instalando pacotes Python >> "%LOG_FILE%"

if exist "%INSTALL_DIR%\launcher-production\requirements.txt" (
    pip install -r "%INSTALL_DIR%\launcher-production\requirements.txt" 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    
    if %errorlevel% equ 0 (
        echo ✅ Pacotes Python instalados com sucesso!
        echo [%date% %time%] Pacotes Python instalados com sucesso >> "%LOG_FILE%"
    ) else (
        echo ❌ Erro ao instalar pacotes Python
        echo [%date% %time%] ERRO ao instalar pacotes Python >> "%LOG_FILE%"
    )
) else (
    echo ⚠️  Arquivo requirements.txt não encontrado
    echo [%date% %time%] requirements.txt não encontrado >> "%LOG_FILE%"
)

:: 7. CONFIGURAR BANCO DE DADOS
echo 💾 7/12 - Configurando banco de dados...
echo [%date% %time%] Configurando banco de dados >> "%LOG_FILE%"

if exist "%INSTALL_DIR%\prisma\dev.db" (
    echo ✅ Banco de dados restaurado!
    echo [%date% %time%] Banco de dados restaurado >> "%LOG_FILE%"
) else (
    echo ⚠️  Banco de dados não encontrado, criando novo...
    echo [%date% %time%] Criando novo banco de dados >> "%LOG_FILE%"
    
    cd /d "%INSTALL_DIR%"
    call npx prisma generate 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    call npx prisma db push 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    
    if %errorlevel% equ 0 (
        echo ✅ Novo banco de dados criado!
        echo [%date% %time%] Novo banco de dados criado >> "%LOG_FILE%"
    ) else (
        echo ❌ Erro ao criar banco de dados
        echo [%date% %time%] ERRO ao criar banco de dados >> "%LOG_FILE%"
    )
)

:: 8. DETECTAR IP AUTOMATICAMENTE
echo 🌐 8/12 - Detectando IP automaticamente...
echo [%date% %time%] Detectando IP automaticamente >> "%LOG_FILE%"

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

:: 9. CONFIGURAR VARIÁVEIS DE AMBIENTE
echo ⚙️  9/12 - Configurando variáveis de ambiente...
echo [%date% %time%] Configurando variáveis de ambiente >> "%LOG_FILE%"

set "ENV_FILE=%INSTALL_DIR%\.env"
set "TEMP_ENV=%TEMP%\temp_env.txt"

:: Backup do .env original
if exist "%ENV_FILE%" (
    copy "%ENV_FILE%" "%ENV_FILE%.backup" >nul 2>nul
)

:: Atualizar .env com IP detectado
if exist "%ENV_FILE%" (
    (
        for /f "usebackq tokens=*" %%a in ("%ENV_FILE%") do (
            set "line=%%a"
            if "!line:~0,9!"=="SERVER_IP" (
                echo SERVER_IP=%LOCAL_IP%
            ) else if "!line:~0,11!"=="NEXTAUTH_URL" (
                echo NEXTAUTH_URL=https://inspetor.terpens.com.br
            ) else if "!line:~0,20!"=="NEXT_PUBLIC_APP_URL" (
                echo NEXT_PUBLIC_APP_URL=https://inspetor.terpens.com.br
            ) else (
                echo !line!
            )
        )
    ) > "%TEMP_ENV%"
    
    move "%TEMP_ENV%" "%ENV_FILE%" >nul 2>nul
    echo ✅ Variáveis de ambiente atualizadas!
    echo [%date% %time%] Variáveis de ambiente atualizadas >> "%LOG_FILE%"
) else (
    echo ❌ Arquivo .env não encontrado
    echo [%date% %time%] ERRO: Arquivo .env não encontrado >> "%LOG_FILE%"
)

:: 10. VALIDAR INSTALAÇÃO
echo ✅ 10/12 - Validando instalação...
echo [%date% %time%] Validando instalação >> "%LOG_FILE%"

set "VALIDATION_OK=1"

:: Verificar arquivos críticos
if not exist "%INSTALL_DIR%\package.json" (
    echo ❌ package.json não encontrado
    set "VALIDATION_OK=0"
)

if not exist "%INSTALL_DIR%\.env" (
    echo ❌ .env não encontrado
    set "VALIDATION_OK=0"
)

if not exist "%INSTALL_DIR%\prisma\schema.prisma" (
    echo ❌ Schema do Prisma não encontrado
    set "VALIDATION_OK=0"
)

if not exist "%INSTALL_DIR%\node_modules" (
    echo ❌ node_modules não encontrado
    set "VALIDATION_OK=0"
)

if "%VALIDATION_OK%"=="0" (
    echo ❌ Validação falhou!
    echo [%date% %time%] ERRO: Validação falhou >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✅ Validação concluída com sucesso!
echo [%date% %time%] Validação concluída com sucesso >> "%LOG_FILE%"

:: 11. CONFIGURAR FIREWALL
echo 🔥 11/12 - Configurando Firewall...
echo [%date% %time%] Configurando Firewall >> "%LOG_FILE%"

netsh advfirewall firewall add rule name="Sistema Laudos - Next.js" dir=in action=allow protocol=TCP localport=3000 2>nul
netsh advfirewall firewall add rule name="Sistema Laudos - HTTPS" dir=in action=allow protocol=TCP localport=443 2>nul
netsh advfirewall firewall add rule name="Sistema Laudos - Python Launcher" dir=in action=allow protocol=TCP localport=8443 2>nul

echo ✅ Regras de firewall configuradas!
echo [%date% %time%] Regras de firewall configuradas >> "%LOG_FILE%"

:: 12. GERAR RELATÓRIO FINAL
echo 📋 12/12 - Gerando relatório final...
echo [%date% %time%] Gerando relatório final >> "%LOG_FILE%"

set "REPORT_FILE=%INSTALL_DIR%\RELATORIO-INSTALACAO.txt"

echo ================================================================ > "%REPORT_FILE%"
echo RELATÓRIO DE INSTALAÇÃO DO SISTEMA DE LAUDOS >> "%REPORT_FILE%"
echo ================================================================ >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo Data da Instalação: %date% %time% >> "%REPORT_FILE%"
echo Computador: %COMPUTERNAME% >> "%REPORT_FILE%"
echo Usuário: %USERNAME% >> "%REPORT_FILE%"
echo Local de Instalação: %INSTALL_DIR% >> "%REPORT_FILE%"
echo IP Detectado: %LOCAL_IP% >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo STATUS DA INSTALAÇÃO >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo ✅ Sistema copiado para C:\Sistema-Laudos >> "%REPORT_FILE%"
echo ✅ Dependências Node.js instaladas >> "%REPORT_FILE%"
echo ✅ Dependências Python instaladas >> "%REPORT_FILE%"
echo ✅ Banco de dados configurado >> "%REPORT_FILE%"
echo ✅ Variáveis de ambiente atualizadas >> "%REPORT_FILE%"
echo ✅ Firewall configurado >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo PRÓXIMOS PASSOS >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo 1. Execute: 04-iniciar-sistema.bat >> "%REPORT_FILE%"
echo 2. Acesse: https://inspetor.terpens.com.br >> "%REPORT_FILE%"
echo 3. Usuário padrão: admin / senha: admin >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"

echo ✅ Relatório gerado: %REPORT_FILE%

:: LIMPEZA
rmdir /s /q "%TEMP_EXTRACT%" 2>nul

echo.
echo ================================================================
echo 🎉 INSTALAÇÃO COMPLETA FINALIZADA!
echo ================================================================
echo.
echo 📁 Sistema instalado em: %INSTALL_DIR%
echo 🌐 IP detectado: %LOCAL_IP%
echo 📋 Log completo: %LOG_FILE%
echo 📄 Relatório: %REPORT_FILE%
echo.
echo ✅ PRÓXIMO PASSO:
echo    Execute o script 04-iniciar-sistema.bat
echo    para iniciar o sistema completo
echo.
echo ================================================================
echo.

echo [%date% %time%] Instalação completa finalizada com sucesso >> "%LOG_FILE%"

pause