import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InformationCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';
import {
  estadoPedido,
  estadoPedidoComercio,
  estadoReserva,
  estadoReservaComercio,
  type EstadoInfo
} from '../lib/estados';
import { Icono, type IconoSvg } from './Icono';

/**
 * S5 — iconos por estado. Las palabras y clases siguen viniendo de lib/estados (fuera de T1);
 * acá se reemplaza el emoji por su Heroicon equivalente.
 */
const ICONOS: Record<string, IconoSvg> = {
  PENDIENTE_PAGO: CreditCardIcon,
  PENDIENTE: ClockIcon,
  EN_PREPARACION: FireIcon,
  LISTO: CheckCircleIcon,
  COMPLETADO: CheckBadgeIcon,
  RECHAZADO: ExclamationTriangleIcon,
  CANCELADO: NoSymbolIcon,
  PENDIENTE_CONFIRMACION: ClockIcon,
  CONFIRMADA: CheckCircleIcon,
  RECHAZADA: ExclamationTriangleIcon,
  CANCELADA: NoSymbolIcon,
  COMPLETADA: CheckBadgeIcon
};

function Etiqueta({ estado, info }: { estado: string; info: EstadoInfo }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-campo px-2 py-1 text-sm font-semibold ${info.clase}`}
    >
      <Icono icono={ICONOS[estado] ?? InformationCircleIcon} tamano="chico" />
      {info.texto}
    </span>
  );
}

/** Etiqueta de estado con icono, texto y color: nunca solo color (§1.10). */
export function EtiquetaPedido({ estado }: { estado: string }) {
  return <Etiqueta estado={estado} info={estadoPedido(estado)} />;
}

export function EtiquetaReserva({ estado }: { estado: string }) {
  return <Etiqueta estado={estado} info={estadoReserva(estado)} />;
}

/** Mismas etiquetas con las palabras del comerciante (§6.1). */
export function EtiquetaPedidoComercio({ estado }: { estado: string }) {
  return <Etiqueta estado={estado} info={estadoPedidoComercio(estado)} />;
}

export function EtiquetaReservaComercio({ estado }: { estado: string }) {
  return <Etiqueta estado={estado} info={estadoReservaComercio(estado)} />;
}
