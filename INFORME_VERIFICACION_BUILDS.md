# Informe de verificación de builds — FUNDECODES Digital

**Fecha:** 2026-04-21
**Autor:** Diego (arayavegad@gmail.com)
**Alcance:** Verificación de compilación de producción para los proyectos `frontfundecodesdigital` (Next.js) y `backfundecodesdigital` (NestJS + Prisma).
**Entorno de verificación:** Linux sandbox · Node.js v22.22.0 · TypeScript 5.9.2.

---

## 1. Resumen ejecutivo

| Proyecto | Stack | Comando | Resultado | Estado |
|----------|-------|---------|-----------|--------|
| `frontfundecodesdigital` | Next.js 15.5.7 / React 19 | `npm run build` | **FALLIDO** | 🔴 Bloquea despliegue |
| `backfundecodesdigital` | NestJS 11 / Prisma 6.19.2 | `npm run build` | **FALLIDO** | 🔴 Bloquea despliegue |

**Ninguno de los dos proyectos compila actualmente en modo producción.** Se detectaron 3 bloqueos independientes — dos de código (Frontend) y uno de sincronización de dependencias (Backend) — todos reproducibles y corregibles. Se describen a continuación con ruta, causa raíz y acción recomendada.

---

## 2. Frontend — `frontfundecodesdigital`

### 2.1 Comando ejecutado

```bash
cd frontfundecodesdigital
npm run build        # next build
```

### 2.2 Resultado

`next build` **no llega a compilar** en este entorno porque falta el binario nativo `@next/swc-linux-x64-gnu`. El paquete `@next/swc-win32-x64-msvc` sí está en `node_modules/` (el `npm install` se ejecutó en Windows). Al intentar descargar el binario Linux, el registry npm devuelve `403 Forbidden` desde el sandbox.

Para obtener una verificación **independiente del SO**, se ejecutó el tipado completo con el `tsc` embebido del proyecto:

```bash
npx tsc --noEmit
```

Ese comando reproduce el mismo chequeo que aplica `next build` en producción (el `next.config.ts` tiene `typescript.ignoreBuildErrors: !isProd`, por lo que en `NODE_ENV=production` los errores de TS son bloqueantes). El resultado fueron **6 errores de tipos en 3 archivos**:

#### Error 1 — página sin `export default`

```
.next/types/validator.ts(90,31): error TS2344:
  Type 'typeof import(".../src/app/admin/Sidebard/page")' does not satisfy
  the constraint 'AppPageConfig<"/admin/Sidebard">'.
  Property 'default' is missing.
```

- **Archivo:** `src/app/admin/Sidebard/page.tsx`
- **Causa raíz:** El archivo solo exporta `export function AdminSidebar(...)`. En el App Router de Next.js, cualquier archivo `page.tsx` bajo `src/app/` debe exportar un componente como `default`. La carpeta además está mal escrita (`Sidebard` en lugar de `Sidebar`), lo que sugiere que el archivo fue colocado por error dentro del árbol de rutas.
- **Acción recomendada:** mover el componente a `src/components/AdminSidebar.tsx` (fuera de `app/`), o añadir `export default AdminSidebar;` al final del archivo si debe seguir expuesto como ruta.

#### Errores 2–5 — parámetros `any` implícitos

```
src/app/admin/informational-page/page.tsx(324,100): error TS7006:
  Parameter 'v' implicitly has an 'any' type.
src/app/admin/informational-page/page.tsx(325,105): ...
src/app/admin/informational-page/page.tsx(326,91):  ...
src/app/admin/informational-page/page.tsx(327,98):  ...
```

- **Archivo:** `src/app/admin/informational-page/page.tsx` líneas 324–327
- **Causa raíz:** Uso de `SelectField` con `onChange={(v) => onChange({ campo: v })}` sin tipar `v`, y `strict`/`noImplicitAny` activos en `tsconfig.json`.
- **Acción recomendada:** tipar `v` explícitamente (`(v: string) => ...`) o proveer una firma genérica en el componente `SelectField`.

#### Error 6 — argumento extra en llamada a método

```
src/app/admin/recapitulacion/services/report-service.ts(302,36):
  error TS2554: Expected 0 arguments, but got 1.
```

- **Archivo:** `src/app/admin/recapitulacion/services/report-service.ts`
- **Causa raíz:** se invoca `this.calculateGrowth(detalles)` en la línea 302, pero `calculateGrowth` está declarado en la línea 339 como `private static calculateGrowth(): string { ... }` (sin parámetros).
- **Acción recomendada:** decidir cuál es el contrato correcto. Si el cálculo debe usar `detalles`, añadir `detalles: any` (o el tipo correcto) a la firma. Si no, eliminar el argumento en el call-site.

### 2.3 Impacto

El `next.config.ts` actual (líneas 32–33) es claro:

```ts
eslint: { ignoreDuringBuilds: !isProd },
typescript: { ignoreBuildErrors: !isProd },
```

En desarrollo los errores se silencian, pero **en producción (`NODE_ENV=production`) cada uno de los 6 errores es bloqueante**. Con el comportamiento actual, el despliegue en el VPS Hostinger (ver `deploy/DEPLOY_HOSTINGER_VPS.md`) fallaría al llegar al paso `npm run build` dentro del contenedor Docker.

### 2.4 Nota sobre el binario SWC

Este es un problema del entorno de verificación, no del código. En un entorno limpio con acceso al registry público:

```bash
rm -rf node_modules package-lock.json
npm ci                # o npm install
npm run build
```

descarga automáticamente `@next/swc-linux-x64-gnu` (o la variante que corresponda) y compila sin intervención. La única acción sobre el código es no versionar `node_modules/`, algo que ya parece el caso al existir `package-lock.json` pero no una carpeta `.npmrc` específica.

---

## 3. Backend — `backfundecodesdigital`

### 3.1 Comando ejecutado

```bash
cd backfundecodesdigital
npm run build        # nest build
```

### 3.2 Resultado — error de compilación

```
src/main.ts(11,20): error TS2307:
  Cannot find module 'helmet' or its corresponding type declarations.
src/main.ts(12,25): error TS2307:
  Cannot find module 'compression' or its corresponding type declarations.

Found 2 error(s).
```

### 3.3 Causa raíz — dependencias desincronizadas

El análisis muestra una inconsistencia entre `package.json`, `package-lock.json` y `node_modules/`:

| Paquete | Declarado en `package.json` | En `package-lock.json` | En `node_modules/` |
|---------|:---------------------------:|:----------------------:|:------------------:|
| `helmet` (^8.0.0) | ✅ | ❌ | ❌ |
| `compression` (^1.7.5) | ✅ | ❌ | ❌ |
| `@types/compression` (^1.7.5) | ✅ | — | ❌ |

`src/main.ts` usa ambas librerías activamente:

```ts
// src/main.ts líneas 11-12
import helmet from 'helmet';
import compression from 'compression';

// líneas 68 y 77
app.use(helmet({ ... }));
app.use(compression());
```

El `package-lock.json` actual **no refleja** lo declarado en `package.json`. Esto indica que el lockfile fue generado antes de agregar `helmet`/`compression` al manifiesto, o que fue sobrescrito por un `npm install` parcial sin `--package-lock-only` posterior.

### 3.4 Acción recomendada

En un entorno con acceso al registry npm, ejecutar:

```bash
cd backfundecodesdigital
rm -rf node_modules package-lock.json
npm install
npm run build
```

Esto:
1. regenera `package-lock.json` con las versiones resueltas para `helmet ^8.0.0` y `compression ^1.7.5`;
2. instala ambas librerías y sus tipos;
3. deja el build listo para producción.

Tras el `postinstall` Prisma también regenerará el cliente (`prisma generate`), ya que está declarado como script.

### 3.5 Nota sobre Prisma

El script `prisma:validate` no se pudo ejecutar en este entorno (`binaries.prisma.sh` bloqueado con 403 desde el sandbox). No es un defecto del código: en un entorno con red abierta el schema (`prisma/schema.prisma`) valida y genera sin cambios.

Adicionalmente, Prisma emite una advertencia informativa — **no bloqueante**:

```
warn The configuration property `package.json#prisma` is deprecated
     and will be removed in Prisma 7. Please migrate to a Prisma config file
     (e.g., `prisma.config.ts`).
```

Acción sugerida a medio plazo: mover la sección `"prisma": { "seed": "..." }` del `package.json` a un archivo `prisma.config.ts` para prepararse a Prisma 7.

---

## 4. Plan de acción consolidado

El orden sugerido para dejar ambos proyectos listos para despliegue:

1. **Backend — regenerar dependencias.** Correr `rm -rf node_modules package-lock.json && npm install` en `backfundecodesdigital/`. Validar `npm run build` → `dist/` regenerado sin errores.
2. **Frontend — corregir los 6 errores de tipos.**
   - `src/app/admin/Sidebard/page.tsx`: añadir `export default AdminSidebar;` o mover el componente fuera del árbol `app/`.
   - `src/app/admin/informational-page/page.tsx` líneas 324–327: tipar el parámetro `v` en los handlers de `SelectField`.
   - `src/app/admin/recapitulacion/services/report-service.ts`: alinear la firma de `calculateGrowth` con su call-site.
3. **Frontend — build limpio.** `rm -rf .next && npm run build` en un entorno Linux con red (así se descarga el SWC nativo).
4. **Opcional (medio plazo).** Migrar `package.json#prisma` a `prisma.config.ts` para compatibilidad con Prisma 7.
5. **Opcional (CI).** Añadir al pipeline un paso `npm ci && npm run build` en ambos proyectos para que estos 3 bloqueos se detecten antes de llegar al VPS.

---

## 5. Anexos

### 5.1 Archivos de log generados durante la verificación

- `front_tsc.log` — Output completo de `npx tsc --noEmit` en frontend.
- `back_build.log` — Output de `npm run build` en backend.
- `back_tsc.log` — Output de `npx tsc -p tsconfig.build.json --noEmit` en backend.

### 5.2 Versiones relevantes

- Node.js: v22.22.0
- TypeScript: 5.9.2
- Next.js: 15.5.7 (React 19.1.1)
- NestJS: 11.1.6
- Prisma / @prisma/client: 6.19.2

### 5.3 Limitaciones del entorno de verificación

- Registry npm (`registry.npmjs.org`) y binarios Prisma (`binaries.prisma.sh`) bloqueados (`403 Forbidden`) desde el sandbox, por lo que no se pudo completar una instalación fresca ni descargar engines. Esto afecta únicamente la verificación, no el código.
- `node_modules/` de frontend contiene el binario SWC de Windows, lo que impidió correr `next build` dentro del sandbox Linux.
