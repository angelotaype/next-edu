# Next Edu

Next Edu es un MVP de gestion escolar construido con Next.js 14 y Supabase. Centraliza matricula, control de alumnos, asistencia por QR y pagos rapidos en una sola aplicacion.

## Modulos incluidos

- Login institucional con Supabase Auth
- Dashboard protegido por middleware
- Registro guiado de alumnos con matricula y primer pago
- Perfil de alumno con tabs de cuotas, asistencia y carnet QR
- Escaner QR para asistencia y cobro rapido
- Vistas de pagos rapidos, morosidad, ciclos y salones

## Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase SSR + Supabase Auth
- React Hook Form + Zod
- Sonner para toasts

## Requisitos

- Node.js 20+
- npm 10+
- Proyecto Supabase con las tablas, funciones RPC y politicas del MVP
- Doppler opcional para desarrollo local

## Variables de entorno

La aplicacion usa estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Uso recomendado por entorno:

- `.env.local`: desarrollo local o scripts manuales
- Doppler: `npm run dev` ya esta configurado para ejecutar `doppler run -- next dev`
- proveedor de hosting: configura las mismas variables en el entorno remoto

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env.local` con tus credenciales de Supabase o configura Doppler.

3. Inicia el proyecto:

```bash
npm run dev
```

4. Abre `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Script util de limpieza:

```bash
node --experimental-strip-types src/scripts/clean-test-data.ts
```

Nota: este script requiere `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con permisos reales sobre las tablas objetivo.

## Estructura principal

```text
src/app/(auth)           Login
src/app/(dashboard)      Modulos protegidos del panel
src/components           UI, shell y flujos compartidos
src/lib                  Clientes Supabase, utilidades y esquemas Zod
src/scripts              Scripts operativos
```

## Build y verificacion

El build de Next.js compila correctamente con:

```bash
npm run build
```

Hay un ajuste pendiente en ESLint del proyecto: la configuracion actual referencia `next/typescript` y puede fallar al cargar esa extension en algunas maquinas.

## Deployment

La guia de despliegue esta en [DEPLOYMENT.md](./DEPLOYMENT.md).
