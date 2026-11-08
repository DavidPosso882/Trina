import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CakeIcon,
  ExclamationTriangleIcon,
  FireIcon,
  HeartIcon,
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
import { useFavoritos } from '../lib/favoritos';
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
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function iconoCategoria(nombre: string): IconoSvg {
  return ICONOS_CATEGORIA[normalizar(nombre)] ?? TagIcon;
}

// Meta en cifras: el vacío se etiqueta "Sin dato", nunca un guion suelto.
const nivelPrecioTexto = (nivel?: number | null) =>
  nivel ? '$'.repeat(Math.min(Math.max(nivel, 1), 3)) : 'Sin dato';

const distanciaTexto = (km?: number | null) =>
  km != null ? `${km.toFixed(1).replace('.', ',')} km` : 'Sin dato';

/** PU-01 Inicio estilo SVG: título + buscador pill + mapa + píldoras + destacados (RF-08/RF-20/RF-21). */
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
    <div className="fondo-limpio">
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-16">
      <section
        aria-labelledby="portada"
        className="rounded-tarjeta border border-oliva/10 bg-white px-4 pb-6 pt-6 shadow-sm md:px-6"
      >
        <h1 id="portada" className="font-display text-titulo">
          Descubre lo mejor del pueblo
        </h1>

        <form role="search" className="mt-4 max-w-2xl" onSubmit={buscar}>
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave"
            />
            <label htmlFor="q" className="sr-only">
              ¿Qué buscas?
            </label>
            <input
              id="q"
              name="q"
              className="w-full rounded-full border border-oliva/15 bg-white py-3 pl-11 pr-24 shadow-sm placeholder:text-texto-suave"
              placeholder="¿Qué buscas?"
              autoComplete="off"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="btn-lima absolute bottom-1 right-1 top-1 px-4 text-sm [min-height:40px]">
              Buscar
            </button>
          </div>
          <p className="mt-1 text-sm text-texto-suave">Ej.: café, hospedaje, artesanías</p>
        </form>

        <div className="relative mt-6">
          {marcadores.isError ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-tarjeta border border-oliva/15 bg-crema px-4 text-center">
              <Icono icono={ExclamationTriangleIcon} tamano="grande" className="text-error" />
              <p className="text-sm text-texto-suave">No pudimos cargar el mapa del pueblo.</p>
              <button
                type="button"
                className="btn-secundario inline-flex items-center gap-2 px-4 py-2 text-sm"
                onClick={() => marcadores.refetch()}
              >
                <Icono icono={ArrowPathIcon} tamano="chico" /> Intentar de nuevo
              </button>
            </div>
          ) : marcadores.data ? (
            <Suspense
              fallback={
                <div aria-hidden="true" className="h-52 w-full animate-pulse rounded-tarjeta bg-crema" />
              }
            >
              <MapaPortada marcadores={marcadores.data} altoClase="h-52 md:h-72" />
            </Suspense>
          ) : (
            <div aria-hidden="true" className="h-52 w-full animate-pulse rounded-tarjeta bg-crema" />
          )}

          {marcadores.data && (
            <div className="pointer-events-none absolute left-3 top-3 z-[500] flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-oliva px-3 py-2 text-white">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-lima" />
              <span className="font-display text-lg font-extrabold leading-none">{abiertosAhora}</span>
              <span className="max-w-[9rem] text-xs font-semibold leading-tight">abiertos ahora cerca</span>
            </div>
          )}
        </div>

        <nav aria-label="Categorías" className="mt-5 overflow-x-auto pb-1">
          <ul className="flex w-max items-center gap-2">
            {categorias.isLoading && <li className="text-sm text-texto-suave">Cargando categorías…</li>}
            {categorias.isError && (
              <li role="alert" className="flex items-center gap-2 text-sm text-error">
                <Icono icono={ExclamationTriangleIcon} tamano="chico" />
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
                  className="inline-flex min-h-boton items-center gap-2 rounded-full border border-oliva/15 bg-white px-4 text-sm font-semibold text-oliva hover:border-oliva/40"
                >
                  <Icono icono={iconoCategoria(c.nombre)} tamano="chico" />
                  {c.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/explorar"
                className="inline-flex min-h-boton items-center gap-2 rounded-full bg-oliva px-4 text-sm font-semibold text-white"
              >
                Ver todas
                <Icono icono={ArrowRightIcon} tamano="chico" className="text-lima" />
              </Link>
            </li>
          </ul>
        </nav>
      </section>

      <section aria-labelledby="destacados" className="mt-8">
        <div className="flex items-center gap-2">
          <Icono icono={StarIcon} tamano="grande" className="text-dorado" />
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
            <p role="alert" className="flex items-start gap-2 rounded-tarjeta bg-error/10 p-3 text-error">
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
            Todavía no hay negocios publicados. Crea el tuyo y aparece aquí.{' '}
            <Link to="/registro" className="font-semibold text-primario underline">
              Quiero vender
            </Link>
          </p>
        )}
        {destacados.data && destacados.data.contenido.length > 0 && (
          <ListaDestacados negocios={destacados.data.contenido} />
        )}

        <Link
          to="/explorar"
          className="btn-lima mt-6 inline-flex px-6 py-3 text-sm"
        >
          <Icono icono={MapIcon} /> Ver todos en el mapa
        </Link>
      </section>
    </main>
    </div>
  );
}

function ListaDestacados({ negocios }: { negocios: FichaNegocio[] }) {
  const { ids: favoritos, alternar: alternarFav } = useFavoritos();
  return (
    <ul className="mt-3 grid gap-3 md:grid-cols-2">
      {negocios.map((n) => (
        <FilaDestacada
          key={n.id}
          negocio={n}
          esFavorito={favoritos.includes(n.id)}
          onAlternarFav={() => alternarFav(n.id)}
        />
      ))}
    </ul>
  );
}

/** Tarjeta SVG: foto o inicial + categoría + estado + precio/distancia + favorito + ver. */
function FilaDestacada({
  negocio: n,
  esFavorito,
  onAlternarFav
}: {
  negocio: FichaNegocio;
  esFavorito: boolean;
  onAlternarFav: () => void;
}) {
  return (
    <li
      className={`rounded-tarjeta bg-white p-3 shadow-sm ${
        n.destacado ? 'tarjeta-negocio-destacada' : 'border border-oliva/10'
      }`}
    >
      <div className="flex gap-3">
        <FotoDestacada id={n.id} nombre={n.nombre} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-full bg-crema px-2 py-0.5 text-xs font-semibold text-oliva/80">
              {n.categoria ?? 'Negocio local'}
            </span>
            <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${n.abiertoAhora ? 'text-exito' : 'text-error'}`}>
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${n.abiertoAhora ? 'bg-exito' : 'bg-error'}`} />
              {n.abiertoAhora ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
          <h3 className="mt-0.5 truncate font-display text-lg font-bold">
            <Link to={`/negocios/${n.id}`} className="hover:text-primario">{n.nombre}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-texto-suave">
            {nivelPrecioTexto(n.nivelPrecio)}
            {n.distanciaKm != null ? ` · ${distanciaTexto(n.distanciaKm)}` : ''}
            {n.destacado && n.insignia ? ` · ${n.insignia}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onAlternarFav}
              aria-pressed={esFavorito}
              aria-label={esFavorito ? `Quitar ${n.nombre} de favoritos` : `Guardar ${n.nombre} en favoritos`}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                esFavorito ? 'border-error/30 text-error' : 'border-oliva/15 text-oliva/60'
              }`}
            >
              <HeartIcon className="h-5 w-5" fill={esFavorito ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <Link
              to={`/negocios/${n.id}`}
              className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-bold ${n.destacado ? 'bg-lima text-oliva' : 'bg-oliva text-white'}`}
            >
              Ver comercio
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * La lista pública no trae foto: se pide la principal de cada destacado (máximo 4 en la portada).
 * Sin foto, el lugar lo ocupa un letrero con la inicial sobre crema.
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
        className="h-24 w-24 shrink-0 rounded-xl bg-crema object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-crema"
    >
      <span className="font-display text-3xl font-extrabold text-oliva/60">{nombre.trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}
