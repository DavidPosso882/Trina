import type { ReactNode } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Icono, type IconoSvg } from '../Icono';

type Tipo = 'error' | 'exito' | 'info';

const ESTILOS: Record<Tipo, { icono: IconoSvg; clase: string }> = {
  error: { icono: ExclamationTriangleIcon, clase: 'bg-error/10 text-error' },
  exito: { icono: CheckCircleIcon, clase: 'bg-primario-claro text-exito' },
  info: { icono: InformationCircleIcon, clase: 'bg-info/10 text-info' }
};

/** Aviso del panel con icono + texto; los errores se anuncian solos (§7 Accesibilidad). */
export function Aviso({ tipo, children }: { tipo: Tipo; children: ReactNode }) {
  const estilo = ESTILOS[tipo];
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      aria-live={tipo === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-2 rounded-campo p-3 ${estilo.clase}`}
    >
      <Icono icono={estilo.icono} className="mt-0.5" />
      <span className="flex-1">{children}</span>
    </div>
  );
}
