import type { ReactNode } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Icono } from './Icono';

/** Cargando con la forma del contenido (§5.4): nunca una pantalla en blanco. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p
      role="status"
      className="mt-6 flex animate-pulse items-center gap-2 rounded-tarjeta bg-superficie p-4 text-texto-suave"
    >
      <Icono icono={ArrowPathIcon} />
      {texto}
    </p>
  );
}

/** Error que dice qué pasó y ofrece reintento (§5.4). */
export function ErrorRecargar({
  mensaje,
  onReintentar,
  textoBoton = 'Intentar de nuevo'
}: {
  mensaje: string;
  onReintentar: () => void;
  textoBoton?: string;
}) {
  return (
    <div className="mt-6">
      <p role="alert" className="flex items-start gap-2 rounded-campo bg-error/10 p-3 text-error">
        <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
        <span>{mensaje}</span>
      </p>
      <button
        type="button"
        className="btn-secundario mt-3 inline-flex items-center gap-2 px-4 py-2"
        onClick={onReintentar}
      >
        <Icono icono={ArrowPathIcon} />
        {textoBoton}
      </button>
    </div>
  );
}

/** Estado vacío con la siguiente acción sugerida (§5.4). */
export function Vacio({ children }: { children: ReactNode }) {
  return <p className="mt-6 rounded-tarjeta bg-superficie p-4 text-texto-suave shadow">{children}</p>;
}
