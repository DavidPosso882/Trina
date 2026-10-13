import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';
import { cambiarEstadoReserva, getReserva, mensajeDeApi, type AccionReserva } from '../../lib/api';
import {
  accionesReservaComercio,
  type AccionComercio,
  type ClaveIconoEstado
} from '../../lib/estados';
import { fecha, hora } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { DialogoMotivo } from '../../components/DialogoMotivo';
import { EtiquetaReservaComercio } from '../../components/EstadoEtiqueta';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar } from '../../components/Estados';

// S5 — la página resuelve las claves de icono de las acciones del comerciante.
const ICONOS_ACCION: Partial<Record<ClaveIconoEstado, IconoSvg>> = {
  check: CheckCircleIcon,
  insignia: CheckBadgeIcon,
  prohibido: NoSymbolIcon
};

const EXITO: Record<string, string> = {
  CONFIRMAR: 'Reserva confirmada. Se avisó al cliente.',
  RECHAZAR: 'Reserva rechazada. Se avisó al cliente y se liberó el cupo.',
  COMPLETAR: 'Reserva marcada como realizada. ¡Gracias!',
  CANCELAR: 'Reserva cancelada. Se avisó al cliente y se liberó el cupo.'
};

/** PM-08 Detalle de la reserva: datos y acciones del comerciante con motivo (RF-27). */
export default function DetalleReservaPanel() {
  const { id: idTexto } = useParams<{ id: string }>();
  const id = Number(idTexto);
  const cliente = useQueryClient();
  const [porMotivo, setPorMotivo] = useState<AccionComercio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const reserva = useQuery({
    queryKey: ['reserva', id],
    queryFn: () => getReserva(id),
    enabled: Number.isFinite(id)
  });

  const cambio = useMutation({
    mutationFn: ({ accion, motivo }: { accion: AccionReserva; motivo?: string }) =>
      cambiarEstadoReserva(id, accion, motivo),
    onSuccess: async (_r, variables) => {
      setError(null);
      setAviso(EXITO[variables.accion] ?? 'La reserva quedó actualizada.');
      setPorMotivo(null);
      await cliente.invalidateQueries({ queryKey: ['reserva', id] });
      await cliente.invalidateQueries({ queryKey: ['reservas'] });
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setPorMotivo(null);
    }
  });

  if (reserva.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Cargando texto="Cargando la reserva…" />
      </main>
    );
  }
  if (reserva.isError || !reserva.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(reserva.error)} onReintentar={() => reserva.refetch()} />
        <Link to="/panel/reservas" className="mt-3 inline-block font-semibold text-primario">
          Volver a Reservas
        </Link>
      </main>
    );
  }

  const r = reserva.data;
  const acciones = accionesReservaComercio(r.estado);
  const esAlojamiento = r.tipoReserva === 'ALOJAMIENTO';

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <Link to="/panel/reservas" className="text-sm font-semibold text-primario">
        ← Reservas
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-titulo">Reserva #{r.id}</h1>
        <EtiquetaReservaComercio estado={r.estado} />
      </div>

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
      {r.motivo && (
        <div className="mt-3">
          <Aviso tipo="info">Motivo: {r.motivo}</Aviso>
        </div>
      )}

      <dl className="mt-4 divide-y divide-tinta-cafe/10 border-b border-t border-tinta-cafe/10">
        <div className="flex justify-between gap-3 py-3">
          <dt className="text-texto-suave">{esAlojamiento ? 'Entrada' : 'Fecha'}</dt>
          <dd className="text-right font-semibold">{fecha(r.inicio)}</dd>
        </div>
        {esAlojamiento ? (
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-texto-suave">Salida</dt>
            <dd className="text-right font-semibold">{fecha(r.fin)}</dd>
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-3 py-3">
              <dt className="text-texto-suave">Hora</dt>
              <dd className="text-right font-semibold">{hora(r.inicio)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-3">
              <dt className="text-texto-suave">Termina</dt>
              <dd className="text-right font-semibold">{hora(r.fin)}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between gap-3 py-3">
          <dt className="text-texto-suave">Personas</dt>
          <dd className="font-semibold">{r.personas}</dd>
        </div>
        {r.nota && (
          <div className="py-3">
            <dt className="text-texto-suave">Nota del cliente</dt>
            <dd>{r.nota}</dd>
          </div>
        )}
      </dl>

      {acciones.length === 0 && (
        <p className="mt-4 border-t border-tinta-cafe/10 pt-4 text-texto-suave">
          {r.estado === 'PENDIENTE_CONFIRMACION'
            ? 'Esperando tu respuesta.'
            : r.estado === 'COMPLETADA'
              ? 'Esta reserva ya se realizó.'
              : 'Esta reserva quedó cerrada.'}
        </p>
      )}

      {acciones.length > 0 && (
        <section className="mt-4" aria-label="Acciones de la reserva">
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
                  onClick={() => cambio.mutate({ accion: a.accion as AccionReserva })}
                >
                  <Icono icono={ICONOS_ACCION[a.icono] ?? CheckCircleIcon} tamano="chico" />
                  {cambio.isPending ? 'Guardando…' : a.texto}
                </button>
              )
            )}
          </div>
        </section>
      )}

      <DialogoMotivo
        abierto={porMotivo !== null}
        titulo={porMotivo?.accion === 'RECHAZAR' ? '¿Rechazar la reserva?' : '¿Cancelar la reserva?'}
        descripcion={
          `La reserva #${r.id} ${
            porMotivo?.accion === 'RECHAZAR' ? 'va a quedar rechazada' : 'va a quedar cancelada'
          } y se avisa al cliente. Se libera el cupo para otra persona.`
        }
        textoConfirmar={porMotivo?.accion === 'RECHAZAR' ? 'Rechazar reserva' : 'Cancelar reserva'}
        guardando={cambio.isPending}
        error={error}
        onCerrar={() => {
          setPorMotivo(null);
          setError(null);
        }}
        onConfirmar={(motivo) =>
          porMotivo && cambio.mutate({ accion: porMotivo.accion as AccionReserva, motivo })
        }
      />
    </main>
  );
}
