import {
  CheckCircleIcon,
  ClockIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { Icono, type IconoSvg } from '../Icono';

/**
 * Estados del negocio con las palabras del comerciante (§6.1 del diseño UI): icono + texto, nunca solo color.
 * S5 — los emojis se reemplazaron por Heroicons equivalentes.
 */
const ESTADOS: Record<string, { texto: string; icono: IconoSvg; clase: string }> = {
  BORRADOR: { texto: 'Sin terminar', icono: PencilSquareIcon, clase: 'bg-advertencia/10 text-advertencia' },
  PENDIENTE: { texto: 'En revisión', icono: ClockIcon, clase: 'bg-info/10 text-info' },
  CORRECCION_SOLICITADA: {
    texto: 'Necesita ajustes',
    icono: WrenchScrewdriverIcon,
    clase: 'bg-acento/10 text-acento'
  },
  RECHAZADO: { texto: 'No aprobado', icono: XCircleIcon, clase: 'bg-error/10 text-error' },
  APROBADO: { texto: 'Publicado', icono: CheckCircleIcon, clase: 'bg-primario-claro text-exito' },
  SUSPENDIDO: {
    texto: 'Oculto temporalmente',
    icono: EyeSlashIcon,
    clase: 'bg-texto-suave/10 text-texto-suave'
  }
};

export function etiquetaEstado(estado: string): string {
  return ESTADOS[estado]?.texto ?? estado;
}

export function EstadoNegocio({ estado, className = '' }: { estado: string; className?: string }) {
  const e = ESTADOS[estado] ?? {
    texto: estado,
    icono: InformationCircleIcon,
    clase: 'bg-texto-suave/10 text-texto-suave'
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-tarjeta px-3 py-1 text-sm font-semibold ${e.clase} ${className}`}
    >
      <Icono icono={e.icono} tamano="chico" />
      {e.texto}
    </span>
  );
}
