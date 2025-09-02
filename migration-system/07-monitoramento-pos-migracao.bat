@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 📊 SISTEMA DE MIGRAÇÃO - MONITORAMENTO PÓS-MIGRAÇÃO
echo ================================================================
echo.
echo Este script vai monitorar o sistema em tempo real:
echo ✅ Verificar status dos serviços continuamente
echo ✅ Monitorar uso de recursos (CPU, RAM, Disco)
echo ✅ Testar conectividade HTTP/HTTPS
echo ✅ Verificar integridade do banco de dados
echo ✅ Monitorar logs de erro
echo ✅ Alertar sobre problemas automaticamente
echo ✅ Gerar relatório de saúde do sistema
echo.

set "INSTALL_DIR=C:\Sistema-Laudos"
set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\monitoramento-%date:~-4%-%date:~3,2%-%date:~0,2%.log"
set "STATUS_FILE=%LOG_DIR%\status-sistema.txt"

:: Criar diretório de logs
mkdir "%LOG_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
echo 📊 Status em tempo real: %STATUS_FILE%
echo.

echo [%date% %time%] Iniciando monitoramento pós-migração >> "%LOG_FILE%"
echo ⏳ Iniciando monitoramento contínuo...
echo.
echo ⚠️  Pressione Ctrl+C a qualquer momento para parar o monitoramento
echo.

:: Contadores
set "CYCLES=0"
set "ERRORS_DETECTED=0"
set "WARNINGS_DETECTED=0"

:MONITORING_LOOP

set /a CYCLES+=1
echo ================================================================
echo 🔄 CICLO DE MONITORAMENTO #%CYCLES% - %time%
echo ================================================================

:: Inicializar status do ciclo
set "CYCLE_STATUS=OK"
set "CYCLE_ISSUES="

:: 1. VERIFICAR SERVIÇOS
echo 🔍 1/8 - Verificando serviços...
echo [%date% %time%] Ciclo #%CYCLES% - Verificando serviços >> "%LOG_FILE%"

:: Verificar Next.js (porta 3000)
netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Next.js: ATIVO (porta 3000)
    set "NEXTJS_STATUS=ATIVO"
) else (
    echo ❌ Next.js: INATIVO
    set "NEXTJS_STATUS=INATIVO"
    set "CYCLE_STATUS=ERRO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! Next.js-Inativo"
    set /a ERRORS_DETECTED+=1
)

:: Verificar Python Launcher (porta 443)
netstat -an | findstr ":443" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Python Launcher: ATIVO (porta 443)
    set "PYTHON_STATUS=ATIVO"
) else (
    echo ⚠️  Python Launcher: INATIVO
    set "PYTHON_STATUS=INATIVO"
    set "CYCLE_STATUS=AVISO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! Python-Launcher-Inativo"
    set /a WARNINGS_DETECTED+=1
)

:: 2. TESTAR CONECTIVIDADE HTTP
echo 🌐 2/8 - Testando conectividade HTTP...
echo [%date% %time%] Testando conectividade HTTP >> "%LOG_FILE%"

:: Testar localhost:3000
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ HTTP localhost:3000: RESPONDENDO
    set "HTTP_STATUS=OK"
) else (
    echo ❌ HTTP localhost:3000: NÃO RESPONDE
    set "HTTP_STATUS=FALHA"
    set "CYCLE_STATUS=ERRO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! HTTP-Nao-Responde"
    set /a ERRORS_DETECTED+=1
)

:: 3. TESTAR CONECTIVIDADE HTTPS
echo 🔒 3/8 - Testando conectividade HTTPS...
echo [%date% %time%] Testando conectividade HTTPS >> "%LOG_FILE%"

powershell -command "try { $response = Invoke-WebRequest -Uri 'https://inspetor.terpens.com.br' -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ HTTPS inspetor.terpens.com.br: RESPONDENDO
    set "HTTPS_STATUS=OK"
) else (
    echo ⚠️  HTTPS inspetor.terpens.com.br: NÃO RESPONDE
    set "HTTPS_STATUS=FALHA"
    set "CYCLE_STATUS=AVISO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! HTTPS-Nao-Responde"
    set /a WARNINGS_DETECTED+=1
)

:: 4. VERIFICAR BANCO DE DADOS
echo 💾 4/8 - Verificando banco de dados...
echo [%date% %time%] Verificando banco de dados >> "%LOG_FILE%"

if exist "%INSTALL_DIR%\prisma\dev.db" (
    :: Verificar se o arquivo não está corrompido (tamanho > 1KB)
    for %%i in ("%INSTALL_DIR%\prisma\dev.db") do (
        set "db_size=%%~zi"
        if !db_size! gtr 1024 (
            echo ✅ Banco de dados: OK (!db_size! bytes)
            set "DB_STATUS=OK"
        ) else (
            echo ⚠️  Banco de dados: MUITO PEQUENO (!db_size! bytes)
            set "DB_STATUS=PEQUENO"
            set "CYCLE_STATUS=AVISO"
            set "CYCLE_ISSUES=!CYCLE_ISSUES! BD-Pequeno"
            set /a WARNINGS_DETECTED+=1
        )
    )
) else (
    echo ❌ Banco de dados: NÃO ENCONTRADO
    set "DB_STATUS=NAO_ENCONTRADO"
    set "CYCLE_STATUS=ERRO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! BD-Nao-Encontrado"
    set /a ERRORS_DETECTED+=1
)

:: 5. MONITORAR RECURSOS DO SISTEMA
echo 💻 5/8 - Monitorando recursos...
echo [%date% %time%] Monitorando recursos >> "%LOG_FILE%"

:: CPU (aproximado via tasklist)
for /f "skip=1 tokens=*" %%i in ('wmic cpu get loadpercentage /value') do (
    for /f "tokens=2 delims==" %%j in ("%%i") do (
        set "CPU_USAGE=%%j"
        if defined CPU_USAGE goto :cpu_found
    )
)

:cpu_found
if defined CPU_USAGE (
    if %CPU_USAGE% lss 80 (
        echo ✅ CPU: %CPU_USAGE%%%
        set "CPU_STATUS=NORMAL"
    ) else (
        echo ⚠️  CPU: %CPU_USAGE%%% (ALTO)
        set "CPU_STATUS=ALTO"
        set "CYCLE_STATUS=AVISO"
        set "CYCLE_ISSUES=!CYCLE_ISSUES! CPU-Alto"
        set /a WARNINGS_DETECTED+=1
    )
) else (
    echo ⚠️  CPU: Não foi possível obter informação
    set "CPU_STATUS=DESCONHECIDO"
)

:: Memória RAM disponível
for /f "skip=1 tokens=4" %%i in ('wmic OS get TotalVisibleMemorySize^,FreePhysicalMemory /format:table') do (
    set "FREE_RAM=%%i"
    if defined FREE_RAM goto :ram_found
)

:ram_found
if defined FREE_RAM (
    set /a "FREE_RAM_MB=!FREE_RAM!/1024"
    if !FREE_RAM_MB! gtr 500 (
        echo ✅ RAM Livre: !FREE_RAM_MB! MB
        set "RAM_STATUS=SUFICIENTE"
    ) else (
        echo ⚠️  RAM Livre: !FREE_RAM_MB! MB (BAIXA)
        set "RAM_STATUS=BAIXA"
        set "CYCLE_STATUS=AVISO"
        set "CYCLE_ISSUES=!CYCLE_ISSUES! RAM-Baixa"
        set /a WARNINGS_DETECTED+=1
    )
) else (
    echo ⚠️  RAM: Não foi possível obter informação
    set "RAM_STATUS=DESCONHECIDO"
)

:: 6. VERIFICAR ESPAÇO EM DISCO
echo 💽 6/8 - Verificando espaço em disco...
echo [%date% %time%] Verificando espaço em disco >> "%LOG_FILE%"

for /f "tokens=3" %%i in ('dir C:\ ^| findstr "bytes free"') do (
    set "free_space=%%i"
    set "free_space=!free_space:,=!"
    goto :space_found
)

:space_found
set /a "free_space_gb=!free_space!/1073741824"
if %free_space_gb% gtr 2 (
    echo ✅ Espaço livre: %free_space_gb% GB
    set "DISK_STATUS=SUFICIENTE"
) else (
    echo ⚠️  Espaço livre: %free_space_gb% GB (BAIXO)
    set "DISK_STATUS=BAIXO"
    set "CYCLE_STATUS=AVISO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! Disco-Baixo"
    set /a WARNINGS_DETECTED+=1
)

:: 7. VERIFICAR LOGS DE ERRO
echo 📄 7/8 - Verificando logs de erro...
echo [%date% %time%] Verificando logs de erro >> "%LOG_FILE%"

set "ERROR_LOG_COUNT=0"

:: Verificar se existem arquivos de log do Next.js com erros
if exist "%INSTALL_DIR%\.next\*" (
    for /f %%i in ('dir /b "%INSTALL_DIR%\.next\*error*" 2^>nul ^| find /c /v ""') do set "ERROR_LOG_COUNT=%%i"
)

if %ERROR_LOG_COUNT% gtr 0 (
    echo ⚠️  Logs de erro encontrados: %ERROR_LOG_COUNT%
    set "LOGS_STATUS=ERROS_ENCONTRADOS"
    set "CYCLE_STATUS=AVISO"
    set "CYCLE_ISSUES=!CYCLE_ISSUES! Logs-Com-Erro"
    set /a WARNINGS_DETECTED+=1
) else (
    echo ✅ Logs: Nenhum erro crítico
    set "LOGS_STATUS=LIMPO"
)

:: 8. ATUALIZAR STATUS EM TEMPO REAL
echo 📊 8/8 - Atualizando status...

:: Gerar arquivo de status em tempo real
echo ================================================================ > "%STATUS_FILE%"
echo STATUS DO SISTEMA EM TEMPO REAL >> "%STATUS_FILE%"
echo ================================================================ >> "%STATUS_FILE%"
echo. >> "%STATUS_FILE%"
echo Última atualização: %date% %time% >> "%STATUS_FILE%"
echo Ciclos de monitoramento: %CYCLES% >> "%STATUS_FILE%"
echo Status geral: %CYCLE_STATUS% >> "%STATUS_FILE%"
echo. >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo SERVIÇOS >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo Next.js (porta 3000): %NEXTJS_STATUS% >> "%STATUS_FILE%"
echo Python Launcher (porta 443): %PYTHON_STATUS% >> "%STATUS_FILE%"
echo. >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo CONECTIVIDADE >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo HTTP localhost:3000: %HTTP_STATUS% >> "%STATUS_FILE%"
echo HTTPS inspetor.terpens.com.br: %HTTPS_STATUS% >> "%STATUS_FILE%"
echo. >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo RECURSOS DO SISTEMA >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo CPU: %CPU_STATUS% >> "%STATUS_FILE%"
echo RAM: %RAM_STATUS% >> "%STATUS_FILE%"
echo Disco: %DISK_STATUS% >> "%STATUS_FILE%"
echo Banco de dados: %DB_STATUS% >> "%STATUS_FILE%"
echo Logs: %LOGS_STATUS% >> "%STATUS_FILE%"
echo. >> "%STATUS_FILE%"

if not "%CYCLE_ISSUES%"=="" (
    echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
    echo PROBLEMAS DETECTADOS >> "%STATUS_FILE%"
    echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
    echo %CYCLE_ISSUES% >> "%STATUS_FILE%"
    echo. >> "%STATUS_FILE%"
)

echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo ESTATÍSTICAS >> "%STATUS_FILE%"
echo ---------------------------------------------------------------- >> "%STATUS_FILE%"
echo Total de erros detectados: %ERRORS_DETECTED% >> "%STATUS_FILE%"
echo Total de avisos detectados: %WARNINGS_DETECTED% >> "%STATUS_FILE%"
echo ================================================================ >> "%STATUS_FILE%"

:: Log do ciclo
echo [%date% %time%] Ciclo #%CYCLES% - Status: %CYCLE_STATUS% - Problemas: %CYCLE_ISSUES% >> "%LOG_FILE%"

:: Exibir resumo do ciclo
echo.
echo 📊 RESUMO DO CICLO #%CYCLES%:
echo    Status: %CYCLE_STATUS%
if not "%CYCLE_ISSUES%"=="" echo    Problemas: %CYCLE_ISSUES%
echo    Próximo ciclo em 30 segundos...
echo.

:: Aguardar 30 segundos ou permitir interrupção
echo ⏳ Aguardando próximo ciclo... (Pressione Ctrl+C para parar)
timeout /t 30 >nul

goto :MONITORING_LOOP

:: Esta linha nunca será alcançada devido ao loop, mas incluímos para completude
echo.
echo ================================================================
echo 🔚 MONITORAMENTO FINALIZADO
echo ================================================================
echo.
echo 📊 Estatísticas finais:
echo    Ciclos executados: %CYCLES%
echo    Erros detectados: %ERRORS_DETECTED%
echo    Avisos detectados: %WARNINGS_DETECTED%
echo.
echo 📋 Log completo: %LOG_FILE%
echo 📊 Último status: %STATUS_FILE%
echo.
echo [%date% %time%] Monitoramento finalizado >> "%LOG_FILE%"

pause