@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo 🚀 SISTEMA DE MIGRAÇÃO COMPLETA - MENU PRINCIPAL
echo ================================================================
echo.
echo Este é o SISTEMA COMPLETO DE MIGRAÇÃO para o Sistema de Laudos
echo Desenvolvido para migrar TUDO de um PC para outro com segurança
echo.
echo 🎯 O QUE ESTE SISTEMA FAZ:
echo    ✅ Exporta sistema completo (código, banco, uploads, SSL)
echo    ✅ Instala automaticamente no novo computador
echo    ✅ Configura tudo automaticamente (IP, rede, firewall)
echo    ✅ Valida instalação com diagnóstico completo
echo    ✅ Monitora sistema em tempo real
echo    ✅ Oferece rollback automático se algo falhar
echo.
echo ================================================================
echo.

:MAIN_MENU
echo 🎛️  MENU PRINCIPAL - ESCOLHA UMA OPÇÃO:
echo.
echo 📦 EXPORTAÇÃO (Execute no computador ATUAL):
echo    1️⃣  - Exportar sistema completo
echo.
echo 🏗️  INSTALAÇÃO (Execute no computador NOVO):
echo    2️⃣  - Instalar dependências (Node.js, Python, Git)
echo    3️⃣  - Instalar sistema completo
echo    4️⃣  - Iniciar sistema
echo.
echo 🔍 VALIDAÇÃO E MONITORAMENTO:
echo    5️⃣  - Validar e diagnosticar sistema
echo    6️⃣  - Monitorar sistema em tempo real
echo.
echo 🌐 CONFIGURAÇÃO ESPECIAL:
echo    7️⃣  - Configurar domínio único para VM
echo.
echo 🚨 EMERGÊNCIA:
echo    8️⃣  - Rollback (desfazer migração)
echo.
echo 📖 DOCUMENTAÇÃO:
echo    9️⃣  - Abrir documentação completa
echo    🔟 - Mostrar checklist de migração
echo.
echo 0️⃣  - Sair
echo.
echo ================================================================

set /p "choice=Digite o número da opção desejada: "

if "%choice%"=="1" goto EXPORT_SYSTEM
if "%choice%"=="2" goto INSTALL_DEPENDENCIES
if "%choice%"=="3" goto INSTALL_SYSTEM
if "%choice%"=="4" goto START_SYSTEM
if "%choice%"=="5" goto VALIDATE_SYSTEM
if "%choice%"=="6" goto MONITOR_SYSTEM
if "%choice%"=="7" goto ROLLBACK_SYSTEM
if "%choice%"=="8" goto SHOW_DOCUMENTATION
if "%choice%"=="9" goto SHOW_CHECKLIST
if "%choice%"=="0" goto EXIT

echo.
echo ❌ Opção inválida! Tente novamente.
echo.
pause
goto MAIN_MENU

:EXPORT_SYSTEM
echo.
echo ================================================================
echo 📦 EXPORTAR SISTEMA COMPLETO
echo ================================================================
echo.
echo ⚠️  IMPORTANTE: Execute esta opção no COMPUTADOR ATUAL
echo    (onde o sistema está funcionando atualmente)
echo.
echo O que será exportado:
echo    ✅ Código fonte completo
echo    ✅ Banco de dados SQLite com todos os dados
echo    ✅ Arquivos de upload (fotos dos laudos)
echo    ✅ Certificados SSL
echo    ✅ Configurações (.env)
echo    ✅ Sistema de launchers Python
echo.
set /p "confirm=Confirma a exportação? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 🚀 Iniciando exportação...
call "01-exportar-sistema-completo.bat"
echo.
echo ✅ Exportação concluída!
echo.
echo 📋 PRÓXIMO PASSO:
echo    1. Transfira o arquivo ZIP gerado para o novo computador
echo    2. Execute esta mesma ferramenta no novo computador
echo    3. Escolha a opção 2 (Instalar dependências)
echo.
pause
goto MAIN_MENU

:INSTALL_DEPENDENCIES
echo.
echo ================================================================
echo 🛠️  INSTALAR DEPENDÊNCIAS
echo ================================================================
echo.
echo ⚠️  IMPORTANTE: Execute esta opção no COMPUTADOR NOVO
echo    (onde você quer instalar o sistema)
echo.
echo O que será instalado:
echo    ✅ Node.js (versão LTS)
echo    ✅ Python 3.12 (com pip)
echo    ✅ Git (controle de versão)
echo    ✅ Visual C++ Build Tools
echo    ✅ Chocolatey (gerenciador de pacotes)
echo.
echo ⚠️  Este processo requer privilégios de ADMINISTRADOR!
echo.
set /p "confirm=Confirma a instalação de dependências? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 🚀 Iniciando instalação de dependências...
call "02-instalador-dependencias.bat"
echo.
echo ✅ Dependências instaladas!
echo.
echo 📋 PRÓXIMO PASSO:
echo    1. REINICIE O COMPUTADOR (obrigatório!)
echo    2. Coloque o arquivo ZIP exportado no mesmo diretório
echo    3. Execute novamente e escolha opção 3 (Instalar sistema)
echo.
pause
goto MAIN_MENU

:INSTALL_SYSTEM
echo.
echo ================================================================
echo 🏗️  INSTALAR SISTEMA COMPLETO
echo ================================================================
echo.
echo ⚠️  IMPORTANTE: 
echo    • Certifique-se de ter reiniciado após instalar dependências
echo    • Coloque o arquivo ZIP exportado neste diretório
echo.
echo O que será feito:
echo    ✅ Detectar arquivo ZIP automaticamente
echo    ✅ Instalar em C:\Sistema-Laudos
echo    ✅ Configurar banco de dados
echo    ✅ Instalar pacotes Node.js e Python
echo    ✅ Detectar IP automaticamente
echo    ✅ Configurar firewall
echo    ✅ Validar instalação
echo.

:: Verificar se existe arquivo ZIP
set "zip_found=0"
for %%f in (Sistema-Laudos-Export-Completo-*.zip) do (
    set "zip_found=1"
    set "zip_file=%%f"
    goto :zip_check_done
)

:zip_check_done
if "%zip_found%"=="0" (
    echo ❌ ERRO: Arquivo ZIP de exportação não encontrado!
    echo.
    echo 📁 Procurando por: Sistema-Laudos-Export-Completo-*.zip
    echo 📍 No diretório: %CD%
    echo.
    echo ✅ SOLUÇÃO:
    echo    1. Copie o arquivo ZIP exportado para este diretório
    echo    2. Execute novamente esta opção
    echo.
    pause
    goto MAIN_MENU
)

echo ✅ Arquivo ZIP encontrado: %zip_file%
echo.
set /p "confirm=Confirma a instalação do sistema? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 🚀 Iniciando instalação do sistema...
call "03-instalar-sistema-completo.bat"
echo.
echo ✅ Sistema instalado!
echo.
echo 📋 PRÓXIMO PASSO:
echo    Execute a opção 5 (Validar sistema) para verificar
echo    se tudo está funcionando corretamente
echo.
pause
goto MAIN_MENU

:START_SYSTEM
echo.
echo ================================================================
echo 🚀 INICIAR SISTEMA
echo ================================================================
echo.
echo O que será iniciado:
echo    ✅ Python Launcher (proxy HTTPS)
echo    ✅ Next.js Server (aplicação principal)
echo    ✅ Navegador automático
echo    ✅ Monitoramento de status
echo.
echo 🌐 URLs de acesso:
echo    • https://inspetor.terpens.com.br
echo    • http://localhost:3000
echo.
echo 🔐 Login padrão:
echo    • Usuário: admin
echo    • Senha: admin
echo.
set /p "confirm=Confirma a inicialização do sistema? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 🚀 Iniciando sistema...
call "04-iniciar-sistema.bat"
echo.
pause
goto MAIN_MENU

:VALIDATE_SYSTEM
echo.
echo ================================================================
echo 🔍 VALIDAR E DIAGNOSTICAR SISTEMA
echo ================================================================
echo.
echo O que será verificado:
echo    ✅ Estrutura completa do sistema
echo    ✅ Dependências (Node.js, Python, npm, pip)
echo    ✅ Integridade do banco de dados
echo    ✅ Arquivos de upload
echo    ✅ Certificados SSL
echo    ✅ Configurações (.env)
echo    ✅ Conectividade de rede
echo    ✅ Portas e firewall
echo    ✅ Recursos do sistema
echo.
echo 📋 Será gerado um relatório completo com diagnóstico
echo    e sugestões de correção automática
echo.
set /p "confirm=Confirma a validação? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 🔍 Iniciando validação e diagnóstico...
call "05-sistema-validacao-diagnostico.bat"
echo.
pause
goto MAIN_MENU

:MONITOR_SYSTEM
echo.
echo ================================================================
echo 📊 MONITORAR SISTEMA EM TEMPO REAL
echo ================================================================
echo.
echo O que será monitorado:
echo    ✅ Status dos serviços (Next.js, Python Launcher)
echo    ✅ Conectividade HTTP/HTTPS
echo    ✅ Recursos do sistema (CPU, RAM, Disco)
echo    ✅ Integridade do banco de dados
echo    ✅ Logs de erro
echo    ✅ Alertas automáticos
echo.
echo ⏳ O monitoramento roda continuamente até você pressionar Ctrl+C
echo.
set /p "confirm=Confirma o monitoramento contínuo? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 📊 Iniciando monitoramento...
call "07-monitoramento-pos-migracao.bat"
echo.
pause
goto MAIN_MENU

:ROLLBACK_SYSTEM
echo.
echo ================================================================
echo 🚨 ROLLBACK AUTOMÁTICO
echo ================================================================
echo.
echo ⚠️  ATENÇÃO: Esta opção vai DESFAZER completamente a migração!
echo.
echo O que será feito:
echo    🛑 Parar todos os serviços
echo    💾 Fazer backup de dados importantes
echo    🗑️  Remover sistema de C:\Sistema-Laudos
echo    🔥 Limpar regras de firewall
echo    📦 Limpar cache npm/pip
echo    🔌 Liberar portas
echo.
echo 💾 DADOS PRESERVADOS:
echo    • Banco de dados será salvo
echo    • Uploads serão salvos
echo    • Configurações serão salvas
echo.
echo ❌ Use apenas se houver problemas graves na migração!
echo.
set /p "confirm=TEM CERTEZA que deseja fazer o rollback? (S/N): "
if /i "%confirm%" neq "S" goto MAIN_MENU

echo.
echo 🔄 Iniciando rollback automático...
call "06-rollback-automatico.bat"
echo.
pause
goto MAIN_MENU

:SHOW_DOCUMENTATION
echo.
echo ================================================================
echo 📖 DOCUMENTAÇÃO COMPLETA
echo ================================================================
echo.
echo Abrindo documentação completa em seu editor padrão...
echo.
start "" "README-MIGRACAO-COMPLETA.md"
echo.
echo ✅ Documentação aberta!
echo.
echo 📋 A documentação contém:
echo    • Visão geral completa do sistema
echo    • Processo passo a passo detalhado
echo    • Solução de problemas comuns
echo    • Informações técnicas
echo    • Checklist de migração
echo.
pause
goto MAIN_MENU

:SHOW_CHECKLIST
echo.
echo ================================================================
echo 📋 CHECKLIST DE MIGRAÇÃO COMPLETA
echo ================================================================
echo.
echo 👉 NO COMPUTADOR ATUAL (origem):
echo    [ ] 1. Executar exportação completa (opção 1)
echo    [ ] 2. Verificar arquivo ZIP gerado
echo    [ ] 3. Transferir ZIP para computador novo
echo.
echo 👉 NO COMPUTADOR NOVO (destino):
echo    [ ] 4. Executar instalação de dependências (opção 2)
echo    [ ] 5. REINICIAR o computador (obrigatório!)
echo    [ ] 6. Colocar arquivo ZIP no diretório dos scripts
echo    [ ] 7. Executar instalação do sistema (opção 3)
echo    [ ] 8. Executar validação e diagnóstico (opção 5)
echo    [ ] 9. Se tudo OK, iniciar sistema (opção 4)
echo    [ ] 10. Testar acesso: https://inspetor.terpens.com.br
echo    [ ] 11. Login: admin/admin
echo    [ ] 12. Verificar se dados estão preservados
echo.
echo 👉 PÓS-MIGRAÇÃO (opcional):
echo    [ ] 13. Monitoramento contínuo (opção 6)
echo    [ ] 14. Backup de segurança
echo.
echo ⚠️  EM CASO DE PROBLEMA:
echo    [ ] Execute rollback automático (opção 7)
echo    [ ] Consulte logs em C:\Sistema-Laudos-Instalacao\
echo.
echo ================================================================
echo.
pause
goto MAIN_MENU

:EXIT
echo.
echo ================================================================
echo 👋 OBRIGADO POR USAR O SISTEMA DE MIGRAÇÃO!
echo ================================================================
echo.
echo 🎯 Sistema desenvolvido para migração completa e segura
echo    do Sistema de Laudos entre computadores
echo.
echo 📞 Para suporte:
echo    • Consulte README-MIGRACAO-COMPLETA.md
echo    • Execute validação e diagnóstico (opção 5)
echo    • Verifique logs em C:\Sistema-Laudos-Instalacao\
echo.
echo 🚀 Tenha uma excelente migração!
echo.
pause
exit
