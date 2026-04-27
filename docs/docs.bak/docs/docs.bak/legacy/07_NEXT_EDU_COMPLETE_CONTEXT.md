# Next Edu - Paquete de contexto para Claude

Este paquete organiza el contexto estratégico, funcional y técnico de **Next Edu** para usarlo en Claude con menos ruido y más precisión.

## Archivos incluidos

1. `01_MASTER_CONTEXT.md`
   - Resumen ejecutivo integral de la startup, producto, posicionamiento, arquitectura y roadmap.
2. `02_PRODUCT_AND_ARCHITECTURE.md`
   - Definición del producto, módulos, arquitectura, dominios y principios de diseño.
3. `03_BUSINESS_MODEL_AND_PRICING.md`
   - Modelo de negocio, pricing, ventas, comisiones y control de costos.
4. `04_DIFFERENTIATION_AND_AI_STRATEGY.md`
   - Diferenciación, uso estratégico de IA y priorización de funcionalidades inteligentes.
5. `05_EXECUTION_ROADMAP.md`
   - MVP, fases de construcción, prioridades y secuencia recomendada.
6. `06_CLAUDE_WORKING_BRIEF.md`
   - Brief listo para pegar en Claude como contexto operativo.

## Recomendación de uso

### Opción 1: rápida
Usar primero `01_MASTER_CONTEXT.md` y `06_CLAUDE_WORKING_BRIEF.md`.

### Opción 2: profunda
Subir los 6 archivos a Claude cuando quieras trabajar:
- arquitectura
- roadmap
- pricing
- estrategia comercial
- diferenciación
- definición de MVP

## Objetivo del paquete

Dar a Claude contexto suficiente para responder como:
- asesor de producto SaaS
- arquitecto funcional/técnico
- apoyo estratégico de startup
- copiloto para roadmap, pricing, pitch, landing, módulos o documentación

## Nota importante

Este material está redactado para que Claude entienda una idea central:

> **Next Edu es un ERP escolar ligero, ofrecido como SaaS multi-tenant, con foco principal en control académico, pagos y reducción de morosidad.**
# Next Edu - Contexto maestro

## 1. Identidad del proyecto

**Next Edu** es una startup EdTech enfocada en Perú, especialmente en academias preuniversitarias y colegios particulares de tamaño pequeño y mediano.

El producto principal es un **ERP escolar ligero**, entregado como **SaaS multi-tenant**, orientado a resolver problemas operativos reales de instituciones educativas privadas.

No se busca construir solo un panel bonito o un sistema de asistencia aislado. El objetivo es construir un sistema operativo administrativo que ayude a los colegios a:

- controlar asistencia en tiempo real
- gestionar alumnos y matrículas
- registrar pagos
- identificar morosidad
- reducir pérdidas por cobranza tardía
- ordenar su operación diaria

## 2. Definición correcta del producto

Next Edu debe definirse así:

> **ERP escolar ligero ofrecido como SaaS multi-tenant.**

Eso significa:

- **ERP**, porque resuelve operación interna del colegio.
- **SaaS**, porque se vende por suscripción y múltiples colegios usan la misma plataforma.
- **Multi-tenant**, porque cada colegio opera como tenant aislado mediante `school_id`.

No son dos productos separados. Es un solo producto con dos capas:

### Capa 1: Dominio ERP escolar
Usado por el cliente final para operar.

- estudiantes
- matrículas
- asistencia
- pagos
- cuotas/cargos
- deuda/morosidad
- dashboard

### Capa 2: Dominio SaaS plataforma
Usado por la propia plataforma para vender, activar y escalar el producto.

- schools
- users
- subscriptions
- billing_events
- stripe_customers
- plan_limits

## 3. Problema principal que resuelve

El producto no debe venderse como “sistema QR”.

Se debe vender como:

> **Sistema que mejora control académico y reduce morosidad.**

El dolor central del cliente es una combinación de:

- falta de orden administrativo
- pagos mal registrados
- deudas sin seguimiento
- asistencia poco confiable
- dependencia de Excel y procesos manuales

## 4. Segmento objetivo inicial

### Mercado inicial
- academias preuniversitarias
- colegios particulares
- instituciones con 200 a 1000 estudiantes
- zonas donde el precio y la facilidad de uso pesan mucho
- contexto local peruano, incluyendo ciudades intermedias como Huánuco y regiones similares

### Tipo de cliente ideal
- director/a o promotor educativo
- administrador/a
- encargado/a de cobranzas
- colegio que ya sufre por morosidad, desorden o falta de trazabilidad

## 5. Promesa central de valor

La promesa del producto debe ser:

> “Te ayudamos a ordenar la operación del colegio y a recuperar dinero que hoy se pierde por descontrol y cobranza tardía.”

## 6. Núcleo del producto

El núcleo funcional del sistema es:

- gestión de estudiantes
- matrículas
- asistencia QR
- pagos
- deuda/morosidad
- dashboard administrativo

### Funcionalidades secundarias o posteriores
- carnet en PDF premium
- reportes avanzados con IA
- automatizaciones complejas
- chatbot avanzado para padres
- predicción sofisticada

## 7. Arquitectura técnica base

### Stack principal
- **Backend:** FastAPI
- **Base de datos y storage:** Supabase (PostgreSQL + Storage)
- **Frontend:** React
- **Pagos SaaS:** Stripe
- **Automatización futura:** n8n
- **IA futura:** Claude / OpenAI / Ollama, solo como capa de valor adicional

### Principios técnicos
- FastAPI concentra la lógica de negocio.
- Supabase almacena datos y archivos.
- React consume APIs y representa la interfaz.
- La lógica crítica nunca debe vivir en el frontend.
- La lógica base no debe depender de IA.

## 8. Principios de arquitectura de producto

### Principio 1
**No construir solo interfaces.**

Construir:
- entidades
- relaciones
- reglas de negocio
- flujo operativo real

### Principio 2
**La lógica vive en el sistema; la IA solo potencia.**

IA no debe resolver:
- cálculos base
- reglas de deuda
- autorizaciones
- seguridad
- persistencia crítica

IA sí puede potenciar:
- redacción de mensajes
- alertas inteligentes
- resúmenes
- clasificación de riesgo
- asistentes limitados

### Principio 3
**Todo debe diseñarse desde el día 1 para `school_id`.**

Casi toda entidad operativa debe estar aislada por tenant.

## 9. Modelo de negocio

Next Edu tiene dos líneas de negocio complementarias:

### Línea 1: Cash inmediato
Implementaciones o setups iniciales para clientes que quieren personalización o despliegue asistido.

Rango esperado:
- S/ 2000 a S/ 4000

### Línea 2: Escala SaaS
Suscripción mensual estandarizada.

Planes base:
- Starter: S/ 129
- Pro: S/ 199
- IA: S/ 259
- Enterprise: personalizado

## 10. Pricing actual

### Plan Starter - S/ 129
Enfoque: entrada al sistema.

Incluye:
- gestión de alumnos
- asistencia QR
- registro de pagos manual
- cuotas simples
- panel básico

No incluye:
- IA
- automatización
- WhatsApp API
- análisis avanzado

### Plan Pro - S/ 199
Enfoque: gestión administrativa real.

Incluye:
- todo Starter
- cálculo automático de deuda
- dashboard de pagos
- reportes
- control de morosidad
- uso limitado de WhatsApp
- IA mínima futura opcional

### Plan IA - S/ 259
Enfoque: optimización del negocio.

Incluye:
- todo Pro
- cobranza preventiva con IA
- chatbot básico para padres
- alertas de deserción
- automatización WhatsApp

### Plan Enterprise
Enfoque: instituciones grandes.

Incluye:
- multisede
- integraciones
- soporte prioritario
- configuración avanzada
- mayor uso de IA y WhatsApp

## 11. Diferenciación estratégica

Las ideas de diferenciación más fuertes son:

### A. Cobranza preventiva con IA
No esperar solo a que el alumno sea marcado como deudor en ventanilla o QR.

Usar patrones de pago para sugerir o automatizar mensajes empáticos y preventivos.

Valor principal:
- reducción de olvido de pago
- mejor seguimiento
- mejor caja para la institución
- posicionamiento como asesor, no solo cobrador

### B. Alertas de riesgo de deserción
Cruzar señales como:
- asistencia
- tardanzas
- inasistencia consecutiva
- pagos irregulares
- eventualmente notas

Objetivo:
- detectar riesgo temprano
- activar intervención administrativa o académica

### C. Asistente virtual para padres
Canal conversacional limitado y útil, preferentemente por WhatsApp, para responder:
- saldo pendiente
- fecha de pago
- información administrativa simple

## 12. Orden recomendado de valor

### Primero construir
- tenants
- usuarios admin
- auth
- estudiantes
- matrículas
- pagos
- deuda/morosidad
- dashboard básico
- asistencia QR

### Después potenciar
- cobranza preventiva
- alertas tempranas
- asistente básico

### Al final perfeccionar
- PDF premium de carnet
- automatizaciones complejas
- IA avanzada
- reportes predictivos profundos

## 13. Decisión sobre carnet digital

El **carnet digital sí entra temprano** si es visual y funcional dentro del sistema.

El **carnet PDF premium** puede ir después.

Motivo:
- el carnet en pantalla ayuda a operación y UX
- la exportación bonita a PDF no es el corazón del negocio

## 14. Estrategia comercial

### Estructura actual
- founder como principal closer
- estudiantes/comisionistas como generadores de leads
- cierres hechos por el fundador en clientes medianos y grandes

### Enfoque comercial
No vender tecnología por tecnología.

Vender resultado:
- orden
- control
- reducción de morosidad
- mejor seguimiento
- menos tiempo perdido en tareas manuales

## 15. Principios de startup

- primero vender
- luego escalar
- luego automatizar
- no regalar demasiado valor en el plan base
- no depender de IA para el núcleo
- no contratar estructura pesada antes de validar ventas
- no entregar equity temprano salvo necesidad real y estratégica

## 16. Frases guía de posicionamiento

### Producto
> “Next Edu es un ERP escolar ligero ofrecido como SaaS.”

### Valor
> “No solo controla asistencia; ayuda a ordenar pagos y reducir morosidad.”

### Mensaje comercial
> “Esto no es un gasto, es un sistema que te ayuda a recuperar dinero que hoy estás perdiendo.”

## 17. Qué debe entender Claude siempre

Cuando Claude trabaje con este proyecto debe asumir que:

1. el producto tiene una orientación fuertemente operativa
2. el foco principal es pagos + control + morosidad
3. el QR es importante, pero no es toda la propuesta de valor
4. la IA es una capa de diferenciación, no el motor central del sistema
5. el producto debe ser simple de usar para administrativos
6. el contexto local peruano importa en pricing, ventas y adopción
7. todo debe evaluarse con criterio de MVP, rentabilidad y escalabilidad
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
# Next Edu - Modelo de negocio y pricing

## 1. Visión del modelo

Next Edu busca construir una empresa SaaS rentable en el sector educativo privado peruano, con foco en operación real y monetización clara.

La estrategia mezcla:
- ingresos inmediatos por implementaciones o setups
- recurrencia vía suscripción mensual SaaS

## 2. Objetivo del modelo

Construir un sistema que:
- sea accesible para el mercado local
- controle costos de IA y WhatsApp
- escale con estructura comercial ligera
- mantenga una línea premium para clientes grandes

## 3. Línea de negocio

## Línea 1 - Cash
Implementaciones o servicios iniciales.

Rango esperado:
- S/ 2000 a S/ 4000

Uso:
- activar caja inicial
- capturar clientes que quieren acompañamiento
- financiar crecimiento

## Línea 2 - Escala
SaaS por suscripción.

Planes actuales:
- S/ 129
- S/ 199
- S/ 259
- Enterprise personalizado

## 4. Posicionamiento comercial

No vender como:
- sistema QR
- software genérico de asistencia
- herramienta técnica compleja

Sí vender como:

> “Sistema que mejora cobranza y control académico.”

## 5. Mensaje principal de venta

> “Esto no es un gasto, es un sistema que te ayuda a recuperar dinero que hoy estás perdiendo.”

## 6. Planes actuales

## Plan Starter - S/ 129
### Enfoque
Entrada al sistema.

### Incluye
- gestión de alumnos
- asistencia QR
- registro de pagos manual
- cuotas simples
- panel básico

### No incluye
- IA
- automatización
- WhatsApp API
- análisis avanzado

### Objetivo estratégico
- adquisición de clientes
- entrada fácil
- bajo riesgo comercial

## Plan Pro - S/ 199
### Enfoque
Gestión administrativa real.

### Incluye
- todo Starter
- cálculo automático de deuda
- dashboard de pagos
- reportes
- control de morosidad
- uso limitado de WhatsApp
- IA mínima opcional futura

### Objetivo estratégico
- resolver el problema real del colegio
- mover al cliente desde operación básica a gestión efectiva

## Plan IA - S/ 259
### Enfoque
Optimización y diferenciación.

### Incluye
- todo Pro
- cobranza preventiva con IA
- chatbot básico para padres
- alertas de deserción
- automatización WhatsApp

### Objetivo estratégico
- generar ROI claro al cliente
- aumentar ticket medio
- diferenciarse frente a sistemas más básicos

## Plan Enterprise - Personalizado
### Enfoque
Academias grandes o colegios con necesidades especiales.

### Incluye
- multisede
- integraciones
- soporte prioritario
- configuración avanzada
- mayor uso de IA y WhatsApp

## 7. Principios de pricing

### Principio 1
No regalar demasiado valor en el plan base.

### Principio 2
La IA y WhatsApp deben ser palancas de ticket, no centros de pérdida.

### Principio 3
Los límites por plan deben proteger margen y facilitar upsell.

## 8. Control de costos

## 8.1 IA
### Regla
No usar IA en la lógica base.

### Sí usar IA para
- redacción de mensajes
- alertas inteligentes
- asistentes acotados
- resúmenes de información

### No usar IA para
- cálculos de deuda
- operaciones SQL
- validaciones centrales
- seguridad

### Frase guía
> “La lógica vive en Supabase/FastAPI; la IA solo potencia.”

## 8.2 WhatsApp API
### Regla
No ofrecer uso ilimitado sin control.

### Modelo sugerido
- Starter: sin automatización
- Pro: cupo limitado
- IA: cupo mayor
- Enterprise: negociación específica

## 9. Estructura comercial inicial

## Founder
Responsable principal de:
- demos
- cierres
- negociación
- venta consultiva

## Fuerza comercial ligera
Estudiantes u otros colaboradores orientados a:
- prospectar
- agendar reuniones
- generar leads

## Regla
Los generadores de leads no deben vender complejidad técnica; deben abrir puertas.

## 10. Segmentación comercial

### Pequeños (100-150 alumnos)
- pueden entrar por venta más simple
- buen fit para Starter o Pro

### Medianos
- requieren demo y manejo de objeciones
- buen fit para Pro

### Grandes / colegios
- cierre más consultivo y presencial
- potencial Enterprise o implementación

## 11. Modelo de comisiones actual

### Por plan
- Plan 129 -> S/ 10
- Plan 199 -> S/ 25
- Plan 259 -> S/ 50

### Bonos sugeridos
- 3 ventas -> + S/ 30
- 5 ventas -> + S/ 80

### Objetivo
Incentivar planes superiores y premiar consistencia.

## 12. Estrategia de escalamiento comercial

### Fase 1
El founder vende todo.

### Fase 2
Se apoyan estudiantes o comisionistas para generar leads.

### Fase 3
Se documenta el sistema comercial.

### Fase 4
Se delega parte del proceso de cierre.

## 13. Métrica principal

Funnel base:

`leads -> reuniones -> demos -> cierres`

## 14. Decisiones estratégicas ya tomadas

- no usar IA en todo
- plan básico limitado
- comisiones escalonadas
- founder como closer principal
- uso de estudiantes como apoyo comercial
- separación entre SaaS estándar y línea premium/implementación

## 15. Qué debe entender Claude

Cuando Claude analice pricing, estrategia o comercialización debe priorizar:

1. rentabilidad
2. claridad de posicionamiento
3. control de costos variables
4. facilidad de venta para el mercado local
5. diferenciación por resultado, no por complejidad técnica
# Next Edu - Diferenciación y estrategia de IA

## 1. Tesis de diferenciación

La diferenciación de Next Edu no debe basarse solo en tener QR, dashboard o chatbot.

La verdadera diferenciación debe construirse sobre esta idea:

> **Next Edu no solo administra; ayuda a prevenir pérdidas y a tomar acción antes de que aparezca el problema.**

Eso se traduce en tres líneas de valor:
- cobranza preventiva
- alertas tempranas de riesgo
- autoservicio para padres

## 2. Principio central de IA

La IA no es el núcleo del sistema.

La IA debe ser una **capa de potenciación** encima de un ERP funcional y rentable.

### Fórmula correcta
- sistema base sólido primero
- IA encima para aumentar valor, eficiencia y ticket

### Fórmula incorrecta
- construir todo alrededor de IA desde el inicio

## 3. Diferenciador principal

## A. Cobranza preventiva con IA

### Idea
En lugar de actuar solo cuando ya existe deuda visible o conflicto, usar patrones de comportamiento para sugerir seguimiento preventivo.

### Ejemplos de señales
- padre que suele pagar el día 15 y no ha pagado al día 20
- alumno con historial de retrasos crecientes
- cuotas por vencer sin movimiento
- familias con patrones repetidos de mora leve

### Acción esperada
La IA redacta o sugiere mensajes empáticos y personalizados.

Ejemplo conceptual:
- “Hola Sr. Juan, notamos un cambio respecto a su fecha habitual de pago. Si necesita apoyo o coordinación, estamos atentos.”

### Valor estratégico
- reduce morosidad por olvido
- mejora relación con el padre
- evita un tono agresivo de cobranza
- transforma al colegio en actor preventivo y no reactivo

### Cómo venderlo
No como “IA fancy”, sino como:

> “Seguimiento preventivo para mejorar cobranza sin desgastar a la administración.”

### Estado recomendado
**Prioridad alta** dentro de la diferenciación futura.

## 4. Diferenciador secundario

## B. Alertas de riesgo de deserción

### Idea
Cruzar señales académicas y operativas para detectar alumnos con riesgo creciente de abandono.

### Señales iniciales sugeridas
- ausencias consecutivas
- incremento de tardanzas
- caída de asistencia respecto a patrón histórico
- irregularidad en pagos
- eventualmente, notas o rendimiento

### Importante
En la primera etapa no venderlo como “predicción perfecta”.

Primero debe presentarse como:
- alerta temprana
- semáforo de riesgo
- priorización de seguimiento

### Valor estratégico
- ayuda a retener alumnos
- mejora percepción del colegio
- conecta lo administrativo con lo académico

### Estado recomendado
**Prioridad media**, después de resolver cobranza preventiva y base operativa.

## 5. Diferenciador de experiencia

## C. Asistente virtual para padres

### Idea
Permitir que padres consulten información administrativa de forma simple, preferentemente por WhatsApp.

### Alcance inicial recomendado
Muy acotado. Solo responder:
- saldo pendiente
- fecha de pago
- información básica de asistencia
- información administrativa simple

### Qué evitar al inicio
- conversaciones demasiado abiertas
- respuestas académicas complejas
- decisiones automáticas delicadas
- promesas que dependan de IA no controlada

### Valor estratégico
- reduce carga operativa de la administradora
- mejora experiencia de atención
- agrega percepción premium

### Estado recomendado
**Prioridad media-baja** comparado con cobranza preventiva.

## 6. Prioridad real de diferenciación

### Orden recomendado
1. cobranza preventiva
2. alertas tempranas de riesgo
3. asistente virtual acotado
4. automatizaciones más avanzadas
5. analítica predictiva profunda

## 7. Cómo empaquetar la IA por planes

## Starter - S/ 129
Sin IA.

## Pro - S/ 199
IA mínima o limitada a funciones internas muy controladas, si conviene en el futuro.

## IA - S/ 259
Debe concentrar las funciones diferenciales:
- cobranza preventiva
- alertas de riesgo
- asistente virtual básico

## Enterprise
Mayor personalización, más límites y automatización avanzada.

## 8. Guardrails de producto para IA

### Guardrail 1
La IA no reemplaza la lógica del ERP.

### Guardrail 2
La IA no debe introducir costos variables descontrolados.

### Guardrail 3
La IA no debe prometer precisión imposible sin suficientes datos.

### Guardrail 4
Todo output sensible debe poder supervisarse o auditarse.

## 9. Frases correctas para posicionar IA

### Correctas
- “automatización inteligente”
- “seguimiento preventivo”
- “alertas tempranas”
- “apoyo administrativo con IA”
- “asistente para consultas frecuentes”

### Evitar al inicio
- “predicción exacta”
- “IA que reemplaza a la administración”
- “chatbot que resuelve todo”
- “reducción garantizada del 30%” sin datos propios

## 10. Qué debe entender Claude

Cuando Claude proponga funcionalidades de IA para Next Edu debe:

1. priorizar funciones que mejoren caja o reduzcan carga operativa
2. evitar arquitectura dependiente de IA en el core
3. pensar primero en reglas, luego en IA
4. cuidar costos de API y WhatsApp
5. diferenciar claramente MVP, premium y visión futura
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
# Brief operativo para Claude - Next Edu

Usa este contexto para responder como asesor estratégico, funcional y técnico del proyecto **Next Edu**.

## Contexto general

Next Edu es una startup EdTech en Perú que está construyendo un **ERP escolar ligero ofrecido como SaaS multi-tenant** para colegios particulares y academias preuniversitarias.

El producto busca resolver problemas operativos reales, especialmente en:
- asistencia QR
- estudiantes
- matrículas
- pagos
- deuda y morosidad
- dashboard administrativo

## Qué es el producto

No lo trates como dos productos separados.

Es un solo producto con dos capas internas:

### 1. Dominio ERP escolar
- students
- enrollments
- attendances
- payments
- charges/installments
- debts/morosity
- dashboard

### 2. Dominio SaaS plataforma
- schools
- users
- subscriptions
- billing_events
- stripe_customers
- plan_limits

## Posicionamiento correcto

No venderlo como “sistema QR”.

Sí venderlo como:

> Sistema que mejora cobranza y control académico.

## Segmento objetivo inicial

- academias preuniversitarias
- colegios particulares
- clientes con 200 a 1000 estudiantes
- mercado peruano, sensible al precio y a la facilidad de uso

## Stack técnico

- Backend: FastAPI
- DB: Supabase/PostgreSQL
- Frontend: React
- Pagos SaaS: Stripe
- Automatización futura: n8n
- IA futura: Claude / OpenAI / Ollama

## Principios técnicos

- FastAPI maneja la lógica de negocio.
- Supabase persiste datos y archivos.
- React consume API y presenta la interfaz.
- La lógica crítica no vive en el frontend.
- La IA no debe usarse para el core del sistema.
- Casi toda entidad operativa debe considerar `school_id`.

## MVP actual

El MVP debe incluir:
- schools / tenants
- users admin
- auth
- students
- enrollments
- payments
- debt / morosity
- dashboard básico
- asistencia QR

## Priorización

### Sí priorizar
- pagos
- deuda/morosidad
- asistencia funcional
- dashboard básico
- experiencia simple para administrativos

### No priorizar demasiado temprano
- carnet PDF premium
- chatbot abierto
- IA profunda
- automatizaciones complejas
- reportes sofisticados

## Carnet digital

- sí al carnet digital visual temprano
- no es prioridad el PDF premium al inicio

## Pricing actual

### Starter - S/ 129
- alumnos
- asistencia QR
- pagos manuales
- cuotas simples
- panel básico
- sin IA ni automatización

### Pro - S/ 199
- todo Starter
- deuda automática
- dashboard de pagos
- reportes
- morosidad
- WhatsApp limitado

### IA - S/ 259
- todo Pro
- cobranza preventiva con IA
- chatbot básico para padres
- alertas de deserción
- automatización WhatsApp

### Enterprise
- multisede
- integraciones
- soporte prioritario
- mayor personalización

## Diferenciación más fuerte

### 1. Cobranza preventiva con IA
La IA analiza patrones y sugiere seguimiento empático antes de que la mora empeore.

### 2. Alertas tempranas de deserción
Cruzar asistencia, pagos y eventualmente notas para identificar riesgo.

### 3. Asistente virtual para padres
Autoservicio controlado por WhatsApp para saldo, fechas y consultas simples.

## Regla clave sobre IA

> La lógica vive en el sistema; la IA solo potencia.

IA sí para:
- redacción de mensajes
- sugerencias
- alertas
- resúmenes
- asistentes acotados

IA no para:
- cálculos centrales
- seguridad
- reglas de negocio base
- persistencia crítica

## Estrategia comercial

- el founder es el principal closer
- estudiantes o comisionistas ayudan a generar leads
- vender resultado, no tecnología
- mensaje clave: recuperar dinero y ordenar operación

## Cómo responder

Cuando respondas, prioriza:
1. claridad práctica
2. pensamiento de negocio
3. simplicidad ejecutable
4. escalabilidad sin sobrecomplicar
5. separación entre MVP, premium y futuro

## Qué evitar

- respuestas genéricas de software sin contexto educativo
- sobreingeniería innecesaria
- dependencia excesiva de IA
- recomendaciones caras o poco adecuadas para el mercado local

## Tono esperado

- profesional
- estratégico
- concreto
- orientado a ejecución real
- honesto sobre prioridades y trade-offs
