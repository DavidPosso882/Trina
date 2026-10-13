import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  actualizarCategoriaCatalogo,
  actualizarItemCatalogo,
  cambiarDisponibilidadItem,
  crearCategoriaCatalogo,
  crearItemCatalogo,
  eliminarCategoriaCatalogo,
  eliminarItemCatalogo,
  getCatalogoPropio,
  listarCategoriasCatalogo,
  mensajeDeApi,
  type CategoriaCatalogo,
  type DatosItemCatalogo,
  type ItemCatalogo,
  type Negocio
} from '../../lib/api';
import {
  BriefcaseIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  PlusIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { precio } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { ConNegocio } from '../../components/negocio/ConNegocio';
import { EstadoNegocio } from '../../components/negocio/EstadoNegocio';
import { Dialogo } from '../../components/Dialogo';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

/** PM: catálogo del comerciante (RF-15 a RF-18): ítems, disponibilidad, baja lógica y categorías. */
export default function Catalogo() {
  return <ConNegocio>{(negocio) => <GestionCatalogo negocio={negocio} />}</ConNegocio>;
}

// S5 — producto y servicio se distinguen con Heroicons, nunca solo con el texto.
const TIPO_ICONO: Record<string, IconoSvg> = { producto: CubeIcon, servicio: BriefcaseIcon };

function GestionCatalogo({ negocio }: { negocio: Negocio }) {
  const cliente = useQueryClient();
  const [itemDialogo, setItemDialogo] = useState<{ item: ItemCatalogo | null } | null>(null);
  const [categoriaDialogo, setCategoriaDialogo] = useState<{ categoria: CategoriaCatalogo | null } | null>(
    null
  );
  const [itemAEliminar, setItemAEliminar] = useState<ItemCatalogo | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<CategoriaCatalogo | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const catalogo = useQuery({
    queryKey: ['catalogo-propio', negocio.id],
    queryFn: () => getCatalogoPropio(negocio.id),
    retry: false
  });
  const categorias = useQuery({
    queryKey: ['catalogo-categorias', negocio.id],
    queryFn: () => listarCategoriasCatalogo(negocio.id),
    retry: false
  });

  const noPublicado = negocio.estado !== 'APROBADO';

  const invalidar = () => {
    cliente.invalidateQueries({ queryKey: ['catalogo-propio', negocio.id] });
    cliente.invalidateQueries({ queryKey: ['catalogo-categorias', negocio.id] });
  };

  const guardarItem = useMutation({
    mutationFn: (entrada: { item: ItemCatalogo | null; datos: DatosItemCatalogo }) =>
      entrada.item
        ? actualizarItemCatalogo(negocio.id, entrada.item.id, entrada.datos)
        : crearItemCatalogo(negocio.id, entrada.datos),
    onSuccess: (_dato, entrada) => {
      invalidar();
      setItemDialogo(null);
      setAviso(entrada.item ? 'Ítem actualizado.' : 'Ítem creado.');
    }
  });

  const guardarCategoria = useMutation({
    mutationFn: (entrada: { categoria: CategoriaCatalogo | null; datos: { nombre: string; orden?: number } }) =>
      entrada.categoria
        ? actualizarCategoriaCatalogo(negocio.id, entrada.categoria.id, entrada.datos)
        : crearCategoriaCatalogo(negocio.id, entrada.datos),
    onSuccess: (_dato, entrada) => {
      invalidar();
      setCategoriaDialogo(null);
      setAviso(entrada.categoria ? 'Categoría actualizada.' : 'Categoría creada.');
    }
  });

  const alternarDisponibilidad = useMutation({
    mutationFn: (item: ItemCatalogo) =>
      cambiarDisponibilidadItem(negocio.id, item.id, !item.disponible),
    onSuccess: (item) => {
      invalidar();
      setAviso(item.disponible ? `"${item.nombre}" vuelve a estar disponible.` : `"${item.nombre}" quedó pausado.`);
    }
  });

  const darDeBajaItem = useMutation({
    mutationFn: (item: ItemCatalogo) => eliminarItemCatalogo(negocio.id, item.id),
    onSuccess: (_dato, item) => {
      invalidar();
      setItemAEliminar(null);
      setErrorEliminar(null);
      setAviso(`"${item.nombre}" se dio de baja.`);
    },
    onError: (e) => setErrorEliminar(mensajeDeApi(e))
  });

  const borrarCategoria = useMutation({
    mutationFn: (categoria: CategoriaCatalogo) => eliminarCategoriaCatalogo(negocio.id, categoria.id),
    onSuccess: (_dato, categoria) => {
      invalidar();
      setCategoriaAEliminar(null);
      setErrorEliminar(null);
      setAviso(`Categoría "${categoria.nombre}" eliminada. Sus ítems quedaron sin categoría.`);
    },
    onError: (e) => setErrorEliminar(mensajeDeApi(e))
  });

  const grupos = [
    ...(catalogo.data?.categorias ?? []).map((g) => ({
      clave: `cat-${g.categoria.id}`,
      titulo: g.categoria.nombre,
      items: g.items
    })),
    ...(catalogo.data && catalogo.data.sinCategoria.length > 0
      ? [{ clave: 'sin-categoria', titulo: 'Sin categoría', items: catalogo.data.sinCategoria }]
      : [])
  ];
  const totalItems = catalogo.data
    ? catalogo.data.categorias.reduce((suma, g) => suma + g.items.length, 0) +
      catalogo.data.sinCategoria.length
    : 0;

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Catálogo</h1>
      <p className="mt-1 text-texto-suave">
        Cargá tus productos o servicios para que tus clientes puedan verlos y pedirlos.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <EstadoNegocio estado={negocio.estado} />
        <Link to="/panel/negocio" className="text-sm font-semibold text-primario">
          Administrar mi negocio →
        </Link>
      </div>

      {aviso && (
        <div className="mt-3">
          <Aviso tipo="exito">{aviso}</Aviso>
        </div>
      )}

      <section className="mt-4" aria-labelledby="items-catalogo">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="items-catalogo" className="font-display text-titulo-menor">
            Ítems {catalogo.data ? `(${totalItems})` : ''}
          </h2>
          <button
            type="button"
            className="btn-principal inline-flex items-center gap-2 px-4 py-2"
            onClick={() => setItemDialogo({ item: null })}
          >
            <Icono icono={PlusIcon} tamano="chico" /> Nuevo ítem
          </button>
        </div>

        {catalogo.isLoading && <Cargando texto="Cargando tu catálogo…" />}
        {noPublicado && (
          <div className="mt-3">
            <Aviso tipo="info">
              Tu negocio está en estado <strong>{negocio.estado}</strong>. Podés cargar tus ítems
              desde ya; se ven en tu perfil público cuando esté aprobado.
            </Aviso>
          </div>
        )}
        {catalogo.isError && !noPublicado && (
          <ErrorRecargar
            mensaje={mensajeDeApi(catalogo.error)}
            onReintentar={() => catalogo.refetch()}
          />
        )}
        {catalogo.data && totalItems === 0 && (
          <Vacio>
            Todavía no cargaste ítems. Empezá con “Nuevo ítem”: un producto o un servicio con su
            precio.
          </Vacio>
        )}
        {grupos.map((grupo) => (
          <div key={grupo.clave} className="mt-4">
            <h3 className="text-seccion">{grupo.titulo}</h3>
            <ul className="mt-2 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
              {grupo.items.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        <Icono
                          icono={TIPO_ICONO[item.tipo ?? 'producto'] ?? CubeIcon}
                          tamano="chico"
                        />
                        {item.nombre}
                      </p>
                      <p className="font-display text-cifra-menor leading-none">{precio(item.precioCop)}</p>
                      {item.descripcion && (
                        <p className="text-sm text-texto-suave">{item.descripcion}</p>
                      )}
                      {!item.disponible && (
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-advertencia">
                          <Icono icono={ExclamationTriangleIcon} tamano="chico" />
                          Pausado: no aparece para pedir.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secundario inline-flex items-center gap-2 px-4 py-2 text-sm"
                      disabled={alternarDisponibilidad.isPending}
                      onClick={() => alternarDisponibilidad.mutate(item)}
                    >
                      <Icono icono={item.disponible ? PauseIcon : PlayIcon} tamano="chico" />
                      {item.disponible ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="btn-secundario inline-flex items-center gap-2 px-4 py-2 text-sm"
                      onClick={() => setItemDialogo({ item })}
                    >
                      <Icono icono={PencilSquareIcon} tamano="chico" /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn-peligro inline-flex items-center gap-2 px-4 py-2 text-sm"
                      onClick={() => {
                        setErrorEliminar(null);
                        setItemAEliminar(item);
                      }}
                    >
                      <Icono icono={TrashIcon} tamano="chico" /> Dar de baja
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {alternarDisponibilidad.isError && (
          <div className="mt-3">
            <ErrorRecargar
              mensaje={mensajeDeApi(alternarDisponibilidad.error)}
              onReintentar={() => alternarDisponibilidad.reset()}
              textoBoton="Cerrar"
            />
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="categorias-catalogo">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="categorias-catalogo" className="font-display text-titulo-menor">
            Categorías {categorias.data ? `(${categorias.data.length})` : ''}
          </h2>
          <button
            type="button"
            className="btn-secundario inline-flex items-center gap-2 px-4 py-2 text-sm"
            onClick={() => setCategoriaDialogo({ categoria: null })}
          >
            <Icono icono={PlusIcon} tamano="chico" /> Nueva categoría
          </button>
        </div>
        <p className="mt-1 text-sm text-texto-suave">
          Agrupan tus ítems en el perfil público. Ej.: Bebidas, Entradas, Servicios.
        </p>

        {categorias.isLoading && <Cargando texto="Cargando categorías…" />}
        {categorias.isError && (
          <ErrorRecargar
            mensaje={mensajeDeApi(categorias.error)}
            onReintentar={() => categorias.refetch()}
          />
        )}
        {categorias.data && categorias.data.length === 0 && (
          <Vacio>Sin categorías todavía. Podés agrupar tus ítems cuando quieras.</Vacio>
        )}
        {categorias.data && categorias.data.length > 0 && (
          <ul className="mt-2 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
            {categorias.data.map((categoria) => (
              <li
                key={categoria.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Icono icono={TagIcon} tamano="chico" />
                  {categoria.nombre}
                  <span className="text-sm font-normal text-texto-suave">
                    orden {categoria.orden}
                  </span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                    onClick={() => setCategoriaDialogo({ categoria })}
                  >
                    <Icono icono={PencilSquareIcon} tamano="chico" /> Editar
                  </button>
                  <button
                    type="button"
                    className="btn-peligro inline-flex items-center gap-2 px-3 py-2 text-sm"
                    onClick={() => {
                      setErrorEliminar(null);
                      setCategoriaAEliminar(categoria);
                    }}
                  >
                    <Icono icono={TrashIcon} tamano="chico" /> Eliminar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialogo
        abierto={itemDialogo !== null}
        titulo={itemDialogo?.item ? 'Editar ítem' : 'Nuevo ítem'}
        onCerrar={() => setItemDialogo(null)}
      >
        {itemDialogo && (
          <FormularioItem
            item={itemDialogo.item}
            categorias={categorias.data ?? []}
            onGuardar={async (datos) => {
              await guardarItem.mutateAsync({ item: itemDialogo.item, datos });
            }}
            onCancelar={() => setItemDialogo(null)}
          />
        )}
      </Dialogo>

      <Dialogo
        abierto={categoriaDialogo !== null}
        titulo={categoriaDialogo?.categoria ? 'Editar categoría' : 'Nueva categoría'}
        onCerrar={() => setCategoriaDialogo(null)}
      >
        {categoriaDialogo && (
          <FormularioCategoria
            categoria={categoriaDialogo.categoria}
            onGuardar={async (datos) => {
              await guardarCategoria.mutateAsync({ categoria: categoriaDialogo.categoria, datos });
            }}
            onCancelar={() => setCategoriaDialogo(null)}
          />
        )}
      </Dialogo>

      <Dialogo
        abierto={itemAEliminar !== null}
        titulo="¿Dar de baja este ítem?"
        onCerrar={() => setItemAEliminar(null)}
      >
        <p>
          <strong>{itemAEliminar?.nombre}</strong> deja de mostrarse en el catálogo público y ya no
          se puede pedir. Los pedidos anteriores no se tocan.
        </p>
        {errorEliminar && (
          <div className="mt-3">
            <Aviso tipo="error">{errorEliminar}</Aviso>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-peligro px-4 py-3"
            disabled={darDeBajaItem.isPending}
            onClick={() => itemAEliminar && darDeBajaItem.mutate(itemAEliminar)}
          >
            {darDeBajaItem.isPending ? 'Dando de baja…' : 'Sí, dar de baja'}
          </button>
          <button type="button" className="btn-secundario px-4 py-3" onClick={() => setItemAEliminar(null)}>
            Cancelar
          </button>
        </div>
      </Dialogo>

      <Dialogo
        abierto={categoriaAEliminar !== null}
        titulo="¿Eliminar esta categoría?"
        onCerrar={() => setCategoriaAEliminar(null)}
      >
        <p>
          Se elimina <strong>{categoriaAEliminar?.nombre}</strong>. Sus ítems no se borran: quedan
          como “Sin categoría” en tu catálogo.
        </p>
        {errorEliminar && (
          <div className="mt-3">
            <Aviso tipo="error">{errorEliminar}</Aviso>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-peligro px-4 py-3"
            disabled={borrarCategoria.isPending}
            onClick={() => categoriaAEliminar && borrarCategoria.mutate(categoriaAEliminar)}
          >
            {borrarCategoria.isPending ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
          <button
            type="button"
            className="btn-secundario px-4 py-3"
            onClick={() => setCategoriaAEliminar(null)}
          >
            Cancelar
          </button>
        </div>
      </Dialogo>
    </main>
  );
}

const esquemaItem = z.object({
  nombre: z.string().trim().min(2, 'Ponéle un nombre al ítem (mínimo 2 letras).'),
  precio: z
    .string()
    .trim()
    .min(1, 'Indicá el precio.')
    .refine(
      (v) => /^\d+$/.test(v) && Number(v) > 0,
      'El precio tiene que ser un número entero mayor que cero. Ej.: 9500'
    ),
  descripcion: z.string().trim(),
  tipo: z.enum(['producto', 'servicio']),
  categoriaId: z.string()
});

type ValoresItem = z.infer<typeof esquemaItem>;

function FormularioItem({
  item,
  categorias,
  onGuardar,
  onCancelar
}: {
  item: ItemCatalogo | null;
  categorias: CategoriaCatalogo[];
  onGuardar: (datos: DatosItemCatalogo) => Promise<void>;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ValoresItem>({
    resolver: zodResolver(esquemaItem),
    defaultValues: {
      nombre: item?.nombre ?? '',
      precio: item ? String(item.precioCop) : '',
      descripcion: item?.descripcion ?? '',
      tipo: item?.tipo === 'servicio' ? 'servicio' : 'producto',
      categoriaId: item?.categoriaId ? String(item.categoriaId) : ''
    }
  });

  const enviar = async (v: ValoresItem) => {
    setError(null);
    try {
      await onGuardar({
        nombre: v.nombre.trim(),
        precioCop: Number(v.precio),
        descripcion: v.descripcion.trim() || undefined,
        tipo: v.tipo,
        categoriaId: v.categoriaId ? Number(v.categoriaId) : null
      });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
      <div>
        <label htmlFor="item-nombre" className="font-semibold">
          Nombre
        </label>
        <input
          id="item-nombre"
          className="campo mt-1"
          placeholder="Ej.: Café americano"
          aria-describedby="item-nombre-error"
          {...register('nombre')}
        />
        {formState.errors.nombre && (
          <p id="item-nombre-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
            <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
            <span>{formState.errors.nombre.message}</span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="item-precio" className="font-semibold">
            Precio (COP)
          </label>
          <input
            id="item-precio"
            className="campo mt-1"
            inputMode="numeric"
            placeholder="9500"
            aria-describedby="item-precio-error"
            {...register('precio')}
          />
          {formState.errors.precio && (
            <p id="item-precio-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.precio.message}</span>
            </p>
          )}
        </div>
        <div>
          <label htmlFor="item-tipo" className="font-semibold">
            Tipo
          </label>
          <select id="item-tipo" className="campo mt-1" {...register('tipo')}>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="item-categoria" className="font-semibold">
          Categoría
        </label>
        <select id="item-categoria" className="campo mt-1" {...register('categoriaId')}>
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="item-descripcion" className="font-semibold">
          Descripción <span className="font-normal text-texto-suave">(opcional)</span>
        </label>
        <textarea
          id="item-descripcion"
          rows={3}
          className="campo mt-1"
          placeholder="Ingredientes, tamaño, duración del servicio…"
          {...register('descripcion')}
        />
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" className="btn-principal px-4 py-3" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Guardando…' : 'Guardar ítem'}
        </button>
        <button type="button" className="btn-secundario px-4 py-3" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

const esquemaCategoria = z.object({
  nombre: z.string().trim().min(2, 'Ponéle un nombre a la categoría (mínimo 2 letras).'),
  orden: z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d+$/.test(v), 'El orden tiene que ser un número entero.')
});

type ValoresCategoria = z.infer<typeof esquemaCategoria>;

function FormularioCategoria({
  categoria,
  onGuardar,
  onCancelar
}: {
  categoria: CategoriaCatalogo | null;
  onGuardar: (datos: { nombre: string; orden?: number }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ValoresCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: {
      nombre: categoria?.nombre ?? '',
      orden: categoria ? String(categoria.orden) : ''
    }
  });

  const enviar = async (v: ValoresCategoria) => {
    setError(null);
    try {
      await onGuardar({
        nombre: v.nombre.trim(),
        orden: v.orden === '' ? undefined : Number(v.orden)
      });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
      <div>
        <label htmlFor="categoria-nombre" className="font-semibold">
          Nombre
        </label>
        <input
          id="categoria-nombre"
          className="campo mt-1"
          placeholder="Ej.: Bebidas"
          aria-describedby="categoria-nombre-error"
          {...register('nombre')}
        />
        {formState.errors.nombre && (
          <p id="categoria-nombre-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
            <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
            <span>{formState.errors.nombre.message}</span>
          </p>
        )}
      </div>
      <div>
        <label htmlFor="categoria-orden" className="font-semibold">
          Orden <span className="font-normal text-texto-suave">(opcional)</span>
        </label>
        <input
          id="categoria-orden"
          className="campo mt-1"
          inputMode="numeric"
          placeholder="0"
          aria-describedby="categoria-orden-ayuda categoria-orden-error"
          {...register('orden')}
        />
        <p id="categoria-orden-ayuda" className="mt-1 text-sm text-texto-suave">
          Las categorías con número menor aparecen primero.
        </p>
        {formState.errors.orden && (
          <p id="categoria-orden-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
            <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
            <span>{formState.errors.orden.message}</span>
          </p>
        )}
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" className="btn-principal px-4 py-3" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Guardando…' : 'Guardar categoría'}
        </button>
        <button type="button" className="btn-secundario px-4 py-3" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
