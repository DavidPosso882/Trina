/** Estados con palabras del usuario (diseño UI §6.1) para pedidos y reservas. */

/**
 * S5 — clave de icono del estado. Las palabras y clases viven acá; el render lo resuelve
 * cada pantalla con un Heroicon vía `components/Icono`.
 */
export type ClaveIconoEstado =
  | 'tarjeta'
  | 'reloj'
  | 'fuego'
  | 'check'
  | 'insignia'
  | 'alerta'
  | 'prohibido'
  | 'campana'
  | 'info';

export type EstadoInfo = { texto: string; icono: ClaveIconoEstado; clase: string };

const NEUTRO = 'bg-texto/10 text-texto-suave';

const PEDIDOS: Record<string, EstadoInfo> = {
  PENDIENTE_PAGO: { texto: 'Falta pagar', icono: 'tarjeta', clase: 'bg-advertencia/10 text-advertencia' },
  PENDIENTE: { texto: 'Esperando al negocio', icono: 'reloj', clase: 'bg-info/10 text-info' },
  EN_PREPARACION: { texto: 'Lo están preparando', icono: 'fuego', clase: 'bg-info/10 text-info' },
  LISTO: { texto: 'Listo para recoger', icono: 'check', clase: 'bg-primario-claro text-exito' },
  COMPLETADO: { texto: 'Entregado', icono: 'insignia', clase: 'bg-primario-claro text-exito' },
  RECHAZADO: { texto: 'El negocio no pudo atenderlo', icono: 'alerta', clase: 'bg-error/10 text-error' },
  CANCELADO: { texto: 'Cancelado', icono: 'prohibido', clase: NEUTRO }
};

const RESERVAS: Record<string, EstadoInfo> = {
  PENDIENTE_CONFIRMACION: {
    texto: 'Esperando confirmación',
    icono: 'reloj',
    clase: 'bg-info/10 text-info'
  },
  CONFIRMADA: { texto: 'Reserva confirmada', icono: 'check', clase: 'bg-primario-claro text-exito' },
  RECHAZADA: { texto: 'No hubo disponibilidad', icono: 'alerta', clase: 'bg-error/10 text-error' },
  CANCELADA: { texto: 'Cancelada', icono: 'prohibido', clase: NEUTRO },
  COMPLETADA: { texto: 'Realizada', icono: 'insignia', clase: 'bg-primario-claro text-exito' }
};

/** Estados que el cliente puede filtrar en Mis pedidos (orden del flujo §3.3). */
export const FILTROS_PEDIDO = [
  'PENDIENTE_PAGO',
  'PENDIENTE',
  'EN_PREPARACION',
  'LISTO',
  'COMPLETADO',
  'RECHAZADO',
  'CANCELADO'
] as const;

/** Estados que el cliente puede filtrar en Mis reservas (orden del flujo §3.4). */
export const FILTROS_RESERVA = [
  'PENDIENTE_CONFIRMACION',
  'CONFIRMADA',
  'RECHAZADA',
  'CANCELADA',
  'COMPLETADA'
] as const;

export function estadoPedido(estado: string): EstadoInfo {
  return PEDIDOS[estado] ?? { texto: estado, icono: 'info', clase: 'bg-info/10 text-info' };
}

export function estadoReserva(estado: string): EstadoInfo {
  return RESERVAS[estado] ?? { texto: estado, icono: 'info', clase: 'bg-info/10 text-info' };
}

// ---------- Palabras del comerciante (diseño UI §6.1, columna derecha) ----------

const PEDIDOS_COMERCIO: Record<string, EstadoInfo> = {
  PENDIENTE_PAGO: { texto: 'Esperando el pago', icono: 'tarjeta', clase: 'bg-advertencia/10 text-advertencia' },
  PENDIENTE: { texto: 'Nuevo pedido', icono: 'campana', clase: 'bg-acento/10 text-acento' },
  EN_PREPARACION: { texto: 'En preparación', icono: 'fuego', clase: 'bg-info/10 text-info' },
  LISTO: { texto: 'Listo para entregar', icono: 'check', clase: 'bg-primario-claro text-exito' },
  COMPLETADO: { texto: 'Entregado', icono: 'insignia', clase: 'bg-primario-claro text-exito' },
  RECHAZADO: { texto: 'Rechazado', icono: 'alerta', clase: 'bg-error/10 text-error' },
  CANCELADO: { texto: 'Cancelado', icono: 'prohibido', clase: NEUTRO }
};

const RESERVAS_COMERCIO: Record<string, EstadoInfo> = {
  PENDIENTE_CONFIRMACION: {
    texto: 'Reserva por confirmar',
    icono: 'campana',
    clase: 'bg-acento/10 text-acento'
  },
  CONFIRMADA: { texto: 'Confirmada', icono: 'check', clase: 'bg-primario-claro text-exito' },
  RECHAZADA: { texto: 'Rechazada', icono: 'alerta', clase: 'bg-error/10 text-error' },
  CANCELADA: { texto: 'Cancelada', icono: 'prohibido', clase: NEUTRO },
  COMPLETADA: { texto: 'Realizada', icono: 'insignia', clase: 'bg-primario-claro text-exito' }
};

export function estadoPedidoComercio(estado: string): EstadoInfo {
  return PEDIDOS_COMERCIO[estado] ?? estadoPedido(estado);
}

export function estadoReservaComercio(estado: string): EstadoInfo {
  return RESERVAS_COMERCIO[estado] ?? estadoReserva(estado);
}

/** Acción con verbo claro para el comerciante; `motivo` pide diálogo con motivo obligatorio. */
export type AccionComercio = {
  accion: string;
  texto: string;
  /** S5 — clave de icono; la pantalla la resuelve con `components/Icono`. */
  icono: ClaveIconoEstado;
  peligro?: boolean;
  motivo?: boolean;
  /** Aviso de reembolso para pedidos pagados con pago de prueba (RF-27 E2). */
  avisoReembolso?: string;
};

/** Acciones del comerciante sobre un pedido según su estado (RF-27, flujo §3.5). */
export function accionesPedidoComercio(estado: string): AccionComercio[] {
  switch (estado) {
    case 'PENDIENTE':
      return [
        { accion: 'ACEPTAR', texto: 'Aceptar pedido', icono: 'check' },
        { accion: 'RECHAZAR', texto: 'Rechazar pedido', icono: 'prohibido', peligro: true, motivo: true }
      ];
    case 'EN_PREPARACION':
      return [
        { accion: 'MARCAR_LISTO', texto: 'Marcar listo para entregar', icono: 'check' },
        { accion: 'CANCELAR', texto: 'Cancelar pedido', icono: 'prohibido', peligro: true, motivo: true }
      ];
    case 'LISTO':
      return [{ accion: 'COMPLETAR', texto: 'Marcar entregado', icono: 'insignia' }];
    default:
      return [];
  }
}

/** Acciones del comerciante sobre una reserva según su estado (RF-27, flujo §3.4). */
export function accionesReservaComercio(estado: string): AccionComercio[] {
  switch (estado) {
    case 'PENDIENTE_CONFIRMACION':
      return [
        { accion: 'CONFIRMAR', texto: 'Confirmar reserva', icono: 'check' },
        { accion: 'RECHAZAR', texto: 'Rechazar reserva', icono: 'prohibido', peligro: true, motivo: true }
      ];
    case 'CONFIRMADA':
      return [
        { accion: 'COMPLETAR', texto: 'Marcar realizada', icono: 'insignia' },
        { accion: 'CANCELAR', texto: 'Cancelar reserva', icono: 'prohibido', peligro: true, motivo: true }
      ];
    default:
      return [];
  }
}

/** Palabras del usuario para el estado de la membresía (RF-35). */
export function estadoMembresia(estado: string | null): EstadoInfo {
  switch (estado) {
    case 'ACTIVA':
      return { texto: 'Activa', icono: 'check', clase: 'bg-primario-claro text-exito' };
    case 'PENDIENTE_PAGO':
      return { texto: 'Falta pagar', icono: 'tarjeta', clase: 'bg-advertencia/10 text-advertencia' };
    case 'VENCIDA':
      return { texto: 'Vencida', icono: 'reloj', clase: 'bg-error/10 text-error' };
    case 'CANCELADA':
      return { texto: 'Cancelada', icono: 'prohibido', clase: NEUTRO };
    default:
      return { texto: 'Sin suscripción', icono: 'info', clase: 'bg-info/10 text-info' };
  }
}

/** §5.1: el cliente cancela mientras el pedido sigue PENDIENTE o PENDIENTE_PAGO. */
export const puedeCancelarPedido = (estado: string): boolean =>
  estado === 'PENDIENTE' || estado === 'PENDIENTE_PAGO';

export const puedePagarPedido = (estado: string): boolean => estado === 'PENDIENTE_PAGO';

/** §5.1: el cliente cancela reservas pendientes o confirmadas. */
export const puedeCancelarReserva = (estado: string): boolean =>
  estado === 'PENDIENTE_CONFIRMACION' || estado === 'CONFIRMADA';

/** Camino del pedido para el seguimiento visual (sin contar rechazo ni cancelación). */
export const CAMINO_PEDIDO = [
  'PENDIENTE_PAGO',
  'PENDIENTE',
  'EN_PREPARACION',
  'LISTO',
  'COMPLETADO'
] as const;

/** Posición del estado dentro del camino; -1 si el pedido salió del flujo (rechazado/cancelado). */
export function pasoDePedido(estado: string): number {
  return CAMINO_PEDIDO.indexOf(estado as (typeof CAMINO_PEDIDO)[number]);
}
