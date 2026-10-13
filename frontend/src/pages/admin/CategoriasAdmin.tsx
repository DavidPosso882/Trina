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
  nombre: z.string().trim().min(2, 'Escribí el nombre (mínimo 2 letras).'),
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
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Categorías</h1>
      <p className="mt-1 text-texto-suave">Ordená cómo se agrupan los negocios en el directorio.</p>

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
        className="mt-4 space-y-3 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
        onSubmit={guardar}
        noValidate
      >
        <h2 className="text-seccion">
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
            className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
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
              className="btn-secundario px-6 py-3"
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
        <Vacio>Todavía no hay categorías. Creá la primera con el formulario de arriba.</Vacio>
      )}
      {categorias.data && categorias.data.length > 0 && (
        <div className="mt-4 overflow-x-auto border-y border-tinta-cafe/10">
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
                      <span className="inline-flex items-center gap-2 rounded-campo bg-primario-claro px-2 py-1 text-sm font-semibold text-exito">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primario" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-campo bg-texto-suave/10 px-2 py-1 text-sm font-semibold text-texto-suave">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-texto-suave" />
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-secundario px-3 py-2 text-sm" onClick={() => editar(c)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className={c.activa ? 'btn-peligro px-3 py-2 text-sm' : 'btn-principal px-3 py-2 text-sm'}
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
                className={porCambiar.activa ? 'btn-peligro px-4 py-3' : 'btn-principal px-4 py-3'}
                disabled={estado.isPending}
                onClick={() => estado.mutate(porCambiar)}
              >
                {estado.isPending ? 'Guardando…' : porCambiar.activa ? 'Desactivar categoría' : 'Activar categoría'}
              </button>
              <button type="button" className="btn-secundario px-4 py-3" onClick={() => setPorCambiar(null)}>
                Volver
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </main>
  );
}
