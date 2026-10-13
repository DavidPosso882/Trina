# Manual del administrador — TRINA

**Proyecto:** TRINA (VitrinaLocal) — directorio comercial georreferenciado con pedidos para recoger, reservas y membresías.
**Versión:** 1.0 (cierre E5) · Octubre de 2026
**Para:** personal de la plataforma (rol ADMINISTRADOR).

Este manual te explica cómo entrar al panel de administración y cómo usar cada sección: revisar negocios, crear cuentas de comerciante, gestionar usuarios, categorías, parámetros, reseñas reportadas y auditoría.

---

## 1. Cómo entrar

1. Abrí la dirección de TRINA (en la demostración local: `http://localhost:5173`).
2. Tocá **Ingresar**.
3. Escribí el correo y la contraseña del administrador.
4. Tocá **Entrar**; TRINA te lleva sola al panel (**Resumen**).

Credenciales según cómo esté instalada la plataforma:

| Entorno | Correo | Contraseña |
|---|---|---|
| Demostración (`APP_SEED_DEMO=true`, sin `ADMIN_PASSWORD`) | `admin@trina.local` | `admin1234` |
| Producción | El que definió `ADMIN_EMAIL` | El que definió `ADMIN_PASSWORD` |

> En producción el administrador inicial se crea una sola vez, en el primer arranque, a partir de las variables de entorno. No existe auto-registro de administradores.

Para salir, tocá **Salir** arriba a la derecha.

---

## 2. El panel de un vistazo

El menú lateral (o el menú de arriba, en el teléfono) tiene:

| Sección | Para qué sirve |
|---|---|
| **Resumen** | Indicadores globales de la plataforma |
| **Negocios** | Cola de revisión y gestión de todos los negocios |
| **Usuarios** | Buscar, activar/desactivar y cambiar de rol |
| **Categorías** | Crear, editar y activar/desactivar categorías del directorio |
| **Parámetros y planes** | Configurar comisión y límites; ver los planes de membresía |
| **Reseñas** | Moderar las reseñas reportadas |
| **Auditoría** | Historial de las acciones administrativas |

---

## 3. Resumen

Al entrar ves los indicadores actualizados de la plataforma:

- **Negocios, Pedidos totales, Comisiones, Membresías activas, Usuarios** y **No residentes** (cantidad y porcentaje de usuarios visitantes).
- **Negocios por estado:** sin terminar, pendientes, con ajustes, no aprobados, publicados y suspendidos, con un enlace **Ver →** a la lista filtrada.
- **Usuarios por rol:** clientes, comerciantes y administradores.

Si todavía no hay datos, la pantalla muestra un mensaje de orientación en lugar de gráficos vacíos.

---

## 4. Revisar negocios

### 4.1 La cola de revisión

Entrá a **Negocios**. Arriba están las pestañas por estado:

**Sin terminar** · **Pendientes** · **Con ajustes** · **No aprobados** · **Publicados** · **Suspendidos** · **Todos**

Los negocios **Pendientes** son los que esperan tu decisión. Podés buscarlos por nombre y abrirlos para ver la ficha completa: datos, contacto, dirección, ubicación, horarios y fotos.

Al abrir un negocio tenés las acciones:

| Acción | Cuándo usarla | Qué pasa |
|---|---|---|
| **Aprobar** | La ficha está completa y es correcta | Pasa a **Publicado** y aparece en el directorio; el comerciante recibe el aviso |
| **Pedir ajustes** | Falta corregir algo, pero el negocio es válido | Pasa a **Con ajustes** con tu observación visible para el comerciante |
| **Rechazar negocio** | No corresponde publicarlo | Pasa a **No aprobado** con tu motivo visible |
| **Suspender negocio** | Ya estaba publicado y hay que sacarlo del directorio | Pasa a **Oculto temporalmente** |
| **Reactivar** | El negocio suspendido puede volver | Vuelve a **Publicado** |

**El motivo es obligatorio** para pedir ajustes, rechazar y suspender: el comerciante lo ve y lo usa para corregir. Todos estos cambios quedan registrados en **Auditoría**.

Un negocio en **Sin terminar** es un borrador: el comerciante todavía no lo envió a revisión, así que no hay nada que decidir.

### 4.2 Alta asistida de un comerciante

Para los comerciantes que no van a cargar sus datos solos:

1. Entrá a **Negocios** y tocá **➕ Alta asistida de negocio**.
2. **Creá la cuenta del comerciante:** nombre, correo y teléfono (opcional). TRINA genera la **clave temporal** y te la muestra **una sola vez**: copiala y entregásela a la persona.
3. **Creá su negocio** con los datos del formulario: nombre, categoría, descripción, dirección, latitud y longitud, teléfono y WhatsApp. Todos los campos salvo el nombre son opcionales: podés completarlos tú o dejar que el comerciante los termine después (los horarios y las fotos los carga el comerciante desde su panel).
4. Elegí el **estado inicial**: **En revisión** (para que lo apruebes después de completarlo) o **Publicado** directamente.

Cuando el comerciante entre por primera vez con la clave temporal, el sistema le exige cambiarla. Si no puede hacerlo, pedile que use la recuperación de contraseña (ver la sección 9, “Problemas comunes”, punto 3).

> **Recomendación:** entregá la clave temporal en persona o por un canal privado y pedile que la cambie en el primer ingreso.

### 4.3 Editar un negocio

Desde la ficha de un negocio podés revisar sus datos y aplicar las acciones de la sección 4.1. La edición directa de los campos bloqueados (**nombre** y **categoría**) está soportada por el servidor para el administrador, pero todavía **no tiene formulario** en el panel: por ahora esa edición queda en la API (pendiente anotado en `estado-hito.md`).

---

## 5. Usuarios

Entrá a **Usuarios**. Podés:

- **Buscar** por nombre o correo.
- **Filtrar** por rol (Cliente, Comerciante, Administrador) y por estado (Activas, Desactivadas, Todas).
- **Activar o desactivar** una cuenta: al desactivarla, la persona no puede ingresar y sus sesiones abiertas quedan invalidadas.
- **Cambiar el rol** de una cuenta (por ejemplo, de Cliente a Comerciante). El cambio invalida las sesiones anteriores.

Reglas:

- No podés desactivar tu propia cuenta: el sistema te lo impide (“No podés desactivar tu propia cuenta”).
- Antes de cambiar un rol, TRINA te pide confirmación indicando el rol anterior y el nuevo.
- Los usuarios desactivados no pueden ingresar; el sistema les dice que contacten al administrador.

---

## 6. Categorías

Entrá a **Categorías** para ordenar cómo se agrupa el directorio. Las categorías iniciales son: Restaurantes, Cafés, Hospedajes, Artesanías, Tiendas, Servicios, Experiencias y turismo.

- **Crear:** escribí el nombre (y el orden en que querés que aparezca).
- **Editar:** cambiá el nombre o el orden.
- **Desactivar:** deja de ofrecerse a los negocios nuevos; los negocios que ya la tenían la conservan.
- **Reactivar:** vuelve a estar disponible para elegir.

---

## 7. Parámetros y planes

Entrá a **Parámetros y planes**.

### 7.1 Parámetros del sistema

| Parámetro | Para qué sirve | Valor semilla |
|---|---|---|
| `comision_pct` | Porcentaje de comisión sobre pagos en línea | 5 |
| `max_imagenes` | Máximo de fotos por negocio | 10 |
| `max_mb_imagen` | Tamaño máximo por foto (MB) | 5 |
| `max_destacados_basica` | Productos destacados del plan Básico | 2 |
| `max_destacados_destacada` | Productos destacados del plan Destacada | 6 |
| `pedido_expira_min` | Minutos antes de cancelar un pedido sin pagar | 30 |
| `reserva_expira_horas` | Horas antes de cancelar una reserva sin respuesta | 24 |

La **comisión** solo acepta valores **entre 0 y 30**. Si escribís un valor fuera de ese rango, TRINA lo rechaza con un mensaje claro. Cada cambio queda en **Auditoría** con el valor anterior y el nuevo.

Los valores de comisión, precio de planes y límites son **parámetros de demostración**: el Product Owner debe validarlos antes de usarlos en producción (pendiente P-02 del SRS).

### 7.2 Planes de membresía

Ves los planes vigentes (**Básica** y **Destacada**) con su precio y su límite de productos destacados. En esta versión los planes se muestran **solo de lectura** en esta pantalla.

---

## 8. Reseñas reportadas y auditoría

### 8.1 Reseñas

Entrá a **Reseñas** para ver la cola de moderación. Arriba podés alternar entre **🚩 Reportadas** (solo las que reportaron los comerciantes) y **Todas**.

- Tocá **🙈 Ocultar reseña** si no corresponde: deja de mostrarse en el perfil y no cuenta en el promedio del negocio.
- Tocá **👁️ Mostrar reseña** para revertir la decisión.

TRINA te pide confirmación antes de aplicar el cambio.

### 8.2 Auditoría

Entrá a **Auditoría** para ver el historial de acciones administrativas de la plataforma. Podés filtrar por:

- **Entidad** (por ejemplo, negocio o parámetro).
- **Usuario** (el identificador del administrador que actuó).
- **Desde** y **Hasta** (fecha).

Cada registro muestra **quién**, **cuándo** y **qué** se hizo, con el valor anterior y el nuevo cuando corresponde: aprobaciones, rechazos, suspensiones, cambios de parámetros, cambios de rol, desactivaciones y ediciones de perfiles.

---

## 9. Problemas comunes

1. **“Hiciste varios intentos. Esperá unos minutos y volvé a probar.”**
   Es el límite de seguridad: 5 intentos fallidos en 15 minutos por correo o por IP. Esperá 15 minutos y volvé a intentar.
2. **“Tu cuenta está desactivada. Contactá al administrador.”**
   Ese usuario fue desactivado. Entrá a **Usuarios**, buscalo y activalo si corresponde.
3. **Un comerciante creado con alta asistida no puede ingresar.**
   El sistema le exige cambiar la clave temporal antes de dejarlo operar, y la pantalla de recuperación todavía no está publicada. Antes de usar el alta asistida, coordiná con el equipo técnico: en esta versión la cuenta queda bloqueada para el primer ingreso (ver `estado-hito.md`).
4. **No puedo desactivarme a mí mismo.**
   Es una protección del sistema: pedile a otro administrador que haga el cambio.
5. **Un cambio de comisión no se ve en los pagos viejos.**
   Es correcto: cada pago guarda la comisión que se calculó en el momento. Los pagos nuevos usan el valor vigente.
6. **Un negocio suspendido sigue apareciendo.**
   Revisá que el estado sea **Oculto temporalmente**; los negocios suspendidos no se muestran en el directorio ni en el mapa.
7. **“No tenés permiso para ver esta página.”**
   Estás usando una cuenta que no es de administrador. Salí e ingresá con la cuenta correcta.
8. **“Tu sesión venció. Volvé a ingresar para seguir.”**
   La sesión dura 60 minutos. Ingresá otra vez; no se pierde nada de lo que habías guardado.

---

## 10. Pendientes conocidos de esta versión

Estos puntos están anotados en **estado-hito.md** para la revisión del Product Owner:

1. **Alta asistida sin horarios ni fotos:** el formulario de alta crea la cuenta y los datos básicos del negocio, pero no carga horarios ni fotos; de eso se encarga el comerciante desde su panel.
2. **Edición administrativa sin formulario:** el servidor permite al administrador editar los campos bloqueados (nombre y categoría) de un negocio publicado, pero esa edición todavía no tiene pantalla.
3. **Pantalla de catálogo:** no hay pantalla para cargar productos, ni para el comerciante ni en el alta asistida.
4. **Moderación de reseñas en la auditoría:** ocultar o mostrar una reseña hoy no genera un registro de auditoría (sí lo hacen las aprobaciones, los rechazos, las suspensiones, los usuarios y los parámetros).
5. **Cambio de precio de los planes:** la pantalla de planes es solo de lectura; el precio del plan Destacado se cambia por parámetro/semilla.
6. **Filtros avanzados de auditoría:** hay filtros por entidad, usuario y fechas; no hay exportación de resultados.

---

*Este manual se acompaña del **Manual de usuario** (`manual-usuario.md`) y del documento **Estado del hito** (`estado-hito.md`).*
