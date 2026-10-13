/** Cliente API TRINA: base /api/v1, JWT desde sessionStorage (RNF-03), errores §5.9 con mensajes claros. */
const BASE = '/api/v1';

export type Rol = 'CLIENTE' | 'COMERCIANTE' | 'ADMINISTRADOR';

export class ApiError extends Error {
  codigo: string;
  estado: number;
  constructor(estado: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

export function tokenGuardado(): string | null {
  return sessionStorage.getItem('trina_token');
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const cabeza = new Headers(opciones.headers);
  // FormData arma su propio Content-Type con boundary; el resto viaja como JSON.
  if (!(opciones.body instanceof FormData)) cabeza.set('Content-Type', 'application/json');
  const token = tokenGuardado();
  if (token) cabeza.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}${ruta}`, { ...opciones, headers: cabeza });
  if (res.status === 204 || res.status === 202) return undefined as T;
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, cuerpo.codigo ?? 'INTERNO', cuerpo.mensaje ?? 'Algo salió mal. Intentá de nuevo.');
  }
  return cuerpo as T;
}

export const api = {
  login: (email: string, password: string) =>
    pedir<{ token: string; rol: Rol }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  registro: (datos: {
    email: string;
    password: string;
    nombre: string;
    rol: Rol;
    consentimiento: boolean;
    esResidente?: boolean;
  }) =>
    pedir<{ id: number; email: string; nombre: string; rol: Rol }>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datos)
    }),
  me: () => pedir<{ id: number; email: string; nombre: string; rol: Rol }>('/auth/me'),
  logout: () => pedir<void>('/auth/logout', { method: 'POST' })
};

// ---- Recuperación de contraseña (RF-03) ----

/** E1: el servidor responde igual exista o no la cuenta (202). */
export const recuperarClave = (email: string) =>
  pedir<void>('/auth/recuperar-clave', { method: 'POST', body: JSON.stringify({ email }) });

/** E2/E3: token de un solo uso; al cambiar la clave se invalidan las sesiones previas. */
export const restablecerClave = (token: string, nuevaClave: string) =>
  pedir<void>('/auth/restablecer-clave', {
    method: 'POST',
    body: JSON.stringify({ token, nuevaClave })
  });

// ---------- Negocio propio (RF-06, RF-11 a RF-13) ----------

export type EstadoNegocio =
  | 'BORRADOR'
  | 'PENDIENTE'
  | 'CORRECCION_SOLICITADA'
  | 'RECHAZADO'
  | 'APROBADO'
  | 'SUSPENDIDO';

/** Respuesta de mi-negocio / negocios: DTO del backend (NegocioGestionDto.Respuesta). */
export type Negocio = {
  id: number;
  nombre: string;
  categoria: string | null;
  estado: EstadoNegocio;
  motivoRevision: string | null;
  descripcion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  telefono: string | null;
  whatsapp: string | null;
};

/** Categoría pública de negocio (GET /categorias, RF-44). */
export type Categoria = {
  id: number;
  nombre: string;
  icono: string | null;
  orden: number | null;
  activa: boolean;
};

/** Franja de horario: día 1 (lunes) a 7 (domingo) y horas HH:mm (RF-13). */
export type Franja = { diaSemana: number; abre: string; cierra: string };

/** Foto del negocio con sus dos URLs ya resueltas por el servidor (RF-12). */
export type ImagenNegocio = {
  id: number;
  url: string;
  urlMiniatura: string;
  principal: boolean;
  orden: number;
};

/** Campos editables del negocio (PUT /negocios/{id}); los ausentes no se tocan. */
export type DatosNegocio = {
  nombre?: string;
  categoriaId?: number;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  whatsapp?: string;
};

export const crearNegocio = (datos: { nombre: string; categoriaId: number | null }) =>
  pedir<Negocio>('/negocios', { method: 'POST', body: JSON.stringify(datos) });

export const actualizarNegocio = (id: number, datos: DatosNegocio) =>
  pedir<Negocio>(`/negocios/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const enviarRevision = (id: number) =>
  pedir<Negocio>(`/negocios/${id}/enviar-revision`, { method: 'POST' });

export const miNegocio = () => pedir<Negocio>('/mi-negocio');

export const getCategorias = () => pedir<Categoria[]>('/categorias');

export const guardarHorarios = (id: number, franjas: Franja[]) =>
  pedir<Franja[]>(`/negocios/${id}/horarios`, { method: 'PUT', body: JSON.stringify(franjas) });

export const getHorarios = (id: number) => pedir<Franja[]>(`/negocios/${id}/horarios`);

export const subirImagen = (id: number, file: File) => {
  const datos = new FormData();
  datos.append('file', file);
  return pedir<ImagenNegocio>(`/negocios/${id}/imagenes`, { method: 'POST', body: datos });
};

export const listarImagenes = (id: number) => pedir<ImagenNegocio[]>(`/negocios/${id}/imagenes`);

export const marcarPrincipal = (id: number, imagenId: number) =>
  pedir<ImagenNegocio>(`/negocios/${id}/imagenes/${imagenId}`, {
    method: 'PATCH',
    body: JSON.stringify({ principal: true })
  });

export const eliminarImagen = (id: number, imagenId: number) =>
  pedir<void>(`/negocios/${id}/imagenes/${imagenId}`, { method: 'DELETE' });

// ---------- Flujos del cliente PC-01 a PC-07 (RF-25, RF-26, RF-30, RF-31, RF-32, RF-48) ----------

/**
 * Ficha pública del negocio (GET /negocios/{id}). Hoy el backend devuelve nombre, categoría, estado y
 * abiertoAhora; los campos de contacto y reserva quedan opcionales para mostrarlos solo si llegan.
 */
export type FichaNegocio = {
  id: number;
  nombre: string;
  categoria: string | null;
  estado: string;
  abiertoAhora?: boolean;
  destacado?: boolean;
  insignia?: string | null;
  distanciaKm?: number | null;
  descripcion?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  whatsapp?: string | null;
  tipoReserva?: TipoReserva | null;
  aceptaPedidos?: boolean;
  aceptaReservas?: boolean;
  nivelPrecio?: number | null;
};

export const getNegocio = (id: number) => pedir<FichaNegocio>(`/negocios/${id}`);

// ---- Directorio público con filtros y mapa (RF-09, RF-20 a RF-24) ----

export type PaginaNegocios = {
  contenido: FichaNegocio[];
  pagina: number;
  tamano: number;
  total: number;
};

/** Marcador del mapa: solo negocios con coordenadas (RF-24). */
export type MarcadorNegocio = {
  id: number;
  nombre: string;
  categoria: string | null;
  latitud: number;
  longitud: number;
  abiertoAhora: boolean;
  destacado: boolean;
};

export type FiltrosExplorar = {
  q?: string;
  categoriaId?: number;
  abiertoAhora?: boolean;
  nivelPrecio?: number;
  lat?: number;
  lng?: number;
  radioKm?: number;
  orden?: 'destacados' | 'cercania' | 'nombre';
  page?: number;
  size?: number;
};

function consultaExplorar(f: FiltrosExplorar): string {
  const p = new URLSearchParams();
  if (f.q?.trim()) p.set('q', f.q.trim());
  if (f.categoriaId) p.set('categoriaId', String(f.categoriaId));
  if (f.abiertoAhora) p.set('abiertoAhora', 'true');
  if (f.nivelPrecio) p.set('nivelPrecio', String(f.nivelPrecio));
  if (f.lat !== undefined && f.lng !== undefined) {
    p.set('lat', String(f.lat));
    p.set('lng', String(f.lng));
  }
  if (f.radioKm) p.set('radioKm', String(f.radioKm));
  if (f.orden) p.set('orden', f.orden);
  if (f.page !== undefined) p.set('page', String(f.page));
  if (f.size !== undefined) p.set('size', String(f.size));
  const cadena = p.toString();
  return cadena ? `?${cadena}` : '';
}

export const listarNegocios = (filtros: FiltrosExplorar = {}) =>
  pedir<PaginaNegocios>(`/negocios${consultaExplorar(filtros)}`);

export const mapaNegocios = (filtros: FiltrosExplorar = {}) =>
  pedir<MarcadorNegocio[]>(`/negocios/mapa${consultaExplorar(filtros)}`);

// ---- Catálogo público (RF-17/RF-18) ----

export type ItemCatalogo = {
  id: number;
  categoriaId: number | null;
  tipo?: string;
  nombre: string;
  descripcion: string | null;
  precioCop: number;
  disponible: boolean;
  destacado?: boolean;
  activo?: boolean;
};

export type GrupoCatalogo = {
  categoria: { id: number; nombre: string };
  items: ItemCatalogo[];
};

export type CatalogoPublico = {
  negocioId: number;
  negocio: string;
  categorias: GrupoCatalogo[];
  sinCategoria: ItemCatalogo[];
};

export const getCatalogo = (negocioId: number) =>
  pedir<CatalogoPublico>(`/negocios/${negocioId}/catalogo`);

/** Catálogo propio del comerciante: incluye bajas y no disponibles, funciona sin estar aprobado. */
export const getCatalogoPropio = (negocioId: number) =>
  pedir<CatalogoPublico>(`/negocios/${negocioId}/catalogo/propio`);

// ---- Gestión del catálogo por el comerciante (RF-15/RF-16/RF-18) ----

/** Categoría interna del catálogo; el orden lo define el comerciante. */
export type CategoriaCatalogo = { id: number; nombre: string; orden: number };

/** Payload de creación/edición de ítem (POST/PUT .../catalogo/items). */
export type DatosItemCatalogo = {
  nombre: string;
  precioCop: number;
  descripcion?: string;
  tipo?: 'producto' | 'servicio';
  categoriaId?: number | null;
};

export const listarCategoriasCatalogo = (negocioId: number) =>
  pedir<CategoriaCatalogo[]>(`/negocios/${negocioId}/catalogo/categorias`);

export const crearItemCatalogo = (negocioId: number, datos: DatosItemCatalogo) =>
  pedir<ItemCatalogo>(`/negocios/${negocioId}/catalogo/items`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });

export const actualizarItemCatalogo = (
  negocioId: number,
  itemId: number,
  datos: DatosItemCatalogo
) =>
  pedir<ItemCatalogo>(`/negocios/${negocioId}/catalogo/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });

export const cambiarDisponibilidadItem = (
  negocioId: number,
  itemId: number,
  disponible: boolean
) =>
  pedir<ItemCatalogo>(`/negocios/${negocioId}/catalogo/items/${itemId}/disponibilidad`, {
    method: 'PATCH',
    body: JSON.stringify({ disponible })
  });

/** Baja lógica: el ítem deja de mostrarse en el catálogo público. */
export const eliminarItemCatalogo = (negocioId: number, itemId: number) =>
  pedir<void>(`/negocios/${negocioId}/catalogo/items/${itemId}`, { method: 'DELETE' });

export const crearCategoriaCatalogo = (negocioId: number, datos: { nombre: string; orden?: number }) =>
  pedir<CategoriaCatalogo>(`/negocios/${negocioId}/catalogo/categorias`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });

export const actualizarCategoriaCatalogo = (
  negocioId: number,
  catId: number,
  datos: { nombre: string; orden?: number }
) =>
  pedir<CategoriaCatalogo>(`/negocios/${negocioId}/catalogo/categorias/${catId}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });

/** Al eliminar la categoría sus ítems quedan sin categoría (no se borran). */
export const eliminarCategoriaCatalogo = (negocioId: number, catId: number) =>
  pedir<void>(`/negocios/${negocioId}/catalogo/categorias/${catId}`, { method: 'DELETE' });

// ---- Reseñas (RF-38) ----

export type Resena = {
  id: number;
  negocioId: number;
  clienteId: number;
  clienteNombre: string;
  calificacion: number;
  comentario: string;
  verificada: boolean;
  visible: boolean;
  reportada: boolean;
  motivoReporte: string | null;
  creadoEn: string;
};

export type ListadoResenas = { resenas: Resena[]; promedio: number | null; cantidad: number };

export const getResenas = (negocioId: number) =>
  pedir<ListadoResenas>(`/negocios/${negocioId}/resenas`);

export const publicarResena = (negocioId: number, datos: { calificacion: number; comentario: string }) =>
  pedir<Resena>(`/negocios/${negocioId}/resenas`, { method: 'POST', body: JSON.stringify(datos) });

export const editarResena = (resenaId: number, datos: { calificacion: number; comentario: string }) =>
  pedir<Resena>(`/resenas/${resenaId}`, { method: 'PUT', body: JSON.stringify(datos) });

// ---- Pedidos para recoger (RF-25/RF-31) ----

export type MetodoPago = 'SANDBOX' | 'EN_LOCAL';

export type ItemPedido = {
  id: number;
  itemId: number | null;
  nombre: string;
  precioUnitarioCop: number;
  cantidad: number;
};

export type Pedido = {
  id: number;
  clienteId: number;
  negocioId: number;
  negocio: string;
  estado: string;
  metodoPago: MetodoPago;
  totalCop: number;
  nota: string | null;
  motivo: string | null;
  creadoEn: string;
  items: ItemPedido[];
};

export const crearPedido = (datos: {
  negocioId: number;
  items: { itemId: number; cantidad: number }[];
  metodoPago: MetodoPago;
  nota?: string;
}) => pedir<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify(datos) });

export const listarPedidos = (estado?: string) =>
  pedir<Pedido[]>(`/pedidos${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`);

export const getPedido = (id: number) => pedir<Pedido>(`/pedidos/${id}`);

export const cancelarPedido = (id: number) =>
  pedir<Pedido>(`/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ accion: 'CANCELAR' })
  });

// ---- Pago simulado (RF-28) ----

export type ResultadoPago = {
  pagoId: number;
  suscripcionId: number | null;
  estado: 'APROBADO' | 'RECHAZADO';
  motivo: string | null;
  montoCop: number;
  comisionCop: number;
  netoCop: number;
  referencia: string | null;
};

/** La clave de idempotencia viaja en el header y debe ser nueva en cada intento. */
export const cobrarPedido = (pedidoId: number, tarjeta: string, claveIdempotencia: string) =>
  pedir<ResultadoPago>('/pagos', {
    method: 'POST',
    headers: { 'Idempotency-Key': claveIdempotencia },
    body: JSON.stringify({ pedidoId, tarjeta })
  });

// ---- Reservas y disponibilidad (RF-26/RF-31) ----

export type TipoReserva = 'FRANJA' | 'ALOJAMIENTO';

export type FranjaDisponible = {
  hora: string;
  inicio: string;
  fin: string;
  ocupadas: number;
  libres: number;
  disponible: boolean;
};

export type Disponibilidad = {
  negocioId: number;
  fecha: string;
  tipoReserva: TipoReserva;
  capacidadReservas: number;
  duracionReservaMin: number;
  franjas: FranjaDisponible[];
};

export const getDisponibilidad = (negocioId: number, fecha: string) =>
  pedir<Disponibilidad>(`/negocios/${negocioId}/disponibilidad?fecha=${fecha}`);

export type Reserva = {
  id: number;
  clienteId: number;
  negocioId: number;
  negocio: string;
  tipoReserva: TipoReserva;
  estado: string;
  inicio: string;
  fin: string;
  personas: number;
  nota: string | null;
  motivo: string | null;
  creadoEn: string;
};

export const crearReserva = (datos: {
  negocioId: number;
  inicio: string;
  fin?: string;
  personas: number;
  nota?: string;
}) => pedir<Reserva>('/reservas', { method: 'POST', body: JSON.stringify(datos) });

export const listarReservas = (estado?: string) =>
  pedir<Reserva[]>(`/reservas${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`);

export const getReserva = (id: number) => pedir<Reserva>(`/reservas/${id}`);

export const cancelarReserva = (id: number) =>
  pedir<Reserva>(`/reservas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ accion: 'CANCELAR' })
  });

// ---- Notificaciones (RF-32) ----

export type Notificacion = {
  id: number;
  tipo: string;
  mensaje: string;
  entidadTipo: string | null;
  entidadId: number | null;
  leida: boolean;
  creadoEn: string;
};

export const getNotificaciones = (soloNoLeidas = false) =>
  pedir<Notificacion[]>(`/notificaciones?soloNoLeidas=${soloNoLeidas}`);

export const getContadorNotificaciones = () =>
  pedir<{ noLeidas: number }>('/notificaciones/contador');

export const marcarNotificacionLeida = (id: number) =>
  pedir<Notificacion>(`/notificaciones/${id}/leida`, { method: 'PATCH' });

export const marcarTodasLeidas = () =>
  pedir<void>('/notificaciones/leer-todas', { method: 'POST' });

// ---- Cuenta y privacidad (RF-48/RF-49) ----

export type ResumenPedido = {
  id: number;
  negocio: string;
  estado: string;
  totalCop: number;
  creadoEn: string;
};

export type ResumenReserva = {
  id: number;
  negocio: string;
  estado: string;
  inicio: string;
  fin: string;
  personas: number;
};

export type MisDatos = {
  id: number;
  email: string;
  nombre: string;
  telefono: string | null;
  rol: Rol;
  esResidente: boolean | null;
  versionConsentimiento: string | null;
  consentimientoEn: string | null;
  pedidos: ResumenPedido[];
  reservas: ResumenReserva[];
  negocio: { id: number; nombre: string; estado: string } | null;
};

export const getMisDatos = () => pedir<MisDatos>('/me/datos');

// ---- Política de privacidad (RF-48, PU-07) ----

export type PoliticaPrivacidad = { version: string; texto: string };

export const getPoliticaPrivacidad = () => pedir<PoliticaPrivacidad>('/politica-privacidad');

export const actualizarMe = (datos: { nombre?: string; telefono?: string }) =>
  pedir<{ id: number; email: string; nombre: string; telefono: string | null; rol: Rol }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(datos)
  });

export const cambiarClave = (actual: string, nueva: string) =>
  pedir<void>('/me/cambiar-clave', { method: 'POST', body: JSON.stringify({ actual, nueva }) });

export const eliminarMiCuenta = () => pedir<void>('/me', { method: 'DELETE' });

// ---------- Panel del comerciante: pedidos y reservas (PM-07/PM-08, RF-27) ----------

/** Acciones que el Comerciante puede aplicar a un pedido. */
export type AccionPedido = 'ACEPTAR' | 'RECHAZAR' | 'MARCAR_LISTO' | 'COMPLETAR' | 'CANCELAR';

/** Acciones que el Comerciante puede aplicar a una reserva. */
export type AccionReserva = 'CONFIRMAR' | 'RECHAZAR' | 'COMPLETAR' | 'CANCELAR';

/** El motivo solo viaja en RECHAZAR y CANCELAR (RF-27). */
export const cambiarEstadoPedido = (id: number, accion: AccionPedido, motivo?: string) =>
  pedir<Pedido>(`/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ accion, motivo })
  });

export const cambiarEstadoReserva = (id: number, accion: AccionReserva, motivo?: string) =>
  pedir<Reserva>(`/reservas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ accion, motivo })
  });

// ---------- Estadísticas (PM-10, PA-01, RF-40/41/42) ----------

export type ResumenEstadisticas = {
  dias: number;
  visitas: number;
  pedidos: number;
  reservas: number;
  ingresosCop: number;
};

export type ItemRanking = { itemId: number | null; nombre: string; visitas: number };

export type ConteoEstado = { estado: string; cantidad: number };
export type ConteoRol = { rol: string; cantidad: number };

/** Indicadores globales del panel administrativo (RF-41). */
export type PanelAdmin = {
  negociosPorEstado: ConteoEstado[];
  usuariosPorRol: ConteoRol[];
  pedidosTotales: number;
  comisionesCop: number;
  membresiasActivas: number;
  usuariosNoResidentes: number;
  usuariosTotales: number;
  proporcionNoResidentes: number;
};

export const getEstadisticas = (dias: number) =>
  pedir<ResumenEstadisticas>(`/mi-negocio/estadisticas?dias=${dias}`);

export const getProductosMasVistos = (dias: number, limite = 5) =>
  pedir<ItemRanking[]>(`/mi-negocio/productos-mas-vistos?dias=${dias}&limite=${limite}`);

export const getAdminEstadisticas = () => pedir<PanelAdmin>('/admin/estadisticas');

// ---------- Membresía (PM-09, RF-33 a RF-37) ----------

export type PlanMembresia = {
  id: number;
  codigo: string;
  nombre: string;
  precioMensualCop: number;
  maxDestacados: number;
  activo: boolean;
};

/** Respuesta de mi-suscripcion: sin fila el plan efectivo es BASICA y los demás campos van nulos. */
export type Suscripcion = {
  id: number | null;
  estado: string | null;
  planCodigo: string | null;
  planNombre: string | null;
  precioMensualCop: number | null;
  inicio: string | null;
  fin: string | null;
  planEfectivo: string;
  avisoRenovacion: boolean;
};

export const getPlanes = () => pedir<PlanMembresia[]>('/membresias/planes');

export const getMiSuscripcion = () => pedir<Suscripcion>('/membresias/mi-suscripcion');

/** Crea (o reprograma) la suscripción Destacada PENDIENTE_PAGO del negocio propio. */
export const solicitarDestacada = () =>
  pedir<Suscripcion>('/membresias/suscripciones', { method: 'POST' });

/** Cobro de la suscripción con el mismo pago simulado del pedido (RF-34). */
export const cobrarSuscripcion = (suscripcionId: number, tarjeta: string, claveIdempotencia: string) =>
  pedir<ResultadoPago>('/pagos', {
    method: 'POST',
    headers: { 'Idempotency-Key': claveIdempotencia },
    body: JSON.stringify({ suscripcionId, tarjeta })
  });

// ---------- Reportar reseña (PM-11, RF-39 E1) ----------

export const reportarResena = (resenaId: number, motivo: string) =>
  pedir<Resena>(`/resenas/${resenaId}/reportar`, {
    method: 'POST',
    body: JSON.stringify({ motivo })
  });

// ---------- Panel admin: negocios y revisión (PA-02, RF-07/RF-47) ----------

export type AccionRevisionNegocio =
  | 'APROBAR'
  | 'RECHAZAR'
  | 'SOLICITAR_CORRECCION'
  | 'SUSPENDER'
  | 'REACTIVAR';

export const listarAdminNegocios = (estado?: string) =>
  pedir<Negocio[]>(`/admin/negocios${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`);

export const cambiarEstadoAdminNegocio = (
  id: number,
  accion: AccionRevisionNegocio,
  motivo?: string
) =>
  pedir<Negocio>(`/admin/negocios/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ accion, motivo })
  });

/** Alta asistida: el Administrador elige si el negocio nace en revisión o publicado. */
export type EstadoInicialNegocio = 'PENDIENTE' | 'APROBADO';

export type DatosAltaNegocioAdmin = {
  comercianteId: number;
  nombre: string;
  categoriaId?: number;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  whatsapp?: string;
  estadoInicial: EstadoInicialNegocio;
};

export const crearNegocioAdmin = (datos: DatosAltaNegocioAdmin) =>
  pedir<Negocio>('/admin/negocios', { method: 'POST', body: JSON.stringify(datos) });

// ---------- Panel admin: usuarios (PA-03, RF-43/RF-47) ----------

export type AdminUsuario = {
  id: number;
  email: string;
  nombre: string;
  telefono: string | null;
  rol: Rol;
  activo: boolean;
  cambioClaveObligatorio: boolean;
};

export type FiltrosUsuarios = { rol?: string; activo?: boolean; q?: string };

export const listarAdminUsuarios = (filtros: FiltrosUsuarios = {}) => {
  const parametros = new URLSearchParams();
  if (filtros.rol) parametros.set('rol', filtros.rol);
  if (filtros.activo !== undefined) parametros.set('activo', String(filtros.activo));
  if (filtros.q?.trim()) parametros.set('q', filtros.q.trim());
  const cadena = parametros.toString();
  return pedir<AdminUsuario[]>(`/admin/usuarios${cadena ? `?${cadena}` : ''}`);
};

export const cambiarEstadoUsuario = (id: number, activo: boolean) =>
  pedir<AdminUsuario>(`/admin/usuarios/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ activo })
  });

export const cambiarRolUsuario = (id: number, rol: Rol) =>
  pedir<AdminUsuario>(`/admin/usuarios/${id}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol })
  });

/** La clave temporal se muestra una sola vez (RF-47 E1). */
export type ComercianteCreado = {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  claveTemporal: string;
};

export const crearComercianteAdmin = (datos: { email: string; nombre: string; telefono?: string }) =>
  pedir<ComercianteCreado>('/admin/usuarios/comerciantes', {
    method: 'POST',
    body: JSON.stringify(datos)
  });

// ---------- Panel admin: categorías (PA-04, RF-44) ----------

export const listarAdminCategorias = () => pedir<Categoria[]>('/admin/categorias');

export const crearCategoriaAdmin = (datos: { nombre: string; icono?: string; orden?: number }) =>
  pedir<Categoria>('/admin/categorias', { method: 'POST', body: JSON.stringify(datos) });

export const editarCategoriaAdmin = (
  id: number,
  datos: { nombre: string; icono?: string; orden?: number }
) => pedir<Categoria>(`/admin/categorias/${id}`, { method: 'PUT', body: JSON.stringify(datos) });

export const cambiarEstadoCategoria = (id: number, activa: boolean) =>
  pedir<Categoria>(`/admin/categorias/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ activa })
  });

// ---------- Panel admin: parámetros (PA-05, RF-45) ----------

export type ParametroAdmin = { clave: string; valor: string; descripcion: string | null };

export const listarAdminParametros = () => pedir<ParametroAdmin[]>('/admin/parametros');

export const actualizarParametro = (clave: string, valor: string) =>
  pedir<ParametroAdmin>(`/admin/parametros/${encodeURIComponent(clave)}`, {
    method: 'PUT',
    body: JSON.stringify({ valor })
  });

// ---------- Panel admin: auditoría (PA-07, RF-46) ----------

export type RegistroAuditoria = {
  id: number;
  usuarioId: number | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  motivo: string | null;
  creadoEn: string;
};

export type PaginaAuditoria = {
  contenido: RegistroAuditoria[];
  pagina: number;
  tamano: number;
  total: number;
};

export type FiltrosAuditoria = {
  desde?: string;
  hasta?: string;
  usuarioId?: number;
  entidad?: string;
  pagina?: number;
  tamano?: number;
};

export const listarAuditoria = (filtros: FiltrosAuditoria = {}) => {
  const parametros = new URLSearchParams();
  if (filtros.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.usuarioId !== undefined) parametros.set('usuarioId', String(filtros.usuarioId));
  if (filtros.entidad?.trim()) parametros.set('entidad', filtros.entidad.trim());
  parametros.set('page', String(filtros.pagina ?? 0));
  parametros.set('size', String(filtros.tamano ?? 20));
  return pedir<PaginaAuditoria>(`/admin/auditoria?${parametros.toString()}`);
};

// ---------- Panel admin: reseñas reportadas (PA-06, RF-39) ----------

export const listarAdminResenas = (reportadas: boolean) =>
  pedir<Resena[]>(`/admin/resenas?reportadas=${reportadas}`);

export const cambiarVisibilidadResena = (id: number, visible: boolean) =>
  pedir<Resena>(`/admin/resenas/${id}/visibilidad`, {
    method: 'PATCH',
    body: JSON.stringify({ visible })
  });

/** Mensajes del panel: el backend ya escribe para el usuario final (RNF-01, §6.2). */
export function mensajeDeApi(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.estado === 401) return 'Tu sesión venció. Volvé a ingresar para seguir.';
    return e.message;
  }
  return 'Sin conexión o respuesta lenta. Revisá tu internet e intentá de nuevo.';
}

/** Mensajes del diseño UI §6.2 según código de error. */
export function mensajeAmable(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.estado === 401) return 'El correo o la contraseña no coinciden. Revisá e intentalo de nuevo.';
    if (e.estado === 409) return 'Ese correo ya está en uso. ¿Querés ingresar o recuperar tu contraseña?';
    if (e.estado === 429) return 'Hiciste varios intentos. Esperá unos minutos y volvé a probar.';
    return e.message;
  }
  return 'Sin conexión o respuesta lenta. Revisá tu internet e intentá de nuevo.';
}
