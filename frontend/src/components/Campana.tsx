import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  getContadorNotificaciones,
  getNotificaciones,
  marcarNotificacionLeida,
  type Notificacion
} from '../lib/api';
import { useSesion } from '../lib/auth';
import { fechaHora } from '../lib/formato';
import { rutaDeNotificacion } from '../lib/notificaciones';
import {
  ArrowPathIcon,
  BellIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { Icono, type IconoSvg } from './Icono';

/** S5 — mismo criterio de tipo que lib/notificaciones, con Heroicons en vez de emoji. */
function iconoDeNotificacion(tipo: string): IconoSvg {
  if (tipo.startsWith('PEDIDO')) return ShoppingBagIcon;
  if (tipo.startsWith('RESERVA')) return CalendarDaysIcon;
  if (tipo.startsWith('NEGOCIO')) return BuildingStorefrontIcon;
  return BellIcon;
}

/** Campana del header (RF-32): contador cada 30 s, lista y marcado de leídas. */
export function Campana() {
  const { sesion } = useSesion();
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  const puedeVer = Boolean(sesion && sesion.rol !== 'ADMINISTRADOR');
  const contador = useQuery({
    queryKey: ['notificaciones', 'contador'],
    queryFn: getContadorNotificaciones,
    enabled: puedeVer,
    refetchInterval: 30_000
  });
  const lista = useQuery({
    queryKey: ['notificaciones', 'campana'],
    queryFn: () => getNotificaciones(),
    enabled: puedeVer && abierta
  });
  const marcar = useMutation({
    mutationFn: marcarNotificacionLeida,
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['notificaciones'] })
  });

  useEffect(() => {
    if (!abierta) return;
    const alTocar = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierta(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(false);
    };
    document.addEventListener('mousedown', alTocar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alTocar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierta]);

  if (!puedeVer || !sesion) return null;

  const noLeidas = contador.data?.noLeidas ?? 0;
  const recientes = (lista.data ?? []).slice(0, 5);

  const abrirNotificacion = (n: Notificacion) => {
    if (!n.leida) marcar.mutate(n.id);
    const ruta = rutaDeNotificacion(n, sesion.rol);
    setAbierta(false);
    if (ruta) navegar(ruta);
  };

  return (
    <div className="relative" ref={caja}>
      <button
        type="button"
        className="relative rounded-campo px-2 py-2 text-xl"
        aria-expanded={abierta}
        aria-haspopup="true"
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
        onClick={() => setAbierta((v) => !v)}
      >
        <Icono icono={BellIcon} tamano="grande" />
        {noLeidas > 0 && (
          <span
            className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-acento px-1 text-xs font-bold text-white"
            aria-hidden="true"
          >
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-tarjeta border bg-superficie p-3 shadow-lg">
          <p className="font-bold">Notificaciones</p>
          {lista.isLoading && (
            <p role="status" className="mt-2 flex items-center gap-2 text-sm text-texto-suave">
              <Icono icono={ArrowPathIcon} tamano="chico" className="animate-pulse" />
              Cargando…
            </p>
          )}
          {lista.isError && (
            <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>No se pudieron cargar. Probá de nuevo en un momento.</span>
            </p>
          )}
          {lista.data && recientes.length === 0 && (
            <p className="mt-2 text-sm text-texto-suave">No tenés notificaciones todavía.</p>
          )}
          <ul className="mt-2 divide-y">
            {recientes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 py-2 text-left"
                  onClick={() => abrirNotificacion(n)}
                >
                  <Icono icono={iconoDeNotificacion(n.tipo)} />
                  <span className="flex-1">
                    <span className={n.leida ? 'block text-sm text-texto-suave' : 'block text-sm font-semibold'}>
                      {n.mensaje}
                    </span>
                    <span className="text-xs text-texto-suave">{fechaHora(n.creadoEn)}</span>
                  </span>
                  {!n.leida && <span className="mt-1 h-2 w-2 rounded-full bg-acento" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          <Link
            to="/notificaciones"
            className="mt-2 block py-2 text-center font-semibold text-primario"
            onClick={() => setAbierta(false)}
          >
            Ver todas →
          </Link>
        </div>
      )}
    </div>
  );
}
