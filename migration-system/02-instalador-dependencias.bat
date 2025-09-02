@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🛠️  SISTEMA DE MIGRAÇÃO - INSTALADOR DE DEPENDÊNCIAS
echo ================================================================
echo.
echo Este script vai instalar TODAS as dependências necessárias:
echo ✅ Node.js (versão LTS mais recente)
echo ✅ Python 3.12 (com pip)
echo ✅ Git (controle de versão)
echo ✅ Visual C++ Build Tools
echo ✅ Chocolatey (gerenciador de pacotes)
echo.

set "LOG_DIR=C:\Sistema-Laudos-Instalacao"
set "LOG_FILE=%LOG_DIR%\instalacao-dependencias-%date:~-4%-%date:~3,2%-%date:~0,2%.log"

:: Criar diretório de logs
mkdir "%LOG_DIR%" 2>nul

echo 📋 Log será salvo em: %LOG_FILE%
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

echo [%date% %time%] Iniciando instalação de dependências >> "%LOG_FILE%"
echo ⚡ Iniciando instalação de dependências...
echo.

:: 1. INSTALAR CHOCOLATEY
echo 🍫 1/6 - Instalando Chocolatey (gerenciador de pacotes)...
echo [%date% %time%] Instalando Chocolatey >> "%LOG_FILE%"

powershell -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command ^
    "[System.Net.ServicePointManager]::SecurityProtocol = 3072; ^
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" ^
    2>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Chocolatey instalado com sucesso!
    echo [%date% %time%] Chocolatey instalado com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao instalar Chocolatey
    echo [%date% %time%] ERRO ao instalar Chocolatey >> "%LOG_FILE%"
)

:: Atualizar PATH para Chocolatey
call refreshenv >nul 2>nul

:: 2. INSTALAR NODE.JS
echo 📗 2/6 - Instalando Node.js LTS...
echo [%date% %time%] Instalando Node.js >> "%LOG_FILE%"

choco install nodejs -y --force 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Node.js instalado com sucesso!
    echo [%date% %time%] Node.js instalado com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao instalar Node.js
    echo [%date% %time%] ERRO ao instalar Node.js >> "%LOG_FILE%"
)

:: 3. INSTALAR PYTHON
echo 🐍 3/6 - Instalando Python 3.12...
echo [%date% %time%] Instalando Python >> "%LOG_FILE%"

choco install python312 -y --force 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Python instalado com sucesso!
    echo [%date% %time%] Python instalado com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao instalar Python
    echo [%date% %time%] ERRO ao instalar Python >> "%LOG_FILE%"
)

:: 4. INSTALAR GIT
echo 🌿 4/6 - Instalando Git...
echo [%date% %time%] Instalando Git >> "%LOG_FILE%"

choco install git -y --force 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Git instalado com sucesso!
    echo [%date% %time%] Git instalado com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao instalar Git
    echo [%date% %time%] ERRO ao instalar Git >> "%LOG_FILE%"
)

:: 5. INSTALAR VISUAL C++ BUILD TOOLS
echo 🔧 5/6 - Instalando Visual C++ Build Tools...
echo [%date% %time%] Instalando Visual C++ Build Tools >> "%LOG_FILE%"

choco install visualstudio2022buildtools -y --force --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools" 2>>"%LOG_FILE%" 1>>"%LOG_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Visual C++ Build Tools instalado com sucesso!
    echo [%date% %time%] Visual C++ Build Tools instalado com sucesso >> "%LOG_FILE%"
) else (
    echo ❌ Erro ao instalar Visual C++ Build Tools
    echo [%date% %time%] ERRO ao instalar Visual C++ Build Tools >> "%LOG_FILE%"
)

:: 6. VALIDAR INSTALAÇÕES
echo ✅ 6/6 - Validando instalações...
echo [%date% %time%] Validando instalações >> "%LOG_FILE%"
echo.

:: Atualizar PATH
call refreshenv >nul 2>nul

echo 🔍 Verificando versões instaladas:
echo.

:: Verificar Node.js
node --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do (
        echo ✅ Node.js: %%i
        echo [%date% %time%] Node.js: %%i >> "%LOG_FILE%"
    )
) else (
    echo ❌ Node.js não encontrado no PATH
    echo [%date% %time%] ERRO: Node.js não encontrado no PATH >> "%LOG_FILE%"
)

:: Verificar npm
npm --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do (
        echo ✅ npm: %%i
        echo [%date% %time%] npm: %%i >> "%LOG_FILE%"
    )
) else (
    echo ❌ npm não encontrado no PATH
    echo [%date% %time%] ERRO: npm não encontrado no PATH >> "%LOG_FILE%"
)

:: Verificar Python
python --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version 2^>nul') do (
        echo ✅ Python: %%i
        echo [%date% %time%] Python: %%i >> "%LOG_FILE%"
    )
) else (
    echo ❌ Python não encontrado no PATH
    echo [%date% %time%] ERRO: Python não encontrado no PATH >> "%LOG_FILE%"
)

:: Verificar pip
pip --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pip --version 2^>nul') do (
        echo ✅ pip: %%i
        echo [%date% %time%] pip: %%i >> "%LOG_FILE%"
    )
) else (
    echo ❌ pip não encontrado no PATH
    echo [%date% %time%] ERRO: pip não encontrado no PATH >> "%LOG_FILE%"
)

:: Verificar Git
git --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version 2^>nul') do (
        echo ✅ Git: %%i
        echo [%date% %time%] Git: %%i >> "%LOG_FILE%"
    )
) else (
    echo ❌ Git não encontrado no PATH
    echo [%date% %time%] ERRO: Git não encontrado no PATH >> "%LOG_FILE%"
)

echo.
echo ================================================================
echo 🎉 INSTALAÇÃO DE DEPENDÊNCIAS FINALIZADA!
echo ================================================================
echo.
echo 📋 Log completo salvo em: %LOG_FILE%
echo.
echo ⚠️  IMPORTANTE: Reinicie o computador antes de continuar
echo    para garantir que todas as variáveis de ambiente 
echo    sejam atualizadas corretamente.
echo.
echo ✅ PRÓXIMO PASSO APÓS REINICIAR:
echo    Execute o script 03-instalar-sistema-completo.bat
echo    com o arquivo de exportação do sistema anterior
echo.
echo ================================================================
echo.

echo [%date% %time%] Instalação de dependências finalizada >> "%LOG_FILE%"

pause