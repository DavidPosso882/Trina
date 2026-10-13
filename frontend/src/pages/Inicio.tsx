import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CakeIcon,
  ExclamationTriangleIcon,
  FireIcon,
  HomeModernIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PaintBrushIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  getCategorias,
  listarImagenes,
  listarNegocios,
  mapaNegocios,
  mensajeDeApi,
  type FichaNegocio
} from '../lib/api';
import { Icono, type IconoSvg } from '../components/Icono';

// El mapa pesa: se carga solo cuando la portada ya tiene pines que mostrar (code-splitting, §8 UI).
const MapaPortada = lazy(() =>
  import('../components/Mapa').then((m) => ({ default: m.MapaExplorar }))
);

// S5 — Heroicons en lugar del emoji que traiga la categoría; el texto siempre acompaña.
const ICONOS_CATEGORIA: Record<string, IconoSvg> = {
  restaurantes: CakeIcon,
  cafes: FireIcon,
  hospedajes: HomeModernIcon,
  artesanias: PaintBrushIcon,
  tiendas: ShoppingBagIcon,
  servicios: WrenchScrewdriverIcon,
  'experiencias y turismo': SparklesIcon
};

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function iconoCategoria(nombre: string): IconoSvg {
  return ICONOS_CATEGORIA[normalizar(nombre)] ?? TagIcon;
}

// Meta en cifras: el vacío se etiqueta "Sin dato", nunca un guion suelto.
const nivelPrecioTexto = (nivel?: number | null) =>
  nivel ? '$'.repeat(Math.min(Math.max(nivel, 1), 3)) : 'Sin dato';

const distanciaTexto = (km?: number | null) =>
  km != null ? `${km.toFixed(1).replace('.', ',')} km` : 'Sin dato';

/** PU-01 Inicio: buscador y categorías conectados al directorio público (RF-08/RF-20/RF-21). */
export default function Inicio() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const categorias = useQuery({ queryKey: ['categorias'], queryFn: getCategorias, staleTime: 5 * 60_000 });
  const destacados = useQuery({
    queryKey: ['inicio-destacados'],
    queryFn: () => listarNegocios({ orden: 'destacados', size: 4 })
  });
  const marcadores = useQuery({
    queryKey: ['inicio-mapa'],
    queryFn: () => mapaNegocios({}),
    staleTime: 5 * 60_000
  });

  const abiertosAhora = useMemo(
    () => (marcadores.data ?? []).filter((m) => m.abiertoAhora).length,
    [marcadores.data]
  );

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const limpio = texto.trim();
    navigate(limpio ? `/explorar?q=${encodeURIComponent(limpio)}` : '/explorar');
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <section
        aria-labelledby="portada"
        className="-mx-4 bg-bosque-profundo px-4 pb-6 pt-8 text-white sm:mx-0 sm:rounded-tarjeta"
      >
        <h1 id="portada" className="font-display text-titulo">
          Descubrí lo mejor del pueblo
        </h1>

        <form role="search" className="mt-4" onSubmit={buscar}>
          <label htmlFor="q" className="sr-only">
            ¿Qué buscás?
          </label>
          <input
            id="q"
            name="q"
            className="campo"
            placeholder="¿Qué buscás?"
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <p className="mt-1 text-sm text-white/70">Ej.: café, hospedaje, artesanías</p>
          <button
            type="submit"
            className="btn-principal mt-3 inline-flex items-center justify-center gap-2 px-6 py-3 ring-1 ring-white/25"
          >
            <Icono icono={MagnifyingGlassIcon} /> Buscar
          </button>
        </form>

        <div className="relative mt-6">
          {marcadores.isError ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-tarjeta border border-white/20 bg-white/5 px-4 text-center">
              <Icono icono={ExclamationTriangleIcon} tamano="grande" className="text-oro-cosecha" />
              <p className="text-sm text-white/85">No pudimos cargar el mapa del pueblo.</p>
              <button
                type="button"
                className="inline-flex min-h-boton items-center gap-2 rounded-tarjeta border border-white/30 px-4 text-sm font-semibold"
                onClick={() => marcadores.refetch()}
              >
                <Icono icono={ArrowPathIcon} tamano="chico" /> Intentar de nuevo
              </button>
            </div>
          ) : marcadores.data ? (
            <Suspense
              fallback={
                <div aria-hidden="true" className="h-52 w-full animate-pulse rounded-tarjeta bg-white/10" />
              }
            >
              <MapaPortada marcadores={marcadores.data} altoClase="h-52" />
            </Suspense>
          ) : (
            <div aria-hidden="true" className="h-52 w-full animate-pulse rounded-tarjeta bg-white/10" />
          )}

          {marcadores.data && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-tarjeta bg-blanco-mercado px-3 py-2 text-tinta-cafe">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-primario" />
              <span className="font-display text-cifra-menor leading-none">{abiertosAhora}</span>
              <span className="max-w-[9rem] text-xs font-semibold leading-tight">abiertos ahora cerca</span>
            </div>
          )}
        </div>

        <nav aria-label="Categorías" className="-mx-4 mt-5 overflow-x-auto px-4 pb-1">
          <ul className="flex w-max items-center gap-2">
            {categorias.isLoading && <li className="text-sm text-white/70">Cargando categorías…</li>}
            {categorias.isError && (
              <li role="alert" className="flex items-center gap-2 text-sm">
                <Icono icono={ExclamationTriangleIcon} tamano="chico" className="text-oro-cosecha" />
                No pudimos cargar las categorías.
                <button
                  type="button"
                  className="min-h-boton font-semibold underline"
                  onClick={() => categorias.refetch()}
                >
                  Intentar de nuevo
                </button>
              </li>
            )}
            {categorias.data?.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/explorar?categoria=${c.id}`}
                  className="inline-flex min-h-boton items-center gap-2 rounded-tarjeta border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Icono icono={iconoCategoria(c.nombre)} tamano="chico" />
                  {c.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/explorar"
                className="inline-flex min-h-boton items-center gap-2 rounded-tarjeta border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10"
              >
                Ver todas
                <Icono icono={ArrowRightIcon} tamano="chico" />
              </Link>
            </li>
          </ul>
        </nav>
      </section>

      <section aria-labelledby="destacados" className="mt-10">
        <div className="flex items-center gap-2">
          <Icono icono={StarIcon} tamano="grande" className="text-oro-cosecha" />
          <h2 id="destacados" className="font-display text-titulo-menor">
            Destacados
          </h2>
        </div>

        {destacados.isLoading && (
          <p role="status" className="mt-4 flex items-center gap-2 text-texto-suave">
            <Icono icono={ArrowPathIcon} className="animate-spin" /> Cargando destacados…
          </p>
        )}
        {destacados.isError && (
          <div className="mt-4">
            <p role="alert" className="flex items-start gap-2 rounded-campo bg-error/10 p-3 text-error">
              <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
              <span>{mensajeDeApi(destacados.error)}</span>
            </p>
            <button
              type="button"
              className="btn-secundario mt-2 inline-flex items-center gap-2 px-4 py-2"
              onClick={() => destacados.refetch()}
            >
              <Icono icono={ArrowPathIcon} /> Intentar de nuevo
            </button>
          </div>
        )}
        {destacados.data && destacados.data.contenido.length === 0 && (
          <p className="mt-4 text-texto-suave">
            Todavía no hay negocios publicados. Creá el tuyo y aparecé acá.{' '}
            <Link to="/registro" className="font-semibold text-primario underline">
              Quiero vender
            </Link>
          </p>
        )}
        {destacados.data && destacados.data.contenido.length > 0 && (
          <ul className="mt-2 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
            {destacados.data.contenido.map((n) => (
              <FilaDestacada key={n.id} negocio={n} />
            ))}
          </ul>
        )}

        <Link
          to="/explorar"
          className="btn-principal mt-6 inline-flex items-center gap-2 px-6 py-3"
        >
          <Icono icono={MapIcon} /> Ver todos en el mapa
        </Link>
      </section>
    </main>
  );
}

/** Fila editorial: foto grande a la izquierda, precio y distancia en cifras a la derecha. */
function FilaDestacada({ negocio: n }: { negocio: FichaNegocio }) {
  return (
    <li className="py-4">
      <Link to={`/negocios/${n.id}`} className="group flex gap-4">
        <FotoDestacada id={n.id} nombre={n.nombre} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-seccion group-hover:text-primario">{n.nombre}</h3>
            {n.destacado && (
              <span className="inline-flex items-center gap-1 rounded-campo bg-oro-cosecha/20 px-2 py-0.5 text-xs font-semibold text-tinta-cafe">
                <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" />
                {n.insignia ?? 'Destacada'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-texto-suave">{n.categoria ?? 'Negocio local'}</p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${n.abiertoAhora ? 'bg-primario' : 'bg-error'}`}
            />
            {n.abiertoAhora ? 'Abierto ahora' : 'Cerrado'}
          </p>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <dt className="text-xs text-texto-suave">Precio</dt>
              <dd className={n.nivelPrecio ? 'font-display text-cifra-menor' : 'text-sm text-texto-suave'}>
                {nivelPrecioTexto(n.nivelPrecio)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-texto-suave">Distancia</dt>
              <dd className={n.distanciaKm != null ? 'font-display text-cifra-menor' : 'text-sm text-texto-suave'}>
                {distanciaTexto(n.distanciaKm)}
              </dd>
            </div>
          </dl>
        </div>
      </Link>
    </li>
  );
}

/**
 * La lista pública no trae foto: se pide la principal de cada destacado (máximo 4 en la portada).
 * Sin foto, el lugar lo ocupa un letrero con la inicial y el color del sistema.
 */
function FotoDestacada({ id, nombre }: { id: number; nombre: string }) {
  const imagenes = useQuery({
    queryKey: ['imagenes', id],
    queryFn: () => listarImagenes(id),
    retry: false,
    staleTime: 5 * 60_000
  });
  const principal = useMemo(() => {
    const ordenadas = [...(imagenes.data ?? [])].sort(
      (a, b) => Number(b.principal) - Number(a.principal) || a.orden - b.orden
    );
    return ordenadas[0];
  }, [imagenes.data]);

  if (principal) {
    return (
      <img
        src={principal.urlMiniatura}
        alt=""
        loading="lazy"
        className="h-28 w-28 shrink-0 rounded-tarjeta bg-primario-claro object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-28 w-28 shrink-0 items-center justify-center rounded-tarjeta bg-primario-claro"
    >
      <span className="font-display text-cifra text-primario">{nombre.trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}
