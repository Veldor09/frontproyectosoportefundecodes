# Guía de Despliegue — Fundecodes Digital en Hostinger VPS (KVM 2)

Guía paso a paso para desplegar el stack completo (PostgreSQL + NestJS + Next.js + Nginx + SSL) en un VPS Hostinger con Ubuntu 22.04 / 24.04 LTS.

Dos modos soportados:
- **A) Docker Compose (recomendado)** — todo en contenedores, reproducible, 1 comando para arrancar.
- **B) PM2 + Nginx nativo** — procesos Node gestionados por PM2, Postgres en el host.

Elige uno y sigue solo esa ruta. Este documento cubre ambos, pero están claramente separados.

---

## 0. Requisitos previos

- VPS Hostinger KVM 2 (2 vCPU, 8 GB RAM, 100 GB SSD) con Ubuntu 24.04 LTS.
- Dominio apuntado al VPS con dos registros A:
  - `tu-dominio.com` → IP del VPS
  - `api.tu-dominio.com` → IP del VPS
- Acceso SSH con usuario root (lo primero que haremos es crear un usuario no-root).

Durante toda la guía, reemplaza `tu-dominio.com` por tu dominio real.

---

## 1. Endurecimiento inicial del servidor

Conéctate por SSH como root:

```bash
ssh root@IP_DEL_VPS
```

Actualiza y crea usuario no-root:

```bash
apt update && apt upgrade -y
adduser fundecodes
usermod -aG sudo fundecodes
rsync --archive --chown=fundecodes:fundecodes ~/.ssh /home/fundecodes
```

Reingresa como `fundecodes`:

```bash
ssh fundecodes@IP_DEL_VPS
```

**Firewall (UFW):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

**Fail2ban contra brute-force SSH:**

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

**SSH hardening** (edita `/etc/ssh/sshd_config`):

```
PermitRootLogin no
PasswordAuthentication no
```

Reinicia SSH: `sudo systemctl restart ssh`.

**Swap (útil con 8 GB de RAM bajo carga):**

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Zona horaria** (ajusta según corresponda):

```bash
sudo timedatectl set-timezone America/Costa_Rica
```

---

## 2A. Modo Docker Compose (recomendado)

### 2A.1. Instalar Docker y Docker Compose

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

### 2A.2. Estructura de carpetas

```bash
sudo mkdir -p /opt/fundecodes
sudo chown -R $USER:$USER /opt/fundecodes
cd /opt/fundecodes
```

### 2A.3. Clonar repos

```bash
git clone https://github.com/TU_USUARIO/backfundecodesdigital.git
git clone https://github.com/TU_USUARIO/frontfundecodesdigital.git
```

### 2A.4. Copiar archivos de despliegue y crear `.env`s

Los archivos de `deploy/` del frontend son el "centro de mando" del stack:

```bash
cp -r frontfundecodesdigital/deploy .
cp backfundecodesdigital/.env.production.example deploy/.env.back
cp frontfundecodesdigital/.env.production.example deploy/.env.front
cp deploy/.env.stack.example deploy/.env.stack
```

Rellena los tres archivos:

- **`deploy/.env.stack`** — credenciales Postgres + `NEXT_PUBLIC_API_URL` (se hornea en el build del frontend).
- **`deploy/.env.back`** — variables del backend (JWT_SECRET, Mailjet, CORS, etc.).
- **`deploy/.env.front`** — variables públicas del frontend.

> **Genera un JWT_SECRET fuerte:** `openssl rand -base64 48`

### 2A.5. Ajustar Nginx con tu dominio real

```bash
sed -i 's/tu-dominio.com/MI-DOMINIO-REAL.com/g' deploy/nginx/conf.d/fundecodes.conf
```

### 2A.6. Primer arranque sin SSL (para que certbot pueda pedir el cert)

Crea un perfil mínimo HTTP-only temporal — copia `fundecodes.conf` como `bootstrap.conf` y deja solo los bloques `server { listen 80; ... }` con `return 200 'ok'` en `/` (en lugar del redirect). Alternativa simple:

```bash
# Arranca solo db + backend + frontend (sin nginx aún)
cd /opt/fundecodes/deploy
docker compose --env-file .env.stack up -d db backend frontend
docker compose logs -f --tail=100
```

Verifica que suben y que `backend` conecta a `db`. Confirma migraciones:

```bash
docker compose logs backend | grep -i migrat
```

### 2A.7. Generar certificados Let's Encrypt

Levanta Nginx con una config HTTP-only de arranque. La más rápida: comenta temporalmente los bloques `server { listen 443 ...}` en `fundecodes.conf` y deja solo los `listen 80`.

```bash
docker compose --env-file .env.stack up -d nginx
```

Pide certificados para ambos dominios:

```bash
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d tu-dominio.com -d www.tu-dominio.com \
  --email tu-email@tu-dominio.com --agree-tos --no-eff-email

docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d api.tu-dominio.com \
  --email tu-email@tu-dominio.com --agree-tos --no-eff-email
```

Verifica: `ls deploy/certbot/conf/live/` debería mostrar `tu-dominio.com/` y `api.tu-dominio.com/`.

### 2A.8. Habilitar HTTPS

Descomenta los bloques `listen 443 ssl` y recarga Nginx:

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

Prueba en el navegador: `https://tu-dominio.com` y `https://api.tu-dominio.com/healthz` (debe devolver `{ "ok": true }`).

### 2A.9. Renovación automática de certificados

Cron del host (cada día a las 3:30 AM):

```bash
sudo crontab -e
```

```
30 3 * * * cd /opt/fundecodes/deploy && /usr/bin/docker compose run --rm certbot renew --quiet && /usr/bin/docker compose exec nginx nginx -s reload
```

### 2A.10. Crear usuario admin inicial (seed)

Si el backend tiene un script de seed, ejecuta:

```bash
docker compose exec backend node dist/prisma/seed.js
```

(O el script equivalente que uses.) Si no, inserta el primer admin manualmente vía psql:

```bash
docker compose exec db psql -U fundecodes -d fundecodes_prod
```

---

## 2B. Modo PM2 + Nginx nativo (alternativa sin Docker)

### 2B.1. Instalar Node 20, Postgres, Nginx

```bash
# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Postgres 16
sudo apt install -y postgresql postgresql-contrib

# Nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# PM2 global
sudo npm install -g pm2
```

### 2B.2. Crear base de datos

```bash
sudo -u postgres psql
```

```sql
CREATE USER fundecodes WITH PASSWORD 'CAMBIAR_PASSWORD';
CREATE DATABASE fundecodes_prod OWNER fundecodes;
\q
```

### 2B.3. Clonar y construir

```bash
sudo mkdir -p /opt/fundecodes && sudo chown -R $USER:$USER /opt/fundecodes
cd /opt/fundecodes
git clone https://github.com/TU_USUARIO/backfundecodesdigital.git
git clone https://github.com/TU_USUARIO/frontfundecodesdigital.git

# Backend
cd backfundecodesdigital
cp .env.production.example .env
# Edita .env con valores reales (DATABASE_URL=postgresql://fundecodes:pass@localhost:5432/fundecodes_prod?schema=public)
npm ci
npx prisma migrate deploy
npm run build

# Frontend
cd ../frontfundecodesdigital
cp .env.production.example .env.local
# Edita .env.local (NEXT_PUBLIC_API_URL=https://api.tu-dominio.com)
npm ci
npm run build
```

### 2B.4. Levantar con PM2

```bash
sudo mkdir -p /var/log/fundecodes && sudo chown -R $USER:$USER /var/log/fundecodes
pm2 start /opt/fundecodes/frontfundecodesdigital/deploy/ecosystem.config.js --env production
pm2 save
pm2 startup  # copia y ejecuta el comando sudo que te imprime
```

### 2B.5. Nginx nativo

Copia `fundecodes.conf` a `/etc/nginx/sites-available/`, ajusta `proxy_pass` (reemplaza `http://frontend:3000` por `http://127.0.0.1:3000`, y `http://backend:4000` por `http://127.0.0.1:4000`):

```bash
sudo cp /opt/fundecodes/frontfundecodesdigital/deploy/nginx/conf.d/fundecodes.conf /etc/nginx/sites-available/fundecodes.conf
sudo sed -i 's|http://frontend:3000|http://127.0.0.1:3000|g' /etc/nginx/sites-available/fundecodes.conf
sudo sed -i 's|http://backend:4000|http://127.0.0.1:4000|g' /etc/nginx/sites-available/fundecodes.conf
sudo sed -i 's|tu-dominio.com|MI-DOMINIO.com|g' /etc/nginx/sites-available/fundecodes.conf

sudo ln -s /etc/nginx/sites-available/fundecodes.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 2B.6. SSL con certbot

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com
```

Certbot instala los certificados y modifica Nginx automáticamente. Renovación: ya queda en `/etc/cron.d/certbot`.

---

## 3. Backups de PostgreSQL

Script en `/opt/fundecodes/backup-db.sh`:

**Modo Docker:**

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d_%H%M)
OUT="/opt/fundecodes/deploy/backups/fundecodes_${STAMP}.sql.gz"
docker compose -f /opt/fundecodes/deploy/docker-compose.prod.yml --env-file /opt/fundecodes/deploy/.env.stack \
  exec -T db pg_dump -U fundecodes fundecodes_prod | gzip > "$OUT"
# Retención: 30 días
find /opt/fundecodes/deploy/backups -name 'fundecodes_*.sql.gz' -mtime +30 -delete
```

**Modo nativo:**

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d_%H%M)
OUT="/opt/fundecodes/backups/fundecodes_${STAMP}.sql.gz"
PGPASSWORD='CAMBIAR_PASSWORD' pg_dump -h 127.0.0.1 -U fundecodes fundecodes_prod | gzip > "$OUT"
find /opt/fundecodes/backups -name 'fundecodes_*.sql.gz' -mtime +30 -delete
```

Da permisos y agrega cron diario:

```bash
chmod +x /opt/fundecodes/backup-db.sh
crontab -e
# Backup a las 2:00 AM
0 2 * * * /opt/fundecodes/backup-db.sh >> /var/log/fundecodes/backup.log 2>&1
```

**Importante:** configura rsync/rclone hacia almacenamiento externo (S3, Backblaze, Drive) — un backup en el mismo VPS no es un backup.

---

## 4. Despliegues posteriores (workflow)

**Docker:**

```bash
cd /opt/fundecodes/backfundecodesdigital && git pull
cd /opt/fundecodes/frontfundecodesdigital && git pull
cd /opt/fundecodes/deploy
docker compose --env-file .env.stack build backend frontend
docker compose --env-file .env.stack up -d backend frontend
docker compose exec backend npx prisma migrate deploy  # si hay migraciones
```

**PM2:**

```bash
cd /opt/fundecodes/backfundecodesdigital && git pull && npm ci --omit=dev && npm run build
npx prisma migrate deploy
pm2 reload fundecodes-backend

cd /opt/fundecodes/frontfundecodesdigital && git pull && npm ci --omit=dev && npm run build
pm2 reload fundecodes-frontend
```

---

## 5. Verificación post-deploy (checklist)

Ejecuta en orden y asegúrate de que todo pasa:

- `curl -sI https://tu-dominio.com | head -n 3` → 200 OK
- `curl -s https://api.tu-dominio.com/healthz` → `{"ok":true}`
- `curl -sI https://tu-dominio.com/_next/static/` → cache `max-age=31536000`
- Login funcional desde el navegador (devtools → Network → `POST /api/auth/login` → 201/200)
- SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=tu-dominio.com → A o A+
- Headers: https://securityheaders.com → A
- `docker compose ps` (modo Docker) — todos los servicios `healthy`
- `pm2 status` (modo PM2) — ambos `online`

---

## 6. Monitoreo y logs

**Docker:**

```bash
docker compose logs -f --tail=200 backend
docker compose logs -f --tail=200 frontend
docker compose logs -f --tail=200 nginx
docker stats              # CPU/RAM por contenedor
```

**PM2:**

```bash
pm2 logs fundecodes-backend --lines 200
pm2 monit
```

**Métricas del host:**

```bash
sudo apt install -y htop
htop
```

Para monitoreo externo, considera:
- **Uptime Robot** (gratuito) apuntando a `/healthz`
- **Sentry** para errores de backend y frontend
- **Grafana + Prometheus** si quieres métricas ricas

---

## 7. Resolución de problemas frecuentes

**`502 Bad Gateway` en Nginx**
- `docker compose ps` → ¿backend/frontend arriba?
- Revisa logs del contenedor afectado.
- En modo nativo: `pm2 status`.

**CORS bloqueado**
- Confirma que `FRONTEND_URL` y/o `CORS_ALLOWED_ORIGINS` en `.env.back` incluyen el dominio exacto **con esquema y sin barra final**.
- Si cambiaste, reinicia backend.

**Frontend muestra `NEXT_PUBLIC_API_URL` vacía**
- Las `NEXT_PUBLIC_*` se hornean en build time. Tras cambiarla, rebuildea el frontend (Docker: `--build`; PM2: `npm run build && pm2 reload`).

**Certbot falla con "Connection refused"**
- Verifica que el puerto 80 está abierto en UFW y que el DNS apunta al VPS (`dig +short tu-dominio.com`).

**`ECONNREFUSED` en backend → db**
- En Docker, el host de DB debe ser `db` (nombre del servicio), no `localhost`.
- En nativo, debe ser `127.0.0.1`.

**Migraciones Prisma fallan**
- Revisa `DATABASE_URL`, especialmente el `?schema=public`.
- Ejecuta manualmente: `docker compose exec backend npx prisma migrate deploy`.

---

## 8. Seguridad — recordatorios críticos

1. **Rotación inmediata** de cualquier secreto que haya estado en un `.env` versionado: JWT_SECRET, credenciales Mailjet, contraseña de Postgres.
2. **`.gitignore`** debe incluir `.env`, `.env.*`, `uploads/` — verifica con `git check-ignore -v .env`.
3. **Accesos SSH** con llaves, no contraseñas. Considera MFA para usuarios administrativos en la app.
4. **Backups fuera del VPS** — uno en el mismo servidor no te salva de un borrado accidental o compromiso.
5. **Revisa dependencias** periódicamente: `npm audit` (en ambos proyectos) y aplica los fixes de seguridad.
6. **Rate limiting** ya está configurado en Nginx para `/api/auth/login` (5 req/s). Ajusta si es necesario.
7. **Actualizaciones del sistema** mensuales: `sudo apt update && sudo apt upgrade -y`.
8. **Headers de seguridad** aplicados (HSTS, X-Frame-Options, etc.) — verifica con securityheaders.com.
9. **Swagger** desactivado en producción (`SWAGGER_ENABLED=false`). Solo habilitar temporalmente si se necesita debugging.
10. **CORS estricto** — no dejar `*` en `CORS_ALLOWED_ORIGINS`.

---

## 9. Ajuste de rendimiento (opcional)

- **Postgres**: ajusta `shared_buffers`, `work_mem`, `effective_cache_size` según carga (usa [pgtune](https://pgtune.leopard.in.ua/)).
- **Node**: en PM2 ya se usa cluster mode (`instances: max`). En Docker, considera scalar con `docker compose up -d --scale backend=2` + upstream con round-robin en Nginx.
- **CDN**: si el tráfico crece, pon Cloudflare delante. Modo proxy (naranja) te cachea estáticos gratis.
- **Imágenes**: activa `next/image` con un remote loader o migra uploads a Cloudinary/S3 cuando crezcan (el `remotePatterns` ya incluye Cloudinary).

---

## 10. Rollback rápido

**Docker** (pin por tag):

```bash
# Si taggeaste imágenes antes del deploy
docker compose --env-file .env.stack down backend
docker tag fundecodes-backend:previous fundecodes-backend:latest
docker compose --env-file .env.stack up -d backend
```

**Git** (revertir código):

```bash
cd /opt/fundecodes/backfundecodesdigital
git log --oneline -n 10
git checkout <commit-anterior>
# rebuildea y redeploya
```

**Base de datos** (restore de backup):

```bash
gunzip < /opt/fundecodes/deploy/backups/fundecodes_YYYYMMDD_HHMM.sql.gz | \
  docker compose exec -T db psql -U fundecodes fundecodes_prod
```

---

## Anexo: contactos y comandos útiles

```bash
# Ver servicios Docker
docker compose ps
docker compose logs -f backend

# Reiniciar un servicio puntual
docker compose restart backend

# Entrar al backend
docker compose exec backend sh

# Abrir psql
docker compose exec db psql -U fundecodes -d fundecodes_prod

# Ver espacio en disco
df -h

# Top por procesos (nativo)
htop

# Top por contenedor
docker stats
```

---

**Listo.** Con esta guía el VPS queda con un stack reproducible, con SSL automático, backups programados, monitoreo básico y un camino claro para cada deploy.
