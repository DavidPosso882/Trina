import type { Negocio } from '../../lib/api';
import { EstadoNegocio } from './EstadoNegocio';
import { NavNegocio } from './NavNegocio';

/** Título + estado + navegación de las pantallas del negocio (PM-03 a PM-05). */
export function EncabezadoNegocio({ negocio, titulo }: { negocio: Negocio; titulo: string }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-titulo">{titulo}</h1>
        <EstadoNegocio estado={negocio.estado} />
      </div>
      <div className="mt-3">
        <NavNegocio />
      </div>
    </>
  );
}
