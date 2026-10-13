import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarNegocio,
  enviarRevision,
  getCategorias,
  mensajeDeApi,
  type Categoria,
  type DatosNegocio,
  type Negocio
} from '../../lib/api';
import { ArrowUpTrayIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Aviso } from '../../components/negocio/Aviso';
import { CampoArea, CampoSelect, CampoTexto } from '../../components/negocio/Campos';
import { Icono } from '../../components/Icono';
import { ConNegocio } from '../../components/negocio/ConNegocio';
import { EncabezadoNegocio } from '../../components/negocio/EncabezadoNegocio';
import { esquemaNegocio, type ValoresNegocio } from '../../components/negocio/esquemaNegocio';

/** Enlace a la pantalla donde se completa lo que el 422 del envío reclama. */
function enlaceDeMensaje(mensaje: string): { to: string; texto: string } | null {
  if (/horario/i.test(mensaje)) return { to: '/panel/negocio/horarios', texto: 'Ir a horarios' };
  if (/foto/i.test(mensaje)) return { to: '/panel/negocio/fotos', texto: 'Ir a fotos' };
  return null;
}

/** PM-03 Datos y contacto del negocio (RF-11, RF-14). */
export default function MiNegocio() {
  return (
    <ConNegocio>{(negocio) => <FormularioDatos negocio={negocio} />}</ConNegocio>
  );
}

function ExplicacionEstado({ negocio }: { negocio: Negocio }) {
  if (negocio.estado === 'BORRADOR') {
    return (
      <Aviso tipo="info">
        Tu negocio está sin terminar. Revisá los datos, los horarios y las fotos, y enviálo a revisión.
      </Aviso>
    );
  }
  if (negocio.estado === 'PENDIENTE') {
    return <Aviso tipo="info">Estamos revisando tu negocio. Te avisaremos cuando esté publicado.</Aviso>;
  }
  if (negocio.estado === 'APROBADO') {
    return (
      <Aviso tipo="exito">
        Tu negocio está publicado en TRINA. Los cambios que guardes se ven al instante.
      </Aviso>
    );
  }
  if (negocio.estado === 'SUSPENDIDO') {
    return (
      <Aviso tipo="error">
        Tu negocio está oculto temporalmente
        {negocio.motivoRevision ? `: ${negocio.motivoRevision}` : '.'}
      </Aviso>
    );
  }
  return (
    <Aviso tipo="error">
      {negocio.estado === 'RECHAZADO' ? 'Tu negocio no fue aprobado.' : 'Tu negocio necesita ajustes.'}
      {negocio.motivoRevision ? ` Motivo: ${negocio.motivoRevision}.` : ''} Corregí lo indicado y volvé a
      enviarlo.
    </Aviso>
  );
}

function FormularioDatos({ negocio }: { negocio: Negocio }) {
  const categorias = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
    staleTime: 5 * 60_000
  });

  if (categorias.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <p role="status">Cargando tus datos…</p>
      </main>
    );
  }

  if (categorias.isError) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Aviso tipo="error">No pudimos cargar las categorías. Revisá tu conexión.</Aviso>
        <button type="button" className="btn-secundario mt-3 px-4 py-2" onClick={() => categorias.refetch()}>
          Intentar de nuevo
        </button>
      </main>
    );
  }

  return <FormularioCargado negocio={negocio} categorias={categorias.data ?? []} />;
}

function FormularioCargado({ negocio, categorias }: { negocio: Negocio; categorias: Categoria[] }) {
  const qc = useQueryClient();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enlaceFaltante, setEnlaceFaltante] = useState<{ to: string; texto: string } | null>(null);

  const bloqueado = negocio.estado === 'APROBADO';
  const puedeEnviar =
    negocio.estado === 'BORRADOR' ||
    negocio.estado === 'RECHAZADO' ||
    negocio.estado === 'CORRECCION_SOLICITADA';
  const categoriaActual = categorias.find((c) => c.nombre === negocio.categoria);

  const { register, handleSubmit, formState } = useForm<ValoresNegocio>({
    resolver: zodResolver(esquemaNegocio),
    mode: 'onTouched',
    defaultValues: {
      nombre: negocio.nombre,
      categoriaId: categoriaActual ? String(categoriaActual.id) : '',
      descripcion: negocio.descripcion ?? '',
      direccion: negocio.direccion ?? '',
      latitud: negocio.latitud === null ? '' : String(negocio.latitud),
      longitud: negocio.longitud === null ? '' : String(negocio.longitud),
      telefono: negocio.telefono ?? '',
      whatsapp: negocio.whatsapp ?? ''
    }
  });

  const persistir = async (v: ValoresNegocio): Promise<boolean> => {
    try {
      const datos: DatosNegocio = {
        descripcion: v.descripcion.trim(),
        direccion: v.direccion.trim(),
        telefono: v.telefono.trim(),
        whatsapp: v.whatsapp.trim()
      };
      if (v.latitud.trim() !== '') datos.latitud = Number(v.latitud);
      if (v.longitud.trim() !== '') datos.longitud = Number(v.longitud);
      if (!bloqueado) {
        datos.nombre = v.nombre.trim();
        datos.categoriaId = Number(v.categoriaId);
      }
      const actualizado = await actualizarNegocio(negocio.id, datos);
      qc.setQueryData(['mi-negocio'], actualizado);
      return true;
    } catch (e) {
      setError(mensajeDeApi(e));
      setEnlaceFaltante(null);
      return false;
    }
  };

  const guardar = handleSubmit(async (v) => {
    setError(null);
    setAviso(null);
    setEnlaceFaltante(null);
    setGuardando(true);
    const ok = await persistir(v);
    if (ok) setAviso('Tus datos quedaron guardados.');
    setGuardando(false);
  });

  const enviar = handleSubmit(async (v) => {
    setError(null);
    setAviso(null);
    setEnlaceFaltante(null);
    setGuardando(true);
    if (!(await persistir(v))) {
      setGuardando(false);
      return;
    }
    try {
      const actualizado = await enviarRevision(negocio.id);
      qc.setQueryData(['mi-negocio'], actualizado);
      setAviso('Tu negocio quedó en revisión. Te avisaremos cuando esté publicado.');
    } catch (e) {
      const mensaje = mensajeDeApi(e);
      setError(mensaje);
      setEnlaceFaltante(enlaceDeMensaje(mensaje));
    } finally {
      setGuardando(false);
    }
  });

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <EncabezadoNegocio negocio={negocio} titulo="Mi negocio" />

      <div className="mt-4">
        <ExplicacionEstado negocio={negocio} />
      </div>

      <form className="mt-4 space-y-4" onSubmit={guardar} noValidate>
        <CampoTexto
          etiqueta="Nombre del negocio"
          registro={register('nombre')}
          error={formState.errors.nombre?.message}
          ayuda={
            bloqueado
              ? 'Para cambiar el nombre de tu negocio, escribinos y lo actualizamos.'
              : 'Así lo van a ver tus clientes. Ej.: Café Plaza'
          }
          disabled={bloqueado}
          autoComplete="organization"
        />
        <CampoSelect
          etiqueta="Categoría"
          registro={register('categoriaId')}
          error={formState.errors.categoriaId?.message}
          ayuda={
            bloqueado
              ? 'Para cambiar la categoría, escribinos y lo actualizamos.'
              : 'Elegí la que mejor lo describe.'
          }
          disabled={bloqueado}
        >
          <option value="">Elegí una categoría…</option>
          {!categoriaActual && negocio.categoria && (
            <option value="" disabled>
              {negocio.categoria} (ya no disponible)
            </option>
          )}
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </CampoSelect>
        <CampoArea
          etiqueta="Descripción"
          registro={register('descripcion')}
          error={formState.errors.descripcion?.message}
          ayuda="Contá en pocas palabras qué ofrecés. Ej.: Café de origen, desayunos y tortas caseras."
        />
        <CampoTexto
          etiqueta="Dirección"
          registro={register('direccion')}
          error={formState.errors.direccion?.message}
          ayuda="Escribila como se la darías a un domiciliario. Ej.: Calle 5 # 10-20, Salento"
          autoComplete="street-address"
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

        {error && <Aviso tipo="error">{error}</Aviso>}
        {enlaceFaltante && (
          <Link to={enlaceFaltante.to} className="btn-secundario inline-block px-4 py-2">
            {enlaceFaltante.texto}
          </Link>
        )}
        {aviso && <Aviso tipo="exito">{aviso}</Aviso>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
            disabled={guardando}
            aria-busy={guardando}
          >
            <Icono icono={CheckIcon} tamano="chico" />
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {puedeEnviar && (
            <button
              type="button"
              className="btn-secundario inline-flex items-center justify-center gap-2 px-6 py-3"
              onClick={() => void enviar()}
              disabled={guardando}
            >
              <Icono icono={ArrowUpTrayIcon} tamano="chico" /> Enviar a revisión
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
