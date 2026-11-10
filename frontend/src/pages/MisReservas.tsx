import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';
import { listarReservas, mensajeDeApi } from '../lib/api';
import { estadoReserva, FILTROS_RESERVA, type ClaveIconoEstado } from '../lib/estados';
import { fecha, hora } from '../lib/formato';
import { EtiquetaReserva } from '../components/EstadoEtiqueta';
import { Icono, type IconoSvg } from '../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';
import { TituloAtras } from '../components/TituloAtras';

// S5 — la página resuelve las claves de icono de lib/estados con Heroicons.
const ICONOS: Partial<Record<ClaveIconoEstado, IconoSvg>> = {
  reloj: ClockIcon,
  check: CheckCircleIcon,
  insignia: CheckBadgeIcon,
  alerta: ExclamationTriangleIcon,
  prohibido: NoSymbolIcon
};

/** PC-05 Mis reservas: historial con filtro por estado (RF-31). */
export default function MisReservas() {
  const [filtro, setFiltro] = useState<string>('');
  const reservas = useQuery({
    queryKey: ['reservas', filtro],
    queryFn: () => listarReservas(filtro || undefined)
  });

  return (
    <main className="mx-auto max-w-4xl xl:max-w-6xl px-4 pb-28 pt-6">
      <TituloAtras titulo="Mis reservas" />

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        <button
          type="button"
          aria-pressed={filtro === ''}
          className={`inline-flex min-h-[44px] items-center rounded-campo px-3 py-1 ${filtro === '' ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => setFiltro('')}
        >
          Todas
        </button>
        {FILTROS_RESERVA.map((estado) => {
          const info = estadoReserva(estado);
          return (
            <button
              key={estado}
              type="button"
              aria-pressed={filtro === estado}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-campo px-3 py-1 ${filtro === estado ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
              onClick={() => setFiltro(estado)}
            >
              <Icono icono={ICONOS[info.icono] ?? InformationCircleIcon} tamano="chico" />
              {info.texto}
            </button>
          );
        })}
      </div>

      {reservas.isLoading && <Cargando texto="Cargando tus reservas…" />}
      {reservas.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(reservas.error)} onReintentar={() => reservas.refetch()} />
      )}
      {reservas.data && reservas.data.length === 0 && (
        <Vacio>
          {filtro
            ? 'No tienes reservas con ese estado.'
            : 'Aún no tienes reservas. ¡Mira los negocios que reciben reservas!'}
        </Vacio>
      )}
      {reservas.data && reservas.data.length > 0 && (
        <ul className="mt-4 grid items-start gap-4">
          {reservas.data.map((r) => (
            <li key={r.id} className="rounded-2xl border border-oliva/10 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 truncate font-display text-lg font-bold leading-snug">{r.negocio}</p>
                <span className="shrink-0"><EtiquetaReserva estado={r.estado} /></span>
              </div>
              <dl className="mt-4 grid grid-cols-2 items-start gap-x-8 gap-y-4 sm:grid-cols-3">
                <div>
                  <dt className="mb-1 text-xs text-texto-suave">
                    {r.tipoReserva === 'ALOJAMIENTO' ? 'Entrada' : 'Fecha'}
                  </dt>
                  <dd className="text-sm font-semibold leading-relaxed">{fecha(r.inicio)}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs text-texto-suave">
                    {r.tipoReserva === 'ALOJAMIENTO' ? 'Salida' : 'Horario'}
                  </dt>
                  <dd className="text-sm font-semibold leading-relaxed">
                    {r.tipoReserva === 'FRANJA' ? `${hora(r.inicio)} a ${hora(r.fin)}` : fecha(r.fin)}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs text-texto-suave">Personas</dt>
                  <dd className="text-sm font-semibold leading-relaxed">{r.personas}</dd>
                </div>
              </dl>
              <Link to={`/reservas/${r.id}`} className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-primario">
                Ver detalle →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
