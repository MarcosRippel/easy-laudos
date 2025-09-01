import sys, os 
import subprocess 
import threading 
import time 
import http.server 
import ssl 
import socketserver 
import urllib.request 
import urllib.parse 
from datetime import datetime 
 
def log(msg): 
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {msg}") 
 
def start_nextjs(): 
    log("🚀 Iniciando Next.js na porta 3000...") 
    env = os.environ.copy() 
    env.update({ 
        'NODE_ENV': 'production', 
        'DATABASE_URL': 'file:./prisma/dev.db', 
        'NEXTAUTH_URL': 'https://inspetor.terpens.com.br:9443', 
        'NEXT_PUBLIC_APP_URL': 'https://inspetor.terpens.com.br:9443', 
        'DOMAIN': 'inspetor.terpens.com.br' 
    }) 
    import shutil 
    npm_path = shutil.which('npm') 
    if npm_path: 
        log(f"📁 Executando Next.js em: {os.getcwd()}") 
        # Verificar se existe build de produção 
        if os.path.exists('.next/BUILD_ID'): 
            log("🚀 Usando modo produção (npm start)") 
            subprocess.run([npm_path, 'start'], env=env, cwd=os.getcwd()) 
        else: 
            log("⚠️ Build não encontrado, usando modo desenvolvimento") 
            subprocess.run([npm_path, 'run', 'dev'], env=env, cwd=os.getcwd()) 
    else: 
        log("❌ npm não encontrado no PATH!") 
 
class ProxyHandler(http.server.BaseHTTPRequestHandler): 
    def do_GET(self): 
        self.proxy_request() 
    def do_POST(self): 
        self.proxy_request() 
    def do_PUT(self): 
        self.proxy_request() 
    def do_DELETE(self): 
        self.proxy_request() 
    def do_PATCH(self): 
        self.proxy_request() 
    def proxy_request(self): 
        try: 
            target_url = f"http://localhost:3000{self.path}" 
            content_length = int(self.headers.get('Content-Length', 0)) 
            post_data = self.rfile.read(content_length) if content_length > 0 else None 
            req = urllib.request.Request(target_url, data=post_data, method=self.command) 
            for header, value in self.headers.items(): 
                if header.lower() not in ['host', 'content-length']: 
                    req.add_header(header, value) 
            with urllib.request.urlopen(req, timeout=30) as response: 
                self.send_response(response.status) 
                for header, value in response.headers.items(): 
                    self.send_header(header, value) 
                self.end_headers() 
                self.wfile.write(response.read()) 
        except Exception as e: 
            log(f"❌ Erro no proxy: {e}") 
            self.send_error(502, "Bad Gateway") 
 
def start_https_proxy(): 
    log("🔒 Iniciando proxy HTTPS na porta 9443...") 
    try: 
        # Tentar usar IP virtual primeiro, depois IP padrão 
        try: 
            httpd = socketserver.TCPServer(("192.168.100.45", 9443), ProxyHandler) 
            log("🌐 Usando IP virtual: 192.168.100.45:9443") 
        except: 
            httpd = socketserver.TCPServer(("0.0.0.0", 9443), ProxyHandler) 
            log("🌐 Usando IP padrão: 0.0.0.0:9443") 
        ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH) 
        ssl_context.load_cert_chain("ssl/inspetor.terpens.com.br.crt", "ssl/inspetor.terpens.com.br.key") 
        httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True) 
        log("🔒 Proxy HTTPS rodando na porta 9443") 
        log("🌐 Acesse: https://inspetor.terpens.com.br:9443") 
        httpd.serve_forever() 
    except Exception as e: 
        log(f"❌ Erro no HTTPS: {e}") 
 
def start_http_redirect(): 
    log("🔄 Redirecionamento HTTP desabilitado - apenas HTTPS:9443") 
 
if __name__ == '__main__': 
    log("🎯 INICIANDO SISTEMA EMISSOR DE LAUDOS - PORTA 9443") 
    log("🔧 Porta Next.js: 3000 (interno)") 
    log("🔒 Porta HTTPS: 9443 (público)") 
    log("🌐 URL: https://inspetor.terpens.com.br:9443") 
 
    # Iniciar Next.js em thread separada 
    nextjs_thread = threading.Thread(target=start_nextjs) 
    nextjs_thread.daemon = True 
    nextjs_thread.start() 
 
    # Sem redirecionamento HTTP - apenas HTTPS:9443 
 
    # Aguardar Next.js inicializar 
    log("⏳ Aguardando Next.js inicializar...") 
    time.sleep(10) 
 
    # Iniciar proxy HTTPS 
    start_https_proxy() 
