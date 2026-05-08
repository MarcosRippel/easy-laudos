// PM2 Ecosystem Config — Easy Laudos (General Inspetor)
// Este arquivo configura o serviço para rodar 24/7 com auto-restart

module.exports = {
  apps: [
    {
      name: 'easy-laudos',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3006',
      cwd: 'D:\\General Truck System\\CLOUDFLARED\\5. Emissor de Laudos - Inspetor',

      // Auto-restart
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,       // 3s entre restarts
      max_restarts: 50,          // máximo 50 restarts seguidos
      min_uptime: '10s',         // processo precisa durar 10s para contar como "online"

      // Logs
      log_date_format: 'DD/MM/YYYY HH:mm:ss',
      error_file: 'D:\\General Truck System\\CLOUDFLARED\\5. Emissor de Laudos - Inspetor\\logs\\pm2-error.log',
      out_file: 'D:\\General Truck System\\CLOUDFLARED\\5. Emissor de Laudos - Inspetor\\logs\\pm2-out.log',
      merge_logs: true,
      log_type: 'json',

      // Variáveis de ambiente — NODE_ENV=production para next start
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
    },
  ],
};
