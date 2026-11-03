# Estado del hito — TRINA

**Propósito:** servir de lista de verificación al Product Owner en la revisión del hito (9 de noviembre) y en la entrega final (16 de noviembre). Resume qué está implementado y verificado, con evidencia, y qué falta.
**Corte de información:** 13 de octubre de 2026. Backend y frontend reverificados hoy (ver §1); resto según `odd/tasks/STAND-BY-2026-10-11.md` y la verificación del código en este repositorio.
**Referencias:** SRS §8.2 (criterios de hito) y §8.3 (criterios de entrega final).

---

## 1. Resumen de verificación

| Evidencia | Resultado |
|---|---|
| Pruebas del backend (`mvn -B test`) | **240 pruebas, 0 fallos** (reverificado 13 oct 2026: `Tests run: 240, Failures: 0, Errors: 0, Skipped: 0`, BUILD SUCCESS en 1m36s) |
| Integración con PostgreSQL real | Flyway V1–V15 aplica limpio; smoke E2E manual de los flujos críticos (registro, negocio, aprobación, pedido, pago, notificaciones, estadísticas) |
| Frontend (`tsc --noEmit` + `vite build`) | **0 errores de tipos y compilación exitosa** (reverificado 13 oct 2026: `tsc --noEmit` exit 0, `vite build` OK en 3.61s) |
| Migraciones | 15 migraciones versionadas (`V1`–`V15`) |
| Dataset de demostración | 4 negocios aprobados (1 Destacada), 8 ítems, 2 pedidos, 1 reserva, 2 reseñas, 5 cuentas demo |
| Pruebas de interfaz (frontend) | No hay pruebas automatizadas de UI; la verificación es por contrato y compilación |

**Leyenda de estado**

| Estado | Significado |
|---|---|
| ✅ **Completo** | Implementado en el servidor (con pruebas) y disponible en la interfaz |
| 🟡 **Parcial** | Implementado en el servidor (con pruebas), pero falta parte de la interfaz o un caso de uso |
| 🔴 **Falta pantalla** | Implementado y probado en el servidor, sin interfaz todavía |
| ⚪ **Fuera de alcance** | Excluido por el Acta o el SRS |

---

## 2. Matriz de requisitos P1 (34)

| RF | Requisito | Servidor | Interfaz | Estado | Nota / evidencia |
|---|---|---|---|---|---|
| RF-01 | Registro de usuarios | ✅ | ✅ | ✅ | Endpoint probado (duplicado 409, sin consentimiento 400, rol ADMIN 400) + pantalla `/registro` (PU-05, crea la cuenta y redirige según el rol) |
| RF-02 | Inicio de sesión seguro | ✅ | ✅ | ✅ | JWT, bloqueo por intentos (429) y mensajes §6.2 |
| RF-04 | Autorización por rol con JWT | ✅ | ✅ | ✅ | Rutas protegidas por rol; propiedad del recurso verificada en el servidor |
| RF-05 | Cierre de sesión | ✅ | ✅ | ✅ | Botón **Salir** descarta el token |
| RF-06 | Registro del negocio | ✅ | ✅ | 🟡 | Asistente de 6 pasos; falta la validación de “ubicación dentro del área del municipio” (requiere P-05) |
| RF-07 | Revisión de negocios por el administrador | ✅ | ✅ | ✅ | Aprobar, pedir ajustes, rechazar y suspender con motivo obligatorio |
| RF-08 | Directorio público | ✅ | 🟡 | 🟡 | La lista funciona con búsqueda por texto; faltan foto, calificación, “abierto ahora” e insignia en la tarjeta de la lista, y la portada muestra datos de ejemplo |
| RF-09 | Georreferenciación | ✅ | ✅ | ✅ | `GET /negocios/mapa` probado + mapa en `Explorar` (`MapaExplorar`: pines agrupados por grilla con enlace al perfil) y selector de ubicación en el asistente |
| RF-10 | Perfil público | ✅ | ✅ | ✅ | Catálogo, horarios, contacto, reseñas y conteo de visitas |
| RF-11 | Edición del perfil | ✅ | ✅ | ✅ | El servidor bloquea el nombre tras la aprobación; la interfaz también bloquea categoría (D-10) |
| RF-12 | Fotografías del negocio | ✅ | ✅ | ✅ | Subida, principal, orden y borrado; límites 10 fotos / 5 MB; WebP aceptado (plugin `imageio-webp` + `SoporteWebpImageioTest` que decodifica un WebP real) |
| RF-13 | Horarios de atención | ✅ | ✅ | ✅ | Franjas por día, cierre tras medianoche, “abierto ahora” |
| RF-14 | Medios de contacto | ✅ | ✅ | ✅ | Teléfono, WhatsApp con mensaje prellenado y ocultamiento de botones vacíos |
| RF-15 | Crear productos o servicios | ✅ | ✅ | ✅ | Endpoint y validaciones probadas + pantalla de catálogo del comerciante (`/panel/catalogo`, funciona en borrador vía `GET /catalogo/propio`) |
| RF-16 | Editar, desactivar y eliminar ítems | ✅ | ✅ | ✅ | Ídem anterior (edición, disponibilidad, baja lógica y categorías desde el panel) |
| RF-17 | Catálogo público | ✅ | 🟡 | 🟡 | El catálogo se ve agrupado en el perfil; la vista de ítem no se registra desde la interfaz (afecta RF-42) |
| RF-18 | Categorías internas del catálogo | ✅ | ✅ | ✅ | Agrupación visible en el perfil + gestión por el comerciante en el panel Catálogo |
| RF-20 | Búsqueda por texto | ✅ | 🟡 | 🟡 | Busca sin tildes sobre nombre, categoría e ítems; el buscador de la portada no está conectado y no hay sugerencias |
| RF-21 | Filtro por categoría | ✅ | ✅ | ✅ | Parámetro soportado por el servidor; `Explorar` aplica `?categoria=` (id o nombre) y la portada enlaza con el filtro |
| RF-24 | Mapa interactivo sincronizado | ✅ | ✅ | ✅ | Endpoint ligero con filtros probado + vista de mapa en `Explorar` sincronizada con los mismos filtros |
| RF-25 | Crear pedido | ✅ | ✅ | ✅ | Flujo completo con carrito y pago; el servidor valida que el negocio esté abierto (`abiertoSiTieneFranjas`, 422 si está cerrado) |
| RF-26 | Crear reserva | ✅ | ✅ | ✅ | FRANJA y ALOJAMIENTO con disponibilidad y cupo (RN-07); el servidor valida que el inicio de la FRANJA caiga en el horario de atención (solo el inicio) |
| RF-27 | Gestión de estados por el comerciante | ✅ | ✅ | ✅ | Acciones por estado con motivo obligatorio y reembolso simulado avisado |
| RF-28 | Pago simulado en sandbox | ✅ | ✅ | ✅ | Tarjetas de prueba, idempotencia y expiración a los 30 min |
| RF-30 | Carrito | — | ✅ | ✅ | En el navegador (`localStorage`), un negocio por pedido |
| RF-31 | Historial de pedidos y reservas | ✅ | ✅ | ✅ | Filtros por estado, detalle y cancelación cuando corresponde |
| RF-33 | Planes de membresía | ✅ | ✅ | ✅ | Básica y Destacada con precio, beneficios y topes |
| RF-34 | Suscripción a plan pagado | ✅ | ✅ | ✅ | Suscripción `PENDIENTE_PAGO` → `ACTIVA` al aprobar el pago |
| RF-35 | Vigencia y estado | ✅ | ✅ | ✅ | Plan efectivo al consultar y aviso de vencimiento a 7 días |
| RF-37 | Visibilidad diferenciada | ✅ | 🟡 | 🟡 | Insignia en el perfil y orden por defecto en el servidor; la lista de `Explorar` todavía no muestra la insignia |
| RF-40 | Estadísticas del comerciante | ✅ | ✅ | ✅ | 7 o 30 días: visitas, pedidos, reservas e ingresos |
| RF-41 | Estadísticas del administrador | ✅ | ✅ | ✅ | Negocios por estado, usuarios por rol, pedidos, comisiones y membresías |
| RF-43 | Gestión de usuarios | ✅ | ✅ | ✅ | Filtros, activar/desactivar, cambio de rol y sin autodesactivación |
| RF-48 | Privacidad y derechos del titular | ✅ | ✅ | ✅ | Exportar y eliminar en **Mi cuenta** + pantalla pública de política en `/privacidad` (PU-07) |

**Resultado P1:** 29 requisitos completos y 5 parciales (RF-06, RF-08, RF-17, RF-20, RF-37), 0 sin pantalla. El servidor tiene implementación probada para todos los casos con parte de servidor; el único requisito sin parte de servidor es RF-30 (carrito en el navegador).

---

## 3. Requisitos P2 y P3

### P2 — Comprometidos (12)

| RF | Requisito | Servidor | Interfaz | Estado |
|---|---|---|---|---|
| RF-03 | Recuperación de contraseña | ✅ | ✅ | ✅ Token de un uso y 30 min probado + pantallas `/recuperar-clave` y `/restablecer-clave` (incluye camino de clave temporal) |
| RF-22 | Cercanía | ✅ | ✅ | ✅ Haversine, radio y orden probados + selector de punto en el mapa y filtros de cercanía en `Explorar` |
| RF-23 | Abierto ahora y nivel de precio | ✅ | ✅ | ✅ Filtros probados + filtros en `Explorar` (abierto ahora, nivel de precio) |
| RF-29 | Comisión por venta | ✅ | — | ✅ RN-06 con reversión en reembolso |
| RF-32 | Notificaciones | ✅ | ✅ | 🟡 Campana, contador y marcado de leídas; el correo (P3 del SRS) no está cableado |
| RF-36 | Renovación | ✅ | ✅ | ✅ Ventana respetada y nuevo período de 30 días |
| RF-42 | Productos más consultados | ✅ | 🟡 | 🟡 Ranking disponible; mide apariciones en el catálogo porque la vista de ítem no se registra desde la interfaz |
| RF-44 | Categorías del directorio | ✅ | ✅ | ✅ Alta, edición y desactivación |
| RF-45 | Parámetros del sistema | ✅ | ✅ | ✅ Comisión validada en 0–30 y auditoría de cambios |
| RF-46 | Auditoría | ✅ | ✅ | 🟡 Registra aprobaciones, rechazos, usuarios, parámetros y perfiles; la moderación de reseñas no se audita |
| RF-47 | Alta asistida | ✅ | ✅ | ✅ Alta de comerciante y negocio con clave temporal visible en el panel; el primer ingreso (`CAMBIO_CLAVE_REQUERIDO`) lo atiende `Ingresar` hacia el restablecimiento |
| RF-49 | Gestión de la cuenta propia | ✅ | ✅ | ✅ Editar datos y cambiar contraseña con rotación de sesiones |

### P3 — Opcionales (3)

| RF | Requisito | Estado |
|---|---|---|
| RF-19 | Productos destacados | 🟡 Servidor con límite por plan; sin pantalla de gestión |
| RF-38 | Reseñas y calificaciones | ✅ Publicar, editar, una por cliente e insignia “Compra verificada” |
| RF-39 | Moderación de reseñas | ✅ Reporte por el comerciante y ocultar/mostrar por el administrador |

---

## 4. Lo que falta para la entrega final (§8.3)

| Pendiente | Tipo | Estado | Referencia |
|---|---|---|---|
| Pruebas integrales ejecutadas y documentadas | E5 | ✅ Informe `docs/informe-pruebas.md` (13 oct 2026: backend 240/240, frontend tsc + build, smoke E2E) | §8.3 |
| Manuales de usuario y administrador | E5 | ✅ Entregados (`docs/manual-usuario.md`, `docs/manual-administrador.md`) | §8.3 |
| Modelo de negocio | E5 | ✅ Entregado (`docs/modelo-negocio.md`) | §8.3 |
| Informe final con evidencias | E5 | Fuera de este documento | §8.3 |
| Prueba de usabilidad (RNF-01) semana 7, con 5 comerciantes y 3 clientes, SUS ≥ 70 | E5 | **Pendiente** | RNF-01 |
| Medición de RNF-02 (Lighthouse móvil < 3 s; búsqueda < 2 s; p95 API < 500 ms) | E5 | **Pendiente** | RNF-02 |
| Auditoría de accesibilidad RNF-07 (Lighthouse ≥ 90 y lista manual) | E5 | **Pendiente** | RNF-07 |
| Compatibilidad RNF-08 (navegadores objetivo y 360–1920 px) | E5 | **Pendiente** | RNF-08 |
| Pruebas E2E automatizadas (Playwright) | E5 | **Pendientes**; hoy hay smoke manual | §10.4 del diseño |
| Cobertura de pruebas ≥ 60 % en módulos críticos | E5 | **Sin medir**; hay 240 pruebas de backend | RNF-09 |
| Prueba de restauración de respaldo (≤ 4 h, pérdida ≤ 24 h) | E5 | **Pendiente** | RNF-10 |
| Correo transaccional (notificaciones P3 y recuperación) | P3 | **Pendiente**; la recuperación se probó con el enlace en el log | RF-32 E4, IE-04 |
| Dinero real y facturación electrónica ante la DIAN | Excluido | ⚪ Fuera de alcance por el Acta | §2.4 del SRS |
| Logística de reparto, apps nativas y WhatsApp Business API | Excluido | ⚪ Fuera de alcance | §2.4 del SRS |
| Pantallas de interfaz pendientes (registro, recuperación, mapa, filtros, catálogo, política) | Cierre | ✅ Cerradas (ver §2 y §3) | RNF-01/02, RF-01/03/09/21/24 |

### Pendientes de decisión del Product Owner (SRS §9)

| ID | Pendiente | Responsable | Fecha límite |
|---|---|---|---|
| P-01 | Confirmar el municipio piloto (Alcalá según el SRS; el dataset demo usa municipios del Quindío) | Daniela | 9 oct |
| P-02 | Validar comisión (5 %), precio del plan Destacada ($19.900) y topes de destacados | Juan David | 16 oct |
| P-03 | Definir servidor y dominio (necesario para HTTPS) | David | 16 oct |
| P-04 | Confirmar el framework del frontend (React + Vite) | Juan David | 12 oct |
| P-05 | Definir las coordenadas del área del municipio (bloquea RF-06 E5) | Juan David y David | 16 oct |
| P-06 | Elegir el proveedor SMTP de producción | David | 23 oct |
| P-07 | Alinear la política de tratamiento de datos con la de la UQ | Daniela | 16 oct |

---

## 5. Riesgos abiertos para el hito

| Riesgo | Impacto | Mitigación propuesta |
|---|---|---|
| Seis requisitos P1 no tenían pantalla (registro, mapa, filtro por categoría y catálogo del comerciante) | Cerrado el 13 oct 2026: las 6 pantallas existen y están verificadas por contrato + compilación | — |
| Migraciones verificadas en local (V1–V14 en arranque con PostgreSQL real y V15 con Testcontainers), todavía no en el servidor de despliegue | Riesgo de diferencias al publicar | Repetir el arranque y el smoke en el servidor definitivo antes del hito |
| RF-25/RF-26 no validaban horario de atención al crear pedido/reserva | Cerrado: pedido valida abierto-ahora (422), reserva valida el inicio de la FRANJA | — |
| Sin mediciones de rendimiento, accesibilidad ni usabilidad | No se puede demostrar RNF-01, RNF-02, RNF-07 y RNF-08 | Agenda de pruebas en la semana 8 y registro de evidencias (capturas y reportes Lighthouse) |
| Alpine/ImageIO sin soporte WebP | Cerrado: plugin `imageio-webp` + test con WebP real decodificable | — |

---

*Documentos relacionados: `trina-requirements.md` (§8 criterios de aceptación), `odd/tasks/STAND-BY-2026-10-11.md` (verificaciones por sesión), `docs/manual-usuario.md`, `docs/manual-administrador.md`, `docs/modelo-negocio.md`, `docs/informe-pruebas.md` y `docs/desarrollo.md`.*
