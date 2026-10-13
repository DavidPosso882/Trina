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
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <h1 className="font-display text-titulo">Mis reservas</h1>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        <button
          type="button"
          aria-pressed={filtro === ''}
          className={`rounded-campo px-3 py-2 ${filtro === '' ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
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
              className={`inline-flex items-center gap-2 rounded-campo px-3 py-2 ${filtro === estado ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
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
            ? 'No tenés reservas con ese estado.'
            : 'Aún no tenés reservas. ¡Mirá los negocios que reciben reservas!'}
        </Vacio>
      )}
      {reservas.data && reservas.data.length > 0 && (
        <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
          {reservas.data.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{r.negocio}</p>
                <EtiquetaReserva estado={r.estado} />
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <dt className="text-xs text-texto-suave">
                    {r.tipoReserva === 'ALOJAMIENTO' ? 'Entrada' : 'Fecha'}
                  </dt>
                  <dd className="text-sm font-semibold">{fecha(r.inicio)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-texto-suave">
                    {r.tipoReserva === 'ALOJAMIENTO' ? 'Salida' : 'Horario'}
                  </dt>
                  <dd className="text-sm font-semibold">
                    {r.tipoReserva === 'FRANJA' ? `${hora(r.inicio)} a ${hora(r.fin)}` : fecha(r.fin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-texto-suave">Personas</dt>
                  <dd className="text-sm font-semibold">{r.personas}</dd>
                </div>
              </dl>
              <Link to={`/reservas/${r.id}`} className="mt-2 inline-block font-semibold text-primario">
                Ver detalle →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
