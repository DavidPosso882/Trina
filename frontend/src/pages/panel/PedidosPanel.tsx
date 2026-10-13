import { Link, useSearchParams } from 'react-router-dom';
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
import { listarPedidos, mensajeDeApi } from '../../lib/api';
import { estadoPedidoComercio, FILTROS_PEDIDO, type ClaveIconoEstado } from '../../lib/estados';
import { fechaHora, precio } from '../../lib/formato';
import { EtiquetaPedidoComercio } from '../../components/EstadoEtiqueta';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

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

/** PM-07 Pedidos: lista de pedidos del negocio con filtro por estado (RF-27). */
export default function PedidosPanel() {
  const [parametros, setParametros] = useSearchParams();
  const filtro = parametros.get('estado') ?? '';
  const pedidos = useQuery({
    queryKey: ['pedidos', filtro],
    queryFn: () => listarPedidos(filtro || undefined)
  });

  const cambiarFiltro = (estado: string) => {
    if (estado) setParametros({ estado });
    else setParametros({});
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Pedidos</h1>
      <p className="mt-1 text-texto-suave">Aceptá, rechazá o marcá como listo cada pedido.</p>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        <button
          type="button"
          aria-pressed={filtro === ''}
          className={`rounded-campo px-3 py-2 ${filtro === '' ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => cambiarFiltro('')}
        >
          Todos
        </button>
        {FILTROS_PEDIDO.map((estado) => {
          const info = estadoPedidoComercio(estado);
          return (
            <button
              key={estado}
              type="button"
              aria-pressed={filtro === estado}
              className={`inline-flex items-center gap-2 rounded-campo px-3 py-2 ${filtro === estado ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
              onClick={() => cambiarFiltro(estado)}
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
            : 'Todavía no tenés pedidos. Cuando un cliente compre, aparece acá.'}
        </Vacio>
      )}
      {pedidos.data && pedidos.data.length > 0 && (
        <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
          {pedidos.data.map((p) => (
            <li key={p.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">Pedido #{p.id}</p>
                <EtiquetaPedidoComercio estado={p.estado} />
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <dt className="text-xs text-texto-suave">Productos</dt>
                  <dd className="text-sm font-semibold">
                    {p.items.length} producto{p.items.length === 1 ? '' : 's'}
                  </dd>
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
              <Link to={`/panel/pedidos/${p.id}`} className="mt-2 inline-block font-semibold text-primario">
                Ver y atender →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
