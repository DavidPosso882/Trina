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
      <h1 className="font-display text-titulo">Mis pedidos</h1>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        <button
          type="button"
          aria-pressed={filtro === ''}
          className={`rounded-campo px-3 py-2 ${filtro === '' ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
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
              className={`inline-flex items-center gap-2 rounded-campo px-3 py-2 ${filtro === estado ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
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
            ? 'No tenés pedidos con ese estado.'
            : 'Aún no tenés pedidos. ¡Explorá los negocios y hacé el primero!'}
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
