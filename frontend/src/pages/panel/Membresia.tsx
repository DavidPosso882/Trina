import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InformationCircleIcon,
  NoSymbolIcon,
  PhotoIcon,
  StarIcon
} from '@heroicons/react/24/solid';
import {
  getMiSuscripcion,
  getPlanes,
  mensajeDeApi,
  solicitarDestacada,
  type PlanMembresia
} from '../../lib/api';
import { estadoMembresia, type ClaveIconoEstado } from '../../lib/estados';
import { fecha, precio } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { FormularioPago } from '../../components/FormularioPago';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar } from '../../components/Estados';

// S5 — la página resuelve las claves de icono de lib/estados con Heroicons.
const ICONOS: Record<ClaveIconoEstado, IconoSvg> = {
  tarjeta: CreditCardIcon,
  reloj: ClockIcon,
  fuego: FireIcon,
  check: CheckCircleIcon,
  insignia: CheckBadgeIcon,
  alerta: ExclamationTriangleIcon,
  prohibido: NoSymbolIcon,
  campana: InformationCircleIcon,
  info: InformationCircleIcon
};

/** PM-09 Mi membresía: planes, vigencia y suscripción con pago de prueba (RF-33 a RF-37). */
export default function Membresia() {
  const cliente = useQueryClient();
  const [pago, setPago] = useState<{ id: number; montoCop: number } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState(false);

  const suscripcion = useQuery({ queryKey: ['mi-suscripcion'], queryFn: getMiSuscripcion });
  const planes = useQuery({ queryKey: ['planes'], queryFn: getPlanes, staleTime: 5 * 60_000 });

  const solicitar = async () => {
    setError(null);
    setAviso(null);
    setSolicitando(true);
    try {
      const pendiente = await solicitarDestacada();
      if (pendiente.id == null) {
        setError('No pudimos crear tu suscripción. Intentá de nuevo.');
        return;
      }
      setPago({ id: pendiente.id, montoCop: pendiente.precioMensualCop ?? 0 });
      await cliente.invalidateQueries({ queryKey: ['mi-suscripcion'] });
    } catch (e) {
      setError(mensajeDeApi(e));
    } finally {
      setSolicitando(false);
    }
  };

  if (suscripcion.isLoading || planes.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Cargando texto="Cargando tu membresía…" />
      </main>
    );
  }

  if (suscripcion.isError || planes.isError || !suscripcion.data || !planes.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <ErrorRecargar
          mensaje={mensajeDeApi(suscripcion.error ?? planes.error)}
          onReintentar={() => {
            suscripcion.refetch();
            planes.refetch();
          }}
        />
      </main>
    );
  }

  const s = suscripcion.data;
  const basica = planes.data.find((p) => p.codigo === 'BASICA');
  const destacada = planes.data.find((p) => p.codigo === 'DESTACADA');
  const etiqueta = estadoMembresia(s.estado);
  const porPagar =
    pago ?? (s.estado === 'PENDIENTE_PAGO' && s.id != null ? { id: s.id, montoCop: s.precioMensualCop ?? 0 } : null);
  const esDestacada = s.planEfectivo === 'DESTACADA';

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Mi membresía</h1>
      <p className="mt-1 text-texto-suave">Elegí cómo querés mostrarte en TRINA.</p>

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

      <section className="mt-4 border-y border-tinta-cafe/10 py-4" aria-label="Tu plan actual">
        <h2 className="text-seccion">Tu plan actual</h2>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          {esDestacada ? (
            <span className="inline-flex items-center gap-1 rounded-campo bg-acento/10 px-2 py-1 font-semibold text-acento">
              <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" /> Plan Destacado
            </span>
          ) : (
            <span className="rounded-campo bg-primario-claro px-2 py-1 font-semibold text-primario">
              Plan Básico
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-campo px-2 py-1 text-sm font-semibold ${etiqueta.clase}`}>
            <Icono icono={ICONOS[etiqueta.icono]} tamano="chico" />
            {etiqueta.texto}
          </span>
        </p>
        {s.fin ? (
          <p className="mt-2 text-texto-suave">Vigente hasta el {fecha(s.fin)}.</p>
        ) : (
          <p className="mt-2 text-texto-suave">El plan Básico no tiene fecha de vencimiento.</p>
        )}
        {s.avisoRenovacion && (
          <div className="mt-2">
            <Aviso tipo="info">
              Tu plan Destacado vence el {s.fin ? fecha(s.fin) : ''}. Renovalo para mantener la insignia
              Destacado.
            </Aviso>
          </div>
        )}
        {esDestacada && (
          <p className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-campo bg-acento/10 px-2 py-1 text-sm font-semibold text-acento">
              <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" /> Insignia Destacado activa
            </span>
          </p>
        )}
      </section>

      {porPagar && (
        <section aria-label="Pagar la membresía">
          {pago && (
            <p className="mt-3 text-texto-suave">
              Ya guardamos tu solicitud. Terminá el pago para activar la insignia.
            </p>
          )}
          <FormularioPago
            suscripcionId={porPagar.id}
            montoCop={porPagar.montoCop}
            titulo={`Pagar la membresía Destacada (${precio(porPagar.montoCop)})`}
            onAprobado={async () => {
              setPago(null);
              setError(null);
              setAviso('¡Listo! Tu plan Destacado quedó activo y ya tenés la insignia Destacado.');
              await cliente.invalidateQueries({ queryKey: ['mi-suscripcion'] });
            }}
          />
        </section>
      )}

      <section className="mt-4 space-y-3" aria-label="Planes disponibles">
        <h2 className="text-seccion">Planes</h2>
        <TarjetaPlan plan={basica} actual={!esDestacada} />
        {destacada ? (
          <TarjetaPlan
            plan={destacada}
            actual={esDestacada && s.estado === 'ACTIVA'}
            onSuscribir={porPagar ? undefined : solicitar}
            solicitando={solicitando}
            renovacion={esDestacada && s.estado === 'ACTIVA'}
          />
        ) : (
          <Aviso tipo="info">El plan Destacado no está disponible por ahora.</Aviso>
        )}
      </section>

      <p className="mt-4 text-sm text-texto-suave">
        El pago es de prueba: usá la tarjeta 4111 1111 1111 1111. No guardamos datos de tarjetas.
      </p>
    </main>
  );
}

function TarjetaPlan({
  plan,
  actual,
  onSuscribir,
  solicitando,
  renovacion
}: {
  plan?: PlanMembresia;
  actual: boolean;
  onSuscribir?: () => void;
  solicitando?: boolean;
  renovacion?: boolean;
}) {
  const esDestacada = plan?.codigo === 'DESTACADA';
  return (
    <div className="border-t border-tinta-cafe/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-seccion">
          {esDestacada && <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" />}
          {plan?.nombre ?? (esDestacada ? 'Destacado' : 'Básico')}
        </h3>
        <p className="font-display text-cifra-menor leading-none">
          {plan ? (plan.precioMensualCop === 0 ? 'Gratis' : `${precio(plan.precioMensualCop)}/mes`) : ''}
        </p>
      </div>
      <ul className="mt-2 space-y-1 text-texto-suave">
        <li className="flex items-start gap-2">
          <Icono icono={CheckCircleIcon} tamano="chico" className="mt-0.5" /> Apareces en el directorio de TRINA.
        </li>
        {esDestacada ? (
          <>
            <li className="flex items-start gap-2">
              <Icono icono={StarIcon} tamano="chico" className="mt-0.5 text-oro-cosecha" /> Insignia Destacado en tu
              perfil.
            </li>
            <li className="flex items-start gap-2">
              <Icono icono={ArrowTrendingUpIcon} tamano="chico" className="mt-0.5" /> Mejor posición en los resultados.
            </li>
            <li className="flex items-start gap-2">
              <Icono icono={PhotoIcon} tamano="chico" className="mt-0.5" /> Hasta {plan?.maxDestacados ?? 6} productos
              destacados.
            </li>
          </>
        ) : (
          <li className="flex items-start gap-2">
            <Icono icono={PhotoIcon} tamano="chico" className="mt-0.5" /> Hasta {plan?.maxDestacados ?? 2} productos
            destacados.
          </li>
        )}
      </ul>
      {actual && (
        <p className="mt-2 font-semibold text-primario">
          {renovacion ? 'Tu plan actual, podés renovarlo abajo.' : 'Es tu plan actual.'}
        </p>
      )}
      {esDestacada && onSuscribir && (
        <button
          type="button"
          className="btn-principal mt-3 inline-flex items-center justify-center gap-2 px-6 py-3"
          disabled={solicitando}
          onClick={onSuscribir}
        >
          <Icono icono={StarIcon} tamano="chico" />
          {solicitando ? 'Guardando…' : renovacion ? 'Renovar Destacado' : 'Pasar a Destacado'}
        </button>
      )}
    </div>
  );
}
