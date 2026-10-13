import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { cancelarReserva, getReserva, mensajeDeApi } from '../lib/api';
import { puedeCancelarReserva } from '../lib/estados';
import { fecha, hora } from '../lib/formato';
import { Aviso } from '../components/negocio/Aviso';
import { Dialogo } from '../components/Dialogo';
import { EtiquetaReserva } from '../components/EstadoEtiqueta';
import { Icono } from '../components/Icono';
import { Cargando, ErrorRecargar } from '../components/Estados';

/** Detalle de una reserva del cliente con cancelación cuando aplica (RF-31). */
export default function DetalleReserva() {
  const { id: idTexto } = useParams<{ id: string }>();
  const id = Number(idTexto);
  const ubicacion = useLocation();
  const mensajeInicial = (ubicacion.state as { mensaje?: string } | null)?.mensaje;
  const cliente = useQueryClient();
  const [dialogo, setDialogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const reserva = useQuery({
    queryKey: ['reserva', id],
    queryFn: () => getReserva(id),
    enabled: Number.isFinite(id)
  });

  if (reserva.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <Cargando texto="Cargando la reserva…" />
      </main>
    );
  }
  if (reserva.isError || !reserva.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(reserva.error)} onReintentar={() => reserva.refetch()} />
        <Link to="/reservas" className="mt-3 inline-block font-semibold text-primario">
          Volver a Mis reservas
        </Link>
      </main>
    );
  }

  const r = reserva.data;
  const esAlojamiento = r.tipoReserva === 'ALOJAMIENTO';

  const cancelar = async () => {
    setError(null);
    setCancelando(true);
    try {
      await cancelarReserva(r.id);
      setDialogo(false);
      await cliente.invalidateQueries({ queryKey: ['reserva', r.id] });
      await cliente.invalidateQueries({ queryKey: ['reservas'] });
    } catch (e) {
      setError(mensajeDeApi(e));
      setDialogo(false);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <Link to="/reservas" className="text-sm font-semibold text-primario">
        ← Mis reservas
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-titulo">Reserva #{r.id}</h1>
        <EtiquetaReserva estado={r.estado} />
      </div>
      <p className="mt-1 text-texto-suave">{r.negocio}</p>

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
            <dt className="text-texto-suave">Nota</dt>
            <dd>{r.nota}</dd>
          </div>
        )}
      </dl>

      {puedeCancelarReserva(r.estado) && (
        <button
          type="button"
          className="btn-peligro mt-4 inline-flex items-center justify-center gap-2 px-6 py-3"
          onClick={() => setDialogo(true)}
        >
          <Icono icono={NoSymbolIcon} tamano="chico" /> Cancelar reserva
        </button>
      )}

      <Dialogo abierto={dialogo} titulo="¿Cancelar la reserva?" onCerrar={() => setDialogo(false)}>
        <p>
          La reserva #{r.id} en {r.negocio} va a quedar cancelada. Si el negocio ya la había confirmado, se
          libera el cupo.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-peligro px-4 py-3" disabled={cancelando} onClick={cancelar}>
            {cancelando ? 'Cancelando…' : 'Sí, cancelar reserva'}
          </button>
          <button type="button" className="btn-secundario px-4 py-3" onClick={() => setDialogo(false)}>
            Volver
          </button>
        </div>
      </Dialogo>
    </main>
  );
}
