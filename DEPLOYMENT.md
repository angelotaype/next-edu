# Deployment Guide

## Objetivo

Desplegar Next Edu a un entorno staging con las variables de Supabase correctas y una verificacion minima posterior al build.

## Variables requeridas

Configura estas variables en el proveedor de despliegue:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Pre-deploy checklist

1. `npm install`
2. `npm run build`
3. Confirmar acceso al proyecto Supabase correcto
4. Validar que las RPC usadas por el MVP existan

RPC esperadas por la app:

- `fn_generate_installments`
- `fn_apply_payment_to_oldest_installments`
- `fn_qr_scan_and_debt`

## Opcion A: Vercel

1. Crear un proyecto nuevo apuntando a este repositorio.
2. Framework preset: `Next.js`.
3. Build command: `npm run build`.
4. Install command: `npm install`.
5. Output directory: default de Next.js.
6. Registrar las variables de entorno de staging.
7. Desplegar la rama objetivo.

## Opcion B: servidor Node

1. Instalar dependencias:

```bash
npm install
```

2. Exportar variables de entorno.

3. Generar build:

```bash
npm run build
```

4. Levantar el servidor:

```bash
npm run start
```

## Verificacion post-deploy

Validar manualmente:

1. `/login` responde y permite autenticacion.
2. `/dashboard` redirige correctamente segun la sesion.
3. `/students/nuevo` crea matricula y primer pago.
4. `/scan` carga la vista y permite flujo manual si la camara falla.
5. `/pagos/rapido` registra abonos.

## Problemas conocidos

- `npm run build` compila, pero ESLint puede mostrar un error de carga para `next/typescript` segun la configuracion local.
- El script `src/scripts/clean-test-data.ts` requiere una credencial con permisos de lectura y borrado sobre `students`, `enrollments`, `payment_plans`, `payments`, `installments` y `attendance_logs`.

## Rollback

1. Re-deploy del ultimo commit estable.
2. Verificar login, dashboard y flujo de matricula.
3. Si hubo cambios de variables, restaurar el set anterior antes de reintentar.
