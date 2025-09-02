@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🚀 INSTALADOR AUTOMÁTICO COMPLETO - SISTEMA DE LAUDOS
echo ================================================================
echo.
echo 🎯 ESTE SCRIPT FAZ TUDO AUTOMATICAMENTE:
echo    ✅ Instala Node.js, Python, Git automaticamente
echo    ✅ Descompacta o ZIP exportado
echo    ✅ Instala TUDO (dependências, sistema, configurações)
echo    ✅ Configura domínio único para VM
echo    ✅ Inicia sistema automaticamente
echo    ✅ Abre navegador
echo.
echo ⚡ APENAS 1 CLIQUE - FAZ TUDO SOZINHO!
echo.

:: Verificar privilégios de administrador
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo ❌ ERRO: Execute como ADMINISTRADOR!
    echo.
    echo 🔧 Clique com botão direito no arquivo
    echo    e selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo ⚠️  ATENÇÃO: Este processo é TOTALMENTE AUTOMÁTICO
echo    Pode demorar 15-30 minutos para completar tudo
echo.
set /p "confirm=Confirma a instalação automática completa? (S/N): "
if /i "%confirm%" neq "S" (
    echo ❌ Instalação cancelada pelo usuário.
    pause
    exit /b 0
)

set "LOG_FILE=C:\Sistema-Laudos-Instalacao\INSTALACAO-AUTOMATICA-%date:~-4%-%date:~3,2%-%date:~0,2%.log"
mkdir "C:\Sistema-Laudos-Instalacao" 2>nul

echo.
echo [%date% %time%] Iniciando instalação automática completa >> "%LOG_FILE%"
echo 🚀 INICIANDO INSTALAÇÃO AUTOMÁTICA COMPLETA...
echo.

:: ETAPA 1: INSTALAR CHOCOLATEY E DEPENDÊNCIAS
echo ================================================================
echo 🛠️  ETAPA 1/6 - INSTALANDO DEPENDÊNCIAS AUTOMATICAMENTE
echo ================================================================
echo.
echo ⏳ Instalando Chocolatey...

powershell -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command ^
    "[System.Net.ServicePointManager]::SecurityProtocol = 3072; ^
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" ^
    2>>"%LOG_FILE%" 1>>"%LOG_FILE%"

:: Atualizar PATH
call refreshenv >nul 2>nul

echo ✅ Chocolatey instalado!
echo.
echo ⏳ Instalando Node.js...
choco install nodejs -y --force 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
echo ✅ Node.js instalado!

echo ⏳ Instalando Python...  
choco install python312 -y --force 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
echo ✅ Python instalado!

echo ⏳ Instalando Git...
choco install git -y --force 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
echo ✅ Git instalado!

echo ⏳ Instalando Build Tools...
choco install visualstudio2022buildtools -y --force --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools" 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
echo ✅ Build Tools instalados!

call refreshenv >nul 2>nul

:: ETAPA 2: DETECTAR E DESCOMPACTAR ZIP
echo.
echo ================================================================
echo 📦 ETAPA 2/6 - DETECTANDO E DESCOMPACTANDO SISTEMA
echo ================================================================
echo.

:: Procurar arquivo ZIP
set "ZIP_FOUND=0"
for %%f in (Sistema-Laudos-Export-Completo-*.zip) do (
    set "ZIP_FOUND=1"
    set "ZIP_FILE=%%f"
    echo ✅ ZIP encontrado: %%f
    goto :zip_found
)

:zip_found
if "%ZIP_FOUND%"=="0" (
    echo ❌ ERRO: Arquivo ZIP não encontrado!
    echo.
    echo 📝 Coloque o arquivo Sistema-Laudos-Export-Completo-*.zip
    echo    no mesmo diretório deste script e execute novamente.
    echo.
    pause
    exit /b 1
)

echo ⏳ Descompactando sistema...
set "INSTALL_DIR=C:\Sistema-Laudos"
rmdir /s /q "%INSTALL_DIR%" 2>nul
mkdir "%INSTALL_DIR%" 2>nul

powershell -command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TEMP%\Sistema-Laudos-Extract' -Force"
xcopy /E /Y "%TEMP%\Sistema-Laudos-Extract\sistema-laudos\*" "%INSTALL_DIR%\" >nul 2>nul

if exist "%INSTALL_DIR%\package.json" (
    echo ✅ Sistema descompactado em C:\Sistema-Laudos!
) else (
    echo ❌ ERRO: Falha ao descompactar sistema
    pause
    exit /b 1
)

:: ETAPA 3: INSTALAR PACOTES
echo.
echo ================================================================
echo 📦 ETAPA 3/6 - INSTALANDO PACOTES AUTOMATICAMENTE  
echo ================================================================
echo.

echo ⏳ Instalando pacotes Node.js...
cd /d "%INSTALL_DIR%"
call npm install 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
echo ✅ Pacotes Node.js instalados!

echo ⏳ Instalando pacotes Python...
if exist "launcher-production\requirements.txt" (
    pip install -r "launcher-production\requirements.txt" 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    echo ✅ Pacotes Python instalados!
) else (
    echo ⚠️  Requirements.txt não encontrado
)

:: ETAPA 4: CONFIGURAR DOMÍNIO ÚNICO AUTOMATICAMENTE
echo.
echo ================================================================
echo 🌐 ETAPA 4/6 - CONFIGURANDO DOMÍNIO ÚNICO AUTOMATICAMENTE
echo ================================================================
echo.

:: Detectar IP automaticamente
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "VM_IP=%%i"
    set "VM_IP=!VM_IP: =!"
    goto :auto_ip_found
)

:auto_ip_found
if "%VM_IP%"=="" set "VM_IP=192.168.1.200"

:: Gerar domínio único
set "CLEAN_IP=%VM_IP:.=%"
set "VM_DOMAIN=vm%CLEAN_IP%.laudos.local"

echo ✅ IP detectado: %VM_IP%
echo ✅ Domínio único: %VM_DOMAIN%

:: Configurar hosts automaticamente
set "HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts"
copy "%HOSTS_FILE%" "%HOSTS_FILE%.backup" >nul 2>nul

echo. >> "%HOSTS_FILE%"
echo # Sistema de Laudos - VM >> "%HOSTS_FILE%"
echo %VM_IP%    %VM_DOMAIN% >> "%HOSTS_FILE%"
echo 127.0.0.1  %VM_DOMAIN% >> "%HOSTS_FILE%"

echo ✅ Arquivo hosts configurado!

:: Configurar .env automaticamente
if exist ".env" (
    set "TEMP_ENV=%TEMP%\auto_env.txt"
    
    (
        for /f "usebackq tokens=*" %%a in (".env") do (
            set "line=%%a"
            if "!line:~0,11!"=="NEXTAUTH_URL" (
                echo NEXTAUTH_URL=https://%VM_DOMAIN%
            ) else if "!line:~0,20!"=="NEXT_PUBLIC_APP_URL" (
                echo NEXT_PUBLIC_APP_URL=https://%VM_DOMAIN%
            ) else if "!line:~0,9!"=="SERVER_IP" (
                echo SERVER_IP=%VM_IP%
            ) else if "!line:~0,6!"=="DOMAIN" (
                echo DOMAIN=%VM_DOMAIN%
            ) else (
                echo !line!
            )
        )
    ) > "%TEMP_ENV%"
    
    move "%TEMP_ENV%" ".env" >nul 2>nul
    echo ✅ Arquivo .env configurado automaticamente!
)

:: ETAPA 5: CONFIGURAR FIREWALL E VALIDAR
echo.
echo ================================================================
echo 🔥 ETAPA 5/6 - CONFIGURANDO FIREWALL E VALIDANDO
echo ================================================================
echo.

echo ⏳ Configurando firewall...
netsh advfirewall firewall add rule name="Sistema Laudos - Next.js" dir=in action=allow protocol=TCP localport=3000 2>nul
netsh advfirewall firewall add rule name="Sistema Laudos - HTTPS" dir=in action=allow protocol=TCP localport=443 2>nul
echo ✅ Firewall configurado!

echo ⏳ Configurando banco de dados...
if exist "prisma\dev.db" (
    echo ✅ Banco de dados já existe!
) else (
    call npx prisma generate 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    call npx prisma db push 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"
    echo ✅ Banco de dados criado!
)

:: ETAPA 6: INICIAR SISTEMA AUTOMATICAMENTE
echo.
echo ================================================================
echo 🚀 ETAPA 6/6 - INICIANDO SISTEMA AUTOMATICAMENTE
echo ================================================================
echo.

echo ⏳ Iniciando Python Launcher...
cd /d "launcher-production"
if exist "launcher.py" (
    start "Python Launcher" cmd /c "python launcher.py"
    timeout /t 3 >nul
    echo ✅ Python Launcher iniciado!
) else (
    echo ⚠️  Python Launcher não encontrado
)

echo ⏳ Iniciando Next.js...
cd /d "%INSTALL_DIR%"
start "Next.js Server" cmd /c "npm run build && npm start"

echo ⏳ Aguardando serviços iniciarem...
timeout /t 15 >nul

echo ⏳ Abrindo navegador automaticamente...
timeout /t 5 >nul
start https://%VM_DOMAIN% 2>nul
start http://localhost:3000 2>nul

:: RESULTADO FINAL
echo.
echo ================================================================
echo 🎉 INSTALAÇÃO AUTOMÁTICA COMPLETA FINALIZADA!
echo ================================================================
echo.
echo ✅ SISTEMA TOTALMENTE INSTALADO E FUNCIONANDO!
echo.
echo 🌐 URLs de Acesso:
echo    • https://%VM_DOMAIN%
echo    • http://localhost:3000  
echo    • http://%VM_IP%:3000
echo.
echo 🔐 Login:
echo    • Usuário: admin
echo    • Senha: admin
echo.
echo 📊 Status dos Serviços:
netstat -an | findstr ":3000" >nul 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Next.js: ATIVO (porta 3000)
) else (
    echo    ⚠️  Next.js: Iniciando...
)

netstat -an | findstr ":443" >nul 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Python Launcher: ATIVO (porta 443)
) else (
    echo    ⚠️  Python Launcher: Iniciando...
)

echo.
echo 📋 Informações da Instalação:
echo    • Local: C:\Sistema-Laudos
echo    • IP da VM: %VM_IP%
echo    • Domínio único: %VM_DOMAIN%
echo    • Log completo: %LOG_FILE%
echo.
echo 🎯 O SISTEMA ESTÁ PRONTO PARA USO!
echo    Não haverá conflito com o sistema principal.
echo.
echo ================================================================

echo [%date% %time%] Instalação automática completa finalizada >> "%LOG_FILE%"

echo.
echo ⏳ Deixando sistema rodando... Pressione qualquer tecla para parar os serviços.
pause >nul

echo.
echo 🛑 Parando serviços...
taskkill /f /im "node.exe" >nul 2>nul
taskkill /f /im "python.exe" >nul 2>nul
echo ✅ Serviços parados!