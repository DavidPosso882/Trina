# Manual de usuario — TRINA

**Proyecto:** TRINA (VitrinaLocal) — directorio comercial georreferenciado con pedidos para recoger, reservas y membresías.
**Versión:** 1.0 (cierre E5) · Octubre de 2026
**Para:** clientes (turistas y habitantes) y comerciantes del municipio piloto.

Este manual te explica, paso a paso, qué podés hacer en TRINA y qué hacer cuando algo no sale como esperabas. Está escrito para usarse desde el teléfono, aunque también funciona en computador.

---

## 1. Cómo entrar

1. Abrí la dirección de TRINA que te dieron (en la demostración local: `http://localhost:5173`).
2. Tocá **Ingresar** (arriba a la derecha).
3. Escribí tu correo y tu contraseña.
4. Tocá **Entrar**.

Después de entrar, TRINA te lleva sola al lugar que te corresponde:

| Si tu cuenta es de… | Vas a… |
|---|---|
| Cliente | La página de inicio, para explorar negocios |
| Comerciante | Tu panel, en **Inicio** |
| Administrador | El panel de administración (ver **manual-administrador.md**) |

Para salir, tocá **Salir** arriba a la derecha.

**Si no podés ingresar:**

- **“El correo o la contraseña no coinciden. Revisá e intentalo de nuevo.”** → Revisá mayúsculas, espacios y que sea el correo de tu cuenta.
- **“Hiciste varios intentos. Esperá unos minutos y volvé a probar.”** → Después de 5 intentos fallidos en 15 minutos, TRINA bloquea el ingreso un rato. Esperá y volvé a probar.
- **“Tu cuenta está desactivada. Contactá al administrador.”** → Pedile al administrador que la reactive.
- **“Tu sesión venció. Volvé a ingresar para seguir.”** → La sesión dura 60 minutos; volvé a entrar y seguí donde estabas.

### Cuentas de demostración

Solo existen si la persona que instaló TRINA arrancó el sistema con el conjunto de datos de demostración (`APP_SEED_DEMO=true`).

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@trina.local` | `admin1234` |
| Comerciante (Café Las Palmas) | `comerciante1@trina.local` | `demo1234` |
| Comerciante (Restaurante El Trapiche) | `comerciante2@trina.local` | `demo1234` |
| Comerciante (Hotel Mirador del Quindío) | `comerciante3@trina.local` | `demo1234` |
| Comerciante (Artesanías del Café) | `comerciante4@trina.local` | `demo1234` |
| Cliente | `cliente1@trina.local` | `demo1234` |

> Las cuentas de demostración son de prueba: no las uses para datos reales y no cambies sus contraseñas en una demostración.

---

## 2. Guía del cliente

### 2.1 Explorar negocios

1. Entrá a **Explorar** (en el teléfono, en la barra de abajo).
2. Escribí en el buscador lo que querés encontrar: el nombre de un negocio, una categoría (“cafés”) o un producto (“tinto”).
3. Presioná **Enter** o esperá a que la lista se actualice.
4. Tocá un negocio de la lista para abrir su perfil.

En la demostración vas a encontrar, entre otros: Café Las Palmas, Restaurante El Trapiche, Hotel Mirador del Quindío y Artesanías del Café.

**Si algo falla:**

- **“Sin resultados. Probá quitar filtros o buscar ‘café’.”** → Probá con una palabra más corta o sin tildes (escribí “cafe” en lugar de “café”).
- **“No se pudo cargar. Revisá tu conexión.”** → Tocá **Intentar de nuevo**; si sigue igual, revisá tu internet.
- El botón **Mapa** todavía muestra un aviso de que la vista de mapa está en camino (ver la sección 4 de este manual).

### 2.2 Conocer un negocio

En el perfil de un negocio ves:

- La foto principal y la insignia **Destacado** (si el negocio tiene plan Destacado).
- Si está **Abierto ahora** o **Cerrado ahora**.
- Los botones **Llamar** y **Escribir por WhatsApp** (si el negocio cargó esos datos).
- Las pestañas **Información** (datos, contacto, dirección y horarios), **Catálogo** y **Reseñas**.
- La dirección y un enlace para abrir la ubicación en el mapa.

Los botones grandes según lo que quieras hacer:

- **Hacer pedido** → arma un pedido para recoger (solo si el negocio acepta pedidos).
- **Reservar** → pide una mesa, un servicio o una noche (solo si el negocio acepta reservas).

**Si algo falla:**

- **No aparece el botón Hacer pedido ni Reservar** → Es que ese negocio no ofrece ese servicio.
- **“Este negocio todavía no cargó teléfono ni WhatsApp.”** → Podés ir en persona usando la dirección.

### 2.3 Armar el carrito

1. En la pestaña **Catálogo**, tocá los productos que quieras. Si el negocio agrupa por categorías internas (por ejemplo “Bebidas calientes”), vas a ver los grupos.
2. Entrá a **Tu carrito** (arriba, ícono de compra; o desde el aviso que aparece al agregar).
3. Ajustá las cantidades con **–** y **+**, o tocá **Quitar** para sacar un producto.
4. Revisá el **Total**.
5. Tocá **Confirmar pedido**.

Reglas del carrito:

- Solo podés pedir productos de **un negocio por pedido**. Si agregás algo de otro negocio, TRINA te pregunta si querés vaciar el carrito y empezar de nuevo.
- El carrito se guarda en tu navegador: si cerrás y volvés a entrar desde el mismo teléfono, lo encontrás como lo dejaste.
- El precio que vale es el que muestra TRINA al confirmar; el servidor revisa precios y disponibilidad en ese momento.

### 2.4 Pedir para recoger y pagar

1. En **Confirmar pedido** revisá el resumen: productos, cantidades, total y dónde recogés.
2. Si querés, escribí una **nota** para el negocio (por ejemplo: “sin cebolla”).
3. Elegí cómo pagar:
   - **Pagar ahora (prueba)** → pagás en línea con el simulador de pagos.
   - **Pagar en el local** → pagás al recoger.
4. Tocá **Confirmar pedido**.

Si elegiste **Pagar ahora**:

1. Escribí el número de una tarjeta de prueba y tocá el botón de pago. La tarjeta que **aprueba** siempre es **`4111 1111 1111 1111`**.
2. Si el pago sale bien, tu pedido queda **Esperando al negocio**.
3. Si el pago no sale, podés probar de nuevo con otra tarjeta.

Tarjetas de prueba (no son tarjetas reales; no se cobra dinero):

| Tarjeta | Resultado |
|---|---|
| `4111 1111 1111 1111` | Aprobado |
| `4000 0000 0000 0002` | Rechazado: fondos insuficientes |
| `4000 0000 0000 0069` | Rechazado: tarjeta vencida |
| Cualquier otro número | Rechazado con un mensaje genérico |

TRINA **nunca** guarda el número completo de tu tarjeta.

**Si algo falla:**

- **“El ítem «…» no está disponible ahora.”** → Volvé al carrito y quitá ese producto para poder continuar.
- **“Ese negocio no está recibiendo pedidos ahora.”** → El negocio pausó los pedidos. Probá más tarde o contactalo por WhatsApp.
- **“No se pudo procesar el pago: Fondos insuficientes. Probá con otra tarjeta.”** → Usá la tarjeta `4111 1111 1111 1111`.
- **“Falta pagar”** → El pedido quedó esperando el pago. Abrí el detalle del pedido y tocá el botón de pago para terminar. Si pasan más de 30 minutos sin pagar, el pedido se cancela solo.
- **“Tu sesión venció. Volvé a ingresar para seguir.”** → Entrá de nuevo y volvé al carrito; no se pierde.

### 2.5 Reservar

1. En el perfil del negocio, tocá **Reservar**.
2. Si el negocio es de **mesa o servicio**: elegí la fecha, tocá un horario con cupo (los que no tienen cupo salen deshabilitados) y decí cuántas personas son.
3. Si el negocio es de **alojamiento**: elegí la fecha de **Entrada**, la de **Salida** y cuántas personas.
4. Si querés, agregá una nota.
5. Tocá **Confirmar reserva**. La reserva queda **Esperando confirmación** y el negocio recibe el aviso.

**Si algo falla:**

- **“No hay cupo para ese horario. Probá con otra franja.”** → Elegí otro horario o probá otro día.
- **“Elegí una fecha y hora futuras para la reserva.”** → No se pueden reservar fechas que ya pasaron.
- **“La salida tiene que ser posterior a la entrada.”** → Revisá las fechas de alojamiento.
- Una reserva que el negocio no responde en 24 horas se cancela sola y te llega un aviso.

### 2.6 Seguir tus pedidos y reservas

1. Entrá a **Pedidos** en la barra de abajo, o a **Mis reservas** desde **Mi cuenta**.
2. Usá los filtros por estado para ver, por ejemplo, solo los **Entregado**.
3. Tocá un pedido o una reserva para ver el detalle: productos, total, estado y el camino que siguió.

Qué significa cada estado de un pedido (como lo ves vos):

| Estado que ves | Qué está pasando |
|---|---|
| Falta pagar | El pedido está creado, pero todavía no se pagó |
| Esperando al negocio | El negocio todavía no lo aceptó |
| Lo están preparando | El negocio lo aceptó y lo está preparando |
| Listo para recoger | Ya podés ir a recogerlo |
| Entregado | Lo recibiste |
| El negocio no pudo atenderlo | El negocio lo rechazó (si habías pagado, se devuelve el pago de prueba) |
| Cancelado | Se canceló; si habías pagado, se devuelve el pago de prueba |

Estados de una reserva: **Esperando confirmación**, **Reserva confirmada**, **No hubo disponibilidad**, **Cancelada** y **Realizada**. Podés cancelar una reserva mientras esté en **Esperando confirmación** o **Reserva confirmada**.

Podés **Cancelar** un pedido mientras esté en **Falta pagar** o **Esperando al negocio**. Una vez que el negocio empezó a prepararlo, tenés que hablar directo con él.

### 2.7 Notificaciones

La **campana** de arriba a la derecha muestra cuántos avisos nuevos tenés. Se actualiza sola cada 30 segundos. Entrá a **Notificaciones** para ver la lista: tocá un aviso para abrir el pedido o la reserva (los no leídos dicen **Nueva** y se marcan al abrirlos). También podés tocar **✅ Marcar todas como leídas** o filtrar por **Todas** y **Sin leer**.

### 2.8 Tu cuenta y tus datos

Entrá a tu nombre (arriba a la derecha) para abrir **Mi cuenta y mis datos**.

- **Editar tus datos:** cambiá tu nombre o tu teléfono y guardá.
- **Cambiar contraseña:** escribí la contraseña actual y la nueva (mínimo 8 caracteres, con letras y números). Por seguridad, después TRINA te pide ingresar de nuevo.
- **Descargar mis datos (JSON):** descargás un archivo con tu información personal y tu actividad.
- **Eliminar mi cuenta:** tu nombre, correo y teléfono se anonimizan, se cierran tus sesiones y no podés volver a entrar. Si eras comerciante, tu negocio sale del directorio.

**Si algo falla:**

- **“Las dos contraseñas tienen que ser iguales.”** → Revisá que la nueva contraseña y su repetición sean idénticas.
- **“La contraseña necesita mínimo 8 caracteres, con letras y números.”** → Agregá al menos una letra y un número.
- **Eliminar la cuenta no se puede deshacer.** → Si querés conservar tu información, tocá primero **Descargar mis datos (JSON)**.

---

## 3. Guía del comerciante

### 3.1 Tu panel

Al entrar con una cuenta de comerciante vas a tu panel:

- **Inicio:** saludo, estado de tu negocio, pedidos nuevos y reservas por confirmar, tu resumen de los últimos días y tu plan.
- **Pedidos** y **Reservas:** lo que tenés que atender.
- **Mi negocio:** tus datos; desde ahí llegás a **Horarios** y **Fotos**.
- **Membresía:** tu plan actual y cómo pasar al plan Destacado.
- **Estadísticas:** cómo te está yendo.
- **Reseñas:** lo que dicen tus clientes.

La **campana** avisa de pedidos, reservas y cambios de estado.

### 3.2 Crear tu negocio en 6 pasos

Desde **Inicio → ➕ Crear mi negocio**, o desde **Mi negocio → ➕ Crear mi negocio**.

Cada paso guarda tu avance solo cuando tocás **Siguiente**. Podés salir y volver otro día: TRINA retoma donde quedaste.

1. **Paso 1 de 6 — ¿Cómo se llama tu negocio?**
   Nombre, categoría (Restaurantes, Cafés, Hospedajes, Artesanías, etc.) y una descripción corta de lo que ofrecés.
2. **Paso 2 de 6 — ¿Dónde está tu negocio?**
   Escribí la dirección como se la darías a un domiciliario (por ejemplo: `Calle 5 # 10-20`) y cargá la ubicación con latitud y longitud. En esta versión las coordenadas se escriben a mano (el pin sobre el mapa todavía no está en pantalla).
3. **Paso 3 de 6 — ¿Cómo te contactan?**
   Cargá al menos un contacto: teléfono o WhatsApp. Si no tenés los dos, con uno alcanza.
4. **Paso 4 de 6 — ¿Cuándo abres?**
   Marcá los días que abrís, cargá las franjas (por ejemplo, `8:00–12:00` y `14:00–18:00`) y usá los atajos para llenar la semana. También podés marcar un día como cerrado.
5. **Paso 5 de 6 — Fotos de tu negocio**
   Subí al menos una foto en JPG o PNG (hasta 5 MB cada una, máximo 10 fotos). Tocá **⭐ Usar como principal** para elegir la que se muestra primero. Las fotos WebP todavía no se procesan.
6. **Paso 6 de 6 — Revisá y publicá**
   Revisá todo. Si falta algo, TRINA te marca qué falta y te lleva al paso correspondiente. Si está completo, tocá **Enviar a revisión**.

Después de enviarlo, tu negocio queda **En revisión** y aparece en el panel con el aviso “Tu negocio quedó en revisión. Te avisaremos cuando esté publicado”. Un administrador lo revisa y puede:

- **Publicarlo** → tu negocio ya aparece en el directorio.
- **Pedirte ajustes** → vas a ver el motivo; corregí desde **Mi negocio** y tocá **📤 Enviar a revisión**.
- **No aprobarlo** → vas a ver el motivo y también podés corregir y reenviar desde **Mi negocio**.

**Si algo falla:**

- **“Falta un paso para publicar: completá datos, ubicación y al menos un contacto.”** → Te falta el paso 1, 2 o 3.
- **“Falta un paso para publicar: configurá tus horarios.”** → Cargá al menos una franja en el paso 4.
- **“Falta un paso para publicar: agregá al menos una foto.”** → Subí una foto en el paso 5.
- **“Esta foto no se puede subir. Usá una imagen JPG, PNG o WebP.”** → Convertí la foto a JPG o PNG.
- **“La foto no puede superar los 5 MB.”** → Usá una foto más liviana.
- **“Ya tenés 10 fotos; eliminá una para subir otra.”** → Borrá una foto que no uses.
- **“Ya tenés un negocio registrado.”** → Cada cuenta de comerciante tiene un solo negocio.

### 3.3 Mantener tus datos al día

En **Mi negocio** podés cambiar la descripción, la dirección, las coordenadas y los contactos cuando quieras. Después de que tu negocio fue **Publicado**:

- El **nombre** y la **categoría** quedan bloqueados: si necesitás cambiarlos, escribile al administrador (en los campos bloqueados vas a leer “Para cambiar el nombre de tu negocio, escribinos y lo actualizamos” y lo mismo para la categoría).
- Los **horarios** y las **fotos** siguen a tu cargo: los cambios se reflejan enseguida en tu perfil público.

**Si algo falla:**

- **No podés editar el nombre ni la categoría.** → Es a propósito después de la publicación; pedile el cambio al administrador.

### 3.4 Horarios

En **Mi negocio → Ir a horarios**:

1. Marcá los días que abrís. Un día sin franjas queda como **Cerrado**.
2. Tocá **➕ Agregar franja** para cargar una franja; si cerrás al mediodía, cargá dos (por ejemplo, `8:00–12:00` y `14:00–18:00`).
3. Usá los atajos **Lunes a viernes, 8:00 a 18:00** o **Todos los días, 8:00 a 18:00** para llenar rápido, o **📋 Copiar a todos los días** y **🚫 Marcar cerrado**.
4. Tocá **💾 Guardar horarios**.

TRINA calcula con estos horarios si estás **Abierto ahora** en el directorio. Una franja como `18:00–02:00` se entiende como cierre después de medianoche.

**Si algo falla:**

- **“Completá la hora de apertura y la de cierre en cada franja.”** → No dejes franjas a medias; quitá las que no uses con **🗑️ Quitar**.
- **“En una franja, la apertura y el cierre no pueden ser la misma hora.”** → Elegí horas distintas.
- **“No pudimos cargar tus horarios. Revisá tu conexión.”** → Tocá **Intentar de nuevo**.

### 3.5 Fotos

En **Mi negocio → Ir a fotos**:

1. Tocá el botón para elegir archivos; podés subir varias a la vez.
2. Esperá a que terminen de subir; cada una queda en la lista.
3. Tocá **⭐ Usar como principal** en la foto que quieras mostrar primero.
4. Tocá **🗑️ Eliminar** para borrar una foto que ya no querés.

Las fotos se achican y se comprimen solas para que carguen rápido en el celular.

### 3.6 Catálogo (productos y servicios)

> **Nota de esta versión.** La gestión del catálogo desde el panel todavía **no tiene pantalla**: en esta versión solo se puede ver el catálogo público en el perfil del negocio, y los productos del conjunto de demostración ya vienen cargados. La creación, edición, disponibilidad y eliminación de productos está implementada en el servidor y su pantalla en el panel quedó pendiente para la entrega final (ver **estado-hito.md**).

Reglas del catálogo que va a usar esa pantalla, para cuando esté disponible:

- Cada producto o servicio tiene nombre, descripción, precio en pesos (número entero mayor que 0) y puede marcarse como **no disponible** (sigue visible, pero no se puede pedir).
- Si borrás un producto, los pedidos viejos conservan el nombre y el precio con que se vendieron.
- Podés agrupar tus productos en categorías internas (por ejemplo: “Bebidas calientes”, “Repostería”).
- El plan Básico permite destacar hasta 2 productos; el plan Destacado, hasta 6.

### 3.7 Atender pedidos

1. Cuando entra un pedido, aparece un aviso en la **campana** y en **Inicio** se muestra la tarjeta de pedidos nuevos.
2. Entrá a **Pedidos** y abrí el pedido (**Nuevo pedido**).
3. Revisá los productos, la nota del cliente y si ya está pagado.
4. Elegí la acción:
   - **✅ Aceptar pedido** → pasa a **En preparación** y el cliente recibe el aviso.
   - **🚫 Rechazar pedido** → te pide un **motivo** (obligatorio). Si el pedido estaba pagado en línea, TRINA devuelve el pago de prueba y avisa al cliente.
5. Cuando esté listo, tocá **✅ Marcar listo para entregar**.
6. Cuando el cliente lo reciba, tocá **🎉 Marcar entregado**.

Si ya no podés atender un pedido que estás preparando, podés **🚫 Cancelar pedido** con un motivo. Si estaba pagado, se devuelve el pago de prueba.

El pedido también puede terminar solo: los pedidos que quedan en **Esperando el pago** más de 30 minutos se cancelan.

**Si algo falla:**

- **“Esa acción no existe.”** → Actualizá la pantalla: puede que el estado del pedido ya haya cambiado.
- **“Esa reserva no es tuya.” / “Ese pedido no es tuyo.”** → Estás abriendo un registro de otro negocio.
- No ves el pedido → Revisá los filtros de la lista o la campana.

### 3.8 Atender reservas

1. Entrá a **Reservas** y abrí la reserva (**Reserva por confirmar**).
2. Elegí la acción:
   - **✅ Confirmar reserva** → el cliente recibe el aviso.
   - **🚫 Rechazar reserva** → te pide un **motivo** (obligatorio) y se libera el cupo.
3. Cuando la reserva ya se realizó, tocá **🎉 Marcar realizada**.
4. Si hace falta, podés **🚫 Cancelar reserva** con un motivo; el cupo se libera y el cliente se entera.

Las reservas se controlan por cupo: tu negocio tiene una capacidad de reservas al mismo tiempo y TRINA solo acepta una nueva si hay lugar.

Las reservas que no respondés en 24 horas se cancelan solas.

### 3.9 Tu membresía

En **Membresía** ves tu plan actual y los planes disponibles:

- **Básica (gratis):** tu negocio siempre visible, hasta 2 productos destacados.
- **Destacada (pago mensual):** insignia **Destacado**, prioridad en el orden por defecto del directorio y hasta 6 productos destacados.

Para pasar al plan Destacado:

1. Tocá **⭐ Pasar a Destacado** (o **⭐ Renovar Destacado** si ya lo tenías y venció).
2. Pagá con una tarjeta de prueba (`4111 1111 1111 1111`).
3. El plan queda activo por 30 días.

Cuando tu plan Destacado esté por vencer (7 días o menos), vas a ver un aviso en **Inicio** y en **Membresía**. Si vence, tu negocio sigue visible con el plan Básico y pierde la insignia.

### 3.10 Estadísticas

En **Estadísticas** elegí el período **7 días** o **30 días** para ver:

- visitas a tu perfil,
- pedidos y reservas recibidos,
- ingresos de pedidos entregados,
- y el ranking de **Productos más vistos**.

Si todavía no tenés actividad, vas a ver valores en cero con un mensaje de orientación.

### 3.11 Reseñas

En **Reseñas** ves lo que opinan tus clientes, con el promedio de estrellas y una insignia de **Compra verificada** cuando la persona tiene un pedido o reserva realizada en tu negocio.

Si una reseña no corresponde a tu negocio, tocá **Reportar**: te pide un motivo y queda en la cola de revisión del administrador.

---

## 4. Pendientes conocidos de esta versión

Estos puntos todavía no están en pantalla, aunque el servidor ya los soporta. Están anotados en **estado-hito.md** para la revisión del Product Owner:

1. **Crear cuenta desde la página** (registro público): por ahora las cuentas se crean con el alta asistida del administrador.
2. **Olvidé mi contraseña**: el enlace de recuperación todavía no tiene pantalla propia.
3. **Mapa en Explorar**: el mapa interactivo y los filtros (“Abierto ahora”, “Cerca de mí”, nivel de precio, categoría). El pin sobre el mapa en el asistente de alta también está pendiente: por ahora las coordenadas se escriben a mano (sección 3.2).
4. **Catálogo en el panel del comerciante** (sección 3.6).
5. **Página pública de la política de privacidad** (el texto existe en el servidor, pero no hay pantalla).
6. **Notificaciones por correo**: hoy solo se avisan dentro de la plataforma.

---

*Este manual se acompaña del **Manual del administrador** (`manual-administrador.md`) y del documento **Estado del hito** (`estado-hito.md`), donde está el detalle de lo que falta para la entrega final.*
