import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BuildingStorefrontIcon,
  CheckIcon,
  CreditCardIcon,
  NoSymbolIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { cancelarPedido, getPedido, mensajeDeApi } from '../lib/api';
import { CAMINO_PEDIDO, estadoPedido, pasoDePedido, puedeCancelarPedido, puedePagarPedido } from '../lib/estados';
import { fechaHora, precio } from '../lib/formato';
import { Aviso } from '../components/negocio/Aviso';
import { Dialogo } from '../components/Dialogo';
import { EtiquetaPedido } from '../components/EstadoEtiqueta';
import { FormularioPago } from '../components/FormularioPago';
import { Icono } from '../components/Icono';
import { Cargando, ErrorRecargar } from '../components/Estados';

/** Detalle de un pedido del cliente con seguimiento, pago pendiente y cancelación (RF-31). */
export default function DetallePedido() {
  const { id: idTexto } = useParams<{ id: string }>();
  const id = Number(idTexto);
  const ubicacion = useLocation();
  const mensajeInicial = (ubicacion.state as { mensaje?: string } | null)?.mensaje;
  const cliente = useQueryClient();
  const [dialogo, setDialogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const pedido = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => getPedido(id),
    enabled: Number.isFinite(id)
  });

  if (pedido.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <Cargando texto="Cargando el pedido…" />
      </main>
    );
  }
  if (pedido.isError || !pedido.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(pedido.error)} onReintentar={() => pedido.refetch()} />
        <Link to="/pedidos" className="mt-3 inline-block font-semibold text-primario">
          Volver a Mis pedidos
        </Link>
      </main>
    );
  }

  const p = pedido.data;
  const paso = pasoDePedido(p.estado);
  const esPagoSandbox = p.metodoPago === 'SANDBOX';

  const cancelar = async () => {
    setError(null);
    setCancelando(true);
    try {
      await cancelarPedido(p.id);
      setDialogo(false);
      await cliente.invalidateQueries({ queryKey: ['pedido', p.id] });
      await cliente.invalidateQueries({ queryKey: ['pedidos'] });
    } catch (e) {
      setError(mensajeDeApi(e));
      setDialogo(false);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <Link to="/pedidos" className="text-sm font-semibold text-primario">
        ← Mis pedidos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-titulo">Pedido #{p.id}</h1>
        <EtiquetaPedido estado={p.estado} />
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <dt className="text-xs text-texto-suave">Negocio</dt>
          <dd className="text-sm font-semibold">{p.negocio}</dd>
        </div>
        <div>
          <dt className="text-xs text-texto-suave">Fecha</dt>
          <dd className="text-sm font-semibold">{fechaHora(p.creadoEn)}</dd>
        </div>
      </dl>

      {mensajeInicial && (
        <div className="mt-3">
          <Aviso tipo="exito">{mensajeInicial}</Aviso>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      {paso >= 0 ? (
        <ol className="mt-4 divide-y divide-tinta-cafe/10 border-b border-t border-tinta-cafe/10">
          {CAMINO_PEDIDO.map((estado, indice) => {
            const info = estadoPedido(estado);
            const hecho = indice <= paso;
            return (
              <li key={estado} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    hecho ? 'bg-primario text-white' : 'bg-texto/10 text-texto-suave'
                  }`}
                  aria-hidden="true"
                >
                  {hecho ? <Icono icono={CheckIcon} tamano="chico" /> : indice + 1}
                </span>
                <span className={hecho ? 'font-semibold' : 'text-texto-suave'}>
                  {info.texto}
                  {estado === p.estado && <span className="sr-only"> (estado actual)</span>}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-4">
          {p.motivo && <Aviso tipo="info">Motivo: {p.motivo}</Aviso>}
        </div>
      )}

      <section
        className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
        aria-label="Productos del pedido"
      >
        <h2 className="text-seccion">Productos</h2>
        <ul className="mt-2 divide-y divide-tinta-cafe/10">
          {p.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.cantidad} × {item.nombre}
              </span>
              <span className="font-semibold">{precio(item.precioUnitarioCop * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-baseline justify-between border-t border-tinta-cafe/10 pt-2">
          <span className="font-semibold">Total</span>
          <span className="font-display text-cifra-menor leading-none">{precio(p.totalCop)}</span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-texto-suave">
          <Icono icono={esPagoSandbox ? CreditCardIcon : BuildingStorefrontIcon} tamano="chico" />
          {esPagoSandbox ? 'Pagás ahora (prueba)' : 'Pagás en el local'}
        </p>
        {p.nota && (
          <p className="mt-2 flex items-start gap-2 text-texto-suave">
            <Icono icono={PencilSquareIcon} tamano="chico" className="mt-0.5" />
            <span>Nota: {p.nota}</span>
          </p>
        )}
      </section>

      {puedePagarPedido(p.estado) && (
        <>
          <FormularioPago
            pedidoId={p.id}
            montoCop={p.totalCop}
            onAprobado={async () => {
              await cliente.invalidateQueries({ queryKey: ['pedido', p.id] });
              await cliente.invalidateQueries({ queryKey: ['pedidos'] });
            }}
          />
          <p className="mt-2 text-texto-suave">
            El pedido se cancela solo si no completás el pago en 30 minutos.
          </p>
        </>
      )}

      {puedeCancelarPedido(p.estado) && (
        <button
          type="button"
          className="btn-peligro mt-4 inline-flex items-center justify-center gap-2 px-6 py-3"
          onClick={() => setDialogo(true)}
        >
          <Icono icono={NoSymbolIcon} tamano="chico" /> Cancelar pedido
        </button>
      )}

      <Dialogo abierto={dialogo} titulo="¿Cancelar el pedido?" onCerrar={() => setDialogo(false)}>
        <p>
          El pedido #{p.id} en {p.negocio} va a quedar cancelado.
          {p.metodoPago === 'SANDBOX' && ' Si ya lo habías pagado, se devuelve el pago de prueba.'}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-peligro px-4 py-3" disabled={cancelando} onClick={cancelar}>
            {cancelando ? 'Cancelando…' : 'Sí, cancelar pedido'}
          </button>
          <button type="button" className="btn-secundario px-4 py-3" onClick={() => setDialogo(false)}>
            Volver
          </button>
        </div>
      </Dialogo>
    </main>
  );
}
