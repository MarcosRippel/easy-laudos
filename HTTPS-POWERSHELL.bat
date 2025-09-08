@echo off
REM Chama PowerShell que nao fecha sozinho

powershell -NoExit -Command "& {
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host '   SISTEMA EMISSOR DE LAUDOS - HTTPS' -ForegroundColor Cyan
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host ''
    
    # Vai para o diretorio
    Set-Location 'd:\General Truck System\5. Emissor de Laudos - Inspetor'
    Write-Host 'Diretorio:' (Get-Location).Path
    Write-Host ''
    
    # Verifica se e admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')
    
    if ($isAdmin) {
        Write-Host '[OK] Executando como ADMINISTRADOR' -ForegroundColor Green
        
        Write-Host 'Configurando IP Virtual...'
        & netsh interface ip delete address 'Loopback Pseudo-Interface 1' 177.126.153.190 2>$null
        & netsh interface ip add address 'Loopback Pseudo-Interface 1' 177.126.153.190 255.255.255.255 2>$null
        
        Write-Host 'Configurando Firewall...'
        & netsh advfirewall firewall delete rule name='Sistema HTTP' 2>$null
        & netsh advfirewall firewall delete rule name='Sistema HTTPS' 2>$null
        & netsh advfirewall firewall add rule name='Sistema HTTP' dir=in action=allow protocol=TCP localport=80,3000 2>$null
        & netsh advfirewall firewall add rule name='Sistema HTTPS' dir=in action=allow protocol=TCP localport=443,9443 2>$null
        
        Write-Host '[OK] Configuracoes aplicadas!' -ForegroundColor Green
    } else {
        Write-Host '[!] Sem privilegios de admin' -ForegroundColor Yellow
    }
    
    Write-Host ''
    
    # Verifica Node
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host '[OK] Node.js:' $nodeVersion -ForegroundColor Green
    } else {
        Write-Host '[ERRO] Node.js nao instalado!' -ForegroundColor Red
        Write-Host 'Baixe em: https://nodejs.org/'
        return
    }
    
    # Verifica NPM
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host '[OK] NPM:' $npmVersion -ForegroundColor Green
    } else {
        Write-Host '[ERRO] NPM nao encontrado!' -ForegroundColor Red
        return
    }
    
    Write-Host ''
    
    # Instala dependencias
    if (-not (Test-Path 'node_modules')) {
        Write-Host 'Instalando dependencias...' -ForegroundColor Yellow
        & npm install
        if (Test-Path 'node_modules') {
            Write-Host '[OK] Dependencias instaladas!' -ForegroundColor Green
        } else {
            Write-Host '[ERRO] Falha ao instalar!' -ForegroundColor Red
            return
        }
    } else {
        Write-Host '[OK] Dependencias ja instaladas' -ForegroundColor Green
    }
    
    Write-Host ''
    
    # Verifica SSL
    Write-Host 'Verificando certificados SSL...'
    if (Test-Path 'ssl\inspetor.terpens.com.br.crt') {
        Write-Host '[OK] Certificado encontrado' -ForegroundColor Green
    } else {
        Write-Host '[!] Certificado nao encontrado' -ForegroundColor Yellow
    }
    
    if (Test-Path 'ssl\inspetor.terpens.com.br.key') {
        Write-Host '[OK] Chave privada encontrada' -ForegroundColor Green
    } else {
        Write-Host '[!] Chave nao encontrada' -ForegroundColor Yellow
    }
    
    Write-Host ''
    
    # Build
    if (-not (Test-Path '.next')) {
        Write-Host 'Compilando projeto...' -ForegroundColor Yellow
        & npm run build
        if (Test-Path '.next') {
            Write-Host '[OK] Build concluido!' -ForegroundColor Green
        } else {
            Write-Host '[!] Build falhou, usando dev' -ForegroundColor Yellow
        }
    } else {
        Write-Host '[OK] Build ja existe' -ForegroundColor Green
    }
    
    Write-Host ''
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host '   INICIANDO SERVIDOR' -ForegroundColor Cyan
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host ''
    
    if (Test-Path 'start-https-local.js') {
        Write-Host 'MODO: HTTPS' -ForegroundColor Green
        Write-Host ''
        Write-Host 'URLs disponiveis:' -ForegroundColor Yellow
        Write-Host '- http://localhost:3000 (redireciona)'
        Write-Host '- https://localhost:9443'
        Write-Host '- https://177.126.153.190:9443'
        Write-Host ''
        Write-Host 'Iniciando servidor HTTPS...'
        Write-Host 'Pressione Ctrl+C para parar'
        Write-Host ''
        
        & node start-https-local.js
    } else {
        Write-Host 'MODO: HTTP' -ForegroundColor Yellow
        Write-Host ''
        Write-Host 'URLs disponiveis:' -ForegroundColor Yellow
        Write-Host '- http://localhost:3000'
        Write-Host '- http://177.126.153.190:3000'
        Write-Host ''
        Write-Host 'Iniciando servidor HTTP...'
        Write-Host 'Pressione Ctrl+C para parar'
        Write-Host ''
        
        & npm run dev
    }
    
    Write-Host ''
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host '   SERVIDOR PARADO' -ForegroundColor Cyan
    Write-Host '============================================' -ForegroundColor Cyan
}"