# Módulo de Integração com Telegram Bot para Sistema Emissor de Laudos
# Criado para General Truck System

function Initialize-TelegramBot {
    param(
        [string]$BotToken,
        [string]$ChatId
    )
    
    $global:TelegramConfig = @{
        BotToken = $BotToken
        ChatId = $ChatId
        ApiUrl = "https://api.telegram.org/bot$BotToken"
        Enabled = $true
    }
    
    Write-Host "🤖 Telegram Bot inicializado com sucesso!" -ForegroundColor Green
}

function Send-TelegramMessage {
    param(
        [string]$Message,
        [string]$ParseMode = "HTML",
        [switch]$Silent
    )
    
    if (-not $global:TelegramConfig.Enabled) {
        Write-Host "⚠️ Telegram Bot desabilitado" -ForegroundColor Yellow
        return
    }
    
    try {
        $body = @{
            chat_id = $global:TelegramConfig.ChatId
            text = $Message
            parse_mode = $ParseMode
            disable_notification = $Silent.IsPresent
        }
        
        $json = $body | ConvertTo-Json -Depth 10
        $url = "$($global:TelegramConfig.ApiUrl)/sendMessage"
        
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $json -ContentType "application/json" -TimeoutSec 10
        
        if ($response.ok) {
            Write-Host "📤 Mensagem Telegram enviada: $($Message.Substring(0, [Math]::Min(50, $Message.Length)))..." -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Erro no Telegram: $($response.description)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Erro ao enviar mensagem Telegram: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Send-SystemStartNotification {
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $message = @"
<b>✅ SISTEMA INICIADO</b>

🚀 <b>General Truck System - Emissor de Laudos</b>
⏰ <b>Horário:</b> $timestamp
🌐 <b>HTTPS:</b> https://inspetor.terpens.com.br:8444
📱 <b>NextJS:</b> Porta 3000
🔧 <b>Status:</b> Operacional

<i>Sistema iniciado com sucesso e pronto para uso!</i>
"@
    
    Send-TelegramMessage -Message $message
}

function Send-SystemStopNotification {
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $message = @"
<b>⏹️ SISTEMA PARADO</b>

🛑 <b>General Truck System - Emissor de Laudos</b>
⏰ <b>Horário:</b> $timestamp
🔧 <b>Status:</b> Desligado

<i>Sistema parado pelo usuário.</i>
"@
    
    Send-TelegramMessage -Message $message
}

function Send-SystemRestartNotification {
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $message = @"
<b>🔄 SISTEMA REINICIADO</b>

🔃 <b>General Truck System - Emissor de Laudos</b>
⏰ <b>Horário:</b> $timestamp
🌐 <b>HTTPS:</b> https://inspetor.terpens.com.br:8444
🔧 <b>Status:</b> Reiniciando...

<i>Sistema reiniciado com sucesso!</i>
"@
    
    Send-TelegramMessage -Message $message
}

function Send-SystemCrashNotification {
    param(
        [string]$ProcessName,
        [string]$ErrorDetails
    )
    
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $message = @"
<b>❌ ALERTA: SISTEMA TRAVOU!</b>

🚨 <b>CRASH DETECTADO - General Truck System</b>
⏰ <b>Horário:</b> $timestamp
🔥 <b>Processo:</b> $ProcessName
⚠️ <b>Erro:</b> $($ErrorDetails.Substring(0, [Math]::Min(200, $ErrorDetails.Length)))

<b>🔧 AÇÃO NECESSÁRIA:</b>
- Verificar logs do sistema
- Investigar causa do crash
- Restart manual pode ser necessário

<i>Notificação automática do Sistema de Monitoramento</i>
"@
    
    Send-TelegramMessage -Message $message
}

function Send-StatusReport {
    param(
        [hashtable]$ProcessStatus,
        [string]$SystemUptime
    )
    
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    
    $statusEmoji = "✅"
    $statusText = "Operacional"
    
    foreach ($process in $ProcessStatus.Keys) {
        if ($ProcessStatus[$process].Status -ne "Running") {
            $statusEmoji = "⚠️"
            $statusText = "Com Problemas"
            break
        }
    }
    
    $npmStatus = if ($ProcessStatus.ContainsKey("npm")) { $ProcessStatus["npm"].Status } else { "Desconhecido" }
    $httpsStatus = if ($ProcessStatus.ContainsKey("https")) { $ProcessStatus["https"].Status } else { "Desconhecido" }
    
    $message = @"
<b>📊 RELATÓRIO DE STATUS</b>

🏢 <b>General Truck System - Emissor de Laudos</b>
⏰ <b>Timestamp:</b> $timestamp
⏳ <b>Uptime:</b> $SystemUptime

<b>📋 STATUS DOS PROCESSOS:</b>
🔸 <b>NextJS (npm):</b> $npmStatus
🔸 <b>HTTPS Server:</b> $httpsStatus

<b>🌐 ENDPOINTS:</b>
• HTTPS: https://inspetor.terpens.com.br:8444
• Local: http://localhost:3000

<b>🔧 STATUS GERAL:</b> $statusEmoji $statusText

<i>Relatório automático do sistema de monitoramento</i>
"@
    
    Send-TelegramMessage -Message $message -Silent
}

function Test-TelegramConnection {
    try {
        $url = "$($global:TelegramConfig.ApiUrl)/getMe"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
        
        if ($response.ok) {
            Write-Host "✅ Conexão Telegram OK - Bot: $($response.result.first_name)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ Erro na conexão Telegram: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    return $false
}

function Enable-TelegramBot {
    $global:TelegramConfig.Enabled = $true
    Write-Host "✅ Telegram Bot habilitado" -ForegroundColor Green
}

function Disable-TelegramBot {
    $global:TelegramConfig.Enabled = $false
    Write-Host "⚠️ Telegram Bot desabilitado" -ForegroundColor Yellow
}

# Export das funções públicas
Export-ModuleMember -Function @(
    'Initialize-TelegramBot',
    'Send-TelegramMessage',
    'Send-SystemStartNotification',
    'Send-SystemStopNotification', 
    'Send-SystemRestartNotification',
    'Send-SystemCrashNotification',
    'Send-StatusReport',
    'Test-TelegramConnection',
    'Enable-TelegramBot',
    'Disable-TelegramBot'
)