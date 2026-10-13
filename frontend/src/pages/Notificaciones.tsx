import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CheckIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import {
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  mensajeDeApi,
  type Notificacion
} from '../lib/api';
import { useSesion } from '../lib/auth';
import { fechaHora } from '../lib/formato';
import {
  iconoNotificacion,
  rutaDeNotificacion,
  type ClaveIconoNotificacion
} from '../lib/notificaciones';
import { Aviso } from '../components/negocio/Aviso';
import { Icono, type IconoSvg } from '../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';

// S5 — mismo criterio de iconos que la campana del header (Campana.tsx).
const ICONOS: Record<ClaveIconoNotificacion, IconoSvg> = {
  pedido: ShoppingBagIcon,
  reserva: CalendarDaysIcon,
  negocio: BuildingStorefrontIcon,
  aviso: BellIcon
};

/** PC-07 Notificaciones: lista completa, marcar leídas y acceso al detalle (RF-32). */
export default function Notificaciones() {
  const { sesion } = useSesion();
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lista = useQuery({ queryKey: ['notificaciones', 'pagina'], queryFn: () => getNotificaciones() });

  const marcar = useMutation({
    mutationFn: marcarNotificacionLeida,
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['notificaciones'] })
  });
  const todas = useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['notificaciones'] })
  });

  const sinLeer = lista.data?.filter((n) => !n.leida).length ?? 0;
  const visibles = (lista.data ?? []).filter((n) => (soloNoLeidas ? !n.leida : true));

  const abrir = async (n: Notificacion) => {
    setError(null);
    try {
      if (!n.leida) await marcar.mutateAsync(n.id);
      const ruta = sesion ? rutaDeNotificacion(n, sesion.rol) : null;
      if (ruta) navegar(ruta);
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  const leerTodas = async () => {
    setError(null);
    try {
      await todas.mutateAsync();
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-titulo">Notificaciones</h1>
        <button
          type="button"
          className="btn-secundario inline-flex items-center gap-2 px-4 py-2"
          disabled={sinLeer === 0 || todas.isPending}
          onClick={leerTodas}
        >
          <Icono icono={CheckIcon} tamano="chico" /> Marcar todas como leídas
        </button>
      </div>

      <div className="mt-3 flex gap-2" aria-label="Filtrar notificaciones">
        <button
          type="button"
          aria-pressed={!soloNoLeidas}
          className={`rounded-campo px-3 py-2 ${!soloNoLeidas ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => setSoloNoLeidas(false)}
        >
          Todas
        </button>
        <button
          type="button"
          aria-pressed={soloNoLeidas}
          className={`rounded-campo px-3 py-2 ${soloNoLeidas ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => setSoloNoLeidas(true)}
        >
          Sin leer {sinLeer > 0 ? `(${sinLeer})` : ''}
        </button>
      </div>

      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}
      {lista.isLoading && <Cargando texto="Cargando tus notificaciones…" />}
      {lista.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(lista.error)} onReintentar={() => lista.refetch()} />
      )}
      {lista.data && visibles.length === 0 && (
        <Vacio>{soloNoLeidas ? 'No tenés notificaciones sin leer.' : 'Todavía no tenés notificaciones.'}</Vacio>
      )}
      {visibles.length > 0 && (
        <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
          {visibles.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`flex w-full items-start gap-3 py-4 text-left ${n.leida ? '' : 'bg-primario-claro'}`}
                onClick={() => abrir(n)}
              >
                <Icono icono={ICONOS[iconoNotificacion(n.tipo)]} tamano="grande" />
                <span className="flex-1">
                  <span className={n.leida ? 'block' : 'block font-semibold'}>{n.mensaje}</span>
                  <span className="mt-1 block text-sm text-texto-suave">{fechaHora(n.creadoEn)}</span>
                </span>
                {!n.leida && (
                  <span className="rounded-campo bg-acento px-2 py-0.5 text-xs font-bold text-white">Nueva</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
