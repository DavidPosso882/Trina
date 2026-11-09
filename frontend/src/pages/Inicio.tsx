import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AdjustmentsHorizontalIcon,
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
  listarNegocios,
  mapaNegocios,
  mensajeDeApi,
  type FichaNegocio
} from '../lib/api';
import { useFavoritos } from '../lib/favoritos';
import { useSesion } from '../lib/auth';
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

  const heroFoto = destacados.data?.contenido.find((n) => n.imagenPrincipal)?.imagenPrincipal ?? null;

  return (
    <div className="fondo-limpio">
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-16">
      {/* Sección superior solo móvil: buscador cápsula + hero bosque + carrusel menta. */}
      <div className="md:hidden">
        <form role="search" onSubmit={buscar} className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave"
            />
            <label htmlFor="q-movil" className="sr-only">
              ¿Qué buscas?
            </label>
            <input
              id="q-movil"
              name="q"
              className="w-full rounded-full border border-gray-200 bg-gray-100/80 py-3 pl-11 pr-4 shadow-sm placeholder:text-texto-suave"
              placeholder="¿Qué buscas?"
              autoComplete="off"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
          <button
            type="button"
            aria-label="Filtrar y explorar"
            onClick={() => navigate('/explorar')}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1A2218] text-white"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>

        <section aria-label="Descubre el pueblo" className="mt-4 rounded-3xl bg-[#1A2218] p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-extrabold leading-tight">
                Descubre lo <span className="text-[#94B839]">mejor</span> del{' '}
                <span className="text-[#94B839]">pueblo</span>
              </h1>
              <Link
                to="/explorar"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#94B839] px-6 font-extrabold text-[#1A2218]"
              >
                Explorar ahora
              </Link>
              <div aria-hidden="true" className="mt-4 flex items-center gap-1.5">
                <span className="h-1.5 w-6 rounded-full bg-[#94B839]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              </div>
            </div>
            {heroFoto ? (
              <img
                src={heroFoto}
                alt=""
                loading="lazy"
                className="h-32 w-24 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-32 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#1A2218]/40"
              >
                <TagIcon className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
          </div>
        </section>

        <nav aria-label="Categorías destacadas" className="mt-5">
          {categorias.isLoading && <p className="text-sm text-texto-suave">Cargando categorías…</p>}
          {categorias.isError && (
            <p role="alert" className="flex items-center gap-2 text-sm text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" />
              No pudimos cargar las categorías.
              <button
                type="button"
                className="min-h-boton font-semibold underline"
                onClick={() => categorias.refetch()}
              >
                Intentar de nuevo
              </button>
            </p>
          )}
          {categorias.data && (
            <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categorias.data.map((c) => (
                <Link
                  key={c.id}
                  to={`/explorar?categoria=${c.id}`}
                  className="flex w-16 shrink-0 flex-col items-center gap-2"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#94B839]/30 bg-[#F0FDF4] text-[#1A2218]">
                    <Icono icono={iconoCategoria(c.nombre)} tamano="grande" />
                  </span>
                  <span className="text-center text-xs font-semibold leading-tight text-[#1A2218]">
                    {c.nombre}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>
      <section
        aria-labelledby="portada"
        className="mt-4 rounded-tarjeta border border-oliva/10 bg-white px-4 pb-6 pt-6 shadow-sm md:mt-0 md:px-6"
      >
        <h1 id="portada" className="hidden font-display text-titulo md:block">
          Descubre lo mejor del pueblo
        </h1>

        <form role="search" className="mt-4 hidden max-w-2xl md:block" onSubmit={buscar}>
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

        <nav aria-label="Categorías" className="mt-5 hidden overflow-x-auto pb-1 md:block">
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
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const alAlternar = () => {
    if (!sesion) {
      navigate('/favoritos');
      return;
    }
    onAlternarFav();
  };
  const detallePrecio =
    [nivelPrecioTexto(n.nivelPrecio), n.distanciaKm != null ? distanciaTexto(n.distanciaKm) : null, n.destacado && n.insignia ? n.insignia : null]
      .filter(Boolean)
      .join(' • ');
  return (
    <li className="rounded-3xl border border-gray-200/80 bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#94B839] hover:shadow-xl">
      <div className="flex gap-4">
        <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-[#94B839]/5 shadow-sm">
          <FotoDestacada imagenPrincipal={n.imagenPrincipal} nombre={n.nombre} />
          <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#1A2218] backdrop-blur-md">
            {n.categoria ?? 'Negocio local'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 font-display text-lg font-bold text-[#1A2218]">
              <Link to={`/negocios/${n.id}`} className="hover:text-[#94B839]">{n.nombre}</Link>
            </h3>
            {n.abiertoAhora ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Abierto
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                Cerrado
              </span>
            )}
          </div>
          <p className="mt-2 inline-flex max-w-full items-center truncate rounded-lg bg-[#94B839]/15 px-2.5 py-1 text-xs font-medium text-[#1A2218]">
            <span aria-hidden="true" className="mr-1 text-[#94B839]">★</span>
            <span className="truncate">{detallePrecio}</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={alAlternar}
              aria-pressed={esFavorito}
              aria-label={esFavorito ? `Quitar ${n.nombre} de favoritos` : `Guardar ${n.nombre} en favoritos`}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                esFavorito ? 'border-error/30 text-error' : 'border-gray-200 text-gray-400 hover:border-[#94B839] hover:text-[#1A2218]'
              }`}
            >
              <HeartIcon className="h-5 w-5" fill={esFavorito ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <Link
              to={`/negocios/${n.id}`}
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#1A2218] px-4 text-sm font-bold text-white transition hover:bg-[#94B839] hover:text-[#1A2218]"
            >
              Ver comercio
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

/** La lista pública ya trae la miniatura principal; sin foto, inicial sobre crema. */
function FotoDestacada({
  imagenPrincipal,
  nombre
}: {
  imagenPrincipal?: string | null;
  nombre: string;
}) {
  if (imagenPrincipal) {
    return (
      <img
        src={imagenPrincipal}
        alt=""
        loading="lazy"
        className="h-36 w-36 rounded-2xl object-cover"
      />
    );
  }

  void nombre;
  return (
    <div
      aria-hidden="true"
      className="flex h-36 w-36 items-center justify-center rounded-2xl bg-[#94B839]/5 text-[#1A2218]/40"
    >
      <TagIcon className="h-8 w-8" aria-hidden="true" />
    </div>
  );
}
