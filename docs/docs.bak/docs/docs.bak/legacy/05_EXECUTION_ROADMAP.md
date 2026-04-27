# Next Edu - Roadmap de ejecución y prioridades

## 1. Regla general

La secuencia importa más que la cantidad de ideas.

Next Edu tiene una visión amplia, pero debe construirse por capas para evitar dispersión, retrasos innecesarios o sobreingeniería.

## 2. Objetivo del MVP

El MVP debe permitir que un colegio o academia pueda operar lo esencial sin depender de Excel para lo crítico.

### Resultado esperado del MVP
Un cliente debe poder:
- ingresar al sistema
- crear estudiantes
- matricularlos
- registrar pagos
- visualizar deuda/morosidad
- controlar asistencia QR
- revisar un dashboard básico

## 3. Módulos obligatorios del MVP

### Base de plataforma
- schools / tenants
- usuarios admin
- auth
- permisos mínimos

### Núcleo ERP
- estudiantes
- matrículas
- pagos
- deuda / morosidad
- dashboard básico
- asistencia QR

## 4. Qué no debe robar foco temprano

- IA avanzada
- chatbot abierto
- automatizaciones complejas
- reportes sofisticados
- PDF premium del carnet
- integraciones no críticas

## 5. Carnet digital: prioridad correcta

### Sí entra temprano
- carnet visible en pantalla
- QR funcional
- datos básicos del alumno
- foto para validación visual

### Va después
- exportación PDF bonita
- impresión optimizada
- plantillas avanzadas

### Motivo
El valor central del negocio está en pagos, control y asistencia; no en el acabado visual del PDF.

## 6. Fases recomendadas

## Fase 1 - Base SaaS y multi-tenant
Construir:
- schools
- users
- auth
- roles mínimos
- `school_id` en entidades críticas
- control de acceso base

## Fase 2 - Núcleo ERP académico
Construir:
- students
- classrooms o salones
- enrollments
- relación alumno-salón

## Fase 3 - Valor operativo inmediato
Construir:
- charges/installments o cuotas
- payments
- cálculo de deuda
- morosidad
- dashboard básico

## Fase 4 - Asistencia QR
Construir:
- generación QR
- validación de token
- registro de asistencia
- pantalla de confirmación con foto y estado
- reglas anti-duplicado

## Fase 5 - Comercialización SaaS automatizada
Construir:
- landing
- planes
- Stripe Checkout
- webhook
- activación automática del tenant
- creación automática de usuario admin

## Fase 6 - Diferenciación inteligente
Construir:
- cobranza preventiva
- alertas tempranas de riesgo
- asistente básico para padres

## Fase 7 - Extras y perfeccionamiento
Construir:
- carnet PDF premium
- reportes avanzados
- n8n
- IA más profunda
- integraciones adicionales

## 7. Si el objetivo es vender rápido

La prioridad real debe ser:
- resolver operación
- demostrar valor
- cerrar primeros clientes
- luego automatizar adquisición y activación

## 8. Si el objetivo es nacer autoservicio desde el inicio

Se puede adelantar:
- landing
- Stripe
- webhook

Pero sin descuidar el núcleo funcional. No tiene sentido automatizar la venta de un producto que aún no resuelve bien el dolor principal.

## 9. KPIs sugeridos por etapa

## Producto
- tiempo de registro de estudiante
- tiempo de matrícula
- pagos registrados por día
- porcentaje de alumnos con estado financiero claro
- tiempo medio de validación QR

## Negocio
- reuniones agendadas
- demos realizadas
- tasa de cierre
- ticket medio
- churn inicial
- upgrade Starter -> Pro -> IA

## IA futura
- mensajes sugeridos usados
- recuperación de pagos tras recordatorio
- casos de alerta atendidos
- consultas resueltas por autoservicio

## 10. Qué debe entender Claude

Cuando Claude ayude a priorizar, debe favorecer:

1. valor operativo antes que brillo visual
2. arquitectura simple antes que complejidad elegante
3. monetización sostenible antes que funciones costosas
4. MVP utilizable antes que visión completa
