import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  EyeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  ApiError,
  getEstadisticas,
  getMiSuscripcion,
  listarPedidos,
  listarReservas,
  mensajeDeApi,
  miNegocio,
  type Negocio
} from '../../lib/api';
import { useSesion } from '../../lib/auth';
import { fecha, precio } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { EstadoNegocio } from '../../components/negocio/EstadoNegocio';
import { SinNegocioPanel } from '../../components/negocio/SinNegocioPanel';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar } from '../../components/Estados';

/** PM-01 Inicio del panel (RF-27, RF-32, RF-35, RF-40): pendientes, resumen y plan. */
export default function InicioPanel() {
  const negocio = useQuery({ queryKey: ['mi-negocio'], queryFn: miNegocio, retry: false });

  if (negocio.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Cargando texto="Cargando tu panel…" />
      </main>
    );
  }

  if (negocio.isError) {
    if (negocio.error instanceof ApiError && negocio.error.estado === 404) {
      return <SinNegocioPanel />;
    }
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(negocio.error)} onReintentar={() => negocio.refetch()} />
      </main>
    );
  }

  if (!negocio.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Cargando texto="Cargando tu panel…" />
      </main>
    );
  }

  return <PanelCargado negocio={negocio.data} />;
}

function PanelCargado({ negocio }: { negocio: Negocio }) {
  const { sesion } = useSesion();
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Hola, {sesion?.nombre ?? ''}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-texto-suave">{negocio.nombre}:</span>
        <EstadoNegocio estado={negocio.estado} />
        <Link to="/panel/negocio" className="text-sm font-semibold text-primario">
          Administrar →
        </Link>
      </div>

      <Pendientes />
      <ResumenPeriodo />
      <Plan />
    </main>
  );
}

/** Filas de lo que necesita atención: pedidos nuevos y reservas por confirmar. */
function Pendientes() {
  const pedidos = useQuery({
    queryKey: ['pedidos', 'PENDIENTE'],
    queryFn: () => listarPedidos('PENDIENTE')
  });
  const reservas = useQuery({
    queryKey: ['reservas', 'PENDIENTE_CONFIRMACION'],
    queryFn: () => listarReservas('PENDIENTE_CONFIRMACION')
  });

  return (
    <section
      className="mt-4 divide-y divide-tinta-cafe/10 border-b border-t border-tinta-cafe/10"
      aria-label="Lo que necesita tu atención"
    >
      <FilaPendiente
        icono={ShoppingBagIcon}
        cargando={pedidos.isLoading}
        error={pedidos.isError ? mensajeDeApi(pedidos.error) : null}
        onReintentar={() => pedidos.refetch()}
        cantidad={pedidos.data?.length ?? 0}
        singular="pedido nuevo"
        plural="pedidos nuevos"
        vacio="No tenés pedidos nuevos por ahora. Cuando alguien pida, aparece acá."
        enlace="/panel/pedidos?estado=PENDIENTE"
        textoEnlace="Ver pedidos"
      />
      <FilaPendiente
        icono={CalendarDaysIcon}
        cargando={reservas.isLoading}
        error={reservas.isError ? mensajeDeApi(reservas.error) : null}
        onReintentar={() => reservas.refetch()}
        cantidad={reservas.data?.length ?? 0}
        singular="reserva por confirmar"
        plural="reservas por confirmar"
        vacio="No tenés reservas esperando respuesta."
        enlace="/panel/reservas?estado=PENDIENTE_CONFIRMACION"
        textoEnlace="Ver reservas"
      />
    </section>
  );
}

function FilaPendiente({
  icono,
  cargando,
  error,
  onReintentar,
  cantidad,
  singular,
  plural,
  vacio,
  enlace,
  textoEnlace
}: {
  icono: IconoSvg;
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
  cantidad: number;
  singular: string;
  plural: string;
  vacio: string;
  enlace: string;
  textoEnlace: string;
}) {
  return (
    <div className="py-4">
      {cargando && (
        <p role="status" className="flex items-center gap-2 text-texto-suave">
          <Icono icono={ArrowPathIcon} className="animate-spin" /> Cargando…
        </p>
      )}
      {error && <ErrorRecargar mensaje={error} onReintentar={onReintentar} />}
      {!cargando && !error && (
        <>
          <p className="flex items-center gap-2 text-seccion">
            <Icono icono={icono} tamano="chico" />
            {cantidad > 0
              ? `${cantidad} ${cantidad === 1 ? singular : plural}`
              : 'Todo al día'}
          </p>
          <p className="mt-1 text-texto-suave">{cantidad > 0 ? 'Necesitan tu respuesta.' : vacio}</p>
          <Link to={enlace} className="mt-2 inline-block font-semibold text-primario">
            {textoEnlace} →
          </Link>
        </>
      )}
    </div>
  );
}

/** Resumen de los últimos 7 o 30 días (RF-40). */
function ResumenPeriodo() {
  const [dias, setDias] = useState(7);
  const resumen = useQuery({
    queryKey: ['estadisticas', dias],
    queryFn: () => getEstadisticas(dias)
  });

  return (
    <section className="mt-6 border-t border-tinta-cafe/10 pt-4" aria-label="Resumen de tu negocio">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-seccion">Tu resumen</h2>
        <div className="flex gap-1" aria-label="Elegir período">
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dias === d}
              className={`rounded-campo px-3 py-2 text-sm ${
                dias === d ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'
              }`}
              onClick={() => setDias(d)}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {resumen.isLoading && <Cargando texto="Cargando el resumen…" />}
      {resumen.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(resumen.error)} onReintentar={() => resumen.refetch()} />
      )}
      {resumen.data && (
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <Dato icono={EyeIcon} etiqueta="Visitas" valor={String(resumen.data.visitas)} />
          <Dato icono={ShoppingBagIcon} etiqueta="Pedidos" valor={String(resumen.data.pedidos)} />
          <Dato icono={CalendarDaysIcon} etiqueta="Reservas" valor={String(resumen.data.reservas)} />
          <Dato icono={BanknotesIcon} etiqueta="Ingresos" valor={precio(resumen.data.ingresosCop)} />
        </dl>
      )}
      <Link to="/panel/estadisticas" className="mt-3 inline-block font-semibold text-primario">
        Ver estadísticas completas
      </Link>
    </section>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: IconoSvg; etiqueta: string; valor: string }) {
  return (
    <div className="border-t border-tinta-cafe/10 pt-2">
      <dt className="flex items-center gap-2 text-sm text-texto-suave">
        <Icono icono={icono} tamano="chico" />
        {etiqueta}
      </dt>
      <dd className="font-display text-cifra-menor leading-none">{valor}</dd>
    </div>
  );
}

/** Plan y aviso de vencimiento ≤ 7 días (RF-33/RF-35). */
function Plan() {
  const suscripcion = useQuery({ queryKey: ['mi-suscripcion'], queryFn: getMiSuscripcion });

  return (
    <section className="mt-6 border-t border-tinta-cafe/10 pt-4" aria-label="Tu plan">
      <h2 className="text-seccion">Tu plan</h2>
      {suscripcion.isLoading && <Cargando texto="Cargando tu plan…" />}
      {suscripcion.isError && (
        <ErrorRecargar
          mensaje={mensajeDeApi(suscripcion.error)}
          onReintentar={() => suscripcion.refetch()}
        />
      )}
      {suscripcion.data && (
        <>
          <p className="mt-2 flex items-center gap-2 font-bold">
            {suscripcion.data.planEfectivo === 'DESTACADA' && (
              <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" />
            )}
            {suscripcion.data.planEfectivo === 'DESTACADA' ? 'Plan Destacado' : 'Plan Básico'}
          </p>
          {suscripcion.data.fin && (
            <p className="text-texto-suave">Vence el {fecha(suscripcion.data.fin)}.</p>
          )}
          {suscripcion.data.avisoRenovacion && (
            <div className="mt-2">
              <Aviso tipo="info">
                Tu plan Destacado vence pronto
                {suscripcion.data.fin ? ` (${fecha(suscripcion.data.fin)})` : ''}. Renovalo para no perder
                la insignia Destacado.
              </Aviso>
            </div>
          )}
          {suscripcion.data.estado === 'PENDIENTE_PAGO' && (
            <div className="mt-2">
              <Aviso tipo="info">Te falta pagar la suscripción Destacada. Podés terminarla desde acá.</Aviso>
            </div>
          )}
          <Link
            to="/panel/membresia"
            className="btn-principal mt-3 inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            <Icono icono={StarIcon} tamano="chico" />
            {suscripcion.data.planEfectivo === 'DESTACADA' ? 'Renovar Destacado' : 'Pasar a Destacado'}
          </Link>
        </>
      )}
      {suscripcion.data && !suscripcion.data.fin && (
        <p className="mt-1 text-sm text-texto-suave">
          El plan Básico es gratis. Destacado te da más alcance con la insignia Destacado.
        </p>
      )}
    </section>
  );
}
