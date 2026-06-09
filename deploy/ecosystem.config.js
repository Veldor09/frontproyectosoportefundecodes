// =============================================================
//  PM2 ecosystem — alternativa sin Docker
//  Uso:
//    pm2 start deploy/ecosystem.config.js --env production
//    pm2 save && pm2 startup
// =============================================================

module.exports = {
  apps: [
    {
      name: "fundecodes-backend",
      cwd: "/opt/fundecodes/backfundecodesdigital",
      script: "dist/main.js",
      instances: "max",           // cluster mode — usa todos los cores
      exec_mode: "cluster",
      max_memory_restart: "512M", // reinicia si excede
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      out_file: "/var/log/fundecodes/backend-out.log",
      error_file: "/var/log/fundecodes/backend-err.log",
      time: true,
    },
    {
      name: "fundecodes-frontend",
      cwd: "/opt/fundecodes/frontfundecodesdigital",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1, // Next.js ya hace su propio manejo interno
      exec_mode: "fork",
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "/var/log/fundecodes/frontend-out.log",
      error_file: "/var/log/fundecodes/frontend-err.log",
      time: true,
    },
  ],
};
