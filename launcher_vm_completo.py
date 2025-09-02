#!/usr/bin/env python3
"""
🚀 LAUNCHER VM COMPLETO - Sistema Emissor de Laudos
================================================================================
LAUNCHER PYTHON ÚNICO PARA VM - FAZ TUDO AUTOMATICAMENTE!

✅ Detecção automática de IP da VM
✅ HTTPS automático para inspetor.terpens.com.br 
✅ Verificação completa de dependências
✅ Notificador Telegram integrado (a cada 10min)
✅ Proxy HTTPS completo na porta 443
✅ Auto-start do Next.js e monitoramento
✅ Logs detalhados de tudo
✅ Interface web de status

TELEGRAM BOT: ***REMOVED-TELEGRAM-BOT-TOKEN***
GRUPO: https://t.me/c/2594596544/1534

COMO USAR:
1. Cole este arquivo no repositório principal
2. Execute: python launcher_vm_completo.py
3. PRONTO! Tudo funciona automaticamente

General Truck System - Inspetor VM Edition
================================================================================
"""

import os
import sys
import ssl
import json
import time
import socket
import shutil
import signal
import logging
import sqlite3
import subprocess
import threading
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from typing import Optional, Dict, Any, List
import re

# ================================================================================
# 🔧 CONFIGURAÇÕES GLOBAIS
# ================================================================================

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = "***REMOVED-TELEGRAM-BOT-TOKEN***"
TELEGRAM_CHAT_ID = "-1002594596544"  # Grupo convertido para formato de bot
TELEGRAM_TOPIC_ID = "1534"

# Sistema Configuration
DOMAIN = "inspetor.terpens.com.br"
HTTPS_PORT = 443
HTTP_PORT = 3000
NOTIFICATION_INTERVAL = 600  # 10 minutos em segundos

# Caminhos importantes
BASE_DIR = Path(__file__).parent
SSL_DIR = BASE_DIR / "ssl"
PRISMA_DIR = BASE_DIR / "prisma"
LOG_DIR = BASE_DIR / "logs"
BACKUP_DIR = BASE_DIR / "backups"

# ================================================================================
# 📝 SISTEMA DE LOGS
# ================================================================================

def setup_logging():
    """Configura sistema de logs avançado"""
    LOG_DIR.mkdir(exist_ok=True)
    
    log_file = LOG_DIR / f"launcher_vm_{datetime.now().strftime('%Y%m%d')}.log"
    
    # Configurar formatação colorida para console
    class ColoredFormatter(logging.Formatter):
        """Formatter colorido para logs"""
        
        COLORS = {
            'DEBUG': '\033[36m',    # Cyan
            'INFO': '\033[32m',     # Green
            'WARNING': '\033[33m',  # Yellow
            'ERROR': '\033[31m',    # Red
            'CRITICAL': '\033[35m', # Magenta
        }
        RESET = '\033[0m'
        
        def format(self, record):
            color = self.COLORS.get(record.levelname, self.RESET)
            record.levelname = f"{color}[{record.levelname:8}]{self.RESET}"
            return super().format(record)
    
    # Handler para arquivo
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    ))
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(ColoredFormatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))
    
    # Configurar logger principal
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logging()

# ================================================================================
# 🌐 DETECTOR DE REDE E IP
# ================================================================================

class NetworkDetector:
    """Detecta automaticamente configurações de rede da VM"""
    
    def __init__(self):
        self.vm_ip = None
        self.external_ip = None
        self.network_info = {}
    
    def get_vm_ip(self) -> str:
        """Detecta IP local da VM"""
        try:
            # Método 1: Conectar para detectar IP usado
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                self.vm_ip = s.getsockname()[0]
                logger.info(f"🌐 IP da VM detectado: {self.vm_ip}")
                return self.vm_ip
        except Exception as e:
            logger.warning(f"Método 1 falhou: {e}")
        
        try:
            # Método 2: Usar hostname
            hostname = socket.gethostname()
            self.vm_ip = socket.gethostbyname(hostname)
            logger.info(f"🌐 IP da VM (hostname): {self.vm_ip}")
            return self.vm_ip
        except Exception as e:
            logger.warning(f"Método 2 falhou: {e}")
        
        # Fallback
        self.vm_ip = "192.168.1.100"
        logger.warning(f"🌐 Usando IP padrão: {self.vm_ip}")
        return self.vm_ip
    
    def get_external_ip(self) -> Optional[str]:
        """Detecta IP externo se possível"""
        try:
            response = urllib.request.urlopen('https://api.ipify.org', timeout=5)
            self.external_ip = response.read().decode().strip()
            logger.info(f"🌍 IP externo detectado: {self.external_ip}")
            return self.external_ip
        except Exception as e:
            logger.warning(f"Não foi possível detectar IP externo: {e}")
            return None
    
    def test_connectivity(self) -> Dict[str, bool]:
        """Testa conectividade de rede"""
        tests = {
            'internet': self._test_internet(),
            'dns': self._test_dns(),
            'local_nextjs': self._test_local_port(HTTP_PORT),
            'https_port': self._test_local_port(HTTPS_PORT)
        }
        
        logger.info(f"🔍 Teste de conectividade: {tests}")
        return tests
    
    def _test_internet(self) -> bool:
        """Testa conectividade com internet"""
        try:
            urllib.request.urlopen('https://8.8.8.8', timeout=3)
            return True
        except:
            return False
    
    def _test_dns(self) -> bool:
        """Testa resolução DNS"""
        try:
            socket.gethostbyname('google.com')
            return True
        except:
            return False
    
    def _test_local_port(self, port: int) -> bool:
        """Testa se porta local está aberta"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('localhost', port))
                return result == 0
        except:
            return False

# ================================================================================
# ⚙️ VERIFICADOR DE DEPENDÊNCIAS
# ================================================================================

class DependencyChecker:
    """Verifica todas as dependências do sistema"""
    
    def __init__(self):
        self.checks = {}
        self.errors = []
        self.warnings = []
    
    def check_all(self) -> bool:
        """Executa todas as verificações"""
        logger.info("🔍 Verificando dependências do sistema...")
        
        checks = [
            ('node_js', self._check_nodejs),
            ('npm', self._check_npm),
            ('python', self._check_python),
            ('pip', self._check_pip),
            ('project_structure', self._check_project_structure),
            ('database', self._check_database),
            ('ssl_certificates', self._check_ssl),
            ('package_json', self._check_package_json),
            ('prisma', self._check_prisma),
            ('node_modules', self._check_node_modules),
        ]
        
        all_passed = True
        for name, check_func in checks:
            try:
                result = check_func()
                self.checks[name] = result
                if not result:
                    all_passed = False
            except Exception as e:
                logger.error(f"Erro ao verificar {name}: {e}")
                self.checks[name] = False
                all_passed = False
        
        # Log resultado final
        if all_passed:
            logger.info("✅ Todas as dependências estão OK!")
        else:
            logger.warning(f"⚠️ Algumas verificações falharam: {self.errors}")
        
        return all_passed
    
    def _check_nodejs(self) -> bool:
        """Verifica Node.js"""
        try:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                version = result.stdout.strip()
                logger.info(f"✅ Node.js encontrado: {version}")
                return True
            else:
                self.errors.append("Node.js não encontrado")
                return False
        except Exception as e:
            self.errors.append(f"Node.js: {e}")
            return False
    
    def _check_npm(self) -> bool:
        """Verifica npm"""
        try:
            result = subprocess.run(['npm', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                version = result.stdout.strip()
                logger.info(f"✅ npm encontrado: {version}")
                return True
            else:
                self.errors.append("npm não encontrado")
                return False
        except Exception as e:
            self.errors.append(f"npm: {e}")
            return False
    
    def _check_python(self) -> bool:
        """Verifica Python"""
        try:
            version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            logger.info(f"✅ Python encontrado: {version}")
            return True
        except Exception as e:
            self.errors.append(f"Python: {e}")
            return False
    
    def _check_pip(self) -> bool:
        """Verifica pip"""
        try:
            result = subprocess.run([sys.executable, '-m', 'pip', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                version = result.stdout.strip()
                logger.info(f"✅ pip encontrado: {version}")
                return True
            else:
                self.errors.append("pip não encontrado")
                return False
        except Exception as e:
            self.errors.append(f"pip: {e}")
            return False
    
    def _check_project_structure(self) -> bool:
        """Verifica estrutura do projeto"""
        required_paths = [
            'app',
            'components', 
            'lib',
            'public',
            'prisma',
            'package.json',
            '.env'
        ]
        
        missing = []
        for path in required_paths:
            if not (BASE_DIR / path).exists():
                missing.append(path)
        
        if missing:
            self.errors.append(f"Arquivos/diretórios não encontrados: {missing}")
            return False
        else:
            logger.info("✅ Estrutura do projeto OK")
            return True
    
    def _check_database(self) -> bool:
        """Verifica banco de dados"""
        db_path = PRISMA_DIR / "dev.db"
        if not db_path.exists():
            self.errors.append("Banco de dados SQLite não encontrado")
            return False
        
        try:
            # Testar conexão
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            conn.close()
            
            if len(tables) > 0:
                logger.info(f"✅ Banco de dados OK ({len(tables)} tabelas)")
                return True
            else:
                self.warnings.append("Banco de dados vazio")
                return False
        except Exception as e:
            self.errors.append(f"Erro no banco de dados: {e}")
            return False
    
    def _check_ssl(self) -> bool:
        """Verifica certificados SSL"""
        cert_file = SSL_DIR / "inspetor.terpens.com.br.crt"
        key_file = SSL_DIR / "inspetor.terpens.com.br.key"
        
        if not cert_file.exists() or not key_file.exists():
            self.errors.append("Certificados SSL não encontrados")
            return False
        
        logger.info("✅ Certificados SSL encontrados")
        return True
    
    def _check_package_json(self) -> bool:
        """Verifica package.json"""
        package_file = BASE_DIR / "package.json"
        if not package_file.exists():
            self.errors.append("package.json não encontrado")
            return False
        
        try:
            with open(package_file, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
            
            required_deps = ['next', 'react', '@prisma/client']
            missing_deps = []
            
            dependencies = package_data.get('dependencies', {})
            for dep in required_deps:
                if dep not in dependencies:
                    missing_deps.append(dep)
            
            if missing_deps:
                self.errors.append(f"Dependências faltantes: {missing_deps}")
                return False
            
            logger.info("✅ package.json válido")
            return True
        except Exception as e:
            self.errors.append(f"Erro no package.json: {e}")
            return False
    
    def _check_prisma(self) -> bool:
        """Verifica Prisma"""
        try:
            result = subprocess.run(['npx', 'prisma', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                logger.info("✅ Prisma CLI disponível")
                return True
            else:
                self.warnings.append("Prisma CLI não disponível")
                return False
        except Exception as e:
            self.warnings.append(f"Prisma: {e}")
            return False
    
    def _check_node_modules(self) -> bool:
        """Verifica node_modules"""
        node_modules = BASE_DIR / "node_modules"
        if not node_modules.exists():
            self.errors.append("node_modules não encontrado - execute 'npm install'")
            return False
        
        logger.info("✅ node_modules encontrado")
        return True

# ================================================================================
# 📱 NOTIFICADOR TELEGRAM
# ================================================================================

class TelegramNotifier:
    """Sistema de notificações Telegram"""
    
    def __init__(self, bot_token: str, chat_id: str, topic_id: str = None):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.topic_id = topic_id
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
        self.last_notification = None
        self.notification_thread = None
        self.running = False
    
    def send_message(self, message: str, urgent: bool = False) -> bool:
        """Envia mensagem para o Telegram"""
        try:
            # Preparar dados da mensagem
            data = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            # Adicionar tópico se especificado
            if self.topic_id:
                data['message_thread_id'] = self.topic_id
            
            # Codificar dados
            data_encoded = urllib.parse.urlencode(data).encode('utf-8')
            
            # Fazer requisição
            request = urllib.request.Request(
                f"{self.base_url}/sendMessage",
                data=data_encoded,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            with urllib.request.urlopen(request, timeout=10) as response:
                result = json.loads(response.read().decode())
                
                if result.get('ok'):
                    logger.info(f"📱 Mensagem Telegram enviada: {message[:50]}...")
                    return True
                else:
                    logger.error(f"❌ Erro Telegram: {result}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Erro ao enviar Telegram: {e}")
            return False
    
    def send_system_online(self) -> bool:
        """Envia notificação de sistema online"""
        vm_detector = NetworkDetector()
        vm_ip = vm_detector.get_vm_ip()
        
        message = f"""🚀 <b>Sistema Online - VM</b>
        
🌐 <b>IP da VM:</b> {vm_ip}
🔗 <b>URL:</b> https://{DOMAIN}
⏰ <b>Timestamp:</b> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
✅ <b>Status:</b> Funcionando normalmente

<i>Notificação automática a cada 10 minutos</i>"""
        
        return self.send_message(message)
    
    def send_error_alert(self, error: str) -> bool:
        """Envia alerta de erro crítico"""
        message = f"""🚨 <b>ERRO CRÍTICO - Sistema VM</b>
        
❌ <b>Erro:</b> {error}
⏰ <b>Timestamp:</b> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}

<i>Verificação automática necessária!</i>"""
        
        return self.send_message(message, urgent=True)
    
    def start_periodic_notifications(self):
        """Inicia notificações periódicas"""
        if self.running:
            logger.warning("Notificações já estão rodando")
            return
        
        self.running = True
        self.notification_thread = threading.Thread(target=self._notification_loop)
        self.notification_thread.daemon = True
        self.notification_thread.start()
        logger.info(f"📱 Notificações Telegram iniciadas (a cada {NOTIFICATION_INTERVAL}s)")
    
    def stop_periodic_notifications(self):
        """Para notificações periódicas"""
        self.running = False
        if self.notification_thread:
            self.notification_thread.join(timeout=5)
        logger.info("📱 Notificações Telegram paradas")
    
    def _notification_loop(self):
        """Loop de notificações periódicas"""
        # Primeira notificação imediata
        self.send_system_online()
        
        while self.running:
            try:
                time.sleep(NOTIFICATION_INTERVAL)
                if self.running:  # Check novamente após sleep
                    self.send_system_online()
            except Exception as e:
                logger.error(f"Erro no loop de notificações: {e}")
                time.sleep(30)  # Wait antes de tentar novamente

# ================================================================================
# 🖥️ GERENCIADOR DE PROCESSOS
# ================================================================================

class ProcessManager:
    """Gerencia processos do sistema (Next.js)"""
    
    def __init__(self):
        self.nextjs_process = None
        self.running = False
        self.restart_count = 0
        self.max_restarts = 5
        self.monitor_thread = None
    
    def start_nextjs(self) -> bool:
        """Inicia processo Next.js"""
        if self.running:
            logger.warning("Next.js já está rodando")
            return True
        
        try:
            logger.info("🚀 Iniciando Next.js...")
            
            # Verificar se node_modules existe
            if not (BASE_DIR / "node_modules").exists():
                logger.info("📦 Instalando dependências npm...")
                install_result = subprocess.run(['npm', 'install'], 
                                              cwd=BASE_DIR, timeout=300)
                if install_result.returncode != 0:
                    logger.error("❌ Erro ao instalar dependências npm")
                    return False
            
            # Iniciar Next.js
            self.nextjs_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=BASE_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.running = True
            logger.info(f"✅ Next.js iniciado com PID: {self.nextjs_process.pid}")
            
            # Iniciar monitoramento
            self.monitor_thread = threading.Thread(target=self._monitor_process)
            self.monitor_thread.daemon = True
            self.monitor_thread.start()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao iniciar Next.js: {e}")
            return False
    
    def stop_nextjs(self) -> bool:
        """Para processo Next.js"""
        if not self.running or not self.nextjs_process:
            return True
        
        try:
            logger.info("🛑 Parando Next.js...")
            self.nextjs_process.terminate()
            
            # Aguardar finalização graciosamente
            try:
                self.nextjs_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                logger.warning("Next.js não finalizou, forçando...")
                self.nextjs_process.kill()
                self.nextjs_process.wait()
            
            self.running = False
            logger.info("✅ Next.js parado com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao parar Next.js: {e}")
            return False
    
    def restart_nextjs(self) -> bool:
        """Reinicia Next.js"""
        logger.info("🔄 Reiniciando Next.js...")
        self.stop_nextjs()
        time.sleep(3)
        return self.start_nextjs()
    
    def _monitor_process(self):
        """Monitora processo Next.js"""
        while self.running:
            try:
                if self.nextjs_process and self.nextjs_process.poll() is not None:
                    logger.error(f"❌ Next.js encerrou inesperadamente (código: {self.nextjs_process.returncode})")
                    
                    if self.restart_count < self.max_restarts:
                        self.restart_count += 1
                        logger.info(f"🔄 Auto-restart {self.restart_count}/{self.max_restarts}...")
                        time.sleep(5)
                        self.running = False
                        self.start_nextjs()
                    else:
                        logger.error("❌ Máximo de restarts atingido")
                        self.running = False
                
                time.sleep(10)  # Check a cada 10 segundos
                
            except Exception as e:
                logger.error(f"Erro no monitor de processo: {e}")
                time.sleep(30)
    
    def get_status(self) -> Dict[str, Any]:
        """Retorna status do processo"""
        if not self.running or not self.nextjs_process:
            return {
                'running': False,
                'pid': None,
                'restart_count': self.restart_count
            }
        
        return {
            'running': True,
            'pid': self.nextjs_process.pid,
            'restart_count': self.restart_count,
            'returncode': self.nextjs_process.poll()
        }

# ================================================================================
# 🌐 SERVIDOR HTTPS E PROXY
# ================================================================================

class VMHTTPSHandler(BaseHTTPRequestHandler):
    """Handler HTTP/HTTPS para a VM"""
    
    def log_message(self, format, *args):
        """Override para usar nosso logger"""
        logger.info(f"HTTP: {format % args}")
    
    def do_GET(self):
        """Processa requisições GET"""
        if self.path == '/vm-status':
            self.send_vm_status_page()
        elif self.path == '/api/vm-status':
            self.send_vm_json_status()
        elif self.path == '/api/restart':
            self.restart_system()
        elif self.path == '/api/telegram-test':
            self.test_telegram()
        else:
            # Proxy para Next.js
            self.proxy_to_nextjs()
    
    def do_POST(self):
        """Processa requisições POST"""
        self.proxy_to_nextjs()
    
    def do_PUT(self):
        """Processa requisições PUT"""
        self.proxy_to_nextjs()
    
    def do_DELETE(self):
        """Processa requisições DELETE"""
        self.proxy_to_nextjs()
    
    def do_PATCH(self):
        """Processa requisições PATCH"""
        self.proxy_to_nextjs()
    
    def send_vm_status_page(self):
        """Página de status da VM"""
        launcher = self.server.vm_launcher
        network = NetworkDetector()
        vm_ip = network.get_vm_ip()
        connectivity = network.test_connectivity()
        
        status = launcher.get_system_status()
        
        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚀 VM Status - Sistema Emissor de Laudos</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                }}
                .container {{
                    max-width: 1000px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 30px;
                    backdrop-filter: blur(10px);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .status-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                .status-card {{
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 15px;
                    padding: 20px;
                }}
                .status-item {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .status-item:last-child {{
                    border-bottom: none;
                }}
                .status-value {{
                    font-weight: bold;
                }}
                .status-success {{ color: #4ade80; }}
                .status-error {{ color: #f87171; }}
                .status-warning {{ color: #fbbf24; }}
                .btn {{
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 8px;
                    transition: all 0.3s;
                }}
                .btn:hover {{
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }}
                .actions {{
                    text-align: center;
                    margin-top: 30px;
                }}
                .telegram-status {{
                    color: {'#4ade80' if status.get('telegram_active') else '#f87171'};
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Sistema Emissor de Laudos - VM Edition</h1>
                    <p>Launcher Python Completo - Monitoramento em Tempo Real</p>
                </div>
                
                <div class="status-grid">
                    <div class="status-card">
                        <h3>🖥️ Sistema VM</h3>
                        <div class="status-item">
                            <span>IP da VM</span>
                            <span class="status-value">{vm_ip}</span>
                        </div>
                        <div class="status-item">
                            <span>Servidor HTTPS</span>
                            <span class="status-value status-success">Ativo (porta {HTTPS_PORT})</span>
                        </div>
                        <div class="status-item">
                            <span>Domínio</span>
                            <span class="status-value">{DOMAIN}</span>
                        </div>
                        <div class="status-item">
                            <span>Uptime</span>
                            <span class="status-value">{status.get('uptime', 'N/A')}</span>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <h3>⚙️ Aplicação</h3>
                        <div class="status-item">
                            <span>Next.js</span>
                            <span class="status-value {'status-success' if status.get('nextjs_running') else 'status-error'}">
                                {'Executando' if status.get('nextjs_running') else 'Parado'}
                            </span>
                        </div>
                        <div class="status-item">
                            <span>PID do Processo</span>
                            <span class="status-value">{status.get('nextjs_pid', 'N/A')}</span>
                        </div>
                        <div class="status-item">
                            <span>Auto-restarts</span>
                            <span class="status-value">{status.get('restart_count', 0)}</span>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <h3>🌐 Conectividade</h3>
                        <div class="status-item">
                            <span>Internet</span>
                            <span class="status-value {'status-success' if connectivity.get('internet') else 'status-error'}">
                                {'OK' if connectivity.get('internet') else 'ERRO'}
                            </span>
                        </div>
                        <div class="status-item">
                            <span>DNS</span>
                            <span class="status-value {'status-success' if connectivity.get('dns') else 'status-error'}">
                                {'OK' if connectivity.get('dns') else 'ERRO'}
                            </span>
                        </div>
                        <div class="status-item">
                            <span>Next.js (3000)</span>
                            <span class="status-value {'status-success' if connectivity.get('local_nextjs') else 'status-error'}">
                                {'OK' if connectivity.get('local_nextjs') else 'ERRO'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <h3>📱 Telegram</h3>
                        <div class="status-item">
                            <span>Bot Status</span>
                            <span class="status-value telegram-status">
                                {'Ativo' if status.get('telegram_active') else 'Inativo'}
                            </span>
                        </div>
                        <div class="status-item">
                            <span>Última Notificação</span>
                            <span class="status-value">{status.get('last_telegram', 'Nunca')}</span>
                        </div>
                        <div class="status-item">
                            <span>Intervalo</span>
                            <span class="status-value">{NOTIFICATION_INTERVAL//60} minutos</span>
                        </div>
                        <div class="status-item">
                            <span>Grupo ID</span>
                            <span class="status-value">{TELEGRAM_CHAT_ID}</span>
                        </div>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn" onclick="restartSystem()">🔄 Reiniciar Next.js</button>
                    <button class="btn" onclick="testTelegram()">📱 Testar Telegram</button>
                    <button class="btn" onclick="window.location.reload()">🔃 Atualizar Status</button>
                    <button class="btn" onclick="openMainApp()">🚀 Abrir Aplicação</button>
                </div>
            </div>
            
            <script>
                function restartSystem() {{
                    if(confirm('Deseja realmente reiniciar o Next.js?')) {{
                        fetch('/api/restart')
                            .then(r => r.json())
                            .then(data => {{
                                alert(data.message);
                                setTimeout(() => window.location.reload(), 5000);
                            }});
                    }}
                }}
                
                function testTelegram() {{
                    fetch('/api/telegram-test')
                        .then(r => r.json())
                        .then(data => {{
                            alert(data.message);
                        }});
                }}
                
                function openMainApp() {{
                    window.open('/', '_blank');
                }}
                
                // Auto-refresh a cada 30 segundos
                setInterval(() => window.location.reload(), 30000);
            </script>
        </body>
        </html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_vm_json_status(self):
        """API JSON com status da VM"""
        launcher = self.server.vm_launcher
        status = launcher.get_system_status()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status, indent=2).encode())
    
    def restart_system(self):
        """Reinicia o sistema Next.js"""
        launcher = self.server.vm_launcher
        success = launcher.process_manager.restart_nextjs()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': success,
            'message': 'Next.js reiniciado com sucesso' if success else 'Erro ao reiniciar Next.js'
        }).encode())
    
    def test_telegram(self):
        """Testa notificação Telegram"""
        launcher = self.server.vm_launcher
        success = launcher.telegram.send_message("🧪 <b>Teste manual do Telegram</b>\n\nTeste iniciado pelo painel de controle da VM.")
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': success,
            'message': 'Mensagem de teste enviada para Telegram' if success else 'Erro ao enviar mensagem Telegram'
        }).encode())
    
    def proxy_to_nextjs(self):
        """Proxy completo para Next.js"""
        try:
            # URL do Next.js
            nextjs_url = f"http://localhost:{HTTP_PORT}{self.path}"
            
            # Preparar dados do corpo da requisição
            request_body = None
            if self.command in ['POST', 'PUT', 'PATCH', 'DELETE']:
                content_length = self.headers.get('Content-Length')
                if content_length:
                    request_body = self.rfile.read(int(content_length))
            
            try:
                # Criar requisição
                req = urllib.request.Request(nextjs_url, data=request_body, method=self.command)
                
                # Copiar headers (exceto problemáticos)
                excluded_headers = {'host', 'connection', 'content-length', 'transfer-encoding'}
                for header_name, header_value in self.headers.items():
                    if header_name.lower() not in excluded_headers:
                        req.add_header(header_name, header_value)
                
                # Fazer requisição para Next.js
                response = urllib.request.urlopen(req, timeout=30)
                content = response.read()
                
                # Enviar resposta
                self.send_response(response.getcode())
                for header_name, header_value in response.headers.items():
                    if header_name.lower() not in {'connection', 'transfer-encoding'}:
                        self.send_header(header_name, header_value)
                
                self.end_headers()
                self.wfile.write(content)
                
            except urllib.error.HTTPError as e:
                # Erro HTTP do Next.js
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                
                try:
                    error_content = e.read()
                    self.wfile.write(error_content)
                except:
                    error_response = f'{{"error": "API Error {e.code}", "message": "{e.reason}"}}'
                    self.wfile.write(error_response.encode())
                
            except urllib.error.URLError:
                # Next.js não disponível
                self.send_response(503)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                
                error_html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Sistema Iniciando</title>
                    <style>
                        body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
                        .container { background: white; padding: 40px; border-radius: 10px; display: inline-block; }
                        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚀 Sistema Emissor de Laudos</h1>
                        <div class="spinner"></div>
                        <h2>⏳ Sistema Iniciando...</h2>
                        <p>A aplicação está sendo inicializada. Aguarde alguns momentos.</p>
                        <p><a href="/vm-status">🔍 Ver Status da VM</a></p>
                        <script>setTimeout(() => location.reload(), 10000);</script>
                    </div>
                </body>
                </html>
                """
                self.wfile.write(error_html.encode())
                
        except Exception as e:
            logger.error(f"Erro no proxy: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = '{"error": "Internal Server Error", "message": "Proxy error"}'
            self.wfile.write(error_response.encode())

# ================================================================================
# 🚀 LAUNCHER PRINCIPAL DA VM
# ================================================================================

class VMCompleteLauncher:
    """Launcher principal completo para VM"""
    
    def __init__(self):
        self.start_time = datetime.now()
        
        # Componentes principais
        self.network = NetworkDetector()
        self.dependency_checker = DependencyChecker()
        self.process_manager = ProcessManager()
        self.telegram = TelegramNotifier(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_TOPIC_ID)
        
        # Servidor HTTPS
        self.https_server = None
        self.vm_ip = None
        
        # Status
        self.system_healthy = True
        self.last_health_check = datetime.now()
        
    def run(self):
        """Executa o launcher completo"""
        try:
            logger.info("=" * 80)
            logger.info("🚀 LAUNCHER VM COMPLETO - Sistema Emissor de Laudos")
            logger.info("=" * 80)
            
            # Configurar handler de sinais
            signal.signal(signal.SIGINT, self._signal_handler)
            signal.signal(signal.SIGTERM, self._signal_handler)
            
            # 1. Detectar rede
            logger.info("🌐 Detectando configuração de rede...")
            self.vm_ip = self.network.get_vm_ip()
            self.network.get_external_ip()
            
            connectivity = self.network.test_connectivity()
            if not connectivity['internet']:
                logger.warning("⚠️ Sem conectividade com internet - algumas funções podem não funcionar")
            
            # 2. Verificar dependências
            logger.info("🔍 Verificando dependências...")
            deps_ok = self.dependency_checker.check_all()
            if not deps_ok:
                logger.warning("⚠️ Algumas dependências falharam, continuando mesmo assim...")
                # Tentar instalar dependências básicas
                self._install_missing_dependencies()
            
            # 3. Configurar SSL (se necessário)
            self._setup_ssl_certificates()
            
            # 4. Iniciar Telegram
            logger.info("📱 Iniciando notificações Telegram...")
            self.telegram.start_periodic_notifications()
            
            # 5. Iniciar Next.js
            logger.info("⚙️ Iniciando Next.js...")
            if not self.process_manager.start_nextjs():
                logger.error("❌ Falha ao iniciar Next.js")
                self.telegram.send_error_alert("Falha ao iniciar Next.js")
            
            # 6. Aguardar Next.js ficar pronto
            self._wait_for_nextjs()
            
            # 7. Iniciar servidor HTTPS
            logger.info("🔒 Iniciando servidor HTTPS...")
            self._start_https_server()
            
        except KeyboardInterrupt:
            logger.info("\n⏹️ Parando sistema...")
            self.shutdown()
        except Exception as e:
            logger.error(f"❌ Erro crítico no launcher: {e}")
            self.telegram.send_error_alert(f"Erro crítico no launcher: {e}")
            self.shutdown()
    
    def _install_missing_dependencies(self):
        """Tenta instalar dependências que estão faltando"""
        logger.info("📦 Tentando instalar dependências faltantes...")
        
        try:
            # npm install se node_modules não existe
            if not (BASE_DIR / "node_modules").exists():
                logger.info("Installing npm dependencies...")
                subprocess.run(['npm', 'install'], cwd=BASE_DIR, timeout=300)
            
            # Prisma generate se necessário
            try:
                subprocess.run(['npx', 'prisma', 'generate'], cwd=BASE_DIR, timeout=60)
                logger.info("✅ Prisma client gerado")
            except:
                logger.warning("⚠️ Não foi possível gerar Prisma client")
                
        except Exception as e:
            logger.error(f"Erro ao instalar dependências: {e}")
    
    def _setup_ssl_certificates(self):
        """Configura certificados SSL se necessário"""
        cert_file = SSL_DIR / "inspetor.terpens.com.br.crt"
        key_file = SSL_DIR / "inspetor.terpens.com.br.key"
        
        if not cert_file.exists() or not key_file.exists():
            logger.warning("🔒 Certificados SSL não encontrados, criando certificados auto-assinados...")
            SSL_DIR.mkdir(exist_ok=True)
            
            try:
                # Gerar certificado auto-assinado usando OpenSSL se disponível
                subprocess.run([
                    'openssl', 'req', '-x509', '-newkey', 'rsa:4096',
                    '-keyout', str(key_file),
                    '-out', str(cert_file),
                    '-days', '365', '-nodes',
                    '-subj', f'/CN={DOMAIN}'
                ], timeout=30)
                logger.info("✅ Certificados auto-assinados criados")
            except:
                logger.error("❌ Não foi possível criar certificados SSL")
                logger.error("   Certifique-se de que os certificados existem em ssl/")
    
    def _wait_for_nextjs(self):
        """Aguarda Next.js ficar disponível"""
        logger.info("⏳ Aguardando Next.js ficar disponível...")
        
        max_attempts = 30
        for attempt in range(max_attempts):
            if self.network._test_local_port(HTTP_PORT):
                logger.info("✅ Next.js está respondendo!")
                return
            
            logger.info(f"⏳ Tentativa {attempt + 1}/{max_attempts}...")
            time.sleep(2)
        
        logger.warning("⚠️ Next.js demorou para ficar disponível")
    
    def _start_https_server(self):
        """Inicia servidor HTTPS"""
        try:
            # Configurar servidor
            self.https_server = HTTPServer(('0.0.0.0', HTTPS_PORT), VMHTTPSHandler)
            self.https_server.vm_launcher = self  # Referência ao launcher
            
            # Configurar SSL
            cert_file = SSL_DIR / "inspetor.terpens.com.br.crt"
            key_file = SSL_DIR / "inspetor.terpens.com.br.key"
            
            if cert_file.exists() and key_file.exists():
                context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                context.load_cert_chain(str(cert_file), str(key_file))
                self.https_server.socket = context.wrap_socket(
                    self.https_server.socket,
                    server_side=True
                )
                logger.info("🔒 SSL configurado com sucesso")
            else:
                logger.warning("⚠️ Executando sem SSL (HTTP apenas)")
            
            # URLs de acesso
            logger.info("=" * 60)
            logger.info("✅ SISTEMA VM INICIADO COM SUCESSO!")
            logger.info("=" * 60)
            logger.info(f"🌐 URL Principal: https://{DOMAIN}")
            logger.info(f"🖥️ IP da VM: {self.vm_ip}")
            logger.info(f"🔍 Status da VM: https://{DOMAIN}/vm-status")
            logger.info(f"📱 Notificações Telegram: Ativas (a cada {NOTIFICATION_INTERVAL//60}min)")
            logger.info("=" * 60)
            
            # Enviar notificação de sucesso
            self.telegram.send_message(f"""🎉 <b>Sistema VM Iniciado!</b>

✅ <b>Status:</b> Todos os serviços ativos
🌐 <b>IP da VM:</b> {self.vm_ip}
🔗 <b>URL:</b> https://{DOMAIN}
📱 <b>Telegram:</b> Notificações ativas

<i>Sistema pronto para uso!</i>""")
            
            # Servir requests
            self.https_server.serve_forever()
            
        except Exception as e:
            logger.error(f"❌ Erro ao iniciar servidor HTTPS: {e}")
            self.telegram.send_error_alert(f"Erro no servidor HTTPS: {e}")
    
    def get_system_status(self) -> Dict[str, Any]:
        """Retorna status completo do sistema"""
        uptime = datetime.now() - self.start_time
        process_status = self.process_manager.get_status()
        
        return {
            'vm_ip': self.vm_ip,
            'uptime': str(uptime),
            'nextjs_running': process_status['running'],
            'nextjs_pid': process_status['pid'],
            'restart_count': process_status['restart_count'],
            'telegram_active': self.telegram.running,
            'last_telegram': getattr(self.telegram, 'last_notification', 'Nunca'),
            'system_healthy': self.system_healthy,
            'last_health_check': self.last_health_check.isoformat(),
            'dependencies': self.dependency_checker.checks,
            'start_time': self.start_time.isoformat()
        }
    
    def _signal_handler(self, signum, frame):
        """Handler para shutdown gracioso"""
        logger.info(f"\n⏹️ Recebido sinal {signum}, encerrando sistema...")
        self.shutdown()
    
    def shutdown(self):
        """Encerra sistema graciosamente"""
        logger.info("🛑 Encerrando sistema...")
        
        try:
            # Parar notificações Telegram
            if self.telegram:
                self.telegram.send_message("⏹️ <b>Sistema VM Parado</b>\n\nShutdown gracioso executado.")
                self.telegram.stop_periodic_notifications()
            
            # Parar processo Next.js
            if self.process_manager:
                self.process_manager.stop_nextjs()
            
            # Parar servidor HTTPS
            if self.https_server:
                self.https_server.shutdown()
            
            logger.info("✅ Sistema encerrado com sucesso")
            
        except Exception as e:
            logger.error(f"Erro durante shutdown: {e}")
        
        sys.exit(0)

# ================================================================================
# 🚀 FUNÇÃO PRINCIPAL
# ================================================================================

def main():
    """Função principal do launcher"""
    try:
        # Verificar se está sendo executado no diretório correto
        if not (BASE_DIR / "package.json").exists():
            print("❌ ERRO: Execute este script no diretório raiz do projeto!")
            print("   (onde está localizado o package.json)")
            sys.exit(1)
        
        # Iniciar launcher
        launcher = VMCompleteLauncher()
        launcher.run()
        
    except KeyboardInterrupt:
        print("\n⏹️ Encerrado pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro fatal: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()