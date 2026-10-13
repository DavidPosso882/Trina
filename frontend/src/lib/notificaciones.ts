import type { Notificacion, Rol } from './api';

/** Destino de una notificación según el rol (RF-32); null si no hay pantalla para ese caso. */
export function rutaDeNotificacion(notificacion: Notificacion, rol: Rol): string | null {
  if (notificacion.entidadId == null) return null;
  if (notificacion.entidadTipo === 'PEDIDO') {
    if (rol === 'CLIENTE') return `/pedidos/${notificacion.entidadId}`;
    if (rol === 'COMERCIANTE') return `/panel/pedidos/${notificacion.entidadId}`;
  }
  if (notificacion.entidadTipo === 'RESERVA') {
    if (rol === 'CLIENTE') return `/reservas/${notificacion.entidadId}`;
    if (rol === 'COMERCIANTE') return `/panel/reservas/${notificacion.entidadId}`;
  }
  if (notificacion.entidadTipo === 'NEGOCIO' && rol === 'COMERCIANTE') return '/panel/negocio';
  return null;
}

/**
 * S5 — clave de icono por tipo de notificación. El render lo resuelve la pantalla con un
 * Heroicon vía `components/Icono`; el texto siempre acompaña al icono (§1.5).
 */
export type ClaveIconoNotificacion = 'pedido' | 'reserva' | 'negocio' | 'aviso';

export function iconoNotificacion(tipo: string): ClaveIconoNotificacion {
  if (tipo.startsWith('PEDIDO')) return 'pedido';
  if (tipo.startsWith('RESERVA')) return 'reserva';
  if (tipo.startsWith('NEGOCIO')) return 'negocio';
  return 'aviso';
}
