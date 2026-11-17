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
import { BotonAtras } from '../components/TituloAtras';

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
  const visibles = lista.data ?? [];

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
    <div className="bg-[#F8F9FA]">
      <main className="animar-admin mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
        <section
          className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md"
          aria-label="Panel de notificaciones"
        >
        <div className="flex items-center gap-2">
          <BotonAtras />
          <div>
          <h1 className="text-2xl font-bold text-[#1A2218]">Notificaciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sinLeer > 0 ? `Tienes ${sinLeer} sin leer.` : 'Estás al día.'}
          </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-[#94B839] px-5 py-2.5 text-sm font-extrabold text-[#1A2218] shadow-sm transition-all hover:bg-[#1A2218] hover:text-white disabled:opacity-50"
            disabled={sinLeer === 0 || todas.isPending}
            onClick={leerTodas}
          >
            <Icono icono={CheckIcon} tamano="chico" /> Marcar todas como leídas
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
          <div className="mt-4">
            <Vacio>Estás al día: no tienes notificaciones.</Vacio>
          </div>
        )}
        {visibles.length > 0 && (
          <div
            className="mt-4 rounded-2xl bg-[#F8F9FA] p-3"
            aria-label="Listado de notificaciones"
          >
          <ul className="flex flex-col gap-3">
            {visibles.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => abrir(n)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
                >
                  <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0FDF4] text-[#1A2218]"
                  >
                    <Icono icono={ICONOS[iconoNotificacion(n.tipo)]} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[#1A2218]">{n.mensaje}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {fechaHora(n.creadoEn)}
                    </span>
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
          </div>
        )}
        </section>
      </main>
    </div>
  );
}
