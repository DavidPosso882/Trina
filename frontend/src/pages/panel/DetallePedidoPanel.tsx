import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CreditCardIcon,
  NoSymbolIcon,
  PencilSquareIcon
} from '@heroicons/react/24/solid';
import { cambiarEstadoPedido, getPedido, mensajeDeApi, type AccionPedido } from '../../lib/api';
import {
  accionesPedidoComercio,
  type AccionComercio,
  type ClaveIconoEstado
} from '../../lib/estados';
import { fechaHora, precio } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { DialogoMotivo } from '../../components/DialogoMotivo';
import { EtiquetaPedidoComercio } from '../../components/EstadoEtiqueta';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar } from '../../components/Estados';

// S5 — la página resuelve las claves de icono de las acciones del comerciante.
const ICONOS_ACCION: Partial<Record<ClaveIconoEstado, IconoSvg>> = {
  check: CheckCircleIcon,
  insignia: CheckBadgeIcon,
  prohibido: NoSymbolIcon
};

const EXITO: Record<string, string> = {
  ACEPTAR: 'Pedido aceptado. El cliente ya sabe que lo estás preparando.',
  RECHAZAR: 'Pedido rechazado. Se avisó al cliente.',
  MARCAR_LISTO: 'Pedido marcado como listo para entregar. Se avisó al cliente.',
  COMPLETAR: 'Pedido marcado como entregado. ¡Gracias!',
  CANCELAR: 'Pedido cancelado. Se avisó al cliente.'
};

/** PM-07 Detalle del pedido: seguimiento y acciones del comerciante con motivo (RF-27). */
export default function DetallePedidoPanel() {
  const { id: idTexto } = useParams<{ id: string }>();
  const id = Number(idTexto);
  const cliente = useQueryClient();
  const [porMotivo, setPorMotivo] = useState<AccionComercio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const pedido = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => getPedido(id),
    enabled: Number.isFinite(id)
  });

  const cambio = useMutation({
    mutationFn: ({ accion, motivo }: { accion: AccionPedido; motivo?: string }) =>
      cambiarEstadoPedido(id, accion, motivo),
    onSuccess: async (_p, variables) => {
      setError(null);
      setAviso(EXITO[variables.accion] ?? 'El pedido quedó actualizado.');
      setPorMotivo(null);
      await cliente.invalidateQueries({ queryKey: ['pedido', id] });
      await cliente.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setPorMotivo(null);
    }
  });

  if (pedido.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Cargando texto="Cargando el pedido…" />
      </main>
    );
  }
  if (pedido.isError || !pedido.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(pedido.error)} onReintentar={() => pedido.refetch()} />
        <Link to="/panel/pedidos" className="mt-3 inline-block font-semibold text-primario">
          Volver a Pedidos
        </Link>
      </main>
    );
  }

  const p = pedido.data;
  const acciones = accionesPedidoComercio(p.estado);
  const esPagoSandbox = p.metodoPago === 'SANDBOX';

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <Link to="/panel/pedidos" className="text-sm font-semibold text-primario">
        ← Pedidos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-titulo">Pedido #{p.id}</h1>
        <EtiquetaPedidoComercio estado={p.estado} />
      </div>
      <p className="mt-1 text-texto-suave">{fechaHora(p.creadoEn)}</p>

      {aviso && (
        <div className="mt-3">
          <Aviso tipo="exito">{aviso}</Aviso>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}
      {p.motivo && (
        <div className="mt-3">
          <Aviso tipo="info">Motivo: {p.motivo}</Aviso>
        </div>
      )}

      <section
        className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
        aria-label="Productos del pedido"
      >
        <h2 className="text-seccion">Productos</h2>
        <ul className="mt-2 divide-y divide-tinta-cafe/10">
          {p.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2">
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
          {esPagoSandbox ? 'Pagó ahora (pago de prueba)' : 'Paga en el local'}
        </p>
        {p.nota && (
          <p className="mt-2 flex items-start gap-2 text-texto-suave">
            <Icono icono={PencilSquareIcon} tamano="chico" className="mt-0.5" />
            <span>Nota del cliente: {p.nota}</span>
          </p>
        )}
      </section>

      {acciones.length === 0 && (
        <div className="mt-4">
          <VacioEstado estado={p.estado} />
        </div>
      )}

      {acciones.length > 0 && (
        <section className="mt-4" aria-label="Acciones del pedido">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {acciones.map((a) =>
              a.motivo ? (
                <button
                  key={a.accion}
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${a.peligro ? 'btn-peligro' : 'btn-principal'}`}
                  disabled={cambio.isPending}
                  onClick={() => {
                    setError(null);
                    setAviso(null);
                    setPorMotivo(a);
                  }}
                >
                  <Icono icono={ICONOS_ACCION[a.icono] ?? CheckCircleIcon} tamano="chico" />
                  {a.texto}
                </button>
              ) : (
                <button
                  key={a.accion}
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${a.peligro ? 'btn-peligro' : 'btn-principal'}`}
                  disabled={cambio.isPending}
                  onClick={() => cambio.mutate({ accion: a.accion as AccionPedido })}
                >
                  <Icono icono={ICONOS_ACCION[a.icono] ?? CheckCircleIcon} tamano="chico" />
                  {cambio.isPending ? 'Guardando…' : a.texto}
                </button>
              )
            )}
          </div>
          {esPagoSandbox && acciones.some((a) => a.motivo) && (
            <p className="mt-2 text-sm text-texto-suave">
              Si rechazás o cancelás un pedido que ya pagó, se devuelve el pago de prueba.
            </p>
          )}
        </section>
      )}

      <DialogoMotivo
        abierto={porMotivo !== null}
        titulo={porMotivo?.accion === 'RECHAZAR' ? '¿Rechazar el pedido?' : '¿Cancelar el pedido?'}
        descripcion={
          `El pedido #${p.id} ${
            porMotivo?.accion === 'RECHAZAR' ? 'va a quedar rechazado' : 'va a quedar cancelado'
          } y se avisa al cliente.` +
          (esPagoSandbox ? ' Como ya lo había pagado, se devuelve el pago de prueba.' : '')
        }
        textoConfirmar={porMotivo?.accion === 'RECHAZAR' ? 'Rechazar pedido' : 'Cancelar pedido'}
        guardando={cambio.isPending}
        error={error}
        onCerrar={() => {
          setPorMotivo(null);
          setError(null);
        }}
        onConfirmar={(motivo) =>
          porMotivo && cambio.mutate({ accion: porMotivo.accion as AccionPedido, motivo })
        }
      />
    </main>
  );
}

/** Qué sigue para los estados que el comerciante ya no puede mover. */
function VacioEstado({ estado }: { estado: string }) {
  const texto =
    estado === 'PENDIENTE_PAGO'
      ? 'Está esperando el pago del cliente. Cuando pague, te avisamos.'
      : estado === 'COMPLETADO'
        ? 'Este pedido ya se entregó.'
        : estado === 'RECHAZADO' || estado === 'CANCELADO'
          ? 'Este pedido quedó cerrado.'
          : 'Por ahora no hay acciones para este pedido.';
  return <p className="border-t border-tinta-cafe/10 pt-4 text-texto-suave">{texto}</p>;
}
