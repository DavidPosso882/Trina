# Modelo de negocio — TRINA

**Proyecto:** TRINA (VitrinaLocal) — directorio comercial georreferenciado con pedidos para recoger, reservas y membresías.
**Versión:** 1.0 (cierre E5) · Octubre de 2026
**Alcance:** municipio piloto con vocación turística del Eje Cafetero.
**Estado:** propuesta para la revisión del Product Owner y el Supervisor. Los valores marcados como **semilla** son de demostración y requieren validación (pendientes P-01 a P-07 del SRS).

---

## 1. Resumen

TRINA es una plataforma web que reúne la oferta comercial de un municipio piloto: los comerciantes publican su negocio, catálogo y horarios; los turistas y habitantes descubren negocios en lista y mapa, hacen pedidos para recoger y reservas; la plataforma cobra una **membresía Destacada** y una **comisión por pedidos pagados en línea**.

El modelo se apoya en tres ideas:

1. **La visibilidad se vende, la operación es gratis.** Publicar el negocio, cargar el catálogo y recibir pedidos y reservas es gratis. Se paga solo por la membresía que da prioridad e insignia.
2. **La comisión se cobra solo donde hay dinero en línea.** Los pedidos pagados en el local no generan comisión, para no castigar a los negocios que no usan la pasarela.
3. **El piloto no busca utilidad, busca evidencia.** Durante las 8 semanas del proyecto, lo que se valida es si los comerciantes cargan su negocio sin ayuda, si los clientes usan el pedido y la reserva, y si los costos caben en los ingresos.

> **Aclaración importante:** en esta versión todos los pagos son **simulados** (sandbox). No se procesa dinero real, no se almacenan números de tarjeta y no hay facturación electrónica. La validación de los valores de negocio se hace con datos de demostración.

---

## 2. Problema y propuesta de valor

**Problema.** El comercio local del municipio piloto tiene presencia digital dispersa (redes sociales, mensajería, voz a voz) y depende de plataformas externas para ser encontrado. Para el turista, la información está fragmentada y sin horarios ni ubicación confiables.

**Propuesta de valor por actor:**

| Actor | Qué gana |
|---|---|
| Comerciante | Un perfil público verificado con fotos, horarios, catálogo, ubicación y contacto por WhatsApp; pedidos y reservas organizados; estadísticas simples de visitas, pedidos e ingresos |
| Cliente (turista o habitante) | Descubrir qué está abierto, qué tan cerca y a qué precio; pedir para recoger y reservar desde el teléfono |
| Municipio / gremio | Una vitrina única de la oferta local y datos agregados de actividad (usuarios no residentes, comisiones, membresías) |

**Diferenciador frente a las alternativas:** un solo lugar para descubrir, pedir para recoger y reservar, con un proceso de alta guiado por pasos, pensado para comerciantes con baja alfabetización digital y uso principal desde el celular (RNF-01, RNF-08).

---

## 3. Fuentes de ingreso

### 3.1 Membresía Destacada (ingreso principal)

| Plan | Precio | Beneficios |
|---|---|---|
| **Básica** | Gratis, siempre disponible | Negocio visible en el directorio y el mapa, catálogo, pedidos y reservas, hasta **2** productos destacados |
| **Destacada** | **$19.900 COP/mes** (valor semilla, P-02) | Insignia **Destacado**, prioridad en el orden por defecto del directorio, hasta **6** productos destacados |

- La suscripción se activa por **30 días** con un pago aprobado y se renueva por el mismo período.
- Si vence, el negocio no pierde visibilidad: vuelve al plan Básico y pierde la insignia y la prioridad.
- El precio y los límites son **parámetros del sistema** que el administrador puede ajustar; el valor de $19.900 es una semilla de demostración pendiente de validación con el Product Owner.

### 3.2 Comisión por pedido pagado en línea

- **Porcentaje semilla: 5 %** sobre el total del pedido, configurable entre **0 % y 30 %**.
- **Solo aplica a pedidos con pago `SANDBOX` (en línea) aprobado.** Los pedidos con pago en el local (`EN_LOCAL`) **no** generan comisión.
- La comisión se calcula al aprobar el pago: `comisión = redondeo(total × porcentaje / 100)`; el comerciante recibe el neto.
- Si el pedido se rechaza o se cancela, el pago se reembolsa (simulado) y **la comisión se revierte**.
- Cada pago conserva el porcentaje vigente al momento del cobro; un cambio de porcentaje no altera los pagos anteriores.

### 3.3 Ingresos fuera de alcance en esta versión

Se dejaron explícitamente afuera, para no prometer lo que el producto no hace:

- Publicidad, patrocinios o posiciones pagas.
- Comisión sobre reservas o anticipos de reserva.
- Ventas con domicilio y logística de reparto.
- Venta o cesión de datos personales.
- Dinero real, facturación electrónica ante la DIAN y manejo de impuestos.

---

## 4. Estructura de costos (piloto)

La plataforma se opera con **un solo servidor** y Docker Compose (API Spring Boot, PostgreSQL, MinIO y Caddy), según el diseño ADR-11. La estimación es del equipo y debe reemplazarse por cotizaciones reales antes de comprometer un presupuesto (pendiente P-03 del SRS).

| Línea de costo | Estimación mensual | Supuesto | Estado |
|---|---|---|---|
| Servidor único (VPS 2 vCPU / 4 GB / 80 GB SSD) | $80.000 – $160.000 COP (≈ US$20 – 40) | Suficiente para el portafolio del piloto (≈ 200 negocios aprobados) | **Estimado, por cotizar** |
| Dominio + HTTPS | $3.000 – $7.000 COP/mes (dominio anual ≈ US$10 – 25) | Caddy emite y renueva el certificado automáticamente | **Estimado, P-03** |
| Correo transaccional (SMTP) | $0 – $60.000 COP | Capa gratuita para el volumen del piloto; plan pago si se supera | **Estimado, P-06** |
| Respaldo (base de datos y objetos) | $0 – $20.000 COP | Mismo disco del servidor o almacenamiento externo pequeño; retención de 7 días | **Estimado (RNF-10)** |
| Monitoreo y verificación de salud | $0 | `/actuator/health` + reinicio automático de contenedores | Implementado |
| Mantenimiento y soporte | 8 – 16 horas/mes del equipo | Correcciones, respaldos, altas asistidas y acompañamiento a comerciantes | **Estimado (no monetizado en el proyecto)** |
| Capacitación y acompañamiento en terreno | 2 – 4 jornadas durante el piloto | Acompañamiento a los comercios piloto (mitigación R-04) | **Estimado** |

**Costo operativo estimado del piloto: $100.000 – $250.000 COP/mes** (incluye infraestructura y deja el soporte como horas del equipo).

Nota: la conversión usa una referencia de ≈ 4.000 COP por dólar; hay que recalcularla con la tasa vigente al momento de cotizar.

---

## 5. Supuestos del modelo

| # | Supuesto | Referencia |
|---|---|---|
| 1 | Municipio piloto único, aún por confirmar con el Supervisor (el Acta y el Plan no coinciden) | P-01 |
| 2 | Comisión del 5 %, plan Destacada de $19.900 y topes de destacados (2/6) son semilla, por validar | P-02 |
| 3 | Servidor y dominio definidos antes de la operación real; el piloto puede correr en local | P-03 |
| 4 | Proveedor SMTP con capa gratuita para correo transaccional | P-06 |
| 5 | Área del municipio piloto (coordenadas) definida para validar ubicaciones | P-05 |
| 6 | Un negocio por comerciante (D-01) y un municipio por plataforma | SRS §2.3 |
| 7 | Pedidos solo para recoger, de un negocio por pedido, sin domicilios | D-02 |
| 8 | Pagos simulados en el piloto; la pasarela real se evalúa después | D-08 |
| 9 | Volumen del piloto: hasta 200 negocios aprobados y decenas de pedidos por semana | RNF-02 |
| 10 | El comerciante objetivo usa el celular y tiene baja alfabetización digital | RNF-01 |

---

## 6. Escenarios de ingreso

Los escenarios son ilustrativos y usan los valores semilla. La comisión se calcula sobre el valor de los pedidos pagados en línea (GMV sandbox) del mes.

**Fórmula:** `ingreso mensual = negocios Destacados × $19.900 + GMV sandbox × 5 %`

| Escenario | Negocios Destacados | GMV sandbox del mes | Membresías | Comisión | Ingreso total | Costo estimado | Margen |
|---|---|---|---|---|---|---|---|
| **A. Arranque del piloto** | 2 | $400.000 | $39.800 | $20.000 | **$59.800** | $100.000 – $250.000 | Negativo (etapa de validación) |
| **B. Tres meses después** | 10 | $2.000.000 | $199.000 | $100.000 | **$299.000** | $100.000 – $250.000 | Positivo |
| **C. Objetivo del primer año** | 25 | $8.000.000 | $497.500 | $400.000 | **$897.500** | $200.000 – $400.000 | Positivo |

Lecturas del ejercicio:

- Con la estructura de un solo servidor, **el punto de equilibrio ronda los 5 suscriptores con el costo mínimo y los 13 con el máximo estimado**; cada peso de comisión baja esa cifra.
- El ingreso por comisión crece con el uso real; el ingreso por membresía es predecible y no depende del volumen de ventas.
- El riesgo principal del modelo no es el costo de infraestructura, sino la **adopción**: si pocos comerciantes cargan su negocio y pocos clientes piden, la membresía pierde valor percibido.

**Valor para el comerciante (por qué pagaría la membresía).** El plan Destacado cuesta $19.900/mes. Con un ticket promedio de $20.000, **una venta adicional al mes ya iguala el costo de la membresía en ingresos** (no en margen); lo que se vende es visibilidad dentro del directorio y prioridad en el orden por defecto. Este argumento es una hipótesis del equipo y debe validarse con los comercios piloto.

---

## 7. Qué valida el piloto (8 semanas)

El piloto no busca rentabilidad: busca evidencia para decidir la siguiente etapa.

| Hipótesis | Cómo se mide | Meta |
|---|---|---|
| Los comerciantes cargan su negocio sin ayuda | Prueba de usabilidad RNF-01 (5 o más personas) y tasa de negocios que pasan de borrador a en revisión | 80 % completa el alta; mediana ≤ 15 minutos |
| La interfaz les resulta clara | Cuestionario SUS | 70 o más |
| Los clientes descubren y piden | Pedidos y reservas creados; vistas a perfiles en el panel del comerciante (RF-40) | Al menos un pedido y una reserva por negocio activo en la semana de pruebas |
| El pago en línea se usa y funciona | Pagos sandbox aprobados vs. pagos en el local | Proporción de pagos en línea sobre el total de pedidos |
| El municipio piloto está interesado | Usuarios no residentes sobre el total (indicador del dashboard, RF-41) | Proporción relevante de visitantes frente a residentes |
| La membresía Destacada se percibe útil | Suscripciones Destacadas activas y renovaciones | Al menos 2 suscripciones en el piloto |
| Los costos caben | Costo real de infraestructura y horas de soporte frente a los ingresos | Costo operativo dentro del rango estimado |

Los resultados del piloto deberían responderse con los indicadores que ya expone la plataforma (dashboard del administrador y estadísticas del comerciante) más la observación directa en la prueba de usabilidad.

---

## 8. Riesgos del modelo

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Baja adopción de comerciantes (R-04) | El directorio queda vacío y la membresía no se vende | Alta asistida (RF-47), acompañamiento a los comercios piloto, alta guiada por pasos |
| Baja adopción de clientes | Sin pedidos, la comisión no existe | Datos de demostración, mapa y filtros, pedidos en el local sin pasarela |
| Ubicación del municipio sin confirmar (P-01) | El discurso comercial y los datos del piloto no coinciden | Cerrar P-01 con el Supervisor antes de operar |
| Precio de la membresía mal calibrado (P-02) | Se cobra poco o no se vende | Validar con los comercios piloto y ajustar el parámetro |
| Dependencia de teselas públicas de OpenStreetMap (R-11) | Límite de uso del mapa | Bajo volumen, atribución visible y proveedor alterno si crece |
| Dependencia de un único servidor | Caída del servicio | Reinicio automático de contenedores, verificación de salud, respaldo diario y restauración probada (RNF-10) |
| Correo transaccional sin proveedor definido (P-06) | La recuperación de contraseña no llega | Proveedor con capa gratuita y envío asíncrono por `MailPort` |

---

## 9. Operación y responsabilidades

| Actividad | Quién | Frecuencia |
|---|---|---|
| Revisar y aprobar negocios | Administrador | Diaria |
| Alta asistida y acompañamiento | Administrador / equipo | Según demanda del piloto |
| Responder soporte y moderar reseñas | Administrador | Diaria |
| Verificar salud, respaldos y restauración | Equipo técnico | Semanal / antes del hito |
| Actualizar parámetros (comisión, precios, límites) | Administrador con visto bueno del Product Owner | Cuando cambie el acuerdo comercial |
| Medir indicadores del piloto | Scrum Master | Semanal |

---

## 10. Fuera de alcance y pasos siguientes

**Fuera de alcance de esta versión** (exclusiones del Plan de Trabajo y del SRS): dinero real, facturación electrónica ante la DIAN, logística de reparto, aplicaciones móviles nativas, WhatsApp Business API, recomendaciones con IA, más de un municipio y más de un negocio por comerciante.

**Pasos siguientes propuestos a partir de los resultados del piloto:**

1. Confirmar municipio (P-01) y validar precios y comisión con datos reales (P-02).
2. Definir servidor, dominio y SMTP (P-03, P-06) y pasar a un entorno con HTTPS.
3. Completar las pantallas pendientes que afectan la adopción (registro, recuperación de contraseña, mapa y filtros, catálogo del comerciante).
4. Evaluar una pasarela de pago real con dinero y facturación, como fase siguiente.
5. Medir el punto de equilibrio con los costos reales y decidir si el modelo escala a un segundo municipio.

---

*Documentos relacionados: `trina-requirements.md` (§2.3 decisiones de alcance, §4.9 parámetros, §8 criterios de hito), `trina-design.md` (§7.1 pagos y comisión, ADR-11 despliegue), `manual-administrador.md` (parámetros y planes) y `estado-hito.md` (estado de cada requisito).*
