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
