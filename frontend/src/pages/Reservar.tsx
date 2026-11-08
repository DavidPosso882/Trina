import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  crearReserva,
  getCatalogo,
  getDisponibilidad,
  getNegocio,
  getOcupacionItem,
  mensajeDeApi,
  type Disponibilidad,
  type FranjaDisponible,
  type ItemCatalogo
} from '../lib/api';
import { fechaDeHoy, horaDeFranja, precio } from '../lib/formato';
import { useSesion } from '../lib/auth';
import { Aviso } from '../components/negocio/Aviso';
import { CalendarioOcupacion } from '../components/CalendarioOcupacion';
import { Icono } from '../components/Icono';
import { Cargando, ErrorRecargar } from '../components/Estados';
import { TituloAtras } from '../components/TituloAtras';

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
  const [parametros] = useSearchParams();
  const itemIdParam = Number(parametros.get('item'));
  const pideItem = Number.isFinite(itemIdParam) && itemIdParam > 0;
  const catalogoItem = useQuery({
    queryKey: ['catalogo-reserva', id],
    queryFn: () => getCatalogo(id),
    enabled: valido && pideItem,
    retry: false,
    staleTime: 5 * 60_000
  });
  const itemElegido: ItemCatalogo | null = (() => {
    if (!pideItem || !catalogoItem.data) return null;
    const todos = [
      ...catalogoItem.data.categorias.flatMap((g) => g.items),
      ...catalogoItem.data.sinCategoria
    ];
    return todos.find((i) => i.id === itemIdParam && i.activo !== false && i.disponible !== false) ?? null;
  })();
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
        <TituloAtras titulo="Reservar" />
        <div className="mt-3">
          <Aviso tipo="info">Para reservar necesitas una cuenta de cliente.</Aviso>
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
        <TituloAtras titulo="Reservar" />
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


  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <TituloAtras
        titulo={
          disponibilidad.data.tipoReserva === 'ALOJAMIENTO'
            ? 'Reservar alojamiento'
            : 'Reservar una mesa o servicio'
        }
        subtitulo="Paso único: cuéntanos cuándo y cuántas personas. Después el negocio confirma."
      />

      {pideItem && catalogoItem.isLoading && <Cargando texto="Cargando la habitación…" />}
      {pideItem && !catalogoItem.isLoading && itemElegido == null && (
        <Aviso tipo="info">
          Esa habitación ya no está disponible. Puedes reservar en general o elegir otra.
        </Aviso>
      )}
      {itemElegido != null && (
        <section aria-label="Habitación elegida" className="mt-4 flex items-center gap-3 rounded-2xl border border-oliva/10 bg-white p-3 shadow-sm">
          {(itemElegido.imagenUrl ?? itemElegido.imagenes?.[0]) ? (
            <img
              src={itemElegido.imagenUrl ?? itemElegido.imagenes![0]}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl bg-crema object-cover"
            />
          ) : (
            <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-crema font-display text-2xl font-extrabold text-oliva/60">
              {itemElegido.nombre.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold">{itemElegido.nombre}</p>
            <p className="text-sm text-texto-suave">
              {precio(itemElegido.precioCop)}
              {disponibilidad.data.tipoReserva === 'ALOJAMIENTO' ? ' /noche' : ''}
              {itemElegido.capacidad != null ? ` · Hasta ${itemElegido.capacidad} ${itemElegido.capacidad === 1 ? 'persona' : 'personas'}` : ''}
            </p>
          </div>
        </section>
      )}

      {disponibilidad.data.tipoReserva === 'ALOJAMIENTO' ? (
        <FormularioAlojamiento id={id} item={itemElegido} />
      ) : (
        <FormularioFranja
          id={id}
          fecha={fecha}
          onFecha={setFecha}
          disponibilidad={disponibilidad.data}
          item={itemElegido}
        />
      )}
    </main>
  );
}

const esquemaBase = z.object({
  personas: z
    .number({ invalid_type_error: 'Indica cuántas personas van.' })
    .int()
    .min(1, 'Tiene que ser al menos una persona.')
    .max(50, 'Puedes reservar hasta 50 personas desde aquí; para más, escríbele al negocio.'),
  nota: z.string().max(300, 'La nota no puede pasar de 300 letras.').optional()
});

function FormularioFranja({
  id,
  fecha,
  onFecha,
  disponibilidad,
  item
}: {
  id: number;
  fecha: string;
  onFecha: (fecha: string) => void;
  disponibilidad: Disponibilidad;
  item: ItemCatalogo | null;
}) {
  const navegar = useNavigate();
  const [franja, setFranja] = useState<FranjaDisponible | null>(null);
  const [error, setError] = useState<string | null>(null);
  const personasPorDefecto = item?.capacidad != null && item.capacidad > 0 ? Math.min(item.capacidad, 50) : 2;
  const { register, handleSubmit, formState } = useForm<z.infer<typeof esquemaBase>>({
    resolver: zodResolver(esquemaBase),
    defaultValues: { personas: personasPorDefecto, nota: '' }
  });

  const enviar = async (v: z.infer<typeof esquemaBase>) => {
    setError(null);
    if (!franja) {
      setError('Elige un horario disponible para continuar.');
      return;
    }
    try {
      const reserva = await crearReserva({
        negocioId: id,
        inicio: franja.inicio,
        personas: v.personas,
        nota: v.nota?.trim() ? v.nota.trim() : undefined,
        itemId: item?.id
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
        <legend className="font-semibold">Elige un horario</legend>
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
                className={`min-h-boton min-w-0 rounded-campo border-2 px-2 py-2 text-left leading-tight ${
                  seleccionada
                    ? 'border-primario bg-primario-claro font-bold text-primario'
                    : f.disponible
                      ? 'border-tinta-cafe/20'
                      : 'border-tinta-cafe/20 bg-texto/5 text-texto-suave'
                }`}
                onClick={() => setFranja(f)}
              >
                <span className="block line-clamp-2 break-words">
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
          max={item?.capacidad ?? 50}
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
    entrada: z.string().min(1, 'Elige el día de entrada.'),
    salida: z.string().min(1, 'Elige el día de salida.')
  })
  .refine((v) => v.salida > v.entrada, {
    path: ['salida'],
    message: 'La salida tiene que ser posterior a la entrada.'
  });

type ValoresAlojamiento = z.infer<typeof esquemaAlojamiento>;

function FormularioAlojamiento({ id, item }: { id: number; item: ItemCatalogo | null }) {
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, watch } = useForm<ValoresAlojamiento>({
    resolver: zodResolver(esquemaAlojamiento),
    defaultValues: { entrada: fechaDeHoy(), salida: '', personas: item?.capacidad != null && item.capacidad > 0 ? Math.min(item.capacidad, 50) : 2, nota: '' }
  });
  const entrada = watch('entrada');
  const [mesManual, setMesManual] = useState<{ anio: number; mes: number } | null>(null);
  const mesBase = useMemo(() => {
    const [y, m] = (entrada || fechaDeHoy()).split('-').map(Number);
    return { anio: y, mes: m - 1 };
  }, [entrada]);
  useEffect(() => {
    setMesManual(null);
  }, [entrada]);
  const mes = mesManual ?? mesBase;
  const primerDia = `${mes.anio}-${String(mes.mes + 1).padStart(2, '0')}-01`;
  const ultimoDia = new Date(mes.anio, mes.mes + 1, 0);
  const ultimoISO = `${mes.anio}-${String(mes.mes + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
  const ocupacion = useQuery({
    queryKey: ['ocupacion', id, item?.id, mes.anio, mes.mes],
    queryFn: () => getOcupacionItem(id, item!.id, primerDia, ultimoISO),
    enabled: item != null,
    retry: false,
    staleTime: 60_000
  });
  const ocupadas = useMemo(() => {
    const dias = new Set<string>();
    for (const r of ocupacion.data ?? []) {
      const ini = new Date(r.inicio + 'T00:00:00');
      const fin = new Date(r.fin + 'T00:00:00');
      for (let d = new Date(ini); d < fin; d.setDate(d.getDate() + 1)) {
        dias.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    }
    return dias;
  }, [ocupacion.data]);

  const enviar = async (v: ValoresAlojamiento) => {
    setError(null);
    if (item != null) {
      const ini = new Date(v.entrada + 'T00:00:00');
      const fin = new Date(v.salida + 'T00:00:00');
      for (let d = new Date(ini); d < fin; d.setDate(d.getDate() + 1)) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (ocupadas.has(iso)) {
          setError('Esas fechas ya están reservadas para esta habitación. Elige otras fechas.');
          return;
        }
      }
    }
    try {
      const reserva = await crearReserva({
        negocioId: id,
        // Horas locales de Colombia (-05:00): entrada a las 3 p. m. y salida a las 12 m.
        inicio: `${v.entrada}T15:00:00-05:00`,
        fin: `${v.salida}T12:00:00-05:00`,
        personas: v.personas,
        nota: v.nota?.trim() ? v.nota.trim() : undefined,
        itemId: item?.id
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

      {item != null && (
        <div>
          <p className="mb-2 font-semibold">Disponibilidad de la habitación</p>
          {ocupacion.isLoading ? (
            <p className="text-sm text-texto-suave">Cargando el calendario…</p>
          ) : ocupacion.isError ? (
            <p className="text-sm text-error">No pudimos cargar los días ocupados. Igual puedes intentar reservar.</p>
          ) : (
            <CalendarioOcupacion
              ocupadas={ocupadas}
              anio={mes.anio}
              mes={mes.mes}
              minISO={fechaDeHoy()}
              onMes={(a, m) => setMesManual({ anio: a, mes: m })}
            />
          )}
        </div>
      )}

      <div>
        <label htmlFor="personas" className="font-semibold">
          ¿Cuántas personas?
        </label>
        <input
          id="personas"
          type="number"
          inputMode="numeric"
          min={1}
          max={item?.capacidad ?? 50}
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
