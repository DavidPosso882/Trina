# Especificación de Requisitos de Software (SRS) — Proyecto TRINA

| Atributo | Valor |
|---|---|
| Proyecto | TRINA (VitrinaLocal) — Directorio comercial georreferenciado con pedidos, reservas y membresías |
| Documento | SRS — Componente 2 (Especificación de requisitos) del Acta de Inicio |
| Versión | 1.0 — Línea base definitiva |
| Fecha | 5 de octubre de 2026 (semana 3, cierre del Sprint 2) |
| Equipo | Daniela Arboleda Trejos (Scrum Master, backend) · Juan David Cardozo Torres (Product Owner, frontend/UI) · David Alfonso Posso Cano (BD, infraestructura, QA) |
| Supervisor | Alejandro Urrea Ospina |
| Documentos hermanos | `trina-design.md` (arquitectura, UML, datos, API) · `trina-ui-design.md` (diseño de interfaz) |
| Estado | Listo para aprobación del Supervisor. Los pendientes abiertos están en la sección 9 |

---

## 1. Introducción

### 1.1 Propósito
Este documento especifica **qué** debe hacer TRINA y bajo qué condiciones de calidad. Es la línea base contractual para diseño, desarrollo, pruebas y sustentación. Todo lo que el Acta de Inicio exige está trazado en la sección 3.

### 1.2 Alcance
TRINA es una aplicación web responsiva con panel de comerciante y panel administrativo, respaldada por una API REST (Spring Boot), PostgreSQL y almacenamiento de objetos MinIO. Centraliza la oferta comercial de un municipio piloto con vocación turística: los comerciantes publican su negocio, catálogo y horarios; los clientes (turistas y habitantes) descubren negocios en lista y mapa, hacen pedidos para recoger y reservas con pago simulado; la plataforma gestiona membresías y estadísticas.

### 1.3 Referencias
- Acta de Inicio y Planificación Técnica (inicio 21-sep-2026).
- Plan de Trabajo TRINA y documento de Elección del Proyecto.
- Ley 1581 de 2012 (protección de datos personales) y política de tratamiento de datos de la Universidad del Quindío.
- WCAG 2.1 nivel AA.

### 1.4 Cronograma contractual (según el Acta)

| Semana | Fechas | Sprint / Épica | Producto |
|---|---|---|---|
| 1 | 21–27 sep | S1 · E1 | Diagnóstico y análisis de mercado |
| 2–3 | 28 sep–11 oct | S2 · E2 | **Este SRS** |
| 4–5 | 12–25 oct | S3 · E3 | Arquitectura, UML, datos, API, UI + esqueleto técnico |
| 6–7 | 26 oct–8 nov | S4 · E4 | Desarrollo e integración |
| 8 | 9–15 nov | S5 · E5 | Cierre: pruebas integrales, manuales, informe, modelo de negocio |
| — | **9 nov** | **Hito** | **100 % de ejecución** |
| 9 | **16 nov** | **Sustentación** | Entrega final |

> **Ajuste respecto al Plan de Trabajo.** El Plan asigna las semanas 8–9 al Sprint 5, pero el Acta fija el hito de ejecución el 9 de noviembre y la sustentación el 16 de noviembre. El Sprint 5 se ejecuta, por tanto, en la semana 8 (9–15 nov). La construcción real ocurre en la semana 6–7 (14 días), por eso el diseño propone un esqueleto técnico anticipado en el Sprint 3 (ver `trina-design.md`, sección 10).

### 1.5 Convenciones
- **Identificadores:** RF-nn (funcional), RNF-nn (no funcional), RN-nn (regla de negocio), D-nn (decisión de alcance), UC-nn (caso de uso, definido en el diseño).
- **Prioridad**, derivada del Acta:
  - **P1 — Obligatorio.** Nombrado explícitamente en el Acta. Debe estar completo en el hito del 9 de noviembre.
  - **P2 — Comprometido.** Sustentado en el Plan de Trabajo o necesario para que un P1 funcione. Entra al hito si la capacidad lo permite, y su recorte requiere acuerdo con el Supervisor.
  - **P3 — Opcional.** Valor agregado fuera del Acta. Se hace solo si P1 y P2 están cerrados; se puede entregar en el Sprint 5.
- **Escenarios:** formato *Dado / Cuando / Entonces*. Cada escenario se convierte en al menos una prueba automatizada o de aceptación.
- **Moneda y hora:** pesos colombianos (COP) sin decimales; zona horaria `America/Bogota`.

---

## 2. Descripción general

### 2.1 Actores

| Actor | Descripción y objetivo |
|---|---|
| **Visitante** | Persona sin sesión. Consulta el directorio, mapa, perfiles y catálogos. |
| **Cliente** | Turista o habitante autenticado. Hereda al Visitante; además hace pedidos y reservas, consulta su historial y (P3) reseña. |
| **Comerciante** | Propietario (o persona que este autorice usando su cuenta) de un negocio. Administra perfil, catálogo, horarios, pedidos, reservas, membresía y estadísticas. |
| **Administrador** | Personal de la plataforma. Aprueba negocios, modera, gestiona usuarios, parámetros, membresías y ve métricas globales. Su cuenta se crea por semilla; no se autoregistra. |
| **Pasarela de pago (sistema)** | Procesa cobros de prueba (simulador interno por defecto) para pedidos y membresías. |

### 2.2 Supuestos y restricciones
- Equipo de 3 personas, 8 semanas de calendario más sustentación; stack fijo: Spring Boot, PostgreSQL, MinIO, aplicación web responsiva, JWT.
- Público comerciante con baja alfabetización digital (diseño centrado en el usuario).
- Todos los pagos son simulados; nunca se procesa dinero real ni se almacenan números de tarjeta.
- Conectividad móvil variable (4G); el uso principal es desde el teléfono.

### 2.3 Decisiones de alcance
Cierran ambigüedades de la versión anterior. Cambiar cualquiera requiere acuerdo del Product Owner.

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | Un Comerciante tiene **un solo negocio** (relación 1:1). | Simplifica estadísticas, permisos y UI. |
| D-02 | Los pedidos son **solo para recoger** en el establecimiento y de **un negocio por pedido**. | Los domicilios y repartidores están fuera de alcance. |
| D-03 | Reservas con **intervalo** `inicio–fin`: tipo FRANJA (mesa o servicio por hora) o ALOJAMIENTO (por noches). El negocio define su capacidad de reservas simultáneas. | Cubre restaurantes y hospedajes con un único modelo. |
| D-04 | El **pago aplica a pedidos y membresías**. Las reservas no se pagan en esta versión (sin anticipo). | Reduce alcance sin perder el flujo pedido→pago. |
| D-05 | Pedido con método de pago `SANDBOX` (en línea) o `EN_LOCAL` (se cobra al recoger; sin comisión). | Permite adopción de negocios sin pasarela. |
| D-06 | Membresías: plan **BASICA gratuito** (siempre visible) y plan **DESTACADA** de pago mensual (insignia y prioridad). | Reduce la barrera de adopción; coherente con el modelo de ingresos (membresía Destacada + comisión). |
| D-07 | El **carrito vive en el navegador**; el servidor valida precios y disponibilidad al crear el pedido. | Evita entidad y endpoints de carrito. |
| D-08 | Se usa un **simulador de pagos interno** tras un puerto (`PaymentGatewayPort`). Un sandbox externo es opcional. | Evita depender de terceros y de webhooks en desarrollo local. |
| D-09 | Las reseñas (P3) las puede publicar cualquier Cliente; la insignia **"Compra verificada"** se muestra si tiene un pedido o reserva completada en ese negocio. | Evita que casi no existan reseñas cuando el negocio no usa pedidos. |
| D-10 | La plataforma publica solo negocios `APROBADO`. Tras la aprobación, **nombre, categoría y ubicación quedan bloqueados** para el Comerciante; el Administrador los edita. | Protege la calidad del directorio con poco esfuerzo de moderación. |
| D-11 | El Administrador puede **crear cuentas de Comerciante y registrar negocios en su nombre** (alta asistida). | Mitiga el riesgo de adopción: muchos comerciantes no cargarán sus datos solos. |
| D-12 | Valores de negocio (comisión, precio de plan, límites) son **parámetros del sistema** con valores semilla de demostración. | No bloquean el desarrollo; el PO los valida después. |

### 2.4 Fuera de alcance

**Exclusiones formales del Plan de Trabajo:**
1. Logística de repartidores y seguimiento de entregas.
2. Aplicaciones móviles nativas (Android/iOS).
3. Manejo de dinero real.
4. Facturación electrónica ante la DIAN.

**Exclusiones adicionales adoptadas por el equipo en este SRS** (no figuran en el Plan; se registran aquí para que sean explícitas):
5. Recomendaciones personalizadas o inteligencia artificial.
6. Más de un municipio, más de un negocio por comerciante, empleados con cuentas propias dentro de un negocio.
7. Pago de reservas o anticipos; reembolsos con dinero real.
8. WhatsApp Business API (solo enlaces `wa.me`).
9. Reportes avanzados o exportación de estadísticas.

---

## 3. Trazabilidad con el Acta de Inicio

| Obligación del Acta | Cubierto por |
|---|---|
| **C1** Diagnóstico y análisis de mercado | Documento de la Épica E1 (fuera de este SRS) |
| **C2** Identificar actores; requisitos funcionales y no funcionales; revisar y consolidar | §2.1; §4; §6; versionado de este documento en Git |
| **C3** Arquitectura (PostgreSQL, API REST, MinIO), SRS, UML de casos de uso, clases, secuencia y arquitectura | Este SRS y `trina-design.md` §2–§4 |
| **C4** Backend y base de datos | Todos los RF; `trina-design.md` §2, §4, §5 |
| **C4** Autenticación | RF-01 a RF-05, RF-48, RF-49 |
| **C4** Directorio | RF-06 a RF-09, RF-47 |
| **C4** Perfiles | RF-10 a RF-14 |
| **C4** Catálogo | RF-15 a RF-19 |
| **C4** Aplicación web | RF-20 a RF-24; RNF-01, RNF-07, RNF-08; `trina-ui-design.md` |
| **C4** Panel administrativo | RF-07, RF-41, RF-43 a RF-47 |
| **C4** Pedidos | RF-25, RF-27, RF-30 a RF-32 |
| **C4** Reservas | RF-26, RF-27 |
| **C4** Pagos en sandbox | RF-28, RF-29 |
| **C4** Membresías | RF-33 a RF-37 |
| **C4** Estadísticas | RF-40 a RF-42 |
| **C4** Integración y pruebas funcionales | §8; `trina-design.md` §10 |
| **C5** Pruebas integrales, manuales, evidencias, modelo de negocio, informe | §8 (criterios); documentos de la Épica E5 |
| **Normativo** Ley 1581/2012 y política de la UQ | RF-01, RF-48, RNF-03; pendiente P-07 |
| **Gestión** Riesgos y presupuesto | Plan de Trabajo; `trina-design.md` §9 |

---
## 4. Requisitos funcionales

Cada requisito indica prioridad, actor y módulo del Acta. Los estados y transiciones de pedidos, reservas, negocios y membresías están en la sección 5.

### 4.1 Autenticación, cuenta y privacidad

#### RF-01 — Registro de usuarios
**P1** · Visitante · Autenticación
El sistema debe permitir registrar Clientes y Comerciantes con correo, contraseña (mínimo 8 caracteres, con letras y números), nombre y rol. El rol Administrador no es seleccionable. El registro exige aceptar la política de tratamiento de datos y admite el dato opcional "¿Vives en el municipio?".
- **E1 Registro válido.** Dado un visitante con correo nuevo, contraseña válida y consentimiento aceptado, cuando confirma, entonces se crea la cuenta con el rol elegido y puede iniciar sesión.
- **E2 Correo duplicado.** Dado que el correo ya existe, cuando intenta registrarse, entonces recibe `409` y el mensaje "Ese correo ya está en uso".
- **E3 Sin consentimiento.** Dado un registro sin aceptar la política de datos, cuando confirma, entonces el sistema lo rechaza indicando el motivo.
- **E4 Rol no permitido.** Dado un registro que solicita el rol Administrador, cuando se envía, entonces el sistema lo rechaza.

#### RF-02 — Inicio de sesión seguro
**P1** · Visitante · Autenticación
El sistema debe autenticar con correo y contraseña, emitir un JWT con vencimiento y limitar intentos fallidos.
- **E1 Inicio exitoso.** Dado un usuario activo con credenciales correctas, cuando inicia sesión, entonces recibe un JWT y es redirigido a su área según el rol.
- **E2 Credenciales incorrectas.** Dado un correo o contraseña erróneos, cuando inicia sesión, entonces recibe `401` con mensaje genérico que no revela cuál dato falló.
- **E3 Cuenta desactivada.** Dado un usuario con credenciales correctas pero cuenta desactivada, cuando inicia sesión, entonces se le informa que su cuenta está desactivada y debe contactar al administrador.
- **E4 Fuerza bruta.** Dados 5 intentos fallidos en 15 minutos para el mismo correo o IP, cuando intenta de nuevo, entonces recibe `429` hasta que pase el periodo de espera.

#### RF-03 — Recuperación de contraseña
**P2** · Visitante · Autenticación
El sistema debe permitir solicitar un enlace de recuperación de un solo uso que vence a los 30 minutos.
- **E1 Solicitud.** Dado un correo cualquiera, cuando solicita recuperación, entonces la respuesta es idéntica exista o no la cuenta y, si existe, se envía el enlace.
- **E2 Enlace vencido o usado.** Dado un enlace expirado o ya utilizado, cuando se intenta restablecer, entonces el sistema lo rechaza y ofrece solicitar uno nuevo.
- **E3 Restablecimiento.** Dado un enlace válido y una contraseña válida, cuando se confirma, entonces la contraseña cambia y las sesiones anteriores quedan invalidadas.

#### RF-04 — Autorización por rol con JWT
**P1** · Sistema · Autenticación
El sistema debe proteger cada endpoint según el rol del token y la propiedad del recurso.
- **E1 Acceso autorizado.** Dado un Comerciante con JWT válido, cuando edita su propio negocio, entonces la operación se permite.
- **E2 Rol insuficiente.** Dado un Cliente, cuando solicita estadísticas de un negocio, entonces recibe `403` sin datos.
- **E3 Token vencido.** Dado un JWT vencido, cuando accede a un recurso protegido, entonces recibe `401` y la interfaz pide iniciar sesión.
- **E4 Usuario desactivado o rol cambiado.** Dado un token emitido antes de que el Administrador desactivara al usuario o cambiara su rol, cuando se usa, entonces recibe `401`.

#### RF-05 — Cierre de sesión
**P1** · Todos los autenticados · Autenticación
- **E1 Cierre.** Dado un usuario autenticado, cuando selecciona "Cerrar sesión", entonces la aplicación elimina el token y lo lleva al inicio.

#### RF-48 — Privacidad y derechos del titular
**P1** · Todos · Autenticación (cumplimiento Acta §4)
El sistema debe mostrar la política de tratamiento de datos, registrar el consentimiento (versión y fecha) y permitir al titular consultar, actualizar, exportar y solicitar la eliminación de sus datos.
- **E1 Exportación.** Dado un usuario autenticado, cuando solicita "Descargar mis datos", entonces recibe un archivo JSON con sus datos personales y su actividad.
- **E2 Eliminación.** Dado un usuario que solicita eliminar su cuenta, cuando confirma, entonces sus datos personales se anonimizan, sus registros transaccionales se conservan sin identificarlo y no puede iniciar sesión.
- **E3 Comerciante que elimina.** Dado un Comerciante con negocio publicado, cuando elimina su cuenta, entonces su negocio pasa a `SUSPENDIDO` y deja de verse en el directorio.

#### RF-49 — Gestión de la cuenta propia
**P2** · Todos los autenticados · Autenticación
- **E1 Edición.** Dado un usuario autenticado, cuando cambia su nombre o teléfono, entonces se guarda y se refleja en la plataforma.
- **E2 Cambio de contraseña.** Dado el cambio de contraseña con la contraseña actual correcta, cuando se confirma, entonces las sesiones anteriores se invalidan.

---

### 4.2 Directorio georreferenciado

#### RF-06 — Registro del negocio
**P1** · Comerciante · Directorio
El Comerciante debe registrar su negocio por pasos y guardar el avance como `BORRADOR`. Para enviarlo a revisión se exige: nombre, categoría, descripción, dirección, ubicación marcada en el mapa dentro del área del municipio piloto, al menos un contacto (teléfono o WhatsApp), horarios configurados y al menos una foto.
- **E1 Envío completo.** Dado un negocio en borrador con todo lo exigido, cuando lo envía a revisión, entonces pasa a `PENDIENTE`.
- **E2 Ubicación ausente.** Dado un borrador sin ubicación, cuando intenta enviarlo, entonces el sistema indica qué falta y no avanza.
- **E3 Retomar borrador.** Dado un borrador incompleto, cuando el Comerciante vuelve a ingresar, entonces retoma donde quedó.
- **E4 Segundo negocio.** Dado un Comerciante que ya tiene negocio, cuando intenta crear otro, entonces recibe `409`.
- **E5 Ubicación fuera del municipio.** Dada una ubicación fuera del área configurada, cuando se envía, entonces se rechaza con un mensaje claro.

#### RF-07 — Revisión de negocios por el Administrador
**P1** · Administrador · Directorio · Panel administrativo
El Administrador debe aprobar, rechazar (motivo obligatorio) o solicitar correcciones (motivo obligatorio) a los negocios `PENDIENTE`.
- **E1 Aprobación.** Dado un negocio `PENDIENTE`, cuando el Administrador lo aprueba, entonces pasa a `APROBADO`, aparece en el directorio y el Comerciante recibe una notificación.
- **E2 Rechazo con motivo.** Dado un negocio con información incompleta, cuando se rechaza con un motivo, entonces el Comerciante ve el motivo y puede corregir.
- **E3 Solicitud de ajustes.** Dado un negocio que requiere cambios, cuando el Administrador solicita correcciones, entonces pasa a `CORRECCION_SOLICITADA` con la observación visible.
- **E4 Reenvío.** Dado un negocio rechazado o con ajustes solicitados, cuando el Comerciante corrige y reenvía, entonces vuelve a `PENDIENTE`.

#### RF-47 — Alta asistida por el Administrador
**P2** · Administrador · Directorio · Panel administrativo
El Administrador debe poder crear la cuenta de un Comerciante (con contraseña temporal) y registrar o editar su negocio en su nombre.
- **E1 Alta asistida.** Dado un Administrador, cuando crea una cuenta de Comerciante y completa su negocio, entonces el negocio queda en `PENDIENTE` o `APROBADO` según decida el Administrador.
- **E2 Cambio obligatorio de clave.** Dada una cuenta creada con contraseña temporal, cuando el Comerciante inicia sesión por primera vez, entonces debe definir una contraseña nueva.
- **E3 Edición administrativa.** Dado un negocio aprobado, cuando el Administrador edita un campo bloqueado (nombre, categoría o ubicación), entonces el cambio se guarda y se audita.

#### RF-08 — Directorio público
**P1** · Visitante · Directorio
El sistema debe listar los negocios `APROBADO`, paginados, con nombre, categoría, foto principal, estado "abierto ahora", calificación (si existe) e insignia Destacado.
- **E1 Lista pública.** Dado un visitante sin sesión, cuando abre el directorio, entonces ve solo negocios `APROBADO`.
- **E2 Exclusión.** Dado un negocio `PENDIENTE`, `RECHAZADO`, `BORRADOR` o `SUSPENDIDO`, cuando se consulta el directorio, entonces no aparece.

#### RF-09 — Georreferenciación
**P1** · Visitante · Directorio
- **E1 Marcador.** Dado un negocio aprobado con coordenadas, cuando se abre el mapa, entonces su marcador aparece en su ubicación.

---

### 4.3 Perfiles de negocio

#### RF-10 — Perfil público
**P1** · Visitante · Perfiles
El sistema debe mostrar nombre, descripción, fotos, categoría, horarios con estado actual, ubicación, contactos y catálogo. Cada visita al perfil se cuenta para las estadísticas (RF-40).
- **E1 Perfil visible.** Dado un negocio aprobado, cuando un visitante abre su perfil, entonces ve la información pública vigente.
- **E2 Perfil no publicado.** Dado un negocio no aprobado, cuando se solicita su perfil por URL, entonces recibe `404`.

#### RF-11 — Edición del perfil
**P1** · Comerciante · Perfiles
El Comerciante edita su negocio. Tras la aprobación, nombre, categoría y ubicación quedan bloqueados (D-10).
- **E1 Actualizar horarios.** Dado el propietario, cuando cambia sus horarios y guarda, entonces el perfil público refleja el cambio de inmediato.
- **E2 No propietario.** Dado un Comerciante que edita un negocio ajeno, cuando envía la solicitud, entonces recibe `403`.
- **E3 Campo bloqueado.** Dado un negocio aprobado, cuando el Comerciante intenta cambiar el nombre, entonces el sistema responde "Para cambiar el nombre, contacta al administrador".

#### RF-12 — Fotografías del negocio
**P1** · Comerciante · Perfiles
El Comerciante sube, ordena, elige la foto principal y elimina fotos (JPG, PNG o WebP; hasta 5 MB por archivo y 10 por negocio; el servidor las redimensiona y comprime).
- **E1 Subida válida.** Dado un JPG de 4 MB, cuando lo sube, entonces se almacena optimizado en MinIO y aparece en el perfil.
- **E2 Formato no permitido.** Dado un PDF, cuando intenta subirlo, entonces se rechaza y se informan los formatos permitidos.
- **E3 Límite.** Dado un negocio con 10 fotos, cuando sube otra, entonces recibe un mensaje claro y no se almacena.
- **E4 Eliminación.** Dada una foto existente, cuando se elimina, entonces el objeto se borra también de MinIO.

#### RF-13 — Horarios de atención
**P1** · Comerciante · Perfiles
El Comerciante define por día una o más franjas (por ejemplo, almuerzo cerrado) o marca el día cerrado; se admiten cierres después de medianoche. La hora se interpreta en `America/Bogota`.
- **E1 Semana típica.** Dado un horario de lunes a sábado con domingo cerrado, cuando guarda, entonces el perfil muestra "Abierto ahora" o "Cerrado, abre a las X" correctamente.
- **E2 Dos franjas.** Dado un día con 8:00–12:00 y 14:00–18:00, cuando son las 13:00, entonces el negocio se muestra cerrado.
- **E3 Cierre tras medianoche.** Dada una franja 18:00–02:00, cuando son las 01:00 del día siguiente, entonces el negocio se muestra abierto.

#### RF-14 — Medios de contacto
**P1** · Comerciante · Perfiles
El perfil muestra teléfono, WhatsApp, correo, sitio web y redes (opcionales). WhatsApp se ofrece como botón que abre un chat con un mensaje inicial prellenado.
- **E1 Contacto visible.** Dado un negocio con teléfono y WhatsApp, cuando un cliente ve el perfil, entonces aparecen los botones "Llamar" y "Escribir por WhatsApp".
- **E2 Contacto ausente.** Dado un negocio sin sitio web, cuando se ve el perfil, entonces no se muestra un botón vacío.

---

### 4.4 Catálogo digital

#### RF-15 — Crear productos o servicios
**P1** · Comerciante · Catálogo
Un ítem tiene nombre, descripción, precio en COP (entero mayor que 0), tipo (producto o servicio), imagen opcional, disponibilidad y categoría interna opcional.
- **E1 Ítem creado.** Dado datos válidos, cuando guarda, entonces el ítem aparece en el catálogo.
- **E2 Precio inválido.** Dado un precio negativo o cero, cuando guarda, entonces se muestra un error de validación.

#### RF-16 — Editar, desactivar y eliminar ítems
**P1** · Comerciante · Catálogo
- **E1 No disponible.** Dado un ítem activo, cuando se marca "No disponible", entonces sigue visible pero no se puede pedir.
- **E2 Eliminar.** Dado un ítem con pedidos previos, cuando se elimina, entonces desaparece del catálogo y los pedidos históricos conservan su nombre y precio.

#### RF-17 — Catálogo público
**P1** · Visitante · Catálogo
- **E1 Catálogo visible.** Dado un negocio con ítems activos, cuando se abre su perfil, entonces se listan con imagen, precio y disponibilidad.
- **E2 Vista de producto.** Dado un ítem, cuando el cliente abre su detalle, entonces se registra una vista para el ranking (RF-42).

#### RF-18 — Categorías internas del catálogo
**P1** · Comerciante · Catálogo
- **E1 Agrupación.** Dados ítems con categorías internas, cuando un cliente ve el catálogo, entonces los ve agrupados por categoría.

#### RF-19 — Productos destacados
**P3** · Comerciante · Catálogo
El Comerciante marca ítems como destacados hasta el límite de su plan.
- **E1 Destacar.** Dado cupo disponible, cuando marca un ítem, entonces aparece primero con indicador visual.
- **E2 Sin cupo.** Dado el límite alcanzado, cuando intenta destacar otro, entonces se le indica y se sugiere el plan Destacada.

---

### 4.5 Búsqueda, filtros y mapa

#### RF-20 — Búsqueda por texto
**P1** · Visitante · Aplicación web
Busca por nombre de negocio, categoría y nombres de ítems del catálogo, sin distinguir mayúsculas ni tildes.
- **E1 Por nombre.** Dado el texto "cafe", cuando busca, entonces aparece "Café del Parque".
- **E2 Sin resultados.** Dado un término sin coincidencias, cuando busca, entonces ve un mensaje claro y sugerencias (quitar filtros).

#### RF-21 — Filtro por categoría
**P1** · Visitante · Aplicación web
- **E1 Filtro.** Dados negocios de varias categorías, cuando elige "Restaurantes", entonces ve solo los de esa categoría.

#### RF-22 — Cercanía
**P2** · Visitante · Aplicación web
Ordena y filtra por distancia a la ubicación del dispositivo o a un punto elegido en el mapa.
- **E1 Más cercanos.** Dado el permiso de ubicación, cuando elige "Más cercanos", entonces los resultados se ordenan por distancia ascendente y se muestra la distancia.
- **E2 Permiso denegado.** Dado que el usuario niega la ubicación, cuando elige cercanía, entonces puede marcar un punto en el mapa.

#### RF-23 — Abierto ahora y nivel de precio
**P2** · Visitante · Aplicación web
- **E1 Abierto ahora.** Dado el filtro "Abierto ahora" a las 14:00, cuando se aplica, entonces se muestran solo negocios abiertos en ese momento.
- **E2 Nivel de precio.** Dado el filtro "$ / $$ / $$$", cuando se aplica, entonces se muestran los negocios con ese nivel declarado.

#### RF-24 — Mapa interactivo sincronizado
**P1** · Visitante · Aplicación web
- **E1 Marcador.** Dado el mapa con varios negocios, cuando selecciona un marcador, entonces ve una tarjeta con nombre, categoría, estado de apertura y enlace al perfil.
- **E2 Sincronía.** Dado un filtro aplicado, cuando la lista se actualiza, entonces el mapa muestra solo los negocios filtrados.
- **E3 Muchos marcadores.** Dados más de 50 marcadores cercanos, cuando se muestra el mapa, entonces se agrupan.
- **E4 Sin coordenadas.** Dado un negocio aprobado sin coordenadas válidas, cuando se muestra el mapa, entonces se omite del mapa y permanece en la lista.

---

### 4.6 Pedidos, reservas y pago sandbox

#### RF-25 — Crear pedido
**P1** · Cliente · Pedidos
El Cliente confirma un pedido para recoger con ítems de **un solo negocio** que acepte pedidos y esté abierto. El servidor valida disponibilidad y toma los precios vigentes.
- **E1 Pedido válido.** Dado un carrito con ítems disponibles, cuando confirma, entonces se crea el pedido (`PENDIENTE_PAGO` si paga en línea, `PENDIENTE` si paga en el local) y se notifica al Comerciante cuando queda `PENDIENTE`.
- **E2 Ítem no disponible.** Dado un ítem marcado no disponible, cuando confirma, entonces se bloquea e informa cuál ítem.
- **E3 Negocio cerrado.** Dado un negocio cerrado, cuando confirma, entonces se rechaza indicando el horario.
- **E4 Precio cambiado.** Dado un ítem cuyo precio cambió desde que se agregó al carrito, cuando confirma, entonces se muestra el nuevo total para que el cliente lo acepte.
- **E5 Carrito vacío.** Dado un carrito sin ítems, cuando confirma, entonces recibe un error de validación.

#### RF-26 — Crear reserva
**P1** · Cliente · Reservas
El Cliente solicita una reserva en negocios que la acepten: FRANJA (fecha, hora, personas) o ALOJAMIENTO (entrada, salida, personas). Cuenta la capacidad simultánea del negocio.
- **E1 Reserva disponible.** Dado un negocio con cupo en la franja, cuando confirma, entonces la reserva queda `PENDIENTE_CONFIRMACION` y se notifica al Comerciante.
- **E2 Fuera de horario.** Dada una hora fuera del horario de atención, cuando confirma, entonces se rechaza.
- **E3 Sin cupo.** Dado un negocio con capacidad agotada en ese intervalo, cuando confirma, entonces se rechaza con un mensaje claro.
- **E4 Fecha pasada.** Dada una fecha u hora anterior al momento actual, cuando confirma, entonces se rechaza.
- **E5 Reserva sin respuesta.** Dada una reserva pendiente por más de 24 horas, cuando vence el plazo, entonces pasa a `CANCELADA` y se notifica al Cliente.

#### RF-27 — Gestión de estados por el Comerciante
**P1** · Comerciante · Pedidos · Reservas
El Comerciante acepta, rechaza, marca listo, completa o cancela pedidos, y confirma, rechaza, cancela o completa reservas, según las transiciones de la sección 5.
- **E1 Aceptar pedido.** Dado un pedido `PENDIENTE`, cuando lo acepta, entonces pasa a `EN_PREPARACION` y se notifica al Cliente.
- **E2 Rechazar pedido pagado.** Dado un pedido pagado en línea, cuando se rechaza con motivo, entonces el pago pasa a `REEMBOLSADO` (simulado) y se notifica al Cliente.
- **E3 Cancelar reserva.** Dada una reserva confirmada, cuando el Comerciante la cancela con motivo, entonces se actualiza y se notifica al Cliente.
- **E4 Transición inválida.** Dado un pedido `COMPLETADO`, cuando se intenta aceptar, entonces recibe `409`.

#### RF-28 — Pago simulado en sandbox
**P1** · Cliente, Comerciante · Pagos
El sistema cobra pedidos y membresías mediante el simulador de pagos con tarjetas de prueba. No almacena números de tarjeta (solo marca y últimos 4 dígitos). Los pagos se envían con clave de idempotencia para evitar doble cobro.
- **E1 Pago aprobado.** Dado un pedido `PENDIENTE_PAGO` y una tarjeta de prueba aprobada, cuando paga, entonces el pago queda `APROBADO` y el pedido pasa a `PENDIENTE`.
- **E2 Pago rechazado.** Dada una tarjeta de prueba rechazada, cuando paga, entonces se informa el motivo y el pedido sigue `PENDIENTE_PAGO` para reintentar.
- **E3 Doble envío.** Dado el mismo pago enviado dos veces con la misma clave, cuando se procesa, entonces se cobra una sola vez.
- **E4 Pago en el local.** Dado un pedido con método `EN_LOCAL`, cuando se crea, entonces no genera pago en línea; el Comerciante lo marca como cobrado al completarlo.
- **E5 Pedido sin pagar.** Dado un pedido `PENDIENTE_PAGO` por más de 30 minutos, cuando vence el plazo, entonces pasa a `CANCELADO`.

#### RF-29 — Comisión por venta
**P2** · Sistema · Pagos
La comisión se calcula sobre el total de los pedidos con pago `SANDBOX` aprobado, con el porcentaje vigente, redondeada al peso más cercano.
- **E1 Cálculo.** Dado un pedido pagado de $100.000 y una comisión del 5 %, cuando se aprueba el pago, entonces se registran $5.000 de comisión y $95.000 de neto para el Comerciante.
- **E2 Cambio de porcentaje.** Dado un cambio de porcentaje, cuando se registran nuevos pagos, entonces se aplica el nuevo y los pagos anteriores no cambian.
- **E3 Reembolso.** Dado un pago reembolsado, cuando se procesa, entonces la comisión asociada se revierte.
- **E4 Pago en el local.** Dado un pedido `EN_LOCAL`, cuando se completa, entonces no genera comisión.

#### RF-30 — Carrito
**P1** · Cliente · Pedidos
El carrito se mantiene en el navegador, contiene ítems de un solo negocio y persiste entre visitas.
- **E1 Modificar.** Dados dos ítems en el carrito, cuando cambia la cantidad de uno y elimina el otro, entonces el total se actualiza.
- **E2 Otro negocio.** Dado un carrito con ítems de un negocio, cuando agrega un ítem de otro, entonces se le pregunta si quiere vaciar el carrito.

#### RF-31 — Historial de pedidos y reservas
**P1** · Cliente · Pedidos
- **E1 Filtrar.** Dados pedidos en varios estados, cuando filtra por "Completados", entonces ve solo esos.
- **E2 Detalle.** Dado un pedido, cuando lo abre, entonces ve ítems, total, estado y su historial de estados.

#### RF-32 — Notificaciones
**P2** · Cliente, Comerciante · Pedidos
Notificaciones dentro de la plataforma (campana con contador, consultadas periódicamente). El correo es P3.
- **E1 Pedido o reserva nueva.** Dado un pedido o reserva nuevos, cuando se crean, entonces el Comerciante ve una notificación y el contador aumenta.
- **E2 Cambio de estado.** Dado un pedido que pasa a `LISTO`, cuando se actualiza, entonces el Cliente recibe la notificación.
- **E3 Marcar leída.** Dada una notificación, cuando se abre o se marca como leída, entonces el contador disminuye.
- **E4 Correo (P3).** Dado el canal de correo habilitado, cuando ocurre un evento relevante, entonces se envía un correo además de la notificación.

---

### 4.7 Membresías

#### RF-33 — Planes de membresía
**P1** · Comerciante · Membresías
El sistema define el plan BASICA (gratuito, siempre disponible) y el plan DESTACADA (pago mensual) con precio, beneficios y límite de ítems destacados.
- **E1 Listado.** Dado un Comerciante, cuando abre "Mi membresía", entonces ve precio, beneficios y vigencia de cada plan.

#### RF-34 — Suscripción a plan pagado
**P1** · Comerciante · Membresías
- **E1 Activación.** Dado el plan DESTACADA seleccionado y un pago de prueba aprobado, cuando se confirma, entonces la suscripción queda `ACTIVA` por 30 días y se aplican los beneficios.
- **E2 Pago rechazado.** Dado un pago rechazado, cuando se procesa, entonces la suscripción no se activa y el negocio conserva el plan BASICA.

#### RF-35 — Vigencia y estado
**P1** · Sistema · Membresías
El sistema registra inicio, fin y estado de cada suscripción; el plan efectivo del negocio se calcula en cada consulta.
- **E1 Vencida.** Dada una suscripción cuyo fin ya pasó, cuando se evalúa el negocio, entonces pierde los beneficios Destacada y sigue visible con plan BASICA.
- **E2 Aviso.** Dada una suscripción que vence en 7 días o menos, cuando el Comerciante ingresa, entonces ve un aviso de renovación.

#### RF-36 — Renovación
**P2** · Comerciante · Membresías
- **E1 Anticipada.** Dada una suscripción activa con 5 días restantes, cuando renueva, entonces el fin se extiende 30 días desde la fecha de vencimiento actual.
- **E2 Tras vencer.** Dada una suscripción vencida, cuando renueva, entonces el nuevo periodo cuenta 30 días desde el momento del pago.

#### RF-37 — Visibilidad diferenciada
**P1** · Visitante · Membresías
Los negocios con plan efectivo DESTACADA muestran la insignia "Destacado" y aparecen primero en el orden por defecto.
- **E1 Insignia.** Dado un negocio con membresía Destacada vigente, cuando aparece en resultados, entonces muestra la insignia.
- **E2 Prioridad.** Dados negocios Destacados y Básicos con el orden por defecto, cuando se lista, entonces los Destacados aparecen primero.
- **E3 Orden por cercanía.** Dado el orden por cercanía, cuando se lista, entonces prevalece la distancia y la insignia se conserva.

---

### 4.8 Reseñas y estadísticas

#### RF-38 — Reseñas y calificaciones
**P3** · Cliente · Reseñas
Un Cliente autenticado publica una reseña por negocio (1 a 5 estrellas y comentario). Se muestra "Compra verificada" si tiene un pedido o reserva completada en ese negocio (D-09).
- **E1 Reseña verificada.** Dado un cliente con un pedido completado, cuando reseña, entonces se publica con insignia "Compra verificada" y se actualiza el promedio.
- **E2 Reseña sin compra.** Dado un cliente sin compras, cuando reseña, entonces se publica sin insignia.
- **E3 Duplicada.** Dado un cliente que ya reseñó el negocio, cuando intenta otra, entonces se le ofrece editar la anterior.

#### RF-39 — Moderación de reseñas
**P3** · Comerciante, Administrador · Reseñas
- **E1 Reporte.** Dado el Comerciante, cuando reporta una reseña con un motivo, entonces queda en la cola del Administrador.
- **E2 Ocultar.** Dada una reseña ofensiva, cuando el Administrador la oculta, entonces deja de verse y sale del promedio.

#### RF-40 — Estadísticas del Comerciante
**P1** · Comerciante · Estadísticas
Muestra, para 7 o 30 días: visitas al perfil, pedidos y reservas recibidos, e ingresos de pedidos completados.
- **E1 Resumen.** Dado el periodo "Últimos 30 días", cuando abre estadísticas, entonces ve visitas, pedidos, reservas e ingresos.
- **E2 Sin datos.** Dado un negocio sin actividad, cuando abre estadísticas, entonces ve ceros y un mensaje de orientación.
- **E3 Aislamiento.** Dado un Comerciante, cuando solicita estadísticas, entonces solo recibe las de su negocio.

#### RF-41 — Estadísticas del Administrador
**P1** · Administrador · Estadísticas · Panel administrativo
Muestra: negocios por estado, usuarios por rol, proporción de usuarios visitantes (no residentes), pedidos, comisiones acumuladas y membresías activas.
- **E1 Dashboard.** Dado el panel general, cuando carga, entonces presenta los indicadores actualizados.

#### RF-42 — Productos más consultados
**P2** · Comerciante · Estadísticas
- **E1 Ranking.** Dado un negocio con ítems consultados, cuando abre el reporte, entonces ve los 5 ítems con más vistas, de mayor a menor.
- **E2 Sin vistas.** Dado un negocio sin vistas, cuando abre el reporte, entonces ve un mensaje explicativo.

---

### 4.9 Administración de la plataforma

#### RF-43 — Gestión de usuarios
**P1** (listar, activar, desactivar) · **P2** (asignar rol) · Administrador · Panel administrativo
- **E1 Desactivar.** Dado un usuario que incumple las políticas, cuando el Administrador lo desactiva, entonces no puede iniciar sesión y sus tokens quedan inválidos.
- **E2 Autodesactivación.** Dado un Administrador, cuando intenta desactivarse a sí mismo, entonces el sistema lo impide.

#### RF-44 — Categorías del directorio
**P2** (la carga inicial de categorías es P1, por semilla) · Administrador · Panel administrativo
- **E1 Nueva categoría.** Dado el Administrador, cuando crea la categoría "Artesanías", entonces los Comerciantes pueden elegirla.
- **E2 Desactivar.** Dada una categoría con negocios, cuando se desactiva, entonces no se puede elegir para negocios nuevos y los existentes la conservan.

#### RF-45 — Parámetros del sistema
**P2** · Administrador · Panel administrativo
Configura la comisión, los precios y beneficios de los planes y límites operativos.
- **E1 Cambio de comisión.** Dado el cambio al 6 %, cuando se registra un nuevo pago, entonces se aplica el 6 %.
- **E2 Valor inválido.** Dado un porcentaje fuera de 0–30 %, cuando guarda, entonces se rechaza.

#### RF-46 — Auditoría
**P2** · Administrador · Panel administrativo
Registra quién, cuándo, qué y por qué en acciones críticas: aprobaciones, rechazos, cambios de parámetros, desactivación de usuarios, ocultamiento de reseñas y cambios de perfil con valor anterior y nuevo.
- **E1 Rechazo.** Dado un negocio rechazado, cuando se guarda, entonces queda registrado el Administrador, la fecha y el motivo.
- **E2 Cambio de perfil.** Dado un cambio de horario, cuando se guarda, entonces el registro conserva el valor anterior y el nuevo.

---
### 4.10 Resumen de prioridades

| Prioridad | Cantidad | Requisitos |
|---|---|---|
| **P1 — Obligatorio** | 34 | RF-01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 24, 25, 26, 27, 28, 30, 31, 33, 34, 35, 37, 40, 41, 43, 48 |
| **P2 — Comprometido** | 12 | RF-03, 22, 23, 29, 32, 36, 42, 44, 45, 46, 47, 49 |
| **P3 — Opcional** | 3 | RF-19, 38, 39 |

---

## 5. Reglas de negocio y estados

**RN-01** Un Comerciante tiene un solo negocio (D-01).
**RN-02** Todos los montos son enteros en COP. No se calculan impuestos.
**RN-03** El pedido guarda una copia del nombre y precio de cada ítem al momento de crearse.
**RN-04** Solo los negocios `APROBADO` son visibles públicamente.
**RN-05** Plan efectivo: DESTACADA si existe una suscripción `ACTIVA` con fecha de fin posterior al momento actual; en cualquier otro caso, BASICA.
**RN-06** Comisión = total del pedido × porcentaje vigente, redondeada al peso más cercano; neto del Comerciante = total − comisión. Solo aplica a pagos `SANDBOX` aprobados y se revierte con el reembolso.
**RN-07** Una reserva ocupa capacidad mientras está `PENDIENTE_CONFIRMACION` o `CONFIRMADA`. Se acepta una reserva nueva solo si el número de reservas que se superponen con su intervalo es menor que la capacidad del negocio.
**RN-08** El promedio de calificación considera solo reseñas visibles.
**RN-09** Los horarios se evalúan en `America/Bogota`. Un cierre anterior a la apertura significa cierre después de medianoche.
**RN-10** Los datos personales eliminados se anonimizan; los registros contables y de auditoría se conservan sin identificar a la persona.
**RN-11** Límites de imágenes por negocio y tamaño de carga son parámetros del sistema (valores semilla: 10 imágenes, 5 MB).

### 5.1 Estados y transiciones

**Negocio**

| Desde | Hacia | Quién | Condición |
|---|---|---|---|
| (nuevo) | `BORRADOR` | Comerciante | Creación con datos mínimos |
| `BORRADOR` | `PENDIENTE` | Comerciante | Datos completos (RF-06) |
| `PENDIENTE` | `APROBADO` | Administrador | Revisión satisfactoria |
| `PENDIENTE` | `RECHAZADO` | Administrador | Motivo obligatorio |
| `PENDIENTE` | `CORRECCION_SOLICITADA` | Administrador | Motivo obligatorio |
| `RECHAZADO`, `CORRECCION_SOLICITADA` | `PENDIENTE` | Comerciante | Reenvío tras corregir |
| `APROBADO` | `SUSPENDIDO` | Administrador | Motivo obligatorio; también por eliminación de cuenta |
| `SUSPENDIDO` | `APROBADO` | Administrador | Reactivación |

**Pedido**

| Desde | Hacia | Quién | Condición |
|---|---|---|---|
| (nuevo, pago en línea) | `PENDIENTE_PAGO` | Cliente | Confirma pedido |
| (nuevo, en el local) | `PENDIENTE` | Cliente | Confirma pedido |
| `PENDIENTE_PAGO` | `PENDIENTE` | Sistema | Pago aprobado |
| `PENDIENTE_PAGO` | `CANCELADO` | Cliente o sistema | Cancelación o 30 min sin pago |
| `PENDIENTE` | `EN_PREPARACION` | Comerciante | Acepta |
| `PENDIENTE` | `RECHAZADO` | Comerciante | Motivo obligatorio; reembolso si hubo pago |
| `PENDIENTE` | `CANCELADO` | Cliente | Antes de que el negocio acepte; reembolso si hubo pago |
| `EN_PREPARACION` | `LISTO` | Comerciante | |
| `EN_PREPARACION` | `CANCELADO` | Comerciante | Motivo obligatorio; reembolso si hubo pago |
| `LISTO` | `COMPLETADO` | Comerciante | Entregado; si es `EN_LOCAL`, marca cobrado |

**Reserva**

| Desde | Hacia | Quién | Condición |
|---|---|---|---|
| (nueva) | `PENDIENTE_CONFIRMACION` | Cliente | Hay cupo (RN-07) |
| `PENDIENTE_CONFIRMACION` | `CONFIRMADA` | Comerciante | |
| `PENDIENTE_CONFIRMACION` | `RECHAZADA` | Comerciante | Motivo obligatorio |
| `PENDIENTE_CONFIRMACION` | `CANCELADA` | Cliente o sistema | Cancelación o 24 h sin respuesta |
| `CONFIRMADA` | `CANCELADA` | Cliente o Comerciante | Motivo obligatorio si cancela el Comerciante |
| `CONFIRMADA` | `COMPLETADA` | Comerciante | Después de la hora de inicio |

**Pago:** `INICIADO` → `APROBADO` o `RECHAZADO`; `APROBADO` → `REEMBOLSADO`.
**Suscripción:** `PENDIENTE_PAGO` → `ACTIVA` (pago aprobado); `ACTIVA` → `VENCIDA` (fin vencido); `VENCIDA` → `ACTIVA` (renovación pagada).

---

## 6. Requisitos no funcionales

#### RNF-01 — Usabilidad para baja alfabetización digital
**P1**
La interfaz usa lenguaje simple, iconos acompañados de texto, un solo objetivo principal por pantalla, flujos guiados por pasos, ayuda en cada campo y retroalimentación inmediata. Los detalles de diseño están en `trina-ui-design.md`.
- **E1 Aceptación.** Dado un grupo de al menos 5 usuarios piloto, cuando realizan "registrarse, crear su negocio y publicar un producto" sin ayuda, entonces al menos el 80 % lo completa y la mediana de tiempo es de 15 minutos o menos.
- **E2 Percepción.** Dada la misma prueba, cuando responden el cuestionario SUS, entonces el puntaje promedio es de 70 o más.
- **E3 Retroalimentación.** Dada cualquier acción (guardar, eliminar, pagar), cuando termina, entonces se muestra un mensaje claro de éxito o error sin términos técnicos.

#### RNF-02 — Rendimiento
**P1**
- **E1 Directorio.** Dado un directorio de hasta 200 negocios aprobados, cuando un cliente lo abre en 4G estándar, entonces el contenido principal aparece en menos de 3 s (medido con Lighthouse en perfil móvil).
- **E2 Búsqueda.** Dados varios filtros simultáneos, cuando se ejecuta la búsqueda, entonces los resultados llegan en menos de 2 s.
- **E3 API.** Dados 20 usuarios concurrentes, cuando consultan los endpoints de lectura más frecuentes, entonces el percentil 95 de respuesta es menor a 500 ms.

#### RNF-03 — Seguridad y protección de datos personales
**P1**
HTTPS obligatorio, contraseñas con BCrypt, JWT firmado con vencimiento, validación de entradas y archivos, límite de intentos de acceso, ningún dato de tarjeta almacenado, y tratamiento de datos conforme a la Ley 1581 de 2012 y la política de la UQ.
- **E1 Token vencido.** Dado un JWT vencido, cuando se usa, entonces el sistema rechaza la solicitud.
- **E2 Consentimiento.** Dado un registro, cuando se piden datos personales, entonces se informa la finalidad y se obtiene consentimiento explícito.
- **E3 Transporte.** Dado cualquier envío de credenciales o datos de pago de prueba, cuando viaja por la red, entonces solo lo hace por HTTPS.
- **E4 Privacidad de imágenes.** Dada una foto con metadatos de ubicación, cuando se sube, entonces los metadatos se eliminan antes de almacenarla.
- **E5 Verificación.** Dada la entrega al hito, cuando se ejecuta el análisis de dependencias, entonces no quedan vulnerabilidades críticas sin tratar.

#### RNF-04 — Disponibilidad
**P1**
- **E1 Operación.** Dada la plataforma en operación durante la semana de pruebas y la sustentación, cuando se monitorea con una verificación de salud periódica, entonces la indisponibilidad no supera el 5 % del periodo.

#### RNF-05 — Almacenamiento eficiente
**P1**
- **E1 Compresión.** Dada una imagen de alta resolución, cuando se sube, entonces se redimensiona a un máximo de 1200 px de ancho y se comprime antes de guardarse.
- **E2 Limpieza.** Dada una foto eliminada o un negocio eliminado, cuando se confirma, entonces los objetos se borran de MinIO; un proceso nocturno elimina objetos sin referencia.

#### RNF-06 — Trazabilidad
**P2**
- **E1 Historial.** Dado un cambio crítico en negocios, catálogos, pedidos, membresías o parámetros, cuando se guarda, entonces se registra autor, fecha y valor anterior.

#### RNF-07 — Accesibilidad
**P1**
Las pantallas públicas y del Comerciante cumplen WCAG 2.1 nivel AA: contraste mínimo 4.5:1, uso completo con teclado, foco visible, etiquetas en formularios, errores comunicados con texto, no depender solo del color, objetivos táctiles de al menos 44 px y texto alternativo en imágenes.
- **E1 Verificación.** Dadas las pantallas clave, cuando se auditan con Lighthouse, entonces el puntaje de accesibilidad es de 90 o más y la lista de verificación manual del diseño no tiene incumplimientos.

#### RNF-08 — Compatibilidad y responsividad
**P1**
- **E1 Navegadores.** Dadas las dos últimas versiones de Chrome, Firefox, Safari y Edge (y Chrome en Android, Safari en iOS), cuando se usan los flujos P1, entonces funcionan sin errores.
- **E2 Pantallas.** Dados anchos de 360 a 1920 px, cuando se navega, entonces no hay desplazamiento horizontal ni contenido cortado.

#### RNF-09 — Mantenibilidad y calidad de código
**P1**
- **E1 Pruebas.** Dados los módulos de autenticación, pedidos, pagos, reservas y membresías, cuando se mide la cobertura, entonces es de al menos 60 %, y cada escenario de aceptación P1 tiene una prueba.
- **E2 Contrato.** Dado un cambio en la API, cuando se integra, entonces el documento OpenAPI queda actualizado.
- **E3 Proceso.** Dado un cambio de código, cuando se integra a la rama principal, entonces pasó por revisión de otro integrante y por el pipeline de compilación y pruebas.
- **E4 Datos.** Dado un cambio de esquema, cuando se despliega, entonces se aplica mediante una migración versionada.

#### RNF-10 — Respaldo y recuperación
**P2**
- **E1 Respaldo.** Dada la operación normal, cuando pasa un día, entonces existe un respaldo de la base de datos y de los objetos de MinIO, con retención de 7 días.
- **E2 Restauración.** Dado un respaldo, cuando se prueba una restauración antes del hito, entonces el servicio se recupera en 4 horas o menos y con una pérdida máxima de 24 horas de datos.

#### RNF-11 — Localización
**P1**
- **E1 Formato.** Dado cualquier pantalla, cuando muestra montos, fechas u horas, entonces usa español de Colombia: pesos con separador de miles, fechas día/mes/año y hora de Bogotá.

---

## 7. Interfaces externas

| ID | Interfaz | Uso |
|---|---|---|
| IE-01 | Navegador web | Geolocalización con permiso del usuario y almacenamiento local para el carrito y borradores |
| IE-02 | Mapa | Leaflet con teselas de OpenStreetMap, con la atribución visible; su uso es de bajo volumen y, si crece, se cambia de proveedor |
| IE-03 | Simulador de pagos | Interno, tras `PaymentGatewayPort`; un sandbox externo es opcional |
| IE-04 | Correo (SMTP) | Recuperación de contraseña (RF-03) y notificaciones por correo (P3) |
| IE-05 | MinIO (API S3) | Almacenamiento de imágenes |
| IE-06 | WhatsApp | Enlaces `wa.me` con mensaje prellenado; sin API |

---

## 8. Aceptación y calidad

### 8.1 Definición de terminado (DoD)
Un requisito se considera terminado cuando:
1. Todos sus escenarios *Dado/Cuando/Entonces* pasan, automatizados o ejecutados en una lista de aceptación.
2. El código fue revisado por otro integrante y pasó el pipeline.
3. El contrato OpenAPI y la documentación afectada están actualizados.
4. Se verificó en el despliegue de pruebas y en un teléfono real (para flujos de cliente y comerciante).
5. El Product Owner lo aceptó en la revisión del sprint.

### 8.2 Criterios de hito (9 de noviembre)
- Los 34 requisitos **P1** están completos y demostrables de extremo a extremo.
- Los **P2** que no estén completos tienen acuerdo escrito del Supervisor sobre su recorte o su traslado al Sprint 5.
- Existe un conjunto de datos de demostración (negocios, catálogos, usuarios de cada rol) cargado.

### 8.3 Criterios de entrega final (16 de noviembre)
Pruebas integrales ejecutadas y documentadas, manuales de usuario y de administrador, informe final con evidencias y modelo de negocio, resultados de la prueba de usabilidad (RNF-01) y de las mediciones de RNF-02, RNF-07 y RNF-08.

---

## 9. Pendientes abiertos

Ninguno bloquea el inicio del diseño. Cada uno tiene responsable y fecha límite.

| ID | Pendiente | Responsable | Fecha límite |
|---|---|---|---|
| P-01 | Confirmar el municipio piloto con el Supervisor: el Acta habla de "sector turístico del Quindío" y el Plan fija Alcalá (Valle del Cauca). Este SRS asume Alcalá | Daniela (Scrum Master) | 9 oct |
| P-02 | Validar los valores semilla: comisión (5 %), precio del plan Destacada y límite de destacados | Juan David (PO) | 16 oct |
| P-03 | Definir el servidor de despliegue y el dominio (necesario para HTTPS) | David | 16 oct |
| P-04 | Confirmar el framework del frontend (propuesto: React + Vite, ADR-04) | Juan David | 12 oct |
| P-05 | Definir las coordenadas del área del municipio piloto (RF-06 E5) | Juan David y David | 16 oct |
| P-06 | Elegir proveedor SMTP con capa gratuita para producción (en desarrollo se usa un servidor de correo local) | David | 23 oct |
| P-07 | Obtener la política de tratamiento de datos de la UQ y alinear la política mostrada en la aplicación | Daniela | 16 oct |

---

## 10. Glosario

| Término | Significado |
|---|---|
| Negocio | Establecimiento comercial o de servicios publicado en el directorio |
| Ítem | Producto o servicio del catálogo de un negocio |
| Plan efectivo | Plan vigente de un negocio en este momento (BASICA o DESTACADA) |
| Sandbox / simulador | Entorno de pagos de prueba sin dinero real |
| Tarjeta de prueba | Número ficticio que el simulador aprueba o rechaza de forma predecible |
| Alta asistida | Registro de un negocio realizado por el Administrador en nombre del Comerciante |
| Borrador | Estado de un negocio cuyo registro aún no se ha enviado a revisión |
