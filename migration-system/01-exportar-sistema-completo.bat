@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🚀 SISTEMA DE MIGRAÇÃO - EXPORTAÇÃO COMPLETA
echo ================================================================
echo.
echo Este script vai exportar TUDO do sistema atual:
echo ✅ Código fonte completo
echo ✅ Banco de dados SQLite com todos os dados
echo ✅ Arquivos de upload (fotos dos laudos)
echo ✅ Certificados SSL
echo ✅ Configurações (.env)
echo ✅ Sistema de launchers Python
echo.

set "EXPORT_DIR=C:\Sistema-Laudos-Export-%date:~-4%-%date:~3,2%-%date:~0,2%-%time:~0,2%%time:~3,2%"
set "EXPORT_DIR=!EXPORT_DIR: =0!"
set "LOG_FILE=!EXPORT_DIR!\export-log.txt"

echo 📁 Diretório de exportação: !EXPORT_DIR!
echo.

:: Criar diretório de exportação
mkdir "!EXPORT_DIR!" 2>nul
mkdir "!EXPORT_DIR!\logs" 2>nul

:: Função de log
echo [%date% %time%] Iniciando exportação completa do sistema >> "!LOG_FILE!"

echo ⏳ Iniciando exportação completa...
echo.

:: 1. VALIDAR SISTEMA ATUAL
echo 🔍 1/8 - Validando sistema atual...
echo [%date% %time%] Validando sistema atual >> "!LOG_FILE!"

:: Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ ERRO: package.json não encontrado!
    echo ❌ Certifique-se de estar no diretório raiz do sistema
    echo [%date% %time%] ERRO: package.json não encontrado >> "!LOG_FILE!"
    pause
    exit /b 1
)

if not exist "prisma\schema.prisma" (
    echo ❌ ERRO: Schema do Prisma não encontrado!
    echo [%date% %time%] ERRO: Schema do Prisma não encontrado >> "!LOG_FILE!"
    pause
    exit /b 1
)

if not exist ".env" (
    echo ❌ ERRO: Arquivo .env não encontrado!
    echo [%date% %time%] ERRO: Arquivo .env não encontrado >> "!LOG_FILE!"
    pause
    exit /b 1
)

echo ✅ Sistema validado com sucesso!
echo [%date% %time%] Sistema validado com sucesso >> "!LOG_FILE!"

:: 2. EXPORTAR CÓDIGO FONTE
echo 📦 2/8 - Exportando código fonte...
echo [%date% %time%] Exportando código fonte >> "!LOG_FILE!"

mkdir "!EXPORT_DIR!\sistema-laudos" 2>nul

:: Copiar todos os arquivos essenciais (exceto node_modules e .next)
xcopy /E /Y "app\*" "!EXPORT_DIR!\sistema-laudos\app\" >nul 2>nul
xcopy /E /Y "components\*" "!EXPORT_DIR!\sistema-laudos\components\" >nul 2>nul
xcopy /E /Y "lib\*" "!EXPORT_DIR!\sistema-laudos\lib\" >nul 2>nul
xcopy /E /Y "prisma\*" "!EXPORT_DIR!\sistema-laudos\prisma\" >nul 2>nul
xcopy /E /Y "public\*" "!EXPORT_DIR!\sistema-laudos\public\" >nul 2>nul
xcopy /E /Y "ssl\*" "!EXPORT_DIR!\sistema-laudos\ssl\" >nul 2>nul
xcopy /E /Y "launcher-production\*" "!EXPORT_DIR!\sistema-laudos\launcher-production\" >nul 2>nul

:: Arquivos raiz importantes
copy "package.json" "!EXPORT_DIR!\sistema-laudos\" >nul 2>nul
copy ".env" "!EXPORT_DIR!\sistema-laudos\" >nul 2>nul
copy "next.config.js" "!EXPORT_DIR!\sistema-laudos\" >nul 2>nul
copy "tailwind.config.js" "!EXPORT_DIR!\sistema-laudos\" >nul 2>nul
copy "postcss.config.js" "!EXPORT_DIR!\sistema-laudos\" >nul 2>nul
copy "tsconfig.json" "!EXPORT_DIR!\sistema-laudos\" >nul 2>nul

echo ✅ Código fonte exportado!
echo [%date% %time%] Código fonte exportado com sucesso >> "!LOG_FILE!"

:: 3. BACKUP BANCO DE DADOS
echo 💾 3/8 - Fazendo backup do banco de dados SQLite...
echo [%date% %time%] Fazendo backup do banco de dados >> "!LOG_FILE!"

if exist "prisma\dev.db" (
    copy "prisma\dev.db" "!EXPORT_DIR!\sistema-laudos\prisma\dev.db" >nul
    copy "prisma\dev.db" "!EXPORT_DIR!\backup-banco-dados.db" >nul
    echo ✅ Banco de dados SQLite copiado!
    echo [%date% %time%] Banco de dados SQLite copiado >> "!LOG_FILE!"
) else (
    echo ⚠️  Banco de dados não encontrado em prisma\dev.db
    echo [%date% %time%] Banco de dados não encontrado >> "!LOG_FILE!"
)

:: 4. BACKUP UPLOADS
echo 📸 4/8 - Fazendo backup dos uploads...
echo [%date% %time%] Fazendo backup dos uploads >> "!LOG_FILE!"

if exist "public\uploads" (
    xcopy /E /Y "public\uploads\*" "!EXPORT_DIR!\sistema-laudos\public\uploads\" >nul 2>nul
    xcopy /E /Y "public\uploads\*" "!EXPORT_DIR!\backup-uploads\" >nul 2>nul
    
    :: Contar arquivos de upload
    set "upload_count=0"
    for /f %%i in ('dir /b /s "public\uploads\*.*" 2^>nul ^| find /c /v ""') do set "upload_count=%%i"
    echo ✅ !upload_count! arquivos de upload copiados!
    echo [%date% %time%] !upload_count! arquivos de upload copiados >> "!LOG_FILE!"
) else (
    echo ⚠️  Diretório de uploads não encontrado
    echo [%date% %time%] Diretório de uploads não encontrado >> "!LOG_FILE!"
)

:: 5. BACKUP CERTIFICADOS SSL
echo 🔒 5/8 - Fazendo backup dos certificados SSL...
echo [%date% %time%] Fazendo backup dos certificados SSL >> "!LOG_FILE!"

if exist "ssl" (
    xcopy /E /Y "ssl\*" "!EXPORT_DIR!\backup-ssl\" >nul 2>nul
    echo ✅ Certificados SSL copiados!
    echo [%date% %time%] Certificados SSL copiados >> "!LOG_FILE!"
) else (
    echo ⚠️  Diretório SSL não encontrado
    echo [%date% %time%] Diretório SSL não encontrado >> "!LOG_FILE!"
)

:: 6. CRIAR INFORMAÇÕES DO SISTEMA
echo 📋 6/8 - Gerando informações do sistema...
echo [%date% %time%] Gerando informações do sistema >> "!LOG_FILE!"

set "INFO_FILE=!EXPORT_DIR!\INFORMACOES-SISTEMA.txt"

echo ================================================================ > "!INFO_FILE!"
echo INFORMAÇÕES DO SISTEMA EXPORTADO >> "!INFO_FILE!"
echo ================================================================ >> "!INFO_FILE!"
echo. >> "!INFO_FILE!"
echo Data da Exportação: %date% %time% >> "!INFO_FILE!"
echo Computador Original: %COMPUTERNAME% >> "!INFO_FILE!"
echo Usuário: %USERNAME% >> "!INFO_FILE!"
echo Sistema: %OS% >> "!INFO_FILE!"
echo. >> "!INFO_FILE!"
echo ---------------------------------------------------------------- >> "!INFO_FILE!"
echo COMPONENTES DO SISTEMA >> "!INFO_FILE!"
echo ---------------------------------------------------------------- >> "!INFO_FILE!"
echo. >> "!INFO_FILE!"
echo ✅ Next.js 15.3.3 (Framework principal) >> "!INFO_FILE!"
echo ✅ Prisma ORM com SQLite (Banco de dados) >> "!INFO_FILE!"
echo ✅ Sistema de usuários (admin, client_a, client_b) >> "!INFO_FILE!"
echo ✅ Sistema de laudos (9 tabelas complexas) >> "!INFO_FILE!"
echo ✅ Upload de arquivos (fotos dos laudos) >> "!INFO_FILE!"
echo ✅ Certificados SSL (inspetor.terpens.com.br) >> "!INFO_FILE!"
echo ✅ Sistema de proxy HTTPS (Python) >> "!INFO_FILE!"
echo ✅ Geração de PDFs (Puppeteer) >> "!INFO_FILE!"
echo. >> "!INFO_FILE!"
echo ---------------------------------------------------------------- >> "!INFO_FILE!"
echo DEPENDÊNCIAS PRINCIPAIS >> "!INFO_FILE!"
echo ---------------------------------------------------------------- >> "!INFO_FILE!"

:: Listar dependências do package.json
if exist "package.json" (
    echo. >> "!INFO_FILE!"
    echo DEPENDENCIES: >> "!INFO_FILE!"
    type "package.json" | findstr /C:"dependencies" -A 50 >> "!INFO_FILE!"
)

echo ✅ Informações do sistema geradas!

:: 7. GERAR HASH/CHECKSUM
echo 🔐 7/8 - Gerando checksums para validação...
echo [%date% %time%] Gerando checksums >> "!LOG_FILE!"

set "CHECKSUM_FILE=!EXPORT_DIR!\CHECKSUMS.txt"
echo ================================================================ > "!CHECKSUM_FILE!"
echo CHECKSUMS DOS ARQUIVOS CRÍTICOS >> "!CHECKSUM_FILE!"
echo ================================================================ >> "!CHECKSUM_FILE!"
echo Data: %date% %time% >> "!CHECKSUM_FILE!"
echo. >> "!CHECKSUM_FILE!"

:: Gerar hash dos arquivos críticos
for %%f in ("!EXPORT_DIR!\sistema-laudos\package.json" "!EXPORT_DIR!\sistema-laudos\.env" "!EXPORT_DIR!\backup-banco-dados.db") do (
    if exist "%%f" (
        for /f "skip=1 tokens=*" %%i in ('certutil -hashfile "%%f" SHA256') do (
            set "hash=%%i"
            if "!hash:~-1!" NEQ "." (
                echo %%~nxf: !hash! >> "!CHECKSUM_FILE!"
                goto :next_file
            )
        )
        :next_file
    )
)

echo ✅ Checksums gerados!

:: 8. COMPACTAR TUDO
echo 📦 8/8 - Compactando exportação...
echo [%date% %time%] Compactando exportação >> "!LOG_FILE!"

set "ZIP_FILE=Sistema-Laudos-Export-Completo-%date:~-4%-%date:~3,2%-%date:~0,2%.zip"
set "ZIP_FILE=!ZIP_FILE: =0!"

:: Usar PowerShell para compactar
powershell -command "Compress-Archive -Path '!EXPORT_DIR!\*' -DestinationPath '!ZIP_FILE!' -Force" 2>nul

if exist "!ZIP_FILE!" (
    echo ✅ Arquivo compactado criado: !ZIP_FILE!
    echo [%date% %time%] Arquivo compactado criado: !ZIP_FILE! >> "!LOG_FILE!"
) else (
    echo ⚠️  Não foi possível compactar automaticamente
    echo ✅ Arquivos disponíveis em: !EXPORT_DIR!
    echo [%date% %time%] Compactação falhou, arquivos em: !EXPORT_DIR! >> "!LOG_FILE!"
)

:: RELATÓRIO FINAL
echo.
echo ================================================================
echo 🎉 EXPORTAÇÃO COMPLETA FINALIZADA!
echo ================================================================
echo.
echo 📁 Local dos arquivos: !EXPORT_DIR!
if exist "!ZIP_FILE!" echo 📦 Arquivo compactado: !ZIP_FILE!
echo 📋 Log detalhado: !LOG_FILE!
echo.
echo ✅ PRÓXIMO PASSO: 
echo    Execute o script 02-instalador-dependencias.bat
echo    no computador de destino ANTES de instalar o sistema
echo.
echo ================================================================
echo.

echo [%date% %time%] Exportação completa finalizada com sucesso >> "!LOG_FILE!"

pause