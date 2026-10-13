import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, mensajeDeApi, miNegocio, type Negocio } from '../../lib/api';
import { Aviso } from './Aviso';
import { SinNegocioPanel } from './SinNegocioPanel';

/**
 * Carga mi-negocio (PM-03/04/05) y delega la pantalla. Cubre cargando, sin negocio (404) y error.
 * Usa la misma queryKey que invalidan las mutaciones para mantener los datos frescos.
 */
export function ConNegocio({ children }: { children: (negocio: Negocio) => ReactNode }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['mi-negocio'],
    queryFn: miNegocio,
    retry: false
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <p role="status">Cargando tu negocio…</p>
      </main>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.estado === 404) return <SinNegocioPanel />;
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Aviso tipo="error">{mensajeDeApi(error)}</Aviso>
        <button type="button" className="btn-secundario mt-3 px-4 py-2" onClick={() => refetch()}>
          Intentar de nuevo
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <p role="status">Cargando tu negocio…</p>
      </main>
    );
  }

  return <>{children(data)}</>;
}
