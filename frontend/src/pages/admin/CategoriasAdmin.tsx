import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cambiarEstadoCategoria,
  crearCategoriaAdmin,
  editarCategoriaAdmin,
  listarAdminCategorias,
  mensajeDeApi,
  type Categoria
} from '../../lib/api';
import {
  CheckIcon,
  PlusIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Aviso } from '../../components/negocio/Aviso';
import { CampoTexto } from '../../components/negocio/Campos';
import { Dialogo } from '../../components/Dialogo';
import { Icono } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre (mínimo 2 letras).'),
  icono: z.string(),
  orden: z.string().refine((v) => v.trim() === '' || /^\d+$/.test(v.trim()), 'El orden tiene que ser un número entero.')
});

type Valores = z.infer<typeof esquema>;

const VACIOS: Valores = { nombre: '', icono: '', orden: '' };

/** PA-04 Categorías: crear, editar, ordenar y activar/desactivar (RF-44). */
export default function CategoriasAdmin() {
  const cliente = useQueryClient();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [porCambiar, setPorCambiar] = useState<Categoria | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categorias = useQuery({ queryKey: ['admin-categorias'], queryFn: listarAdminCategorias });

  const { register, handleSubmit, formState, reset } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: VACIOS
  });

  const guardar = handleSubmit(async (v) => {
    setError(null);
    setAviso(null);
    const datos = {
      nombre: v.nombre.trim(),
      icono: v.icono.trim() || undefined,
      orden: v.orden.trim() === '' ? undefined : Number(v.orden)
    };
    try {
      if (editando) {
        await editarCategoriaAdmin(editando.id, datos);
        setAviso('La categoría quedó actualizada.');
      } else {
        await crearCategoriaAdmin(datos);
        setAviso('La categoría quedó creada.');
      }
      setEditando(null);
      reset(VACIOS);
      await cliente.invalidateQueries({ queryKey: ['admin-categorias'] });
      await cliente.invalidateQueries({ queryKey: ['categorias'] });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  });

  const estado = useMutation({
    mutationFn: (c: Categoria) => cambiarEstadoCategoria(c.id, !c.activa),
    onSuccess: async (c) => {
      setError(null);
      setAviso(`La categoría ${c.nombre} quedó ${c.activa ? 'activa' : 'desactivada'}.`);
      setPorCambiar(null);
      await cliente.invalidateQueries({ queryKey: ['admin-categorias'] });
      await cliente.invalidateQueries({ queryKey: ['categorias'] });
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setPorCambiar(null);
    }
  });

  const editar = (c: Categoria) => {
    setEditando(c);
    reset({ nombre: c.nombre, icono: c.icono ?? '', orden: c.orden == null ? '' : String(c.orden) });
    document.getElementById('form-categoria')?.scrollIntoView({ block: 'start' });
  };

  return (
    <main className="animar-admin pb-20 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2218]">Categorías</h1>
        <p className="mt-1 text-sm text-gray-500">Ordena cómo se agrupan los negocios en el directorio.</p>
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

      <form
        id="form-categoria"
        className="mt-4 space-y-3 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md"
        onSubmit={guardar}
        noValidate
      >
        <h2 className="text-lg font-bold text-[#1A2218]">
          {editando ? `Editar ${editando.nombre}` : 'Nueva categoría'}
        </h2>
        <CampoTexto
          etiqueta="Nombre"
          registro={register('nombre')}
          error={formState.errors.nombre?.message}
          ayuda="Ej.: Cafés"
        />
        <CampoTexto
          etiqueta="Icono (opcional)"
          registro={register('icono')}
          error={formState.errors.icono?.message}
          ayuda="Opcional. Referencia interna de la categoría."
        />
        <CampoTexto
          etiqueta="Orden (opcional)"
          registro={register('orden')}
          error={formState.errors.orden?.message}
          ayuda="Menor número, más arriba en la lista."
          inputMode="numeric"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A2218] px-6 py-3 text-sm font-bold text-white transition hover:brightness-125 disabled:opacity-60"
            disabled={formState.isSubmitting}
          >
            <Icono icono={editando ? CheckIcon : PlusIcon} tamano="chico" />
            {formState.isSubmitting
              ? 'Guardando…'
              : editando
                ? 'Guardar categoría'
                : 'Crear categoría'}
          </button>
          {editando && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200/70 bg-white px-6 py-3 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4]"
              onClick={() => {
                setEditando(null);
                reset(VACIOS);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {categorias.isLoading && <Cargando texto="Cargando las categorías…" />}
      {categorias.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(categorias.error)} onReintentar={() => categorias.refetch()} />
      )}
      {categorias.data && categorias.data.length === 0 && (
        <Vacio>Todavía no hay categorías. Crea la primera con el formulario de arriba.</Vacio>
      )}
      {categorias.data && categorias.data.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-3xl border border-gray-200/70 bg-white p-2 shadow-md">
          <table className="w-full min-w-[560px] text-left">
            <caption className="sr-only">Categorías de negocio</caption>
            <thead>
              <tr className="border-b border-tinta-cafe/10 text-sm text-texto-suave">
                <th scope="col" className="px-4 py-3">
                  Orden
                </th>
                <th scope="col" className="px-4 py-3">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {categorias.data.map((c) => (
                <tr key={c.id} className="border-b border-tinta-cafe/10 last:border-0">
                  <td className="px-4 py-3 text-texto-suave">{c.orden ?? 'Sin dato'}</td>
                  <td className="px-4 py-3 font-semibold">
                    <span className="flex items-center gap-2">
                      <Icono icono={TagIcon} tamano="chico" />
                      {c.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.activa ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#F0FDF4] px-2 py-1 text-sm font-semibold text-[#1A2218]">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primario" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-500/10 px-2 py-1 text-sm font-semibold text-gray-500">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-texto-suave" />
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="rounded-full border border-gray-200/70 bg-white px-3 py-2 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4]" onClick={() => editar(c)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className={c.activa ? 'rounded-full bg-[#C8322B] px-3 py-2 text-sm font-bold text-white transition hover:brightness-110' : 'rounded-full bg-[#1A2218] px-3 py-2 text-sm font-bold text-white transition hover:brightness-125'}
                        onClick={() => {
                          setError(null);
                          setAviso(null);
                          setPorCambiar(c);
                        }}
                      >
                        {c.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo
        abierto={porCambiar !== null}
        titulo={porCambiar?.activa ? '¿Desactivar la categoría?' : '¿Activar la categoría?'}
        onCerrar={() => setPorCambiar(null)}
      >
        {porCambiar && (
          <>
            <p>
              {porCambiar.activa
                ? `${porCambiar.nombre} deja de aparecer para elegir, pero los negocios que ya la tienen no cambian.`
                : `${porCambiar.nombre} vuelve a aparecer para elegir.`}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={porCambiar.activa ? 'rounded-full bg-[#C8322B] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60' : 'rounded-full bg-[#1A2218] px-4 py-3 text-sm font-bold text-white transition hover:brightness-125 disabled:opacity-60'}
                disabled={estado.isPending}
                onClick={() => estado.mutate(porCambiar)}
              >
                {estado.isPending ? 'Guardando…' : porCambiar.activa ? 'Desactivar categoría' : 'Activar categoría'}
              </button>
              <button type="button" className="rounded-full border border-gray-200/70 bg-white px-4 py-3 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4]" onClick={() => setPorCambiar(null)}>
                Volver
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </main>
  );
}
