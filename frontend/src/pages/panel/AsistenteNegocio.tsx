import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ApiError,
  actualizarNegocio,
  crearNegocio,
  enviarRevision,
  getCategorias,
  guardarHorarios,
  mensajeDeApi,
  miNegocio,
  type Franja
} from '../../lib/api';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Aviso } from '../../components/negocio/Aviso';
import { SelectorUbicacion } from '../../components/Mapa';
import { CampoArea, CampoSelect, CampoTexto } from '../../components/negocio/Campos';
import { EditorFotos } from '../../components/negocio/EditorFotos';
import { Icono } from '../../components/Icono';
import {
  EditorHorarios,
  normalizarFranjas,
  problemasDeHorarios
} from '../../components/negocio/EditorHorarios';
import {
  esquemaNegocio,
  numeroOpcional,
  textoOpcional,
  type ValoresNegocio
} from '../../components/negocio/esquemaNegocio';

const PASOS = [
  { pregunta: '¿Cómo se llama tu negocio?', ayuda: 'Con estos datos creamos tu borrador.' },
  {
    pregunta: '¿Dónde está tu negocio?',
    ayuda: 'La dirección y las coordenadas ayudan a tus clientes a llegar.'
  },
  { pregunta: '¿Cómo te contactan?', ayuda: 'Con un teléfono o un WhatsApp alcanza.' },
  { pregunta: '¿Cuándo abres?', ayuda: 'Cargá tus días y horarios de atención.' },
  { pregunta: 'Fotos de tu negocio', ayuda: 'Subí al menos una foto para poder publicar.' },
  { pregunta: 'Revisá y publicá', ayuda: 'Confirmá que todo esté bien antes de enviarlo.' }
];

/** Paso donde se completa lo que falta, según el mensaje 422 del backend. */
function pasoDeMensaje(mensaje: string): number | null {
  if (/horario/i.test(mensaje)) return 4;
  if (/foto/i.test(mensaje)) return 5;
  if (/contacto|tel[eé]fono|whatsapp/i.test(mensaje)) return 3;
  if (/ubicaci[oó]n|direcci[oó]n|datos/i.test(mensaje)) return 2;
  return null;
}

/** Convierte el texto del campo en número; vacío o inválido devuelve null. */
function numeroDeTexto(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

/** PM-02 Asistente de alta (RF-06): 6 pasos, cada paso guarda el borrador antes de avanzar. */
export default function AsistenteNegocio() {
  const navigate = useNavigate();

  const [chequeo, setChequeo] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [errorChequeo, setErrorChequeo] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [paso, setPaso] = useState(1);
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Franja[]>([]);
  const [cantidadFotos, setCantidadFotos] = useState(0);
  const [fotosPendientes, setFotosPendientes] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const tituloRef = useRef<HTMLHeadingElement>(null);

  // RF-06 E3/E4: si ya hay negocio, el asistente no aplica.
  useEffect(() => {
    let vivo = true;
    setChequeo('cargando');
    miNegocio().then(
      () => {
        if (vivo) navigate('/panel/negocio', { replace: true });
      },
      (e) => {
        if (!vivo) return;
        if (e instanceof ApiError && e.estado === 404) {
          setChequeo('listo');
        } else {
          setErrorChequeo(mensajeDeApi(e));
          setChequeo('error');
        }
      }
    );
    return () => {
      vivo = false;
    };
  }, [navigate, intento]);

  const { register, trigger, getValues, watch, setValue, formState } = useForm<ValoresNegocio>({
    resolver: zodResolver(esquemaNegocio),
    mode: 'onTouched',
    defaultValues: {
      nombre: '',
      categoriaId: '',
      descripcion: '',
      direccion: '',
      latitud: '',
      longitud: '',
      telefono: '',
      whatsapp: ''
    }
  });
  const valores = watch();

  const categorias = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
    enabled: chequeo === 'listo',
    staleTime: 5 * 60_000
  });

  // Al cambiar de paso llevamos el foco al título para lectores de pantalla.
  useEffect(() => {
    if (chequeo === 'listo') tituloRef.current?.focus();
  }, [paso, chequeo]);

  const irAtras = () => {
    setErrorPaso(null);
    setPaso((p) => Math.max(1, p - 1));
  };

  const siguiente = async () => {
    setErrorPaso(null);

    if (paso === 1) {
      if (!(await trigger(['nombre', 'categoriaId']))) return;
      setGuardando(true);
      try {
        const v = getValues();
        const nombre = v.nombre.trim();
        const categoriaId = Number(v.categoriaId);
        const descripcion = textoOpcional(v.descripcion);
        if (negocioId === null) {
          const creado = await crearNegocio({ nombre, categoriaId });
          setNegocioId(creado.id);
          if (descripcion !== undefined) await actualizarNegocio(creado.id, { descripcion });
        } else {
          await actualizarNegocio(negocioId, { nombre, categoriaId, descripcion });
        }
        setPaso(2);
      } catch (e) {
        setErrorPaso(mensajeDeApi(e));
      } finally {
        setGuardando(false);
      }
      return;
    }

    if (paso === 2) {
      if (!(await trigger(['direccion', 'latitud', 'longitud']))) return;
      if (negocioId === null) {
        setErrorPaso('Volvé al paso 1: falta crear tu negocio.');
        return;
      }
      setGuardando(true);
      try {
        const v = getValues();
        await actualizarNegocio(negocioId, {
          direccion: textoOpcional(v.direccion),
          latitud: numeroOpcional(v.latitud),
          longitud: numeroOpcional(v.longitud)
        });
        setPaso(3);
      } catch (e) {
        setErrorPaso(mensajeDeApi(e));
      } finally {
        setGuardando(false);
      }
      return;
    }

    if (paso === 3) {
      if (!(await trigger(['telefono', 'whatsapp']))) return;
      if (negocioId === null) {
        setErrorPaso('Volvé al paso 1: falta crear tu negocio.');
        return;
      }
      setGuardando(true);
      try {
        const v = getValues();
        await actualizarNegocio(negocioId, {
          telefono: textoOpcional(v.telefono),
          whatsapp: textoOpcional(v.whatsapp)
        });
        setPaso(4);
      } catch (e) {
        setErrorPaso(mensajeDeApi(e));
      } finally {
        setGuardando(false);
      }
      return;
    }

    if (paso === 4) {
      const problema = problemasDeHorarios(horarios);
      if (problema) {
        setErrorPaso(problema);
        return;
      }
      if (negocioId === null) {
        setErrorPaso('Volvé al paso 1: falta crear tu negocio.');
        return;
      }
      setGuardando(true);
      try {
        const guardadas = await guardarHorarios(negocioId, horarios);
        setHorarios(normalizarFranjas(guardadas));
        setPaso(5);
      } catch (e) {
        setErrorPaso(mensajeDeApi(e));
      } finally {
        setGuardando(false);
      }
      return;
    }

    if (paso === 5) {
      if (fotosPendientes > 0) {
        setErrorPaso('Tenés fotos sin subir. Tocá “Agregar fotos” o quitalas para seguir.');
        return;
      }
      setPaso(6);
      return;
    }

    if (paso === 6) {
      if (negocioId === null) {
        setErrorPaso('Volvé al paso 1: falta crear tu negocio.');
        return;
      }
      setGuardando(true);
      try {
        await enviarRevision(negocioId);
        setEnviado(true);
      } catch (e) {
        setErrorPaso(mensajeDeApi(e));
      } finally {
        setGuardando(false);
      }
    }
  };

  if (chequeo === 'cargando') {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <p role="status">Cargando…</p>
      </main>
    );
  }

  if (chequeo === 'error') {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Aviso tipo="error">{errorChequeo}</Aviso>
        <button
          type="button"
          className="btn-secundario mt-3 px-4 py-2"
          onClick={() => setIntento((i) => i + 1)}
        >
          Intentar de nuevo
        </button>
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <h1 className="flex items-center gap-2 font-display text-titulo">
          <Icono icono={CheckBadgeIcon} tamano="grande" className="text-primario" />
          ¡Listo! Tu negocio quedó en revisión
        </h1>
        <p className="mt-2">Te avisaremos cuando esté publicado. Si necesitamos algo, te lo hacemos saber.</p>
        <Link to="/panel/negocio" className="btn-principal mt-4 inline-block px-6 py-3">
          Ver mi negocio
        </Link>
      </main>
    );
  }

  const faltantes: { clave: string; texto: string; paso: number }[] = [];
  if (!valores.nombre.trim()) faltantes.push({ clave: 'nombre', texto: 'El nombre del negocio', paso: 1 });
  if (!valores.categoriaId) faltantes.push({ clave: 'categoria', texto: 'La categoría', paso: 1 });
  if (!valores.descripcion.trim()) faltantes.push({ clave: 'descripcion', texto: 'La descripción', paso: 1 });
  if (!valores.direccion.trim()) faltantes.push({ clave: 'direccion', texto: 'La dirección', paso: 2 });
  if (!valores.latitud.trim() || !valores.longitud.trim())
    faltantes.push({ clave: 'ubicacion', texto: 'La ubicación (latitud y longitud)', paso: 2 });
  if (!valores.telefono.trim() && !valores.whatsapp.trim())
    faltantes.push({ clave: 'contacto', texto: 'Al menos un contacto (teléfono o WhatsApp)', paso: 3 });
  if (horarios.length === 0)
    faltantes.push({ clave: 'horarios', texto: 'Al menos un horario de atención', paso: 4 });
  if (cantidadFotos === 0) faltantes.push({ clave: 'fotos', texto: 'Al menos una foto', paso: 5 });

  const pasoFaltante = errorPaso ? pasoDeMensaje(errorPaso) : null;
  const nombreCategoria =
    categorias.data?.find((c) => String(c.id) === valores.categoriaId)?.nombre ?? 'Sin dato';
  const contactos = [valores.telefono.trim(), valores.whatsapp.trim()].filter(Boolean);
  const pasoActual = PASOS[paso - 1];

  const contenidoPaso = () => {
    if (paso === 1) {
      return (
        <>
          <CampoTexto
            etiqueta="Nombre del negocio"
            registro={register('nombre')}
            error={formState.errors.nombre?.message}
            ayuda="Así lo van a ver tus clientes. Ej.: Café Plaza"
            autoComplete="organization"
          />
          <CampoSelect
            etiqueta="Categoría"
            registro={register('categoriaId')}
            error={formState.errors.categoriaId?.message}
            ayuda={categorias.isLoading ? 'Cargando categorías…' : 'Elegí la que mejor lo describe.'}
            disabled={categorias.isLoading}
          >
            <option value="">Elegí una categoría…</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </CampoSelect>
          {categorias.isError && (
            <Aviso tipo="error">
              No pudimos cargar las categorías. Revisá tu conexión.{' '}
              <button type="button" className="underline" onClick={() => categorias.refetch()}>
                Intentar de nuevo
              </button>
            </Aviso>
          )}
          <CampoArea
            etiqueta="Descripción"
            registro={register('descripcion')}
            error={formState.errors.descripcion?.message}
            ayuda="Contá en pocas palabras qué ofrecés. Ej.: Café de origen, desayunos y tortas caseras."
          />
        </>
      );
    }

    if (paso === 2) {
      return (
        <>
          <CampoTexto
            etiqueta="Dirección"
            registro={register('direccion')}
            error={formState.errors.direccion?.message}
            ayuda="Escribila como se la darías a un domiciliario. Ej.: Calle 5 # 10-20, Salento"
            autoComplete="street-address"
          />
          <SelectorUbicacion
            lat={numeroDeTexto(valores.latitud)}
            lng={numeroDeTexto(valores.longitud)}
            onCambiar={(lat, lng) => {
              setValue('latitud', lat.toFixed(6), { shouldValidate: true });
              setValue('longitud', lng.toFixed(6), { shouldValidate: true });
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto
              etiqueta="Latitud"
              registro={register('latitud')}
              error={formState.errors.latitud?.message}
              ayuda="Ej.: 4.538600"
              type="number"
              step="0.000001"
              inputMode="decimal"
            />
            <CampoTexto
              etiqueta="Longitud"
              registro={register('longitud')}
              error={formState.errors.longitud?.message}
              ayuda="Ej.: -75.643300"
              type="number"
              step="0.000001"
              inputMode="decimal"
            />
          </div>
        </>
      );
    }

    if (paso === 3) {
      return (
        <>
          <CampoTexto
            etiqueta="Teléfono"
            registro={register('telefono')}
            error={formState.errors.telefono?.message}
            ayuda="Ej.: 300 123 4567"
            type="tel"
            autoComplete="tel"
          />
          <CampoTexto
            etiqueta="WhatsApp"
            registro={register('whatsapp')}
            error={formState.errors.whatsapp?.message}
            ayuda="Con indicativo del país y sin espacios. Ej.: 573001234567"
            type="tel"
            autoComplete="tel"
          />
          <p className="text-sm text-texto-suave">
            Con al menos uno de los dos alcanza. Tus clientes van a poder llamarte o escribirte desde tu
            perfil.
          </p>
        </>
      );
    }

    if (paso === 4) {
      return <EditorHorarios franjas={horarios} onCambiar={setHorarios} />;
    }

    if (paso === 5) {
      if (negocioId === null) {
        return <Aviso tipo="error">Volvé al paso 1: falta crear tu negocio.</Aviso>;
      }
      return (
        <EditorFotos
          negocioId={negocioId}
          nombreNegocio={valores.nombre.trim() || 'tu negocio'}
          onCambio={setCantidadFotos}
          onPendientes={setFotosPendientes}
        />
      );
    }

    return (
      <>
        {faltantes.length > 0 ? (
          <div role="alert" className="rounded-campo bg-advertencia/10 p-3 text-advertencia">
            <p className="font-semibold">Falta completar:</p>
            <ul className="mt-1 list-disc pl-5">
              {faltantes.map((f) => (
                <li key={f.clave}>
                  {f.texto}{' '}
                  <button type="button" className="underline" onClick={() => setPaso(f.paso)}>
                    Completar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Aviso tipo="exito">Todo listo para enviar a revisión.</Aviso>
        )}

        <dl className="space-y-2 rounded-tarjeta border border-tinta-cafe/10 p-4">
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Nombre</dt>
            <dd className="text-right font-semibold">{valores.nombre.trim() || 'Sin dato'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Categoría</dt>
            <dd className="text-right font-semibold">{nombreCategoria}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Descripción</dt>
            <dd className="text-right">{valores.descripcion.trim() || 'Sin dato'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Dirección</dt>
            <dd className="text-right">{valores.direccion.trim() || 'Sin dato'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Ubicación</dt>
            <dd className="text-right">
              {valores.latitud.trim() && valores.longitud.trim()
                ? `${valores.latitud.trim()}, ${valores.longitud.trim()}`
                : 'Sin dato'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Contacto</dt>
            <dd className="text-right">
              {contactos.length > 0
                ? contactos.map((c, indice) => (
                    <span key={`${c}-${indice}`} className="block">
                      {c}
                    </span>
                  ))
                : 'Sin dato'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Horarios</dt>
            <dd className="text-right">
              {horarios.length > 0 ? `${horarios.length} franja(s) cargada(s)` : 'Sin dato'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Fotos</dt>
            <dd className="text-right">{cantidadFotos}</dd>
          </div>
        </dl>
        <p className="text-sm text-texto-suave">
          Al enviar, revisamos tu negocio y te avisamos. Cuando esté publicado, tus clientes van a verlo en
          TRINA.
        </p>
      </>
    );
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <p className="text-sm font-semibold text-primario">Crear mi negocio</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1" aria-hidden="true">
          {PASOS.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-8 rounded-full ${i + 1 <= paso ? 'bg-primario' : 'bg-primario-claro'}`}
            />
          ))}
        </div>
        <p role="status" className="text-sm font-semibold">
          Paso {paso} de {PASOS.length}
        </p>
      </div>

      <h1 ref={tituloRef} tabIndex={-1} className="mt-4 font-display text-titulo-menor">
        {pasoActual.pregunta}
      </h1>
      <p className="text-texto-suave">{pasoActual.ayuda}</p>

      {errorPaso && (
        <div className="mt-3 space-y-2">
          <Aviso tipo="error">{errorPaso}</Aviso>
          {pasoFaltante !== null && (
            <button
              type="button"
              className="btn-secundario px-4 py-2"
              onClick={() => {
                setErrorPaso(null);
                setPaso(pasoFaltante);
              }}
            >
              Completar ese paso
            </button>
          )}
        </div>
      )}

      <div className="mt-4 space-y-4">{contenidoPaso()}</div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {paso > 1 ? (
          <button type="button" className="btn-secundario px-4 py-3" onClick={irAtras} disabled={guardando}>
            ← Atrás
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
          onClick={() => void siguiente()}
          disabled={guardando}
          aria-busy={guardando}
        >
          {paso === PASOS.length && !guardando && <Icono icono={ArrowUpTrayIcon} tamano="chico" />}
          {guardando ? 'Guardando…' : paso === PASOS.length ? 'Enviar a revisión' : 'Siguiente →'}
        </button>
      </div>
    </main>
  );
}
