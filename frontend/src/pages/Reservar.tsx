import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  crearReserva,
  getDisponibilidad,
  getNegocio,
  mensajeDeApi,
  type Disponibilidad,
  type FranjaDisponible
} from '../lib/api';
import { fechaDeHoy, horaDeFranja } from '../lib/formato';
import { useSesion } from '../lib/auth';
import { Aviso } from '../components/negocio/Aviso';
import { Icono } from '../components/Icono';
import { Cargando, ErrorRecargar } from '../components/Estados';

/** Mensaje de error de campo: icono + texto (RNF-01). */
function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
      <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
      <span>{mensaje}</span>
    </p>
  );
}

/** PC-04 Reservar: franja con disponibilidad o alojamiento por entrada y salida (RF-26). */
export default function Reservar() {
  const { negocioId } = useParams<{ negocioId: string }>();
  const { sesion } = useSesion();
  const id = Number(negocioId);
  const valido = Number.isFinite(id) && id > 0;
  const [fecha, setFecha] = useState(fechaDeHoy());

  const negocio = useQuery({
    queryKey: ['negocio', id],
    queryFn: () => getNegocio(id),
    enabled: valido
  });
  const disponibilidad = useQuery({
    queryKey: ['disponibilidad', id, fecha],
    queryFn: () => getDisponibilidad(id, fecha),
    enabled: valido,
    retry: false
  });

  if (!valido) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <Aviso tipo="error">Ese negocio no existe.</Aviso>
        <Link to="/explorar" className="mt-3 inline-block font-semibold text-primario">
          Explorar negocios
        </Link>
      </main>
    );
  }

  if (sesion && sesion.rol !== 'CLIENTE') {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <h1 className="font-display text-titulo">Reservar</h1>
        <div className="mt-3">
          <Aviso tipo="info">Para reservar necesitás una cuenta de cliente.</Aviso>
        </div>
        <Link to={`/negocios/${id}`} className="mt-3 inline-block font-semibold text-primario">
          Volver al perfil del negocio
        </Link>
      </main>
    );
  }

  if (negocio.isLoading || disponibilidad.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <Cargando texto="Cargando la disponibilidad…" />
      </main>
    );
  }

  if (disponibilidad.isError || !disponibilidad.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <h1 className="font-display text-titulo">Reservar</h1>
        <ErrorRecargar
          mensaje={mensajeDeApi(disponibilidad.error)}
          onReintentar={() => disponibilidad.refetch()}
        />
        <Link to={`/negocios/${id}`} className="mt-3 inline-block font-semibold text-primario">
          Volver al perfil del negocio
        </Link>
      </main>
    );
  }

  const nombre = negocio.data?.nombre ?? 'este negocio';

  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <Link to={`/negocios/${id}`} className="text-sm font-semibold text-primario">
        ← {nombre}
      </Link>
      <h1 className="mt-2 font-display text-titulo">
        {disponibilidad.data.tipoReserva === 'ALOJAMIENTO' ? 'Reservar alojamiento' : 'Reservar una mesa o servicio'}
      </h1>
      <p className="mt-1 text-texto-suave">
        Paso único: contanos cuándo y cuántas personas. Después el negocio confirma.
      </p>

      {disponibilidad.data.tipoReserva === 'ALOJAMIENTO' ? (
        <FormularioAlojamiento id={id} />
      ) : (
        <FormularioFranja
          id={id}
          fecha={fecha}
          onFecha={setFecha}
          disponibilidad={disponibilidad.data}
        />
      )}
    </main>
  );
}

const esquemaBase = z.object({
  personas: z
    .number({ invalid_type_error: 'Indicá cuántas personas van.' })
    .int()
    .min(1, 'Tiene que ser al menos una persona.')
    .max(50, 'Podés reservar hasta 50 personas desde acá; para más, escribile al negocio.'),
  nota: z.string().max(300, 'La nota no puede pasar de 300 letras.').optional()
});

function FormularioFranja({
  id,
  fecha,
  onFecha,
  disponibilidad
}: {
  id: number;
  fecha: string;
  onFecha: (fecha: string) => void;
  disponibilidad: Disponibilidad;
}) {
  const navegar = useNavigate();
  const [franja, setFranja] = useState<FranjaDisponible | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof esquemaBase>>({
    resolver: zodResolver(esquemaBase),
    defaultValues: { personas: 2, nota: '' }
  });

  const enviar = async (v: z.infer<typeof esquemaBase>) => {
    setError(null);
    if (!franja) {
      setError('Elegí un horario disponible para continuar.');
      return;
    }
    try {
      const reserva = await crearReserva({
        negocioId: id,
        inicio: franja.inicio,
        personas: v.personas,
        nota: v.nota?.trim() ? v.nota.trim() : undefined
      });
      navegar(`/reservas/${reserva.id}`, {
        state: { mensaje: 'Reserva enviada. Esperando confirmación.', tipo: 'exito' }
      });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
      <div>
        <label htmlFor="fecha" className="font-semibold">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          className="campo mt-1"
          min={fechaDeHoy()}
          value={fecha}
          onChange={(e) => {
            onFecha(e.target.value);
            setFranja(null);
          }}
        />
      </div>

      <fieldset>
        <legend className="font-semibold">Elegí un horario</legend>
        <p className="text-sm text-texto-suave">Solo van los horarios con cupo.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {disponibilidad.franjas.map((f) => {
            const seleccionada = franja?.inicio === f.inicio;
            return (
              <button
                key={f.inicio}
                type="button"
                aria-pressed={seleccionada}
                disabled={!f.disponible}
                className={`min-h-boton rounded-campo border-2 px-2 py-2 text-left ${
                  seleccionada
                    ? 'border-primario bg-primario-claro font-bold text-primario'
                    : f.disponible
                      ? 'border-tinta-cafe/20'
                      : 'border-tinta-cafe/20 bg-texto/5 text-texto-suave'
                }`}
                onClick={() => setFranja(f)}
              >
                <span className="block">
                  {f.hora} a {horaDeFranja(f.fin)}
                </span>
                <span className="block text-sm">
                  {f.disponible ? `${f.libres} lugar${f.libres === 1 ? '' : 'es'}` : 'Sin cupo'}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="personas" className="font-semibold">
          ¿Cuántas personas?
        </label>
        <input
          id="personas"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          className="campo mt-1"
          {...register('personas', { valueAsNumber: true })}
        />
        <ErrorCampo mensaje={formState.errors.personas?.message} />
      </div>

      <div>
        <label htmlFor="nota" className="font-semibold">
          Nota para el negocio (opcional)
        </label>
        <textarea
          id="nota"
          rows={3}
          className="campo mt-1"
          placeholder="Ej.: mesa afuera, cumpleaños."
          {...register('nota')}
        />
        <ErrorCampo mensaje={formState.errors.nota?.message} />
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Enviando la reserva…' : 'Confirmar reserva'}
      </button>
    </form>
  );
}

const esquemaAlojamiento = esquemaBase
  .extend({
    entrada: z.string().min(1, 'Elegí el día de entrada.'),
    salida: z.string().min(1, 'Elegí el día de salida.')
  })
  .refine((v) => v.salida > v.entrada, {
    path: ['salida'],
    message: 'La salida tiene que ser posterior a la entrada.'
  });

type ValoresAlojamiento = z.infer<typeof esquemaAlojamiento>;

function FormularioAlojamiento({ id }: { id: number }) {
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, watch } = useForm<ValoresAlojamiento>({
    resolver: zodResolver(esquemaAlojamiento),
    defaultValues: { entrada: fechaDeHoy(), salida: '', personas: 2, nota: '' }
  });
  const entrada = watch('entrada');

  const enviar = async (v: ValoresAlojamiento) => {
    setError(null);
    try {
      const reserva = await crearReserva({
        negocioId: id,
        // Horas locales de Colombia (-05:00): entrada a las 3 p. m. y salida a las 12 m.
        inicio: `${v.entrada}T15:00:00-05:00`,
        fin: `${v.salida}T12:00:00-05:00`,
        personas: v.personas,
        nota: v.nota?.trim() ? v.nota.trim() : undefined
      });
      navegar(`/reservas/${reserva.id}`, {
        state: { mensaje: 'Reserva enviada. Esperando confirmación.', tipo: 'exito' }
      });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="entrada" className="font-semibold">
            Entrada
          </label>
          <input
            id="entrada"
            type="date"
            className="campo mt-1"
            min={fechaDeHoy()}
            {...register('entrada')}
          />
          <ErrorCampo mensaje={formState.errors.entrada?.message} />
        </div>
        <div>
          <label htmlFor="salida" className="font-semibold">
            Salida
          </label>
          <input
            id="salida"
            type="date"
            className="campo mt-1"
            min={entrada || fechaDeHoy()}
            {...register('salida')}
          />
          <ErrorCampo mensaje={formState.errors.salida?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="personas" className="font-semibold">
          ¿Cuántas personas?
        </label>
        <input
          id="personas"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          className="campo mt-1"
          {...register('personas', { valueAsNumber: true })}
        />
        <ErrorCampo mensaje={formState.errors.personas?.message} />
      </div>

      <div>
        <label htmlFor="nota" className="font-semibold">
          Nota para el negocio (opcional)
        </label>
        <textarea
          id="nota"
          rows={3}
          className="campo mt-1"
          placeholder="Ej.: llegamos tarde, cama doble."
          {...register('nota')}
        />
        <ErrorCampo mensaje={formState.errors.nota?.message} />
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Enviando la reserva…' : 'Confirmar reserva'}
      </button>
    </form>
  );
}
