import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircleIcon,
  EyeSlashIcon,
  NoSymbolIcon,
  PlusIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import {
  cambiarEstadoAdminNegocio,
  listarAdminNegocios,
  mensajeDeApi,
  type AccionRevisionNegocio,
  type Negocio
} from '../../lib/api';
import { Aviso } from '../../components/negocio/Aviso';
import { EstadoNegocio } from '../../components/negocio/EstadoNegocio';
import { Dialogo } from '../../components/Dialogo';
import { DialogoMotivo } from '../../components/DialogoMotivo';
import { Icono } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';
import { AltaAsistida } from './AltaAsistida';

const TABS = [
  { valor: '', texto: 'Todos' },
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'APROBADO', texto: 'Publicados' },
  { valor: 'CORRECCION_SOLICITADA', texto: 'Con ajustes' },
  { valor: 'RECHAZADO', texto: 'No aprobados' },
  { valor: 'SUSPENDIDO', texto: 'Suspendidos' },
  { valor: 'BORRADOR', texto: 'Sin terminar' }
];

/** PA-02 Negocios y revisión: cola por estado, ficha con decisiones y alta asistida (RF-07/RF-47). */
export default function NegociosAdmin() {
  const [parametros, setParametros] = useSearchParams();
  const estado = parametros.get('estado') ?? '';
  const [seleccionado, setSeleccionado] = useState<Negocio | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [altaAbierta, setAltaAbierta] = useState(false);

  const negocios = useQuery({
    queryKey: ['admin-negocios', estado],
    queryFn: () => listarAdminNegocios(estado || undefined)
  });

  const cambiarTab = (valor: string) => {
    if (valor) setParametros({ estado: valor });
    else setParametros({});
  };

  return (
    <main className="animar-admin pb-20 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2218]">Negocios</h1>
        <p className="mt-1 text-sm text-gray-500">Revisa las solicitudes y decide si se publican.</p>
      </div>

      {aviso && (
        <div className="mt-3">
          <Aviso tipo="exito">{aviso}</Aviso>
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-4 shadow-md" aria-label="Filtrar por estado">
        <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.valor}
            type="button"
            aria-pressed={estado === t.valor}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              estado === t.valor ? 'bg-[#1A2218] text-white shadow-sm' : 'border border-gray-200/70 bg-white text-gray-500 hover:bg-[#F0FDF4]'
            }`}
            onClick={() => cambiarTab(t.valor)}
          >
            {t.texto}
          </button>
        ))}
        </div>
      </div>

      {negocios.isLoading && <Cargando texto="Cargando los negocios…" />}
      {negocios.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(negocios.error)} onReintentar={() => negocios.refetch()} />
      )}
      {negocios.data && negocios.data.length === 0 && (
        <Vacio>
          {estado
            ? 'No hay negocios en ese estado.'
            : 'Todavía no hay negocios para revisar.'}
        </Vacio>
      )}
      {negocios.data && negocios.data.length > 0 && (
        <section className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md" aria-label="Listado de negocios">
        <ul className="flex flex-col gap-3">
          {negocios.data.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#F8F9FA] p-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#1A2218]">{n.nombre}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{n.categoria ?? 'Sin dato'}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <EstadoNegocio estado={n.estado} />
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[#1A2218] px-4 py-1.5 text-xs font-bold text-white transition hover:brightness-125"
                  onClick={() => setSeleccionado(n)}
                >
                  Revisar →
                </button>
              </span>
            </li>
          ))}
        </ul>
        </section>
      )}

      <section className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md" aria-label="Alta asistida">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A2218]">Alta asistida de negocio</h2>
            <p className="mt-1 text-sm text-gray-500">Crea la cuenta y el negocio de una vez.</p>
          </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-[#94B839] px-5 py-2.5 text-sm font-extrabold text-[#1A2218] shadow-sm transition-all hover:bg-[#1A2218] hover:text-white"
          aria-expanded={altaAbierta}
          onClick={() => setAltaAbierta((v) => !v)}
        >
          <Icono icono={PlusIcon} tamano="chico" />
          {altaAbierta ? 'Ocultar alta asistida' : 'Alta asistida de negocio'}
        </button>
        </div>
        {altaAbierta && <AltaAsistida onCreado={setAviso} />}
      </section>

      <Dialogo
        abierto={seleccionado !== null}
        titulo={seleccionado ? `Ficha de ${seleccionado.nombre}` : 'Ficha del negocio'}
        onCerrar={() => setSeleccionado(null)}
      >
        {seleccionado && (
          <FichaNegocio
            negocio={seleccionado}
            onCerrar={() => setSeleccionado(null)}
            onActualizado={(n) => {
              setSeleccionado(n);
              setAviso(`La ficha de ${n.nombre} quedó actualizada.`);
            }}
          />
        )}
      </Dialogo>
    </main>
  );
}

type MotivoPendiente = {
  accion: AccionRevisionNegocio;
  titulo: string;
  descripcion: string;
  confirmar: string;
  peligro: boolean;
};

function FichaNegocio({
  negocio,
  onCerrar,
  onActualizado
}: {
  negocio: Negocio;
  onCerrar: () => void;
  onActualizado: (negocio: Negocio) => void;
}) {
  const cliente = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [porMotivo, setPorMotivo] = useState<MotivoPendiente | null>(null);

  const cambio = useMutation({
    mutationFn: ({ accion, motivo }: { accion: AccionRevisionNegocio; motivo?: string }) =>
      cambiarEstadoAdminNegocio(negocio.id, accion, motivo),
    onSuccess: async (n) => {
      setError(null);
      setPorMotivo(null);
      setAviso('La ficha quedó actualizada.');
      await cliente.invalidateQueries({ queryKey: ['admin-negocios'] });
      onActualizado(n);
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setPorMotivo(null);
    }
  });

  const abrirMotivo = (accion: AccionRevisionNegocio, titulo: string, confirmar: string) => {
    setError(null);
    setAviso(null);
    setPorMotivo({
      accion,
      titulo,
      confirmar,
      peligro: accion !== 'SOLICITAR_CORRECCION',
      descripcion:
        accion === 'SOLICITAR_CORRECCION'
          ? `Le vas a pedir ajustes a ${negocio.nombre}. El comerciante recibe el motivo y puede corregir y reenviar.`
          : accion === 'RECHAZAR'
            ? `${negocio.nombre} va a quedar no aprobado y el comerciante va a ver el motivo.`
            : `${negocio.nombre} va a quedar oculto del directorio hasta que lo reactives.`
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <EstadoNegocio estado={negocio.estado} />
        <span className="text-texto-suave">{negocio.categoria ?? 'Sin dato'}</span>
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

      <dl className="mt-3 space-y-1 text-sm">
        <Dato etiqueta="Descripción" valor={negocio.descripcion} />
        <Dato etiqueta="Dirección" valor={negocio.direccion} />
        <Dato etiqueta="Teléfono" valor={negocio.telefono} />
        <Dato etiqueta="WhatsApp" valor={negocio.whatsapp} />
        <Dato
          etiqueta="Ubicación"
          valor={
            negocio.latitud != null && negocio.longitud != null
              ? `${negocio.latitud.toFixed(5)}, ${negocio.longitud.toFixed(5)}`
              : null
          }
        />
        {negocio.motivoRevision && <Dato etiqueta="Motivo de la revisión" valor={negocio.motivoRevision} />}
      </dl>

      {negocio.estado === 'BORRADOR' && (
        <div className="mt-3">
          <Aviso tipo="info">El comerciante todavía no envió este negocio a revisión.</Aviso>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {negocio.estado === 'PENDIENTE' && (
          <>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A2218] px-4 py-3 text-sm font-bold text-white transition hover:brightness-125 disabled:opacity-60"
              disabled={cambio.isPending}
              onClick={() => cambio.mutate({ accion: 'APROBAR' })}
            >
              <Icono icono={CheckCircleIcon} tamano="chico" /> Aprobar negocio
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200/70 bg-white px-4 py-3 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4] disabled:opacity-60"
              disabled={cambio.isPending}
              onClick={() => abrirMotivo('SOLICITAR_CORRECCION', '¿Pedir ajustes?', 'Pedir ajustes')}
            >
              <Icono icono={WrenchScrewdriverIcon} tamano="chico" /> Pedir ajustes
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C8322B] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              disabled={cambio.isPending}
              onClick={() => abrirMotivo('RECHAZAR', '¿Rechazar el negocio?', 'Rechazar negocio')}
            >
              <Icono icono={NoSymbolIcon} tamano="chico" /> Rechazar negocio
            </button>
          </>
        )}
        {negocio.estado === 'APROBADO' && (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C8322B] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            disabled={cambio.isPending}
            onClick={() => abrirMotivo('SUSPENDER', '¿Suspender el negocio?', 'Suspender negocio')}
          >
            <Icono icono={EyeSlashIcon} tamano="chico" /> Suspender negocio
          </button>
        )}
        {negocio.estado === 'SUSPENDIDO' && (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A2218] px-4 py-3 text-sm font-bold text-white transition hover:brightness-125 disabled:opacity-60"
            disabled={cambio.isPending}
            onClick={() => cambio.mutate({ accion: 'REACTIVAR' })}
          >
            <Icono icono={CheckCircleIcon} tamano="chico" /> Reactivar negocio
          </button>
        )}
        <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200/70 bg-white px-4 py-3 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4]" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      <DialogoMotivo
        abierto={porMotivo !== null}
        titulo={porMotivo?.titulo ?? ''}
        descripcion={porMotivo?.descripcion ?? ''}
        textoConfirmar={porMotivo?.confirmar ?? ''}
        peligro={porMotivo?.peligro}
        guardando={cambio.isPending}
        error={error}
        onCerrar={() => {
          setPorMotivo(null);
          setError(null);
        }}
        onConfirmar={(motivo) => porMotivo && cambio.mutate({ accion: porMotivo.accion, motivo })}
      />
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-texto-suave">{etiqueta}</dt>
      <dd className="text-right font-semibold">{valor || 'Sin dato'}</dd>
    </div>
  );
}
