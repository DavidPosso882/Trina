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
import { TituloAtras } from '../components/TituloAtras';

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

  const capsulaFiltro = (activa: boolean) =>
    `inline-flex min-h-[44px] items-center rounded-full px-5 text-sm font-semibold transition ${
      activa ? 'bg-[#1A2218] text-white shadow' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="bg-[#F8F9FA]">
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TituloAtras titulo="Notificaciones" />
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1A2218] transition hover:bg-gray-50 disabled:opacity-50"
            disabled={sinLeer === 0 || todas.isPending}
            onClick={leerTodas}
          >
            <Icono icono={CheckIcon} tamano="chico" /> Marcar todas como leídas
          </button>
        </div>

        <div className="mt-4 flex gap-2" role="group" aria-label="Filtrar notificaciones">
          <button
            type="button"
            aria-pressed={!soloNoLeidas}
            className={capsulaFiltro(!soloNoLeidas)}
            onClick={() => setSoloNoLeidas(false)}
          >
            Todas
          </button>
          <button
            type="button"
            aria-pressed={soloNoLeidas}
            className={capsulaFiltro(soloNoLeidas)}
            onClick={() => setSoloNoLeidas(true)}
          >
            Sin leer{sinLeer > 0 ? ` (${sinLeer})` : ''}
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
          <Vacio>{soloNoLeidas ? 'No tienes notificaciones sin leer.' : 'Todavía no tienes notificaciones.'}</Vacio>
        )}
        {visibles.length > 0 && (
          <ul className="mt-4 space-y-3">
            {visibles.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => abrir(n)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0FDF4] text-[#1A2218]"
                  >
                    <Icono icono={ICONOS[iconoNotificacion(n.tipo)]} tamano="grande" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#1A2218]">{n.mensaje}</span>
                    <span className="mt-1 block text-xs font-medium text-gray-400">
                      {fechaHora(n.creadoEn)}
                    </span>
                  </span>
                  {!n.leida && (
                    <span className="shrink-0 rounded-full bg-[#94B839]/20 px-2.5 py-1 text-xs font-bold text-[#1A2218]">
                      Nueva
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
