@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🌐 CONFIGURAR DOMÍNIO DEDICADO PARA VM
echo ================================================================
echo.
echo Este script vai configurar um domínio único para a VM:
echo ✅ Detectar IP da VM automaticamente
echo ✅ Configurar domínio dedicado (inspetor-vm.terpens.com.br)
echo ✅ Criar certificados SSL para novo domínio
echo ✅ Atualizar configurações (.env)
echo ✅ Configurar hosts locais se necessário
echo ✅ Testar conectividade
echo.

set "INSTALL_DIR=C:\Sistema-Laudos"
set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\configuracao-dominio-vm-%date:~-4%-%date:~3,2%-%date:~0,2%.log"

:: Criar diretório de logs
mkdir "%LOG_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
echo.

echo [%date% %time%] Iniciando configuração de domínio para VM >> "%LOG_FILE%"
echo ⏳ Configurando domínio dedicado para VM...
echo.

:: 1. DETECTAR IP DA VM
echo 🔍 1/8 - Detectando IP da VM...
echo [%date% %time%] Detectando IP da VM >> "%LOG_FILE%"

:: Detectar IP local da VM
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "VM_IP=%%i"
    set "VM_IP=!VM_IP: =!"
    goto :vm_ip_found
)

:vm_ip_found
if "%VM_IP%"=="" set "VM_IP=192.168.1.200"

echo ✅ IP da VM detectado: %VM_IP%
echo [%date% %time%] IP da VM detectado: %VM_IP% >> "%LOG_FILE%"

:: 2. DEFINIR DOMÍNIO DEDICADO
echo 🌐 2/8 - Definindo domínio dedicado...
echo [%date% %time%] Definindo domínio dedicado >> "%LOG_FILE%"

set "VM_DOMAIN=inspetor-vm.terpens.com.br"
set "VM_SUBDOMAIN=vm%VM_IP:~-3%.inspetor.terpens.com.br"

:: Remover pontos do IP para criar subdomínio único
set "CLEAN_IP=%VM_IP:.=%"
set "VM_UNIQUE=vm%CLEAN_IP%.laudos.local"

echo ✅ Domínio principal: %VM_DOMAIN%
echo ✅ Domínio único: %VM_UNIQUE%
echo ✅ Subdomínio: %VM_SUBDOMAIN%
echo [%date% %time%] Domínios definidos: %VM_DOMAIN% / %VM_UNIQUE% >> "%LOG_FILE%"

:: 3. CONFIGURAR ARQUIVO HOSTS
echo 📝 3/8 - Configurando arquivo hosts...
echo [%date% %time%] Configurando arquivo hosts >> "%LOG_FILE%"

set "HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts"

:: Backup do hosts
copy "%HOSTS_FILE%" "%HOSTS_FILE%.backup" >nul 2>nul

:: Remover entradas antigas se existirem
findstr /v "inspetor-vm.terpens.com.br" "%HOSTS_FILE%" > "%TEMP%\hosts_temp"
findstr /v "%VM_UNIQUE%" "%TEMP%\hosts_temp" > "%HOSTS_FILE%"

:: Adicionar novas entradas
echo. >> "%HOSTS_FILE%"
echo # Configuração para VM do Sistema de Laudos >> "%HOSTS_FILE%"
echo %VM_IP%    %VM_DOMAIN% >> "%HOSTS_FILE%"
echo %VM_IP%    %VM_UNIQUE% >> "%HOSTS_FILE%"
echo 127.0.0.1  %VM_UNIQUE% >> "%HOSTS_FILE%"

echo ✅ Arquivo hosts atualizado!
echo [%date% %time%] Arquivo hosts atualizado >> "%LOG_FILE%"

:: 4. ATUALIZAR .ENV
echo ⚙️ 4/8 - Atualizando configurações (.env)...
echo [%date% %time%] Atualizando .env >> "%LOG_FILE%"

if exist "%INSTALL_DIR%\.env" (
    set "ENV_FILE=%INSTALL_DIR%\.env"
    set "TEMP_ENV=%TEMP%\temp_env_vm.txt"
    
    :: Backup do .env
    copy "%ENV_FILE%" "%ENV_FILE%.backup" >nul 2>nul
    
    :: Atualizar URLs no .env
    (
        for /f "usebackq tokens=*" %%a in ("%ENV_FILE%") do (
            set "line=%%a"
            if "!line:~0,11!"=="NEXTAUTH_URL" (
                echo NEXTAUTH_URL=https://%VM_UNIQUE%
            ) else if "!line:~0,20!"=="NEXT_PUBLIC_APP_URL" (
                echo NEXT_PUBLIC_APP_URL=https://%VM_UNIQUE%
            ) else if "!line:~0,9!"=="SERVER_IP" (
                echo SERVER_IP=%VM_IP%
            ) else if "!line:~0,6!"=="DOMAIN" (
                echo DOMAIN=%VM_UNIQUE%
            ) else (
                echo !line!
            )
        )
    ) > "%TEMP_ENV%"
    
    move "%TEMP_ENV%" "%ENV_FILE%" >nul 2>nul
    echo ✅ Arquivo .env atualizado com domínio da VM!
    echo [%date% %time%] .env atualizado com domínio da VM >> "%LOG_FILE%"
) else (
    echo ❌ Arquivo .env não encontrado
    echo [%date% %time%] ERRO: .env não encontrado >> "%LOG_FILE%"
)

:: 5. GERAR CERTIFICADOS SSL PARA VM
echo 🔒 5/8 - Gerando certificados SSL para VM...
echo [%date% %time%] Gerando certificados SSL >> "%LOG_FILE%"

if exist "%INSTALL_DIR%\ssl" (
    :: Backup dos certificados originais
    if exist "%INSTALL_DIR%\ssl\inspetor.terpens.com.br.crt" (
        copy "%INSTALL_DIR%\ssl\inspetor.terpens.com.br.crt" "%INSTALL_DIR%\ssl\original.crt.backup" >nul
        copy "%INSTALL_DIR%\ssl\inspetor.terpens.com.br.key" "%INSTALL_DIR%\ssl\original.key.backup" >nul
    )
    
    :: Gerar novos certificados autoassinados para VM
    powershell -command "& {
        $cert = New-SelfSignedCertificate -DnsName '%VM_UNIQUE%','%VM_DOMAIN%','localhost' -CertStoreLocation 'cert:\LocalMachine\My'
        $pwd = ConvertTo-SecureString -String 'vm123' -Force -AsPlainText
        Export-PfxCertificate -cert $cert -FilePath '%INSTALL_DIR%\ssl\vm-cert.pfx' -Password $pwd
        
        # Exportar como .crt e .key
        $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
        [System.IO.File]::WriteAllBytes('%INSTALL_DIR%\ssl\%VM_UNIQUE%.crt', $certBytes)
        
        # Copiar para nomes padrão
        Copy-Item '%INSTALL_DIR%\ssl\%VM_UNIQUE%.crt' '%INSTALL_DIR%\ssl\inspetor.terpens.com.br.crt'
    }" 2>nul
    
    if exist "%INSTALL_DIR%\ssl\%VM_UNIQUE%.crt" (
        echo ✅ Certificados SSL gerados para VM!
        echo [%date% %time%] Certificados SSL gerados >> "%LOG_FILE%"
    ) else (
        echo ⚠️ Usando certificados existentes
        echo [%date% %time%] Usando certificados existentes >> "%LOG_FILE%"
    )
) else (
    echo ❌ Diretório SSL não encontrado
    echo [%date% %time%] ERRO: Diretório SSL não encontrado >> "%LOG_FILE%"
)

:: 6. ATUALIZAR LAUNCHER PYTHON
echo 🐍 6/8 - Atualizando configuração do Python Launcher...
echo [%date% %time%] Atualizando Python Launcher >> "%LOG_FILE%"

if exist "%INSTALL_DIR%\launcher-production\launcher-config.json" (
    :: Backup da configuração
    copy "%INSTALL_DIR%\launcher-production\launcher-config.json" "%INSTALL_DIR%\launcher-production\launcher-config.backup" >nul
    
    :: Atualizar configuração do launcher
    powershell -command "& {
        $config = Get-Content '%INSTALL_DIR%\launcher-production\launcher-config.json' | ConvertFrom-Json
        $config.domain = '%VM_UNIQUE%'
        $config.server_ip = '%VM_IP%'
        $config | ConvertTo-Json -Depth 10 | Out-File '%INSTALL_DIR%\launcher-production\launcher-config.json' -Encoding UTF8
    }" 2>nul
    
    echo ✅ Configuração do Python Launcher atualizada!
    echo [%date% %time%] Python Launcher configurado >> "%LOG_FILE%"
) else (
    echo ⚠️ Arquivo de configuração do launcher não encontrado
    echo [%date% %time%] launcher-config.json não encontrado >> "%LOG_FILE%"
)

:: 7. TESTAR CONECTIVIDADE
echo 🔍 7/8 - Testando conectividade...
echo [%date% %time%] Testando conectividade >> "%LOG_FILE%"

:: Testar resolução DNS local
nslookup %VM_UNIQUE% >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Resolução DNS: OK
    echo [%date% %time%] DNS resolvido >> "%LOG_FILE%"
) else (
    echo ⚠️ Resolução DNS: Usando arquivo hosts
    echo [%date% %time%] DNS usando hosts >> "%LOG_FILE%"
)

:: Ping local
ping -n 1 %VM_IP% >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Conectividade IP: OK
    echo [%date% %time%] Ping OK >> "%LOG_FILE%"
) else (
    echo ⚠️ Conectividade IP: Verificar rede
    echo [%date% %time%] Ping falhou >> "%LOG_FILE%"
)

:: 8. GERAR RELATÓRIO DE CONFIGURAÇÃO
echo 📋 8/8 - Gerando relatório...
echo [%date% %time%] Gerando relatório final >> "%LOG_FILE%"

set "VM_REPORT=%LOG_DIR%\CONFIGURACAO-VM-RELATORIO.txt"

echo ================================================================ > "%VM_REPORT%"
echo RELATÓRIO DE CONFIGURAÇÃO DE DOMÍNIO PARA VM >> "%VM_REPORT%"
echo ================================================================ >> "%VM_REPORT%"
echo. >> "%VM_REPORT%"
echo Data: %date% %time% >> "%VM_REPORT%"
echo IP da VM: %VM_IP% >> "%VM_REPORT%"
echo Domínio principal: %VM_DOMAIN% >> "%VM_REPORT%"
echo Domínio único: %VM_UNIQUE% >> "%VM_REPORT%"
echo. >> "%VM_REPORT%"
echo ---------------------------------------------------------------- >> "%VM_REPORT%"
echo CONFIGURAÇÕES APLICADAS >> "%VM_REPORT%"
echo ---------------------------------------------------------------- >> "%VM_REPORT%"
echo ✅ Arquivo hosts atualizado >> "%VM_REPORT%"
echo ✅ Arquivo .env configurado >> "%VM_REPORT%"
echo ✅ Certificados SSL gerados >> "%VM_REPORT%"
echo ✅ Python Launcher configurado >> "%VM_REPORT%"
echo. >> "%VM_REPORT%"
echo ---------------------------------------------------------------- >> "%VM_REPORT%"
echo URLS DE ACESSO >> "%VM_REPORT%"
echo ---------------------------------------------------------------- >> "%VM_REPORT%"
echo HTTPS: https://%VM_UNIQUE% >> "%VM_REPORT%"
echo HTTP:  http://%VM_UNIQUE%:3000 >> "%VM_REPORT%"
echo Local: http://%VM_IP%:3000 >> "%VM_REPORT%"
echo. >> "%VM_REPORT%"
echo ---------------------------------------------------------------- >> "%VM_REPORT%"
echo PRÓXIMOS PASSOS >> "%VM_REPORT%"
echo ---------------------------------------------------------------- >> "%VM_REPORT%"
echo 1. Execute: 04-iniciar-sistema.bat >> "%VM_REPORT%"
echo 2. Acesse: https://%VM_UNIQUE% >> "%VM_REPORT%"
echo 3. Login: admin / admin >> "%VM_REPORT%"
echo. >> "%VM_REPORT%"
echo Log completo: %LOG_FILE% >> "%VM_REPORT%"
echo ================================================================ >> "%VM_REPORT%"

echo ✅ Relatório gerado: %VM_REPORT%

:: RESULTADO FINAL
echo.
echo ================================================================
echo 🎉 CONFIGURAÇÃO DE DOMÍNIO VM CONCLUÍDA!
echo ================================================================
echo.
echo 🌐 INFORMAÇÕES DA VM:
echo    • IP da VM: %VM_IP%
echo    • Domínio único: %VM_UNIQUE%
echo    • Domínio principal: %VM_DOMAIN%
echo.
echo 🔗 URLS DE ACESSO:
echo    • HTTPS: https://%VM_UNIQUE%
echo    • HTTP:  http://%VM_UNIQUE%:3000
echo    • Local: http://%VM_IP%:3000
echo.
echo 📋 ARQUIVOS CONFIGURADOS:
echo    • %HOSTS_FILE%
echo    • %INSTALL_DIR%\.env
echo    • %INSTALL_DIR%\ssl\
echo    • %INSTALL_DIR%\launcher-production\
echo.
echo ✅ PRÓXIMO PASSO:
echo    Execute o script 04-iniciar-sistema.bat
echo    para iniciar o sistema com o novo domínio
echo.
echo 📊 A VM agora tem seu próprio domínio único!
echo    Não haverá conflito com o sistema principal.
echo.
echo ================================================================
echo.

echo [%date% %time%] Configuração de domínio VM concluída >> "%LOG_FILE%"

pause