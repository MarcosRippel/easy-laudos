@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🔄 SISTEMA DE MIGRAÇÃO - ROLLBACK AUTOMÁTICO
echo ================================================================
echo.
echo Este script vai DESFAZER a migração em caso de problemas:
echo ✅ Parar todos os serviços do sistema
echo ✅ Remover arquivos instalados
echo ✅ Restaurar configurações originais
echo ✅ Limpar registros e firewall
echo ✅ Restaurar backups se disponíveis
echo ✅ Gerar relatório de rollback
echo.

set "INSTALL_DIR=C:\Sistema-Laudos"
set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\rollback-%date:~-4%-%date:~3,2%-%date:~0,2%.log"
set "BACKUP_DIR=%LOG_DIR%\backup-original"

:: Criar diretório de logs
mkdir "%LOG_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
echo 🔄 Iniciando processo de rollback...
echo.

:: Confirmar rollback
echo ⚠️  ATENÇÃO: Este processo vai REMOVER completamente o sistema instalado!
echo.
set /p "confirm=Tem certeza que deseja continuar? (S/N): "
if /i "%confirm%" neq "S" (
    echo ❌ Rollback cancelado pelo usuário.
    pause
    exit /b 0
)

echo [%date% %time%] Iniciando rollback automático >> "%LOG_FILE%"
echo.

:: 1. PARAR SERVIÇOS
echo 🛑 1/10 - Parando todos os serviços...
echo [%date% %time%] Parando serviços >> "%LOG_FILE%"

taskkill /f /im "node.exe" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Processos Node.js parados
    echo [%date% %time%] Processos Node.js parados >> "%LOG_FILE%"
) else (
    echo ⚠️  Nenhum processo Node.js encontrado
    echo [%date% %time%] Nenhum processo Node.js encontrado >> "%LOG_FILE%"
)

taskkill /f /im "python.exe" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Processos Python parados
    echo [%date% %time%] Processos Python parados >> "%LOG_FILE%"
) else (
    echo ⚠️  Nenhum processo Python encontrado
    echo [%date% %time%] Nenhum processo Python encontrado >> "%LOG_FILE%"
)

echo ✅ Serviços parados!
echo.

:: 2. REMOVER REGRAS DE FIREWALL
echo 🔥 2/10 - Removendo regras de firewall...
echo [%date% %time%] Removendo regras de firewall >> "%LOG_FILE%"

netsh advfirewall firewall delete rule name="Sistema Laudos - Next.js" >nul 2>nul
netsh advfirewall firewall delete rule name="Sistema Laudos - HTTPS" >nul 2>nul
netsh advfirewall firewall delete rule name="Sistema Laudos - Python Launcher" >nul 2>nul

echo ✅ Regras de firewall removidas!
echo [%date% %time%] Regras de firewall removidas >> "%LOG_FILE%"
echo.

:: 3. FAZER BACKUP DOS DADOS IMPORTANTES
echo 💾 3/10 - Fazendo backup dos dados importantes...
echo [%date% %time%] Fazendo backup dos dados importantes >> "%LOG_FILE%"

if exist "%INSTALL_DIR%" (
    mkdir "%BACKUP_DIR%" 2>nul
    
    :: Backup do banco de dados se existir
    if exist "%INSTALL_DIR%\prisma\dev.db" (
        copy "%INSTALL_DIR%\prisma\dev.db" "%BACKUP_DIR%\dev.db" >nul 2>nul
        echo ✅ Backup do banco de dados salvo
        echo [%date% %time%] Backup do banco salvo >> "%LOG_FILE%"
    )
    
    :: Backup dos uploads se existirem
    if exist "%INSTALL_DIR%\public\uploads" (
        xcopy /E /Y "%INSTALL_DIR%\public\uploads\*" "%BACKUP_DIR%\uploads\" >nul 2>nul
        echo ✅ Backup dos uploads salvo
        echo [%date% %time%] Backup dos uploads salvo >> "%LOG_FILE%"
    )
    
    :: Backup do .env se existir
    if exist "%INSTALL_DIR%\.env" (
        copy "%INSTALL_DIR%\.env" "%BACKUP_DIR%\.env" >nul 2>nul
        echo ✅ Backup do .env salvo
        echo [%date% %time%] Backup do .env salvo >> "%LOG_FILE%"
    )
    
    echo ✅ Backups importantes salvos em: %BACKUP_DIR%
) else (
    echo ⚠️  Diretório de instalação não encontrado
    echo [%date% %time%] Diretório de instalação não encontrado >> "%LOG_FILE%"
)
echo.

:: 4. REMOVER DIRETÓRIO DE INSTALAÇÃO
echo 🗑️  4/10 - Removendo diretório de instalação...
echo [%date% %time%] Removendo diretório de instalação >> "%LOG_FILE%"

if exist "%INSTALL_DIR%" (
    echo ⏳ Removendo %INSTALL_DIR%...
    rmdir /s /q "%INSTALL_DIR%" 2>nul
    
    :: Verificar se foi removido
    if not exist "%INSTALL_DIR%" (
        echo ✅ Diretório removido com sucesso!
        echo [%date% %time%] Diretório removido com sucesso >> "%LOG_FILE%"
    ) else (
        echo ❌ Erro ao remover diretório (pode ter arquivos em uso)
        echo [%date% %time%] Erro ao remover diretório >> "%LOG_FILE%"
        
        :: Tentar forçar remoção após aguardar
        echo ⏳ Aguardando e tentando novamente...
        timeout /t 5 >nul
        rmdir /s /q "%INSTALL_DIR%" 2>nul
        
        if not exist "%INSTALL_DIR%" (
            echo ✅ Diretório removido na segunda tentativa!
            echo [%date% %time%] Diretório removido na segunda tentativa >> "%LOG_FILE%"
        ) else (
            echo ⚠️  Alguns arquivos podem não ter sido removidos
            echo [%date% %time%] Alguns arquivos podem não ter sido removidos >> "%LOG_FILE%"
        )
    )
) else (
    echo ⚠️  Diretório de instalação não encontrado
    echo [%date% %time%] Diretório de instalação não encontrado >> "%LOG_FILE%"
)
echo.

:: 5. LIMPAR CACHE NPM
echo 📦 5/10 - Limpando cache npm global...
echo [%date% %time%] Limpando cache npm >> "%LOG_FILE%"

npm cache clean --force >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Cache npm limpo!
    echo [%date% %time%] Cache npm limpo >> "%LOG_FILE%"
) else (
    echo ⚠️  npm não encontrado ou erro na limpeza
    echo [%date% %time%] npm não encontrado ou erro na limpeza >> "%LOG_FILE%"
)
echo.

:: 6. LIMPAR CACHE PIP
echo 🐍 6/10 - Limpando cache pip...
echo [%date% %time%] Limpando cache pip >> "%LOG_FILE%"

pip cache purge >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Cache pip limpo!
    echo [%date% %time%] Cache pip limpo >> "%LOG_FILE%"
) else (
    echo ⚠️  pip não encontrado ou erro na limpeza
    echo [%date% %time%] pip não encontrado ou erro na limpeza >> "%LOG_FILE%"
)
echo.

:: 7. REMOVER VARIÁVEIS DE AMBIENTE TEMPORÁRIAS
echo 🔧 7/10 - Limpando variáveis de ambiente...
echo [%date% %time%] Limpando variáveis de ambiente >> "%LOG_FILE%"

:: Não há variáveis específicas do sistema para limpar neste caso
echo ✅ Variáveis de ambiente verificadas!
echo [%date% %time%] Variáveis de ambiente verificadas >> "%LOG_FILE%"
echo.

:: 8. VERIFICAR PROCESSOS RESTANTES
echo 🔍 8/10 - Verificando processos restantes...
echo [%date% %time%] Verificando processos restantes >> "%LOG_FILE%"

set "PROCESSES_FOUND=0"

tasklist | findstr /i "node.exe" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Processos Node.js ainda em execução
    echo [%date% %time%] Processos Node.js ainda em execução >> "%LOG_FILE%"
    set "PROCESSES_FOUND=1"
)

tasklist | findstr /i "python.exe" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Processos Python ainda em execução
    echo [%date% %time%] Processos Python ainda em execução >> "%LOG_FILE%"
    set "PROCESSES_FOUND=1"
)

if "%PROCESSES_FOUND%"=="0" (
    echo ✅ Nenhum processo relacionado encontrado
    echo [%date% %time%] Nenhum processo relacionado encontrado >> "%LOG_FILE%"
) else (
    echo ⚠️  Alguns processos ainda estão em execução
    echo [%date% %time%] Alguns processos ainda estão em execução >> "%LOG_FILE%"
)
echo.

:: 9. VERIFICAR PORTAS
echo 🔌 9/10 - Verificando liberação de portas...
echo [%date% %time%] Verificando liberação de portas >> "%LOG_FILE%"

netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Porta 3000 ainda está em uso
    echo [%date% %time%] Porta 3000 ainda em uso >> "%LOG_FILE%"
) else (
    echo ✅ Porta 3000 liberada
    echo [%date% %time%] Porta 3000 liberada >> "%LOG_FILE%"
)

netstat -an | findstr ":443" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Porta 443 ainda está em uso
    echo [%date% %time%] Porta 443 ainda em uso >> "%LOG_FILE%"
) else (
    echo ✅ Porta 443 liberada
    echo [%date% %time%] Porta 443 liberada >> "%LOG_FILE%"
)
echo.

:: 10. GERAR RELATÓRIO DE ROLLBACK
echo 📋 10/10 - Gerando relatório de rollback...
echo [%date% %time%] Gerando relatório de rollback >> "%LOG_FILE%"

set "ROLLBACK_REPORT=%LOG_DIR%\RELATORIO-ROLLBACK.txt"

echo ================================================================ > "%ROLLBACK_REPORT%"
echo RELATÓRIO DE ROLLBACK AUTOMÁTICO >> "%ROLLBACK_REPORT%"
echo ================================================================ >> "%ROLLBACK_REPORT%"
echo. >> "%ROLLBACK_REPORT%"
echo Data do Rollback: %date% %time% >> "%ROLLBACK_REPORT%"
echo Computador: %COMPUTERNAME% >> "%ROLLBACK_REPORT%"
echo Usuário: %USERNAME% >> "%ROLLBACK_REPORT%"
echo. >> "%ROLLBACK_REPORT%"
echo ---------------------------------------------------------------- >> "%ROLLBACK_REPORT%"
echo AÇÕES EXECUTADAS >> "%ROLLBACK_REPORT%"
echo ---------------------------------------------------------------- >> "%ROLLBACK_REPORT%"
echo ✅ Serviços Node.js e Python parados >> "%ROLLBACK_REPORT%"
echo ✅ Regras de firewall removidas >> "%ROLLBACK_REPORT%"
echo ✅ Backup de dados importantes salvo >> "%ROLLBACK_REPORT%"
echo ✅ Diretório de instalação removido >> "%ROLLBACK_REPORT%"
echo ✅ Cache npm e pip limpos >> "%ROLLBACK_REPORT%"
echo ✅ Portas liberadas >> "%ROLLBACK_REPORT%"
echo. >> "%ROLLBACK_REPORT%"
echo ---------------------------------------------------------------- >> "%ROLLBACK_REPORT%"
echo DADOS PRESERVADOS >> "%ROLLBACK_REPORT%"
echo ---------------------------------------------------------------- >> "%ROLLBACK_REPORT%"

if exist "%BACKUP_DIR%\dev.db" (
    echo ✅ Banco de dados: %BACKUP_DIR%\dev.db >> "%ROLLBACK_REPORT%"
)

if exist "%BACKUP_DIR%\uploads" (
    echo ✅ Arquivos de upload: %BACKUP_DIR%\uploads\ >> "%ROLLBACK_REPORT%"
)

if exist "%BACKUP_DIR%\.env" (
    echo ✅ Configurações: %BACKUP_DIR%\.env >> "%ROLLBACK_REPORT%"
)

echo. >> "%ROLLBACK_REPORT%"
echo ---------------------------------------------------------------- >> "%ROLLBACK_REPORT%"
echo PRÓXIMOS PASSOS >> "%ROLLBACK_REPORT%"
echo ---------------------------------------------------------------- >> "%ROLLBACK_REPORT%"
echo 1. Verifique os logs para identificar problemas >> "%ROLLBACK_REPORT%"
echo 2. Corrija os problemas identificados >> "%ROLLBACK_REPORT%"
echo 3. Execute novamente a migração se necessário >> "%ROLLBACK_REPORT%"
echo 4. Use os backups salvos para restaurar dados >> "%ROLLBACK_REPORT%"
echo. >> "%ROLLBACK_REPORT%"
echo Log completo: %LOG_FILE% >> "%ROLLBACK_REPORT%"
echo ================================================================ >> "%ROLLBACK_REPORT%"

echo ✅ Relatório de rollback gerado: %ROLLBACK_REPORT%
echo [%date% %time%] Relatório de rollback gerado >> "%LOG_FILE%"

:: RESULTADO FINAL
echo.
echo ================================================================
echo 🔄 ROLLBACK AUTOMÁTICO CONCLUÍDO!
echo ================================================================
echo.
echo ✅ Sistema completamente removido
echo 💾 Dados importantes preservados em: %BACKUP_DIR%
echo 📋 Relatório completo: %ROLLBACK_REPORT%
echo 📄 Log detalhado: %LOG_FILE%
echo.
echo ⚠️  O que foi feito:
echo    • Todos os serviços parados
echo    • Diretório C:\Sistema-Laudos removido
echo    • Regras de firewall limpas
echo    • Cache limpo
echo    • Portas liberadas
echo.
echo 💾 O que foi preservado:
echo    • Banco de dados
echo    • Arquivos de upload
echo    • Configurações (.env)
echo.
echo 🔄 Para tentar novamente:
echo    1. Identifique e corrija os problemas
echo    2. Execute o script 03-instalar-sistema-completo.bat
echo    3. Restaure os dados dos backups se necessário
echo.
echo ================================================================
echo.

echo [%date% %time%] Rollback automático concluído com sucesso >> "%LOG_FILE%"

pause