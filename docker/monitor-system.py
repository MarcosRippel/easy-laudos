#!/usr/bin/env python3
"""
Sistema de Monitoramento - Container Docker
Sistema Emissor de Laudos - IP Virtual: 172.20.0.10
"""

import os
import sys
import json
import time
import psutil
import sqlite3
import subprocess
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

def setup_logging():
    log_dir = Path("/app/logs")
    log_dir.mkdir(exist_ok=True)
    
    log_file = log_dir / f"monitor_{datetime.now().strftime('%Y%m%d')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

class ContainerMonitor:
    """Sistema de monitoramento para container Docker"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.metrics_history = []
        self.alerts = []
        self.thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "disk_percent": 90.0,
            "response_time_ms": 5000,
            "error_rate": 0.05
        }
    
    def collect_system_metrics(self) -> Dict:
        """Coleta métricas do sistema"""
        try:
            # Métricas de CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Métricas de memória
            memory = psutil.virtual_memory()
            
            # Métricas de disco
            disk = psutil.disk_usage("/")
            
            # Métricas de rede
            network = psutil.net_io_counters()
            
            metrics = {
                "timestamp": datetime.now().isoformat(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used
                },
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                }
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Erro ao coletar métricas do sistema: {e}")
            return {}
    
    def check_nextjs_health(self) -> Dict:
        """Verifica saúde do Next.js"""
        try:
            import urllib.request
            import urllib.error
            
            start_time = time.time()
            
            try:
                response = urllib.request.urlopen("http://localhost:3000/api/health", timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                return {
                    "status": "healthy",
                    "response_time_ms": response_time,
                    "status_code": response.getcode()
                }
            except urllib.error.HTTPError as e:
                return {
                    "status": "error",
                    "response_time_ms": (time.time() - start_time) * 1000,
                    "status_code": e.code,
                    "error": str(e)
                }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "response_time_ms": None,
                    "error": str(e)
                }
                
        except Exception as e:
            logger.error(f"Erro ao verificar saúde do Next.js: {e}")
            return {"status": "unknown", "error": str(e)}
    
    def check_database_health(self) -> Dict:
        """Verifica saúde do banco de dados"""
        try:
            db_path = "/app/prisma/dev.db"
            
            if not os.path.exists(db_path):
                return {"status": "missing", "error": "Database file not found"}
            
            start_time = time.time()
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Teste de conectividade
            cursor.execute("SELECT 1")
            
            # Verificar integridade
            cursor.execute("PRAGMA integrity_check")
            integrity_result = cursor.fetchone()
            
            # Estatísticas básicas
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            conn.close()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy" if integrity_result[0] == "ok" else "warning",
                "response_time_ms": response_time,
                "integrity": integrity_result[0] if integrity_result else "unknown",
                "tables_count": len(tables),
                "file_size": os.path.getsize(db_path)
            }
            
        except Exception as e:
            logger.error(f"Erro ao verificar saúde do banco: {e}")
            return {"status": "error", "error": str(e)}
    
    def check_nginx_health(self) -> Dict:
        """Verifica saúde do nginx"""
        try:
            import urllib.request
            
            start_time = time.time()
            
            # Testar HTTP
            try:
                response = urllib.request.urlopen("http://localhost:80/health", timeout=5)
                http_status = "healthy"
                http_code = response.getcode()
            except Exception as e:
                http_status = "error"
                http_code = None
            
            # Testar HTTPS  
            try:
                import ssl
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                
                response = urllib.request.urlopen("https://localhost:443/health", timeout=5, context=context)
                https_status = "healthy"
                https_code = response.getcode()
            except Exception as e:
                https_status = "error"
                https_code = None
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy" if http_status == "healthy" and https_status == "healthy" else "partial",
                "response_time_ms": response_time,
                "http": {
                    "status": http_status,
                    "status_code": http_code
                },
                "https": {
                    "status": https_status,
                    "status_code": https_code
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao verificar saúde do nginx: {e}")
            return {"status": "error", "error": str(e)}
    
    def check_ssl_certificates(self) -> Dict:
        """Verifica status dos certificados SSL"""
        try:
            cert_path = Path("/app/ssl/inspetor.terpens.com.br.crt")
            key_path = Path("/app/ssl/inspetor.terpens.com.br.key")
            
            if not cert_path.exists():
                return {"status": "missing", "error": "Certificate file not found"}
            
            if not key_path.exists():
                return {"status": "missing", "error": "Key file not found"}
            
            # Verificar expiração do certificado
            try:
                import ssl
                import socket
                
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                
                with socket.create_connection(("localhost", 443), timeout=5) as sock:
                    with context.wrap_socket(sock, server_hostname="localhost") as ssock:
                        cert_info = ssock.getpeercert()
                        
                        if cert_info:
                            not_after = cert_info.get('notAfter')
                            if not_after:
                                from datetime import datetime
                                expiry_date = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                                days_until_expiry = (expiry_date - datetime.now()).days
                                
                                return {
                                    "status": "healthy" if days_until_expiry > 7 else "warning",
                                    "expiry_date": not_after,
                                    "days_until_expiry": days_until_expiry,
                                    "subject": cert_info.get('subject'),
                                    "issuer": cert_info.get('issuer')
                                }
                
                return {"status": "unknown", "error": "Could not retrieve certificate info"}
                
            except Exception as e:
                # Se não conseguir conectar via SSL, pelo menos verificar se os arquivos existem
                return {
                    "status": "present",
                    "cert_file_size": cert_path.stat().st_size,
                    "key_file_size": key_path.stat().st_size,
                    "warning": f"Could not verify expiration: {str(e)}"
                }
                
        except Exception as e:
            logger.error(f"Erro ao verificar certificados SSL: {e}")
            return {"status": "error", "error": str(e)}
    
    def generate_health_report(self) -> Dict:
        """Gera relatório completo de saúde"""
        logger.info("Gerando relatório de saúde do sistema...")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "uptime_seconds": (datetime.now() - self.start_time).total_seconds(),
            "container_ip": "172.20.0.10",
            "system_metrics": self.collect_system_metrics(),
            "services": {
                "nextjs": self.check_nextjs_health(),
                "database": self.check_database_health(),
                "nginx": self.check_nginx_health(),
                "ssl": self.check_ssl_certificates()
            }
        }
        
        # Determinar status geral
        service_statuses = []
        for service_name, service_data in report["services"].items():
            status = service_data.get("status", "unknown")
            service_statuses.append(status)
        
        if all(s in ["healthy", "present"] for s in service_statuses):
            report["overall_status"] = "healthy"
        elif any(s == "error" for s in service_statuses):
            report["overall_status"] = "error"
        else:
            report["overall_status"] = "warning"
        
        return report
    
    def check_alerts(self, metrics: Dict):
        """Verifica e gera alertas baseado nas métricas"""
        alerts = []
        
        # Alertas de CPU
        cpu_percent = metrics.get("system_metrics", {}).get("cpu", {}).get("percent", 0)
        if cpu_percent > self.thresholds["cpu_percent"]:
            alerts.append({
                "type": "cpu_high",
                "severity": "warning",
                "message": f"CPU usage high: {cpu_percent:.1f}%",
                "threshold": self.thresholds["cpu_percent"],
                "current": cpu_percent
            })
        
        # Alertas de memória
        memory_percent = metrics.get("system_metrics", {}).get("memory", {}).get("percent", 0)
        if memory_percent > self.thresholds["memory_percent"]:
            alerts.append({
                "type": "memory_high",
                "severity": "warning",
                "message": f"Memory usage high: {memory_percent:.1f}%",
                "threshold": self.thresholds["memory_percent"],
                "current": memory_percent
            })
        
        # Alertas de disco
        disk_percent = metrics.get("system_metrics", {}).get("disk", {}).get("percent", 0)
        if disk_percent > self.thresholds["disk_percent"]:
            alerts.append({
                "type": "disk_high",
                "severity": "critical",
                "message": f"Disk usage high: {disk_percent:.1f}%",
                "threshold": self.thresholds["disk_percent"],
                "current": disk_percent
            })
        
        # Alertas de serviços
        nextjs_status = metrics.get("services", {}).get("nextjs", {}).get("status")
        if nextjs_status not in ["healthy"]:
            alerts.append({
                "type": "service_unhealthy",
                "severity": "critical",
                "message": f"Next.js service status: {nextjs_status}",
                "service": "nextjs"
            })
        
        # Alertas de tempo de resposta
        response_time = metrics.get("services", {}).get("nextjs", {}).get("response_time_ms", 0)
        if response_time and response_time > self.thresholds["response_time_ms"]:
            alerts.append({
                "type": "response_time_high",
                "severity": "warning",
                "message": f"High response time: {response_time:.0f}ms",
                "threshold": self.thresholds["response_time_ms"],
                "current": response_time
            })
        
        if alerts:
            for alert in alerts:
                logger.warning(f"ALERT: {alert['message']}")
        
        return alerts
    
    def run_monitor_cycle(self):
        """Executa um ciclo completo de monitoramento"""
        try:
            report = self.generate_health_report()
            alerts = self.check_alerts(report)
            
            # Salvar métricas históricas
            self.metrics_history.append(report)
            
            # Manter apenas as últimas 100 métricas
            if len(self.metrics_history) > 100:
                self.metrics_history.pop(0)
            
            # Log do status geral
            overall_status = report.get("overall_status", "unknown")
            logger.info(f"Status geral do sistema: {overall_status.upper()}")
            
            if alerts:
                logger.warning(f"Alertas ativos: {len(alerts)}")
            
            return report
            
        except Exception as e:
            logger.error(f"Erro no ciclo de monitoramento: {e}")
            return {"error": str(e)}
    
    def run_continuous_monitor(self, interval_seconds=60):
        """Executa monitoramento contínuo"""
        logger.info("Iniciando monitoramento contínuo...")
        logger.info(f"Intervalo: {interval_seconds} segundos")
        
        try:
            while True:
                self.run_monitor_cycle()
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            logger.info("Monitoramento interrompido pelo usuário")
        except Exception as e:
            logger.error(f"Erro no monitoramento contínuo: {e}")

if __name__ == "__main__":
    monitor = ContainerMonitor()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "report":
            report = monitor.generate_health_report()
            print(json.dumps(report, indent=2))
        elif command == "continuous":
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            monitor.run_continuous_monitor(interval)
        else:
            print("Comandos disponíveis: report, continuous [interval_seconds]")
    else:
        # Execução única
        report = monitor.run_monitor_cycle()
        print(json.dumps(report, indent=2))