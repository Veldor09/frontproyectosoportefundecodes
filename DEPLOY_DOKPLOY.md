# Despliegue del Frontend en Dokploy — `fundecodesdigital.cloud`

Guía paso a paso para desplegar **frontfundecodesdigital** (Next.js 15) en un VPS Hostinger usando Dokploy. Pensada para hacerla de un tirón.

> **Estado del backend:** todavía NO desplegado. El frontend se despliega
> apuntando a `https://api.fundecodesdigital.cloud` (la URL futura del back),
> así no hay que rebuildear cuando llegue el momento. Mientras el back no
> esté arriba, las llamadas a la API fallarán pero la app carga.

---

## 0. Antes de empezar — checklist local

Esto se hace en tu máquina, **antes** de ir al VPS.

### 0.1 Regenerar `package-lock.json`

Se añadió `react-international-phone` al `package.json`. El lockfile actual no lo refleja, y `npm ci` (que usa el Dockerfile) falla si el lock no coincide con el manifiesto.

```bash
cd frontfundecodesdigital
rm -f package-lock.json
npm install        # genera package-lock.json fresco
```

### 0.2 Verificar que el build pasa localmente

```bash
npm run build
```

Tiene que terminar sin errores. Si falla, lee la salida — los 6 errores TS bloqueantes ya fueron corregidos en este PR/branch, pero podrían aparecer otros si tocaste código.

### 0.3 Commit y push

```bash
git add package.json package-lock.json \
        Dockerfile .dockerignore .env.production.example \
        DEPLOY_DOKPLOY.md \
        src/app/admin/_components/AdminSidebar.tsx \
        src/app/admin/Sidebard/page.tsx \
        src/app/admin/page.tsx \
        src/app/admin/layout.tsx \
        src/app/admin/informational-page/page.tsx \
        src/app/admin/recapitulacion/services/report-service.ts \
        src/components/ui/switch.tsx \
        src/app/api/health/route.ts

git commit -m "feat(deploy): preparar frontend para Dokploy + fix de errores TS bloqueantes"
git push origin main
```

> **Tip:** la carpeta `src/app/admin/Sidebard/` se mantiene como redirect
> hacia `/admin` (ver el archivo). Cuando puedas, bórrala en otro commit
> con `git rm -r src/app/admin/Sidebard/`.

---

## 1. Provisioning del VPS

Si ya pasaste la pantalla de "Choose what to install" y tienes Ubuntu 24.04 LTS andando, salta a la sección 2.

Hostinger panel → VPS → **Plain OS → Ubuntu 24.04 LTS**. Espera a que el VPS esté `Running`. Anota la IP pública.

### 1.1 Endurecimiento mínimo (≈ 5 min)

```bash
ssh root@IP_DEL_VPS

apt update && apt upgrade -y
adduser fundecodes
usermod -aG sudo fundecodes
rsync --archive --chown=fundecodes:fundecodes ~/.ssh /home/fundecodes

# Firewall — Dokploy necesita 80, 443 y 3000 (UI Dokploy)
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable

# Swap (con KVM 2 / 8 GB es opcional, pero recomendado bajo build)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Zona horaria
timedatectl set-timezone America/Costa_Rica

# Salir y reentrar como `fundecodes`
exit
```

### 1.2 Instalar Dokploy

Reentra como `fundecodes`:

```bash
ssh fundecodes@IP_DEL_VPS
sudo curl -sSL https://dokploy.com/install.sh | sudo sh
```

Esto instala Docker, Traefik (reverse proxy con SSL automático) y Dokploy. Tarda ~3 minutos.

Cuando termine, accede en tu navegador a:

```
http://IP_DEL_VPS:3000
```

La primera pantalla pide crear el usuario admin. Guarda la contraseña en tu password manager.

---

## 2. Configurar DNS en Hostinger

Antes de añadir el dominio en Dokploy, los registros DNS deben estar apuntando al VPS, **propagados**. Sin esto, Let's Encrypt fallará al pedir el certificado.

En Hostinger panel → Dominios → `fundecodesdigital.cloud` → **DNS / Nameservers**, crea/edita:

| Tipo  | Nombre | Valor          | TTL  |
|-------|--------|----------------|------|
| A     | `@`    | IP_DEL_VPS     | 300  |
| A     | `www`  | IP_DEL_VPS     | 300  |
| A     | `api`  | IP_DEL_VPS     | 300  |

> El registro `api` lo dejamos listo desde ya para cuando despliegues el backend
> sin tocar el frontend.

Verifica propagación (puede tardar 5–30 min):

```bash
dig +short fundecodesdigital.cloud
dig +short www.fundecodesdigital.cloud
dig +short api.fundecodesdigital.cloud
```

Las tres deben devolver la IP del VPS.

---

## 3. Conectar GitHub a Dokploy

En la UI de Dokploy:

1. **Settings → Git → GitHub → Connect** → autoriza la app de Dokploy en tu cuenta de GitHub.
2. En la pantalla de instalación, marca **"Only select repositories"** y elige `frontfundecodesdigital`. (Más limpio que dar acceso a todo.)
3. Vuelves a Dokploy y deberías ver el repo en la lista.

> Si tu repo es privado y prefieres SSH Deploy Keys en lugar de OAuth,
> Dokploy también lo soporta en **Settings → Git → Deploy Key**. La
> documentación oficial cubre ambos caminos.

---

## 4. Crear la aplicación en Dokploy

### 4.1 Nuevo Project / Application

Dashboard → **Projects → Create Project** → nombre: `fundecodes-digital`.

Dentro del proyecto → **Create Service → Application** → nombre: `frontend`.

### 4.2 Source

Pestaña **General → Source**:

- **Source Type:** Github
- **Repository:** `<tu-org>/frontfundecodesdigital`
- **Branch:** `main` (o la que uses para producción)
- **Build Path:** `/` (raíz)
- **Auto Deploy:** ON (Dokploy redespliega en cada push a `main`)

### 4.3 Build Type → Dockerfile

Pestaña **General → Build Type**:

- **Build Type:** `Dockerfile`
- **Dockerfile Path:** `Dockerfile` (raíz del repo)

### 4.4 Build Arguments (CRÍTICO)

Pestaña **Environment → Build Arguments** (NO en "Environment", debe ser ARG de build):

```
NEXT_PUBLIC_API_URL=https://api.fundecodesdigital.cloud
```

> **Por qué aquí y no en Environment:** todas las `NEXT_PUBLIC_*` de Next.js
> se "hornean" dentro del bundle JS del cliente durante `next build`. No se
> leen en runtime. El `Dockerfile` las recibe como `ARG`. Si las pones en
> Environment funcionan en el server pero salen vacías en el cliente
> (= `fetch("/api/...")` falla con `localhost`).

### 4.5 Environment (runtime)

Pestaña **Environment**:

```
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

### 4.6 Domains

Pestaña **Domains → Add Domain**:

**Dominio principal:**

- **Host:** `fundecodesdigital.cloud`
- **Path:** `/`
- **Container Port:** `3000`
- **HTTPS:** ON
- **Certificate Provider:** Let's Encrypt

Guarda. Dokploy crea la regla en Traefik y arranca el flujo ACME para el cert.

**Redirect www → root:**

Añade un segundo dominio:

- **Host:** `www.fundecodesdigital.cloud`
- **Container Port:** `3000`
- **HTTPS:** ON
- **Redirect:** `https://fundecodesdigital.cloud` (status 308)

> Si tu versión de Dokploy no tiene un toggle de "Redirect to" en la UI,
> puedes lograr el mismo efecto con un middleware de Traefik en
> Advanced → Traefik labels:
> ```
> traefik.http.middlewares.www-redirect.redirectregex.regex=^https://www\.fundecodesdigital\.cloud/(.*)
> traefik.http.middlewares.www-redirect.redirectregex.replacement=https://fundecodesdigital.cloud/$1
> traefik.http.middlewares.www-redirect.redirectregex.permanent=true
> ```

### 4.7 Health check

Pestaña **Advanced → Health Check** (opcional pero recomendado — Dokploy reinicia el container si falla):

- **Path:** `/api/health`
- **Port:** `3000`
- **Interval:** `30s`
- **Timeout:** `5s`

(El Dockerfile ya tiene su propio HEALTHCHECK contra el mismo endpoint, así que esto es redundancia útil.)

### 4.8 Resources (opcional)

Pestaña **Advanced → Resources**:

- **Memory limit:** `1.5g` (deja margen para Postgres/back en el mismo VPS)
- **CPU limit:** `1.5`

---

## 5. Primer deploy

Botón superior derecho → **Deploy**.

Dokploy:

1. Hace `git clone` del repo.
2. Construye la imagen Docker con tu `Dockerfile` (3 stages, ~3-6 min la primera vez).
3. Levanta el container.
4. Pide el certificado SSL a Let's Encrypt.
5. Conecta Traefik al puerto 3000.

Sigue el progreso en **Logs**.

### 5.1 Verificación post-deploy

Cuando el log diga `ready - started server on 0.0.0.0:3000`:

```bash
# Healthcheck del frontend
curl -s https://fundecodesdigital.cloud/api/health | jq
# → { "ok": true, "service": "frontfundecodesdigital", "time": "..." }

# www redirect
curl -sI https://www.fundecodesdigital.cloud | grep -i location
# → location: https://fundecodesdigital.cloud/

# Headers de seguridad (los aplica el next.config.ts)
curl -sI https://fundecodesdigital.cloud | grep -iE "x-frame|x-content|referrer|permissions"

# SSL grade
# Visita https://www.ssllabs.com/ssltest/analyze.html?d=fundecodesdigital.cloud
# Deberías ver A o A+.
```

Abre en navegador `https://fundecodesdigital.cloud`. La home y rutas estáticas deben cargar. El login intentará llamar `https://api.fundecodesdigital.cloud/api/auth/login` → fallará con error de red (porque el back aún no existe) hasta que despliegues el backend.

---

## 6. Workflow de deploys posteriores

Con **Auto Deploy: ON**, cualquier push a `main` redespliega automáticamente.

Para deploy manual (rollback, hotfix, rama distinta):

1. Dokploy → Application → **Deployments → New Deployment** → elige la rama o commit.
2. **Deploy.**

Dokploy guarda los últimos N deploys; puedes hacer rollback con un click.

---

## 7. Cuando llegues a desplegar el backend

Recordatorios para que el back conecte limpio con este front:

1. **Otro Application en Dokploy** apuntando al repo `backfundecodesdigital`, build con su `Dockerfile`.
2. **Domain:** `api.fundecodesdigital.cloud` con HTTPS Let's Encrypt.
3. **Environment del backend** debe incluir:
   ```
   FRONTEND_URL=https://fundecodesdigital.cloud
   CORS_ALLOWED_ORIGINS=https://fundecodesdigital.cloud
   ```
   (sin barra final, sin coma extra). Sin esto, el navegador bloquea CORS.
4. **Database:** crear un servicio Postgres dentro del mismo Project en Dokploy → la DATABASE_URL será `postgresql://USER:PASS@HOSTNAME:5432/DBNAME?schema=public`. El hostname lo da Dokploy en la pestaña del servicio Postgres.
5. **Migraciones:** después del primer deploy del back, exec dentro del container:
   ```
   npx prisma migrate deploy
   ```
   Dokploy también te deja correr comandos one-off desde la UI.
6. **Pre-deploy del back:** corre `rm -rf node_modules package-lock.json && npm install` en local para que el lockfile incluya `helmet` y `compression` (ver `INFORME_VERIFICACION_BUILDS.md`).

---

## 8. Backups

Dokploy → Settings → **Backups → Add backup destination** (S3 o local).

Para el frontend solo hace falta backup de **volumes** si tienes uploads del lado del FE (no es el caso aquí — los uploads van al backend). Dale prioridad al backup del Postgres cuando esté arriba.

---

## 9. Troubleshooting

**El build falla con "Cannot find module 'react-international-phone'"**
→ No regeneraste el lockfile. `rm package-lock.json && npm install`, commit, push.

**El build pasa pero la página muestra "API URL undefined" / `fetch("undefined/api/...")`**
→ Pusiste `NEXT_PUBLIC_API_URL` en *Environment* en lugar de *Build Arguments*. Muévela a Build Arguments y redeploy.

**`502 Bad Gateway` en el dominio**
→ El container murió. Logs en Dokploy → Application → Logs. Si ves `EADDRINUSE :3000`, alguien más usa el puerto en el host (raro en Dokploy); reinicia el container.

**Let's Encrypt no emite el cert**
→ DNS no propagado o el puerto 80 cerrado. `dig +short fundecodesdigital.cloud` debe devolver IP del VPS, y `sudo ufw status` debe mostrar 80/tcp ALLOW.

**HSTS o redirect en bucle**
→ El bloque de redirect www→root está mal configurado y el dominio raíz redirige a sí mismo. Revisa que el "Host:" del segundo domain sea exactamente `www.fundecodesdigital.cloud` (con `www.`), no el root.

**CORS bloqueado al conectar al backend**
→ El back no tiene `https://fundecodesdigital.cloud` en `CORS_ALLOWED_ORIGINS`, o lo tiene con barra final. Sin barra. Reinicia el back tras cambiar.

**Memoria llena durante el build (`JavaScript heap out of memory`)**
→ El KVM 2 con 8 GB debería bastar, pero si pasa, sube el swap a 8 GB o añade `NODE_OPTIONS=--max-old-space-size=4096` en Build Arguments.

---

## 10. Resumen de archivos que toca este PR

| Archivo | Cambio |
|---------|--------|
| `Dockerfile` | Multi-stage endurecido + healthcheck contra `/api/health`. |
| `.dockerignore` | Más estricto, excluye `deploy/`, docs, lockfile de TS. |
| `.env.production.example` | Apunta a `api.fundecodesdigital.cloud`. |
| `package.json` | + `react-international-phone ^4.6.0`. |
| `src/app/admin/_components/AdminSidebar.tsx` | **Nuevo** — el componente vive aquí. |
| `src/app/admin/Sidebard/page.tsx` | Convertido en redirect 308 → `/admin`. |
| `src/app/admin/page.tsx` | Import actualizado al nuevo path. |
| `src/app/admin/layout.tsx` | Import actualizado al nuevo path. |
| `src/app/admin/informational-page/page.tsx` | `SelectField` tipado correctamente. |
| `src/app/admin/recapitulacion/services/report-service.ts` | Firma de `calculateGrowth` alineada. |
| `src/components/ui/switch.tsx` | Import correcto del paquete Radix instalado. |
| `src/app/api/health/route.ts` | **Nuevo** — endpoint de salud para Dokploy/Docker. |

---

## 11. Comandos útiles dentro del VPS

```bash
# Ver containers de Dokploy
docker ps

# Logs del frontend en vivo
docker logs -f $(docker ps --filter name=frontend -q)

# Entrar al container
docker exec -it $(docker ps --filter name=frontend -q) sh

# Estadísticas de recursos
docker stats

# Estado de Dokploy
sudo systemctl status dokploy

# Reiniciar Dokploy (no afecta tus apps)
sudo systemctl restart dokploy
```

---

**Listo.** Cuando termines, el frontend está en `https://fundecodesdigital.cloud` con SSL A/A+, redirect de www, healthcheck activo, deploy automático en cada push y rollback de un click. La app cargará y mostrará los formularios; las llamadas API esperarán al backend.
