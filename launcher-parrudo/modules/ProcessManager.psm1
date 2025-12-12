# Módulo de Gerenciamento de Processos para Sistema Emissor de Laudos
# Criado para General Truck System

$global:ManagedProcesses = @{}
$global:ProcessConfig = @{}

function Initialize-ProcessManager {
    param(
        [hashtable]$ProcessConfig
    )
    
    $global:ProcessConfig = $ProcessConfig
    $global:ManagedProcesses = @{}
    
    Write-Host "⚙️ Process Manager inicializado!" -ForegroundColor Green
}

function Start-ManagedProcess {
    param(
        [string]$ProcessName,
        [string]$Command,
        [string]$WorkingDirectory = (Get-Location).Path,
        [switch]$Hidden
    )
    
    try {
        if ($global:ManagedProcesses.ContainsKey($ProcessName)) {
            Write-Host "⚠️ Processo '$ProcessName' já está em execução!" -ForegroundColor Yellow
            return $false
        }
        
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "cmd.exe"
        $startInfo.Arguments = "/c `"$Command`""
        $startInfo.WorkingDirectory = $WorkingDirectory
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.RedirectStandardInput = $true
        $startInfo.CreateNoWindow = $Hidden.IsPresent
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $startInfo
        
        # Event handlers para capturar output
        $outputEvent = Register-ObjectEvent -InputObject $process -EventName "OutputDataReceived" -Action {
            param($sender, $e)
            if (-not [string]::IsNullOrEmpty($e.Data)) {
                Add-ProcessLog -ProcessName $Event.MessageData.ProcessName -Message $e.Data -Type "Output"
            }
        } -MessageData @{ ProcessName = $ProcessName }
        
        $errorEvent = Register-ObjectEvent -InputObject $process -EventName "ErrorDataReceived" -Action {
            param($sender, $e)
            if (-not [string]::IsNullOrEmpty($e.Data)) {
                Add-ProcessLog -ProcessName $Event.MessageData.ProcessName -Message $e.Data -Type "Error"
            }
        } -MessageData @{ ProcessName = $ProcessName }
        
        $exitEvent = Register-ObjectEvent -InputObject $process -EventName "Exited" -Action {
            param($sender, $e)
            $processName = $Event.MessageData.ProcessName
            Write-Host "❌ Processo '$processName' finalizou com código: $($sender.ExitCode)" -ForegroundColor Red
            
            if ($global:ProcessConfig[$processName].autoRestart -and $sender.ExitCode -ne 0) {
                Start-Sleep -Seconds 5
                Write-Host "🔄 Tentando reiniciar processo '$processName'..." -ForegroundColor Yellow
                Restart-ManagedProcess -ProcessName $processName
            }
        } -MessageData @{ ProcessName = $ProcessName }
        
        $process.EnableRaisingEvents = $true
        $process.Start()
        $process.BeginOutputReadLine()
        $process.BeginErrorReadLine()
        
        $global:ManagedProcesses[$ProcessName] = @{
            Process = $process
            StartTime = Get-Date
            Command = $Command
            WorkingDirectory = $WorkingDirectory
            OutputEvent = $outputEvent
            ErrorEvent = $errorEvent
            ExitEvent = $exitEvent
            RestartCount = 0
            Logs = @()
        }
        
        Write-Host "✅ Processo '$ProcessName' iniciado com sucesso! PID: $($process.Id)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erro ao iniciar processo '$ProcessName': $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Stop-ManagedProcess {
    param(
        [string]$ProcessName,
        [switch]$Force
    )
    
    if (-not $global:ManagedProcesses.ContainsKey($ProcessName)) {
        Write-Host "⚠️ Processo '$ProcessName' não está sendo gerenciado!" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $managedProcess = $global:ManagedProcesses[$ProcessName]
        $process = $managedProcess.Process
        
        if ($process.HasExited) {
            Write-Host "ℹ️ Processo '$ProcessName' já foi finalizado." -ForegroundColor Blue
            Remove-ProcessEvents -ProcessName $ProcessName
            $global:ManagedProcesses.Remove($ProcessName)
            return $true
        }
        
        if ($Force.IsPresent) {
            $process.Kill()
            Write-Host "🔥 Processo '$ProcessName' forçadamente terminado!" -ForegroundColor Red
        } else {
            # Tenta fechar graciosamente
            $process.StandardInput.WriteLine("exit")
            $process.StandardInput.Close()
            
            if (-not $process.WaitForExit(10000)) {
                Write-Host "⏳ Processo não respondeu, forçando encerramento..." -ForegroundColor Yellow
                $process.Kill()
            }
        }
        
        $process.WaitForExit()
        Remove-ProcessEvents -ProcessName $ProcessName
        $global:ManagedProcesses.Remove($ProcessName)
        
        Write-Host "⏹️ Processo '$ProcessName' parado com sucesso!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erro ao parar processo '$ProcessName': $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Restart-ManagedProcess {
    param(
        [string]$ProcessName
    )
    
    if (-not $global:ManagedProcesses.ContainsKey($ProcessName)) {
        Write-Host "⚠️ Processo '$ProcessName' não está sendo gerenciado!" -ForegroundColor Yellow
        return $false
    }
    
    $managedProcess = $global:ManagedProcesses[$ProcessName]
    $command = $managedProcess.Command
    $workingDir = $managedProcess.WorkingDirectory
    
    Write-Host "🔄 Reiniciando processo '$ProcessName'..." -ForegroundColor Yellow
    
    if (Stop-ManagedProcess -ProcessName $ProcessName) {
        Start-Sleep -Seconds 2
        $result = Start-ManagedProcess -ProcessName $ProcessName -Command $command -WorkingDirectory $workingDir -Hidden
        
        if ($result) {
            $global:ManagedProcesses[$ProcessName].RestartCount++
            Write-Host "✅ Processo '$ProcessName' reiniciado com sucesso!" -ForegroundColor Green
        }
        
        return $result
    }
    
    return $false
}

function Get-ProcessStatus {
    param(
        [string]$ProcessName
    )
    
    if (-not $global:ManagedProcesses.ContainsKey($ProcessName)) {
        return @{
            Status = "NotManaged"
            PID = 0
            StartTime = $null
            Uptime = "N/A"
            RestartCount = 0
        }
    }
    
    $managedProcess = $global:ManagedProcesses[$ProcessName]
    $process = $managedProcess.Process
    
    if ($process.HasExited) {
        return @{
            Status = "Stopped"
            PID = $process.Id
            StartTime = $managedProcess.StartTime
            Uptime = "Parado"
            RestartCount = $managedProcess.RestartCount
            ExitCode = $process.ExitCode
        }
    } else {
        $uptime = (Get-Date) - $managedProcess.StartTime
        return @{
            Status = "Running"
            PID = $process.Id
            StartTime = $managedProcess.StartTime
            Uptime = "{0:hh\:mm\:ss}" -f $uptime
            RestartCount = $managedProcess.RestartCount
        }
    }
}

function Get-AllProcessStatus {
    $status = @{}
    
    foreach ($processName in $global:ManagedProcesses.Keys) {
        $status[$processName] = Get-ProcessStatus -ProcessName $processName
    }
    
    return $status
}

function Add-ProcessLog {
    param(
        [string]$ProcessName,
        [string]$Message,
        [string]$Type = "Info"
    )
    
    if ($global:ManagedProcesses.ContainsKey($ProcessName)) {
        $logEntry = @{
            Timestamp = Get-Date
            Type = $Type
            Message = $Message
        }
        
        $global:ManagedProcesses[$ProcessName].Logs += $logEntry
        
        # Limitar logs para não usar muita memória
        if ($global:ManagedProcesses[$ProcessName].Logs.Count -gt 1000) {
            $global:ManagedProcesses[$ProcessName].Logs = $global:ManagedProcesses[$ProcessName].Logs[-500..-1]
        }
        
        # Detectar crashes/erros críticos
        if ($Type -eq "Error" -and ($Message -match "Error|Exception|Failed|Crash")) {
            Write-Host "🚨 Erro detectado em '$ProcessName': $Message" -ForegroundColor Red
        }
    }
}

function Get-ProcessLogs {
    param(
        [string]$ProcessName,
        [int]$LastN = 100
    )
    
    if ($global:ManagedProcesses.ContainsKey($ProcessName)) {
        $logs = $global:ManagedProcesses[$ProcessName].Logs
        if ($logs.Count -gt $LastN) {
            return $logs[-$LastN..-1]
        }
        return $logs
    }
    
    return @()
}

function Remove-ProcessEvents {
    param(
        [string]$ProcessName
    )
    
    if ($global:ManagedProcesses.ContainsKey($ProcessName)) {
        $managedProcess = $global:ManagedProcesses[$ProcessName]
        
        if ($managedProcess.OutputEvent) {
            Unregister-Event -SourceIdentifier $managedProcess.OutputEvent.Name
        }
        if ($managedProcess.ErrorEvent) {
            Unregister-Event -SourceIdentifier $managedProcess.ErrorEvent.Name
        }
        if ($managedProcess.ExitEvent) {
            Unregister-Event -SourceIdentifier $managedProcess.ExitEvent.Name
        }
    }
}

function Stop-AllManagedProcesses {
    Write-Host "🛑 Parando todos os processos gerenciados..." -ForegroundColor Yellow
    
    foreach ($processName in $global:ManagedProcesses.Keys) {
        Stop-ManagedProcess -ProcessName $processName
    }
    
    Write-Host "✅ Todos os processos foram parados!" -ForegroundColor Green
}

# Export das funções públicas
Export-ModuleMember -Function @(
    'Initialize-ProcessManager',
    'Start-ManagedProcess',
    'Stop-ManagedProcess',
    'Restart-ManagedProcess',
    'Get-ProcessStatus',
    'Get-AllProcessStatus',
    'Get-ProcessLogs',
    'Stop-AllManagedProcesses'
)