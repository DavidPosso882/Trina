import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHorarios,
  guardarHorarios,
  mensajeDeApi,
  type Franja,
  type Negocio
} from '../../lib/api';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Aviso } from '../../components/negocio/Aviso';
import { ConNegocio } from '../../components/negocio/ConNegocio';
import { Icono } from '../../components/Icono';
import { EncabezadoNegocio } from '../../components/negocio/EncabezadoNegocio';
import {
  EditorHorarios,
  normalizarFranjas,
  problemasDeHorarios
} from '../../components/negocio/EditorHorarios';

/** PM-04 Horarios (RF-13): edición directa con el mismo editor del asistente. */
export default function Horarios() {
  return <ConNegocio>{(negocio) => <CargarHorarios negocio={negocio} />}</ConNegocio>;
}

function CargarHorarios({ negocio }: { negocio: Negocio }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['horarios', negocio.id],
    queryFn: () => getHorarios(negocio.id),
    retry: false
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <p role="status">Cargando tus horarios…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <Aviso tipo="error">No pudimos cargar tus horarios. Revisá tu conexión.</Aviso>
        <button type="button" className="btn-secundario mt-3 px-4 py-2" onClick={() => refetch()}>
          Intentar de nuevo
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
        <p role="status">Cargando tus horarios…</p>
      </main>
    );
  }

  return <FormularioHorarios negocio={negocio} inicial={normalizarFranjas(data)} />;
}

function FormularioHorarios({ negocio, inicial }: { negocio: Negocio; inicial: Franja[] }) {
  const qc = useQueryClient();
  const [franjas, setFranjas] = useState<Franja[]>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const guardar = async () => {
    setError(null);
    setAviso(null);
    const problema = problemasDeHorarios(franjas);
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    try {
      const guardadas = await guardarHorarios(negocio.id, franjas);
      setFranjas(normalizarFranjas(guardadas));
      setAviso('Tus horarios quedaron guardados.');
      await qc.invalidateQueries({ queryKey: ['horarios', negocio.id] });
    } catch (e) {
      setError(mensajeDeApi(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <EncabezadoNegocio negocio={negocio} titulo="Horarios" />
      <p className="mt-4 text-texto-suave">
        Cargá tus días y horas de atención. Un día sin franjas queda como cerrado.
      </p>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
        noValidate
      >
        <EditorHorarios franjas={franjas} onCambiar={setFranjas} />
        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
        <button
          type="submit"
          className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
          disabled={guardando}
          aria-busy={guardando}
        >
          <Icono icono={CheckIcon} tamano="chico" />
          {guardando ? 'Guardando…' : 'Guardar horarios'}
        </button>
      </form>
    </main>
  );
}
