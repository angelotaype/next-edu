# Next Edu - Producto y arquitectura

## 1. Descripción del producto

Next Edu es un sistema de gestión académica y financiera para colegios particulares y academias preuniversitarias.

El producto debe operar como un **ERP escolar ligero**, entregado como **SaaS multi-tenant**, con foco en operación real y no solo en visualización.

## 2. Objetivo del producto

Construir un sistema real, escalable y usable en producción, orientado a:

- asistencia con QR en tiempo real
- gestión de estudiantes
- matrículas por salón o curso
- control de pagos y morosidad
- panel administrativo moderno
- evolución futura con automatización e IA

## 3. Stack tecnológico

### Backend
- FastAPI (Python)

### Base de datos
- Supabase (PostgreSQL + Storage)

### Frontend
- React

### Monetización SaaS
- Stripe

### Automatización futura
- n8n

### IA futura
- Claude / OpenAI / Ollama

## 4. Arquitectura general

```text
Frontend (React)
    ↓
Backend (FastAPI - lógica de negocio)
    ↓
Supabase (DB + Storage)
    ↓
Respuesta JSON estructurada
```

### Regla crítica
- Supabase almacena.
- FastAPI decide.
- React presenta.

## 5. Naturaleza multi-tenant

El sistema debe construirse desde el inicio como multi-tenant.

### Regla base
Cada colegio es un tenant aislado por `school_id`.

### Implicación
La mayoría de entidades operativas deben incluir `school_id`, por ejemplo:
- students
- enrollments
- classrooms
- attendances
- charges
- payments
- users
- reports

## 6. Dominios del sistema dentro de un solo producto

## A. Dominio ERP escolar
Resuelve la operación del cliente.

### Entidades principales
- students
- enrollments
- classrooms
- courses
- attendances
- charges / installments
- payments
- debt views / morosity indicators
- dashboard metrics

## B. Dominio SaaS plataforma
Resuelve el negocio de Next Edu.

### Entidades principales
- schools
- users
- subscriptions
- plan_limits
- stripe_customers
- billing_events
- feature_flags

## 7. Módulos funcionales principales

## 7.1 Estudiantes
Funciones:
- crear estudiante
- editar estudiante
- listar estudiantes
- subir foto
- activar/inactivar
- generar carnet digital visual

Campos base:
- id
- school_id
- full_name
- dni
- photo_url
- status

## 7.2 Matrículas
Funciones:
- asignar estudiante a salón
- asignar curso o programa
- gestionar estado de matrícula

Campos base:
- id
- school_id
- student_id
- classroom_id
- start_date
- status

## 7.3 Asistencia QR
Flujo:
1. escaneo QR
2. validación de token
3. identificación de estudiante
4. verificación de matrícula y contexto
5. evaluación de reglas
6. registro de asistencia
7. respuesta al frontend

Respuesta esperada:
- nombre
- foto
- salón
- estado de pago
- resultado permitido/denegado

### Consideraciones reales
- la foto ayuda a validación humana
- se deben evitar múltiples registros seguidos
- deben existir logs de acceso

## 7.4 Pagos
Funciones:
- registrar pago
- ver historial
- controlar cuotas o cargos
- visualizar saldo pendiente

Campos base:
- id
- school_id
- student_id
- amount
- date
- status
- method
- reference

## 7.5 Deuda / morosidad
Funciones:
- listar morosos
- agrupar por salón
- ranking de deuda
- filtrar por días de atraso
- resumen financiero

### Recomendación de diseño
La deuda no siempre debe ser una tabla simple. En muchos casos debe derivarse de:

`cargos generados - pagos aplicados`

Eso evita inconsistencias.

## 7.6 Dashboard administrativo
Debe incluir:
- asistencia diaria
- estudiantes activos
- morosos por salón
- ingresos totales
- KPIs generales
- gráficos

## 7.7 Carnet digital
### Sí entra temprano
- tarjeta visual
- nombre
- foto
- DNI
- salón
- QR

### Puede esperar
- PDF premium
- impresión optimizada
- variantes visuales complejas

## 8. Módulos SaaS de plataforma

## 8.1 Tenants / schools
Representa cada institución cliente.

Campos sugeridos:
- id
- name
- slug
- status
- current_plan
- stripe_customer_id
- created_at

## 8.2 Usuarios
Campos sugeridos:
- id
- school_id
- email
- password_hash o auth_id
- role
- status

## 8.3 Suscripciones
Campos sugeridos:
- id
- school_id
- plan_code
- status
- stripe_subscription_id
- renewal_date
- trial_ends_at

## 8.4 Eventos de facturación
Campos sugeridos:
- id
- school_id
- provider
- event_type
- provider_event_id
- raw_payload
- processed_at

## 9. Reglas de arquitectura

### Regla 1
No mezclar la lógica del ERP con la lógica de facturación SaaS, aunque convivan en el mismo producto.

### Regla 2
No poner reglas críticas en el frontend.

### Regla 3
No usar IA para cálculos o decisiones core.

### Regla 4
Toda operación debe ser trazable por tenant.

## 10. Estructura de carpetas sugerida

```text
next-edu/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── api/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── middleware/
│   │   ├── dependencies/
│   │   ├── utils/
│   │   └── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
├── database/
│   ├── schema.sql
│   ├── migrations/
│   ├── seeds/
│   └── views/
└── docs/
```

## 11. Mínimo esquema conceptual de datos

### Plataforma SaaS
- schools
- users
- subscriptions
- billing_events
- plan_limits

### Operación ERP
- students
- classrooms
- courses
- enrollments
- attendance_records
- charges
- payments
- guardians
- audit_logs

## 12. Seguridad base

### QR
No basta con un identificador expuesto. Debe existir token firmado y reglas de validación.

### SaaS
- el webhook de Stripe se valida por firma
- el frontend no crea tenants por sí solo
- la activación debe ocurrir en backend
- el acceso debe estar condicionado por estado de suscripción y tenant

## 13. Objetivo del MVP técnico

Un colegio debe poder:
- entrar al sistema
- registrar alumnos
- matricularlos
- controlar asistencia
- registrar pagos
- identificar morosidad
- ver un dashboard simple

Eso debe funcionar bien antes de expandir IA o automatizaciones complejas.
