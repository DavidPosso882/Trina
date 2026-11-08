import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BellIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InformationCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';
import { listarPedidos, mensajeDeApi } from '../lib/api';
import { estadoPedido, FILTROS_PEDIDO, type ClaveIconoEstado } from '../lib/estados';
import { fechaHora, precio } from '../lib/formato';
import { EtiquetaPedido } from '../components/EstadoEtiqueta';
import { Icono, type IconoSvg } from '../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';
import { TituloAtras } from '../components/TituloAtras';

// S5 — la página resuelve las claves de icono de lib/estados con Heroicons.
const ICONOS: Record<ClaveIconoEstado, IconoSvg> = {
  tarjeta: CreditCardIcon,
  reloj: ClockIcon,
  fuego: FireIcon,
  check: CheckCircleIcon,
  insignia: CheckBadgeIcon,
  alerta: ExclamationTriangleIcon,
  prohibido: NoSymbolIcon,
  campana: BellIcon,
  info: InformationCircleIcon
};

/** PC-03 Mis pedidos: historial con filtro por estado (RF-31). */
export default function MisPedidos() {
  const [filtro, setFiltro] = useState<string>('');
  const pedidos = useQuery({
    queryKey: ['pedidos', filtro],
    queryFn: () => listarPedidos(filtro || undefined)
  });

  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <TituloAtras titulo="Mis pedidos" />

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        <button
          type="button"
          aria-pressed={filtro === ''}
          className={`inline-flex min-h-[44px] items-center rounded-campo px-3 py-1 ${filtro === '' ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => setFiltro('')}
        >
          Todos
        </button>
        {FILTROS_PEDIDO.map((estado) => {
          const info = estadoPedido(estado);
          return (
            <button
              key={estado}
              type="button"
              aria-pressed={filtro === estado}
              className={`inline-flex items-center gap-2 inline-flex min-h-[44px] items-center rounded-campo px-3 py-1 ${filtro === estado ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
              onClick={() => setFiltro(estado)}
            >
              <Icono icono={ICONOS[info.icono]} tamano="chico" />
              {info.texto}
            </button>
          );
        })}
      </div>

      {pedidos.isLoading && <Cargando texto="Cargando tus pedidos…" />}
      {pedidos.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(pedidos.error)} onReintentar={() => pedidos.refetch()} />
      )}
      {pedidos.data && pedidos.data.length === 0 && (
        <Vacio>
          {filtro
            ? 'No tienes pedidos con ese estado.'
            : 'Aún no tienes pedidos. ¡Explora los negocios y haz el primero!'}
        </Vacio>
      )}
      {pedidos.data && pedidos.data.length > 0 && (
        <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
          {pedidos.data.map((p) => (
            <li key={p.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{p.negocio}</p>
                <EtiquetaPedido estado={p.estado} />
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <dt className="text-xs text-texto-suave">Pedido</dt>
                  <dd className="text-sm font-semibold">#{p.id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-texto-suave">Fecha</dt>
                  <dd className="text-sm font-semibold">{fechaHora(p.creadoEn)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-texto-suave">Total</dt>
                  <dd className="font-display text-cifra-menor leading-none">{precio(p.totalCop)}</dd>
                </div>
              </dl>
              <Link to={`/pedidos/${p.id}`} className="mt-2 inline-block font-semibold text-primario">
                Ver detalle →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
