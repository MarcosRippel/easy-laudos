#Requires -Version 5.1
<#
.SYNOPSIS
    Sistema Emissor de Laudos - Launcher "Parrudo"
    
.DESCRIPTION
    Launcher robusto em PowerShell com interface Windows Forms e integração Telegram
    Substitui o PyInstaller problemático por uma solução nativa Windows
    
.AUTHOR
    General Truck System
    
.VERSION
    1.0.0
#>

# Configuração de execução
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Sistema Emissor de Laudos - Launcher"

# Importar módulos necessários
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Importar módulos personalizados
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module "$ScriptDir\modules\TelegramBot.psm1" -Force
Import-Module "$ScriptDir\modules\ProcessManager.psm1" -Force

# Variáveis globais
$global:LauncherConfig = @{}
$global:MainForm = $null
$global:LogTextBox = $null
$global:StatusLabel = $null
$global:NotifyIcon = $null
$global:IsMinimizedToTray = $false

function Initialize-Launcher {
    Write-Host "🚀 Inicializando Sistema Emissor de Laudos - Launcher Parrudo..." -ForegroundColor Cyan
    
    # Carregar configurações
    Load-Configuration
    
    # Inicializar módulos
    Initialize-TelegramBot -BotToken $global:LauncherConfig.telegram.botToken -ChatId $global:LauncherConfig.telegram.groupChatId
    Initialize-ProcessManager -ProcessConfig $global:LauncherConfig.processes
    
    # Criar interface
    Create-MainInterface
    
    # Testar conexão Telegram
    if (Test-TelegramConnection) {
        Add-LogMessage "✅ Conexão com Telegram estabelecida com sucesso!"
    } else {
        Add-LogMessage "⚠️ Falha na conexão com Telegram - verificar configuração"
    }
    
    Add-LogMessage "🎯 Launcher inicializado e pronto para uso!"
}

function Load-Configuration {
    $configPath = "$ScriptDir\config\settings.json"
    
    if (Test-Path $configPath) {
        try {
            $global:LauncherConfig = Get-Content $configPath | ConvertFrom-Json -AsHashtable
            Write-Host "✅ Configuração carregada: $configPath" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao carregar configuração: $($_.Exception.Message)" -ForegroundColor Red
            Exit 1
        }
    } else {
        Write-Host "❌ Arquivo de configuração não encontrado: $configPath" -ForegroundColor Red
        Exit 1
    }
}

function Create-MainInterface {
    # Formulário principal
    $global:MainForm = New-Object System.Windows.Forms.Form
    $global:MainForm.Text = $global:LauncherConfig.ui.windowTitle
    $global:MainForm.Size = New-Object System.Drawing.Size(800, 600)
    $global:MainForm.StartPosition = "CenterScreen"
    $global:MainForm.FormBorderStyle = "Sizable"
    $global:MainForm.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
    $global:MainForm.ForeColor = [System.Drawing.Color]::White
    
    # Ícone do formulário (usar ícone padrão se não existir)
    $iconPath = "$ScriptDir\assets\icon.ico"
    if (Test-Path $iconPath) {
        $global:MainForm.Icon = New-Object System.Drawing.Icon($iconPath)
    }
    
    # Header com logo e título
    $headerPanel = New-Object System.Windows.Forms.Panel
    $headerPanel.Size = New-Object System.Drawing.Size(780, 80)
    $headerPanel.Location = New-Object System.Drawing.Point(10, 10)
    $headerPanel.BackColor = [System.Drawing.Color]::FromArgb(45, 45, 45)
    
    $titleLabel = New-Object System.Windows.Forms.Label
    $titleLabel.Text = "🚀 GENERAL TRUCK SYSTEM"
    $titleLabel.Size = New-Object System.Drawing.Size(400, 30)
    $titleLabel.Location = New-Object System.Drawing.Point(20, 15)
    $titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 150, 255)
    $titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
    
    $subtitleLabel = New-Object System.Windows.Forms.Label
    $subtitleLabel.Text = "Sistema Emissor de Laudos - Launcher v1.0"
    $subtitleLabel.Size = New-Object System.Drawing.Size(400, 20)
    $subtitleLabel.Location = New-Object System.Drawing.Point(20, 45)
    $subtitleLabel.ForeColor = [System.Drawing.Color]::LightGray
    $subtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    
    # Status atual
    $global:StatusLabel = New-Object System.Windows.Forms.Label
    $global:StatusLabel.Text = "⚪ Sistema Parado"
    $global:StatusLabel.Size = New-Object System.Drawing.Size(200, 30)
    $global:StatusLabel.Location = New-Object System.Drawing.Point(550, 25)
    $global:StatusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $global:StatusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    
    # Botões de controle
    $buttonPanel = New-Object System.Windows.Forms.Panel
    $buttonPanel.Size = New-Object System.Drawing.Size(780, 60)
    $buttonPanel.Location = New-Object System.Drawing.Point(10, 100)
    $buttonPanel.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 40)
    
    $startButton = Create-StyledButton "▶️ INICIAR" (New-Object System.Drawing.Point(20, 15)) ([System.Drawing.Color]::FromArgb(0, 150, 0))
    $stopButton = Create-StyledButton "⏹️ PARAR" (New-Object System.Drawing.Point(180, 15)) ([System.Drawing.Color]::FromArgb(200, 0, 0))
    $restartButton = Create-StyledButton "🔄 REINICIAR" (New-Object System.Drawing.Point(340, 15)) ([System.Drawing.Color]::FromArgb(255, 140, 0))
    $telegramButton = Create-StyledButton "📱 TESTE TELEGRAM" (New-Object System.Drawing.Point(500, 15)) ([System.Drawing.Color]::FromArgb(0, 120, 200))
    
    # Event handlers dos botões
    $startButton.Add_Click({ Start-SystemProcesses })
    $stopButton.Add_Click({ Stop-SystemProcesses })
    $restartButton.Add_Click({ Restart-SystemProcesses })
    $telegramButton.Add_Click({ Test-TelegramIntegration })
    
    # Área de logs
    $logLabel = New-Object System.Windows.Forms.Label
    $logLabel.Text = "📋 LOGS DO SISTEMA:"
    $logLabel.Size = New-Object System.Drawing.Size(200, 20)
    $logLabel.Location = New-Object System.Drawing.Point(20, 180)
    $logLabel.ForeColor = [System.Drawing.Color]::White
    $logLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    
    $global:LogTextBox = New-Object System.Windows.Forms.TextBox
    $global:LogTextBox.Multiline = $true
    $global:LogTextBox.ScrollBars = "Both"
    $global:LogTextBox.Size = New-Object System.Drawing.Size(760, 350)
    $global:LogTextBox.Location = New-Object System.Drawing.Point(20, 205)
    $global:LogTextBox.BackColor = [System.Drawing.Color]::FromArgb(20, 20, 20)
    $global:LogTextBox.ForeColor = [System.Drawing.Color]::LimeGreen
    $global:LogTextBox.Font = New-Object System.Drawing.Font("Consolas", 9)
    $global:LogTextBox.ReadOnly = $true
    
    # Adicionar controles aos painéis
    $headerPanel.Controls.AddRange(@($titleLabel, $subtitleLabel, $global:StatusLabel))
    $buttonPanel.Controls.AddRange(@($startButton, $stopButton, $restartButton, $telegramButton))
    
    # Adicionar painéis ao formulário
    $global:MainForm.Controls.AddRange(@($headerPanel, $buttonPanel, $logLabel, $global:LogTextBox))
    
    # Event handlers do formulário
    $global:MainForm.Add_Load({ On-FormLoad })
    $global:MainForm.Add_FormClosing({ On-FormClosing })
    $global:MainForm.Add_Resize({ On-FormResize })
    
    # Configurar ícone na bandeja
    Setup-SystemTray
}

function Create-StyledButton {
    param(
        [string]$Text,
        [System.Drawing.Point]$Location,
        [System.Drawing.Color]$BackColor
    )
    
    $button = New-Object System.Windows.Forms.Button
    $button.Text = $Text
    $button.Size = New-Object System.Drawing.Size(150, 35)
    $button.Location = $Location
    $button.BackColor = $BackColor
    $button.ForeColor = [System.Drawing.Color]::White
    $button.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $button.FlatStyle = "Flat"
    $button.FlatAppearance.BorderSize = 0
    $button.Cursor = "Hand"
    
    return $button
}

function Setup-SystemTray {
    $global:NotifyIcon = New-Object System.Windows.Forms.NotifyIcon
    $global:NotifyIcon.Text = "Sistema Emissor de Laudos"
    $global:NotifyIcon.Visible = $true
    
    # Ícone da bandeja
    $iconPath = "$ScriptDir\assets\icon.ico"
    if (Test-Path $iconPath) {
        $global:NotifyIcon.Icon = New-Object System.Drawing.Icon($iconPath)
    } else {
        $global:NotifyIcon.Icon = [System.Drawing.SystemIcons]::Application
    }
    
    # Menu de contexto
    $contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
    
    $showItem = New-Object System.Windows.Forms.ToolStripMenuItem("Mostrar")
    $showItem.Add_Click({ Show-MainWindow })
    
    $startItem = New-Object System.Windows.Forms.ToolStripMenuItem("Iniciar Sistema")
    $startItem.Add_Click({ Start-SystemProcesses })
    
    $stopItem = New-Object System.Windows.Forms.ToolStripMenuItem("Parar Sistema")
    $stopItem.Add_Click({ Stop-SystemProcesses })
    
    $exitItem = New-Object System.Windows.Forms.ToolStripMenuItem("Sair")
    $exitItem.Add_Click({ Exit-Application })
    
    $contextMenu.Items.AddRange(@($showItem, "-", $startItem, $stopItem, "-", $exitItem))
    $global:NotifyIcon.ContextMenuStrip = $contextMenu
    
    # Double-click para mostrar
    $global:NotifyIcon.Add_DoubleClick({ Show-MainWindow })
}

function Add-LogMessage {
    param([string]$Message)
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logEntry = "[$timestamp] $Message`r`n"
    
    if ($global:LogTextBox) {
        $global:LogTextBox.AppendText($logEntry)
        $global:LogTextBox.SelectionStart = $global:LogTextBox.Text.Length
        $global:LogTextBox.ScrollToCaret()
    }
    
    Write-Host $logEntry -NoNewline
}

function Start-SystemProcesses {
    Add-LogMessage "🚀 Iniciando processos do sistema..."
    Update-SystemStatus "🟡 Iniciando..." ([System.Drawing.Color]::Yellow)
    
    $projectRoot = Split-Path -Parent $ScriptDir
    
    # Iniciar npm run dev
    if (Start-ManagedProcess -ProcessName "npm" -Command "npm run dev" -WorkingDirectory $projectRoot -Hidden) {
        Add-LogMessage "✅ NextJS (npm run dev) iniciado com sucesso!"
    } else {
        Add-LogMessage "❌ Erro ao iniciar NextJS"
        return
    }
    
    Start-Sleep -Seconds 3
    
    # Iniciar HTTPS server
    if (Start-ManagedProcess -ProcessName "https" -Command "node start-https-inspetor.js" -WorkingDirectory $projectRoot -Hidden) {
        Add-LogMessage "✅ Servidor HTTPS iniciado com sucesso!"
    } else {
        Add-LogMessage "❌ Erro ao iniciar servidor HTTPS"
        return
    }
    
    Update-SystemStatus "🟢 Sistema Operacional" ([System.Drawing.Color]::LimeGreen)
    Add-LogMessage "🎯 Sistema iniciado completamente!"
    
    # Notificar via Telegram
    Send-SystemStartNotification
    
    # Mostrar notificação do Windows
    Show-TrayNotification "Sistema Iniciado" "O Sistema Emissor de Laudos foi iniciado com sucesso!"
}

function Stop-SystemProcesses {
    Add-LogMessage "🛑 Parando processos do sistema..."
    Update-SystemStatus "🟡 Parando..." ([System.Drawing.Color]::Yellow)
    
    Stop-AllManagedProcesses
    
    Update-SystemStatus "⚪ Sistema Parado" ([System.Drawing.Color]::Gray)
    Add-LogMessage "⏹️ Sistema parado completamente!"
    
    # Notificar via Telegram
    Send-SystemStopNotification
    
    # Mostrar notificação do Windows
    Show-TrayNotification "Sistema Parado" "O Sistema Emissor de Laudos foi parado."
}

function Restart-SystemProcesses {
    Add-LogMessage "🔄 Reiniciando sistema..."
    Stop-SystemProcesses
    Start-Sleep -Seconds 2
    Start-SystemProcesses
    
    # Notificar via Telegram
    Send-SystemRestartNotification
}

function Test-TelegramIntegration {
    Add-LogMessage "📱 Testando integração Telegram..."
    
    if (Test-TelegramConnection) {
        $timestamp = Get-Date -Format 'dd/MM/yyyy HH:mm:ss'
        $message = @"
🧪 <b>TESTE DE CONECTIVIDADE</b>

✅ Launcher PowerShell funcionando!
⏰ $timestamp

<i>Teste enviado pelo Launcher Parrudo</i>
"@
        
        if (Send-TelegramMessage -Message $message) {
            Add-LogMessage "✅ Teste Telegram enviado com sucesso!"
            Show-TrayNotification "Telegram OK" "Mensagem de teste enviada com sucesso!"
        } else {
            Add-LogMessage "❌ Falha ao enviar teste Telegram"
        }
    } else {
        Add-LogMessage "❌ Falha na conexão Telegram"
    }
}

function Update-SystemStatus {
    param(
        [string]$StatusText,
        [System.Drawing.Color]$Color
    )
    
    if ($global:StatusLabel) {
        $global:StatusLabel.Text = $StatusText
        $global:StatusLabel.ForeColor = $Color
    }
}

function Show-TrayNotification {
    param(
        [string]$Title,
        [string]$Message
    )
    
    if ($global:NotifyIcon) {
        $global:NotifyIcon.ShowBalloonTip(5000, $Title, $Message, [System.Windows.Forms.ToolTipIcon]::Info)
    }
}

function Show-MainWindow {
    if ($global:MainForm.WindowState -eq "Minimized") {
        $global:MainForm.WindowState = "Normal"
    }
    $global:MainForm.Show()
    $global:MainForm.Activate()
    $global:IsMinimizedToTray = $false
}

function Hide-MainWindow {
    $global:MainForm.Hide()
    $global:IsMinimizedToTray = $true
}

function On-FormLoad {
    Add-LogMessage "🎯 Interface carregada com sucesso!"
    Add-LogMessage "📱 Telegram Bot: $($global:LauncherConfig.telegram.botToken.Substring(0,20))..."
    Add-LogMessage "💬 Grupo: $($global:LauncherConfig.telegram.groupUrl)"
}

function On-FormClosing {
    param($sender, $e)
    
    if ($global:LauncherConfig.ui.minimizeToTray -and -not $global:IsClosing) {
        $e.Cancel = $true
        Hide-MainWindow
        Show-TrayNotification "Minimizado" "Launcher movido para bandeja do sistema"
    } else {
        Exit-Application
    }
}

function On-FormResize {
    if ($global:MainForm.WindowState -eq "Minimized" -and $global:LauncherConfig.ui.minimizeToTray) {
        Hide-MainWindow
    }
}

function Exit-Application {
    $global:IsClosing = $true
    
    Add-LogMessage "🚪 Encerrando aplicação..."
    
    # Parar todos os processos
    Stop-AllManagedProcesses
    
    # Limpar ícone da bandeja
    if ($global:NotifyIcon) {
        $global:NotifyIcon.Visible = $false
        $global:NotifyIcon.Dispose()
    }
    
    # Fechar formulário
    if ($global:MainForm) {
        $global:MainForm.Close()
    }
    
    Write-Host "👋 Launcher encerrado!" -ForegroundColor Green
    [System.Environment]::Exit(0)
}

# Função principal
function Main {
    try {
        Initialize-Launcher
        
        # Executar aplicação
        [System.Windows.Forms.Application]::EnableVisualStyles()
        [System.Windows.Forms.Application]::SetCompatibleTextRenderingDefault($false)
        [System.Windows.Forms.Application]::Run($global:MainForm)
    }
    catch {
        Write-Host "💥 Erro crítico: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.ScriptStackTrace -ForegroundColor Red
        
        # Tentar notificar erro via Telegram
        try {
            Send-SystemCrashNotification -ProcessName "Launcher" -ErrorDetails $_.Exception.Message
        } catch {
            Write-Host "Falha ao notificar erro via Telegram" -ForegroundColor Yellow
        }
        
        Read-Host "Pressione Enter para sair..."
        Exit 1
    }
}

# Executar aplicação
Main