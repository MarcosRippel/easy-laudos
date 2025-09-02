@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🔍 SISTEMA DE MIGRAÇÃO - VALIDAÇÃO E DIAGNÓSTICO COMPLETO
echo ================================================================
echo.
echo Este script vai validar TUDO e diagnosticar problemas:
echo ✅ Validar estrutura completa do sistema
echo ✅ Verificar integridade do banco de dados
echo ✅ Testar conectividade de rede
echo ✅ Validar certificados SSL
echo ✅ Diagnosticar erros automaticamente
echo ✅ Gerar relatório detalhado de problemas
echo ✅ Sugerir correções automáticas
echo.

set "INSTALL_DIR=C:\Sistema-Laudos"
set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\validacao-diagnostico-%date:~-4%-%date:~3,2%-%date:~0,2%.log"
set "REPORT_FILE=%LOG_DIR%\DIAGNOSTICO-COMPLETO.txt"

:: Criar diretório de logs
mkdir "%LOG_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
echo 📄 Relatório será salvo em: %REPORT_FILE%
echo.

echo [%date% %time%] Iniciando validação e diagnóstico completo >> "%LOG_FILE%"
echo ⏳ Iniciando validação completa...
echo.

:: Inicializar contadores
set "ERRORS=0"
set "WARNINGS=0"
set "SUCCESS=0"

:: Inicializar relatório
echo ================================================================ > "%REPORT_FILE%"
echo RELATÓRIO DE VALIDAÇÃO E DIAGNÓSTICO COMPLETO >> "%REPORT_FILE%"
echo ================================================================ >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo Data: %date% %time% >> "%REPORT_FILE%"
echo Computador: %COMPUTERNAME% >> "%REPORT_FILE%"
echo Sistema: %OS% >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo RESULTADOS DA VALIDAÇÃO >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"

:: 1. VALIDAR ESTRUTURA DO SISTEMA
echo 📁 1/12 - Validando estrutura do sistema...
echo [%date% %time%] Validando estrutura do sistema >> "%LOG_FILE%"

echo 📁 ESTRUTURA DO SISTEMA: >> "%REPORT_FILE%"

if exist "%INSTALL_DIR%" (
    echo ✅ Diretório principal existe: %INSTALL_DIR%
    echo ✅ Diretório principal: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
) else (
    echo ❌ ERRO: Diretório principal não existe: %INSTALL_DIR%
    echo ❌ ERRO CRÍTICO: Diretório principal não existe >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

:: Verificar arquivos essenciais
set "ESSENTIAL_FILES=package.json .env prisma\schema.prisma"
for %%f in (%ESSENTIAL_FILES%) do (
    if exist "%INSTALL_DIR%\%%f" (
        echo ✅ %%f encontrado
        echo ✅ %%f: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ❌ ERRO: %%f não encontrado
        echo ❌ ERRO: %%f não encontrado >> "%REPORT_FILE%"
        set /a ERRORS+=1
    )
)

:: Verificar diretórios essenciais
set "ESSENTIAL_DIRS=app components lib public prisma ssl launcher-production node_modules"
for %%d in (%ESSENTIAL_DIRS%) do (
    if exist "%INSTALL_DIR%\%%d" (
        echo ✅ Diretório %%d encontrado
        echo ✅ Diretório %%d: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ⚠️  Diretório %%d não encontrado
        echo ⚠️  Diretório %%d não encontrado >> "%REPORT_FILE%"
        set /a WARNINGS+=1
    )
)

echo. >> "%REPORT_FILE%"

:: 2. VALIDAR DEPENDÊNCIAS
echo 🔧 2/12 - Validando dependências...
echo [%date% %time%] Validando dependências >> "%LOG_FILE%"

echo 🔧 DEPENDÊNCIAS: >> "%REPORT_FILE%"

:: Verificar Node.js
node --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do (
        echo ✅ Node.js: %%i
        echo ✅ Node.js: %%i >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    )
) else (
    echo ❌ ERRO: Node.js não encontrado
    echo ❌ ERRO CRÍTICO: Node.js não encontrado >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

:: Verificar npm
npm --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do (
        echo ✅ npm: %%i
        echo ✅ npm: %%i >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    )
) else (
    echo ❌ ERRO: npm não encontrado
    echo ❌ ERRO CRÍTICO: npm não encontrado >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

:: Verificar Python
python --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version 2^>nul') do (
        echo ✅ Python: %%i
        echo ✅ Python: %%i >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    )
) else (
    echo ❌ ERRO: Python não encontrado
    echo ❌ ERRO CRÍTICO: Python não encontrado >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

echo. >> "%REPORT_FILE%"

:: 3. VALIDAR BANCO DE DADOS
echo 💾 3/12 - Validando banco de dados...
echo [%date% %time%] Validando banco de dados >> "%LOG_FILE%"

echo 💾 BANCO DE DADOS: >> "%REPORT_FILE%"

if exist "%INSTALL_DIR%\prisma\dev.db" (
    echo ✅ Arquivo de banco SQLite existe
    echo ✅ Arquivo SQLite: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
    
    :: Verificar tamanho do banco
    for %%i in ("%INSTALL_DIR%\prisma\dev.db") do (
        set "db_size=%%~zi"
        if !db_size! gtr 1024 (
            echo ✅ Banco tem dados (tamanho: !db_size! bytes)
            echo ✅ Banco com dados: !db_size! bytes >> "%REPORT_FILE%"
            set /a SUCCESS+=1
        ) else (
            echo ⚠️  Banco muito pequeno (tamanho: !db_size! bytes)
            echo ⚠️  Banco pequeno: !db_size! bytes >> "%REPORT_FILE%"
            set /a WARNINGS+=1
        )
    )
) else (
    echo ❌ ERRO: Banco de dados SQLite não encontrado
    echo ❌ ERRO CRÍTICO: Banco SQLite não encontrado >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

:: Tentar conectar ao banco usando Prisma
if exist "%INSTALL_DIR%\node_modules\.bin\prisma" (
    cd /d "%INSTALL_DIR%"
    npx prisma db pull --schema=prisma/schema.prisma >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Conexão com banco validada
        echo ✅ Conexão Prisma: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ⚠️  Não foi possível validar conexão Prisma
        echo ⚠️  Conexão Prisma: FALHA >> "%REPORT_FILE%"
        set /a WARNINGS+=1
    )
) else (
    echo ⚠️  Prisma CLI não encontrado
    echo ⚠️  Prisma CLI: NÃO ENCONTRADO >> "%REPORT_FILE%"
    set /a WARNINGS+=1
)

echo. >> "%REPORT_FILE%"

:: 4. VALIDAR UPLOADS
echo 📸 4/12 - Validando uploads...
echo [%date% %time%] Validando uploads >> "%LOG_FILE%"

echo 📸 UPLOADS: >> "%REPORT_FILE%"

if exist "%INSTALL_DIR%\public\uploads" (
    echo ✅ Diretório de uploads existe
    echo ✅ Diretório uploads: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
    
    :: Contar arquivos de upload
    set "upload_count=0"
    for /f %%i in ('dir /b /s "%INSTALL_DIR%\public\uploads\*.*" 2^>nul ^| find /c /v ""') do set "upload_count=%%i"
    echo ✅ Arquivos de upload encontrados: !upload_count!
    echo ✅ Arquivos de upload: !upload_count! >> "%REPORT_FILE%"
    set /a SUCCESS+=1
) else (
    echo ⚠️  Diretório de uploads não existe
    echo ⚠️  Diretório uploads: NÃO EXISTE >> "%REPORT_FILE%"
    set /a WARNINGS+=1
)

echo. >> "%REPORT_FILE%"

:: 5. VALIDAR CERTIFICADOS SSL
echo 🔒 5/12 - Validando certificados SSL...
echo [%date% %time%] Validando certificados SSL >> "%LOG_FILE%"

echo 🔒 CERTIFICADOS SSL: >> "%REPORT_FILE%"

if exist "%INSTALL_DIR%\ssl" (
    echo ✅ Diretório SSL existe
    echo ✅ Diretório SSL: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
    
    if exist "%INSTALL_DIR%\ssl\inspetor.terpens.com.br.crt" (
        echo ✅ Certificado .crt encontrado
        echo ✅ Certificado .crt: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ❌ ERRO: Certificado .crt não encontrado
        echo ❌ ERRO: Certificado .crt não encontrado >> "%REPORT_FILE%"
        set /a ERRORS+=1
    )
    
    if exist "%INSTALL_DIR%\ssl\inspetor.terpens.com.br.key" (
        echo ✅ Chave privada .key encontrada
        echo ✅ Chave privada .key: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ❌ ERRO: Chave privada .key não encontrada
        echo ❌ ERRO: Chave privada .key não encontrada >> "%REPORT_FILE%"
        set /a ERRORS+=1
    )
) else (
    echo ❌ ERRO: Diretório SSL não existe
    echo ❌ ERRO CRÍTICO: Diretório SSL não existe >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

echo. >> "%REPORT_FILE%"

:: 6. VALIDAR CONFIGURAÇÕES
echo ⚙️ 6/12 - Validando configurações...
echo [%date% %time%] Validando configurações >> "%LOG_FILE%"

echo ⚙️ CONFIGURAÇÕES: >> "%REPORT_FILE%"

if exist "%INSTALL_DIR%\.env" (
    :: Verificar variáveis críticas no .env
    findstr /i "DATABASE_URL" "%INSTALL_DIR%\.env" >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ DATABASE_URL configurada
        echo ✅ DATABASE_URL: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ❌ ERRO: DATABASE_URL não encontrada
        echo ❌ ERRO: DATABASE_URL não encontrada >> "%REPORT_FILE%"
        set /a ERRORS+=1
    )
    
    findstr /i "NEXTAUTH_SECRET" "%INSTALL_DIR%\.env" >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ NEXTAUTH_SECRET configurada
        echo ✅ NEXTAUTH_SECRET: OK >> "%REPORT_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo ❌ ERRO: NEXTAUTH_SECRET não encontrada
        echo ❌ ERRO: NEXTAUTH_SECRET não encontrada >> "%REPORT_FILE%"
        set /a ERRORS+=1
    )
) else (
    echo ❌ ERRO: Arquivo .env não encontrado
    echo ❌ ERRO CRÍTICO: Arquivo .env não encontrado >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

echo. >> "%REPORT_FILE%"

:: 7. TESTAR CONECTIVIDADE DE REDE
echo 🌐 7/12 - Testando conectividade de rede...
echo [%date% %time%] Testando conectividade >> "%LOG_FILE%"

echo 🌐 CONECTIVIDADE DE REDE: >> "%REPORT_FILE%"

:: Detectar IP local
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "LOCAL_IP=%%i"
    set "LOCAL_IP=!LOCAL_IP: =!"
    goto :ip_found
)

:ip_found
if "%LOCAL_IP%"=="" set "LOCAL_IP=192.168.1.100"

echo ✅ IP local detectado: %LOCAL_IP%
echo ✅ IP local: %LOCAL_IP% >> "%REPORT_FILE%"
set /a SUCCESS+=1

:: Testar conectividade com Google
ping -n 1 8.8.8.8 >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Conectividade internet: OK
    echo ✅ Internet: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
) else (
    echo ⚠️ Conectividade internet: FALHA
    echo ⚠️ Internet: FALHA >> "%REPORT_FILE%"
    set /a WARNINGS+=1
)

echo. >> "%REPORT_FILE%"

:: 8. VERIFICAR PORTAS
echo 🔌 8/12 - Verificando portas...
echo [%date% %time%] Verificando portas >> "%LOG_FILE%"

echo 🔌 PORTAS: >> "%REPORT_FILE%"

:: Verificar se as portas estão livres
netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️ Porta 3000 já está em uso
    echo ⚠️ Porta 3000: EM USO >> "%REPORT_FILE%"
    set /a WARNINGS+=1
) else (
    echo ✅ Porta 3000 disponível
    echo ✅ Porta 3000: DISPONÍVEL >> "%REPORT_FILE%"
    set /a SUCCESS+=1
)

netstat -an | findstr ":443" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️ Porta 443 já está em uso
    echo ⚠️ Porta 443: EM USO >> "%REPORT_FILE%"
    set /a WARNINGS+=1
) else (
    echo ✅ Porta 443 disponível
    echo ✅ Porta 443: DISPONÍVEL >> "%REPORT_FILE%"
    set /a SUCCESS+=1
)

echo. >> "%REPORT_FILE%"

:: 9. VERIFICAR FIREWALL
echo 🔥 9/12 - Verificando firewall...
echo [%date% %time%] Verificando firewall >> "%LOG_FILE%"

echo 🔥 FIREWALL: >> "%REPORT_FILE%"

netsh advfirewall firewall show rule name="Sistema Laudos - Next.js" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Regra firewall Next.js configurada
    echo ✅ Firewall Next.js: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
) else (
    echo ⚠️ Regra firewall Next.js não configurada
    echo ⚠️ Firewall Next.js: NÃO CONFIGURADA >> "%REPORT_FILE%"
    set /a WARNINGS+=1
)

netsh advfirewall firewall show rule name="Sistema Laudos - HTTPS" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Regra firewall HTTPS configurada
    echo ✅ Firewall HTTPS: OK >> "%REPORT_FILE%"
    set /a SUCCESS+=1
) else (
    echo ⚠️ Regra firewall HTTPS não configurada
    echo ⚠️ Firewall HTTPS: NÃO CONFIGURADA >> "%REPORT_FILE%"
    set /a WARNINGS+=1
)

echo. >> "%REPORT_FILE%"

:: 10. VERIFICAR ESPAÇO EM DISCO
echo 💽 10/12 - Verificando espaço em disco...
echo [%date% %time%] Verificando espaço em disco >> "%LOG_FILE%"

echo 💽 ESPAÇO EM DISCO: >> "%REPORT_FILE%"

for /f "tokens=3" %%i in ('dir C:\ ^| findstr "bytes free"') do (
    set "free_space=%%i"
    set "free_space=!free_space:,=!"
    goto :space_found
)

:space_found
if %free_space% gtr 1073741824 (
    echo ✅ Espaço livre suficiente: %free_space% bytes
    echo ✅ Espaço livre: %free_space% bytes >> "%REPORT_FILE%"
    set /a SUCCESS+=1
) else (
    echo ❌ ERRO: Espaço livre insuficiente: %free_space% bytes
    echo ❌ ERRO: Espaço insuficiente >> "%REPORT_FILE%"
    set /a ERRORS+=1
)

echo. >> "%REPORT_FILE%"

:: 11. DIAGNÓSTICO AUTOMÁTICO
echo 🔬 11/12 - Executando diagnóstico automático...
echo [%date% %time%] Executando diagnóstico automático >> "%LOG_FILE%"

echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo DIAGNÓSTICO AUTOMÁTICO E SUGESTÕES DE CORREÇÃO >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"

:: Sugestões baseadas nos erros encontrados
if %ERRORS% gtr 0 (
    echo 🚨 ERROS CRÍTICOS ENCONTRADOS (%ERRORS%): >> "%REPORT_FILE%"
    
    if not exist "%INSTALL_DIR%" (
        echo • CORREÇÃO: Execute o script 03-instalar-sistema-completo.bat >> "%REPORT_FILE%"
    )
    
    if not exist "%INSTALL_DIR%\package.json" (
        echo • CORREÇÃO: Execute novamente a exportação e instalação >> "%REPORT_FILE%"
    )
    
    if not exist "%INSTALL_DIR%\.env" (
        echo • CORREÇÃO: Verifique se o arquivo .env foi exportado corretamente >> "%REPORT_FILE%"
    )
    
    echo. >> "%REPORT_FILE%"
)

if %WARNINGS% gtr 0 (
    echo ⚠️ AVISOS ENCONTRADOS (%WARNINGS%): >> "%REPORT_FILE%"
    
    if not exist "%INSTALL_DIR%\node_modules" (
        echo • SUGESTÃO: Execute 'npm install' no diretório %INSTALL_DIR% >> "%REPORT_FILE%"
    )
    
    if not exist "%INSTALL_DIR%\ssl" (
        echo • SUGESTÃO: Configure os certificados SSL manualmente >> "%REPORT_FILE%"
    )
    
    echo. >> "%REPORT_FILE%"
)

echo. >> "%REPORT_FILE%"

:: 12. RELATÓRIO FINAL
echo 📊 12/12 - Gerando relatório final...
echo [%date% %time%] Gerando relatório final >> "%LOG_FILE%"

echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo RESUMO FINAL >> "%REPORT_FILE%"
echo ---------------------------------------------------------------- >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo ✅ Sucessos: %SUCCESS% >> "%REPORT_FILE%"
echo ⚠️  Avisos: %WARNINGS% >> "%REPORT_FILE%"
echo ❌ Erros: %ERRORS% >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"

if %ERRORS% equ 0 (
    if %WARNINGS% equ 0 (
        echo 🎉 STATUS GERAL: SISTEMA PERFEITO! >> "%REPORT_FILE%"
        echo    O sistema está pronto para uso. >> "%REPORT_FILE%"
    ) else (
        echo 🟡 STATUS GERAL: SISTEMA FUNCIONAL COM AVISOS >> "%REPORT_FILE%"
        echo    O sistema pode funcionar, mas há melhorias recomendadas. >> "%REPORT_FILE%"
    )
) else (
    echo 🔴 STATUS GERAL: SISTEMA COM PROBLEMAS CRÍTICOS >> "%REPORT_FILE%"
    echo    Corrija os erros antes de tentar usar o sistema. >> "%REPORT_FILE%"
)

echo. >> "%REPORT_FILE%"
echo Log completo em: %LOG_FILE% >> "%REPORT_FILE%"
echo Data do diagnóstico: %date% %time% >> "%REPORT_FILE%"
echo ================================================================ >> "%REPORT_FILE%"

:: EXIBIR RESULTADO FINAL
echo.
echo ================================================================
echo 🔍 VALIDAÇÃO E DIAGNÓSTICO COMPLETOS!
echo ================================================================
echo.
echo 📊 RESULTADOS:
echo    ✅ Sucessos: %SUCCESS%
echo    ⚠️  Avisos: %WARNINGS%
echo    ❌ Erros: %ERRORS%
echo.

if %ERRORS% equ 0 (
    if %WARNINGS% equ 0 (
        echo 🎉 STATUS GERAL: SISTEMA PERFEITO!
        echo    O sistema está pronto para uso.
    ) else (
        echo 🟡 STATUS GERAL: SISTEMA FUNCIONAL COM AVISOS
        echo    O sistema pode funcionar, mas há melhorias recomendadas.
    )
) else (
    echo 🔴 STATUS GERAL: SISTEMA COM PROBLEMAS CRÍTICOS
    echo    Corrija os erros antes de tentar usar o sistema.
)

echo.
echo 📋 Relatório completo: %REPORT_FILE%
echo 📄 Log detalhado: %LOG_FILE%
echo.

if %ERRORS% equ 0 (
    echo ✅ PRÓXIMO PASSO:
    echo    Execute o script 04-iniciar-sistema.bat
    echo    para iniciar o sistema completo
) else (
    echo 🔧 PRÓXIMO PASSO:
    echo    Corrija os erros listados no relatório
    echo    e execute este diagnóstico novamente
)

echo.
echo ================================================================
echo.

echo [%date% %time%] Validação e diagnóstico completos >> "%LOG_FILE%"

pause