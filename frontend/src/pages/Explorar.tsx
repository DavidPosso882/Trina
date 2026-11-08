import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  getCategorias,
  listarNegocios,
  mapaNegocios,
  mensajeDeApi,
  type FiltrosExplorar
} from '../lib/api';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';
import { useFavoritos } from '../lib/favoritos';
import { Icono } from '../components/Icono';
import { MapaExplorar } from '../components/Mapa';
import { TarjetaNegocio, iconoCategoria } from '../components/negocio/TarjetaNegocio';
import { TituloAtras } from '../components/TituloAtras';

/** Búsqueda sin tildes para que “cafe” encuentre “Café”. */
function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const NIVELES = [
  { valor: 1, texto: '$ Económico' },
  { valor: 2, texto: '$$ Medio' },
  { valor: 3, texto: '$$$ Alto' }
];

/** PU-02 Explorar SVG: título + buscador pill + toggle + píldoras + mapa y lista (RF-21/23/24). */
export default function Explorar() {
  const [parametros, setParametros] = useSearchParams();
  const categoriaParam = parametros.get('categoria') ?? '';
  const qParam = parametros.get('q') ?? '';

  const [texto, setTexto] = useState(qParam);
  const [busqueda, setBusqueda] = useState(qParam);
  const [categoriaId, setCategoriaId] = useState<number | null>(
    /^\\d+$/.test(categoriaParam) ? Number(categoriaParam) : null
  );
  const [abiertoAhora, setAbiertoAhora] = useState(false);
  const [nivelPrecio, setNivelPrecio] = useState<number | null>(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [orden, setOrden] = useState<'destacados' | 'nombre' | 'cercania'>('destacados');
  const [modoPunto, setModoPunto] = useState(false);
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

  const categorias = useQuery({ queryKey: ['categorias'], queryFn: getCategorias, staleTime: 5 * 60_000 });

  // ?categoria= puede traer el id o el nombre (enlaces viejos de la portada); aceptamos los dos.
  useEffect(() => {
    if (categoriaId !== null || !categoriaParam || !categorias.data) return;
    const normal = sinTildes(categoriaParam).toLowerCase();
    const encontrada = categorias.data.find(
      (c) => sinTildes(c.nombre).toLowerCase() === normal || c.nombre.toLowerCase() === normal
    );
    if (encontrada) setCategoriaId(encontrada.id);
  }, [categoriaId, categoriaParam, categorias.data]);

  const filtros = useMemo<FiltrosExplorar>(
    () => ({
      q: busqueda.trim() || undefined,
      categoriaId: categoriaId ?? undefined,
      abiertoAhora: abiertoAhora || undefined,
      nivelPrecio: nivelPrecio ?? undefined,
      lat: ubicacion?.lat,
      lng: ubicacion?.lng,
      orden: ubicacion ? 'cercania' : orden,
      pagina: 0,
      tamano: 30
    }),
    [busqueda, categoriaId, abiertoAhora, nivelPrecio, ubicacion, orden]
  );

  const negocios = useQuery({
    queryKey: ['explorar-negocios', filtros],
    queryFn: () => listarNegocios(filtros)
  });

  // Mapa fijo en Alcalá: si no hay punto elegido, pedimos cercanos a Alcalá (15 km)
  // para que siempre aparezcan puntos con las coordenadas de cada negocio.
  const filtrosMapa = useMemo<FiltrosExplorar>(
    () => ({
      ...filtros,
      lat: filtros.lat ?? 4.6736,
      lng: filtros.lng ?? -75.7825,
      radioKm: 15,
      orden: 'cercania'
    }),
    [filtros]
  );

  const marcadores = useQuery({
    queryKey: ['explorar-mapa', filtrosMapa],
    queryFn: () => mapaNegocios(filtrosMapa)
  });

  const actualizarParametros = (cambios: Record<string, string | null>) => {
    const siguiente = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
    }
    setParametros(siguiente, { replace: true });
  };

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const limpio = texto.trim();
    setBusqueda(limpio);
    actualizarParametros({ q: limpio || null });
  };

  const cambiarCategoria = (id: number | null) => {
    setCategoriaId(id);
    actualizarParametros({ categoria: id ? String(id) : null });
  };

  const hayFiltros = Boolean(busqueda.trim() || categoriaId || abiertoAhora || nivelPrecio || ubicacion);

  const limpiar = () => {
    setTexto('');
    setBusqueda('');
    setCategoriaId(null);
    setAbiertoAhora(false);
    setNivelPrecio(null);
    setUbicacion(null);
    setModoPunto(false);
    setAvisoUbicacion(null);
    actualizarParametros({ q: null, categoria: null });
  };

  const pedirUbicacion = () => {
    setAvisoUbicacion(null);
    if (!('geolocation' in navigator)) {
      setAvisoUbicacion('Tu navegador no permite usar tu ubicación. Elige tu punto en el mapa.');
      return;
    }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscandoUbicacion(false);
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setBuscandoUbicacion(false);
        setAvisoUbicacion('No pudimos usar tu ubicación. Elige tu punto de referencia en el mapa.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const elegirPuntoEnMapa = () => {
    setModoPunto(true);
    setAvisoUbicacion(null);
  };

  const quitarCercania = () => {
    setUbicacion(null);
    setModoPunto(false);
    setAvisoUbicacion(null);
  };

  const total = negocios.data?.total ?? 0;
  const categoriaActiva = categorias.data?.find((c) => c.id === categoriaId)?.nombre;
  const { ids: favoritos, alternar: alternarFav } = useFavoritos();

  return (
    <div className="fondo-limpio">
    <main className="mx-auto w-full max-w-7xl min-w-0 overflow-x-clip px-4 pb-28 pt-6 md:pb-16">
      <TituloAtras
        titulo="Descubre comercios locales"
        subtitulo="Encuentra restaurantes, cafés, tiendas y más cerca de ti"
      />

      <div className="mt-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <form role="search" className="min-w-0 flex-1" onSubmit={buscar}>
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave"
            />
            <label htmlFor="buscar" className="sr-only">
              Buscar por nombre o palabra clave
            </label>
            <input
              id="buscar"
              className="w-full rounded-full border border-oliva/15 bg-white py-3 pl-11 pr-24 shadow-sm placeholder:text-texto-suave"
              placeholder="Buscar por nombre o palabra clave…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="btn-lima absolute bottom-1 right-1 top-1 px-4 text-sm [min-height:40px]">
              Buscar
            </button>
          </div>
        </form>
        <button
          type="button"
          role="switch"
          aria-checked={abiertoAhora}
          aria-label="Abierto ahora"
          onClick={() => setAbiertoAhora((v) => !v)}
          className="flex min-h-boton items-center gap-2 self-start"
        >
          <span
            aria-hidden="true"
            className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${abiertoAhora ? 'bg-lima' : 'bg-oliva/20'}`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${abiertoAhora ? 'translate-x-5' : ''}`}
            />
          </span>
          <span className="font-semibold">Abierto ahora</span>
        </button>
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" role="group" aria-label="Categorías">
          <button
            type="button"
            onClick={() => cambiarCategoria(null)}
            aria-pressed={categoriaId === null}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              categoriaId === null ? 'bg-oliva text-white' : 'border border-oliva/15 bg-white text-oliva'
            }`}
          >
            <Icono icono={TagIcon} tamano="chico" className={categoriaId === null ? 'text-lima' : ''} />
            Todos
          </button>
          {categorias.data?.map((c) => {
            const IconoCat = iconoCategoria(c.nombre);
            const activa = c.id === categoriaId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => cambiarCategoria(activa ? null : c.id)}
                aria-pressed={activa}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                  activa ? 'bg-oliva text-white' : 'border border-oliva/15 bg-white text-oliva'
                }`}
              >
                <Icono icono={IconoCat} tamano="chico" className={activa ? 'text-lima' : ''} />
                {c.nombre}
              </button>
            );
          })}
        </div>
        <p className="hidden shrink-0 text-sm text-texto-suave md:block" role="status">
          {total} resultado{total === 1 ? '' : 's'}
          {categoriaActiva ? ` en ${categoriaActiva}` : ''}
        </p>
      </div>

      {categorias.isError && (
        <p role="alert" className="mt-2 rounded-tarjeta bg-error/10 p-3 text-error">
          No pudimos cargar las categorías.{' '}
          <button type="button" className="font-semibold underline" onClick={() => categorias.refetch()}>
            Intentar de nuevo
          </button>
        </p>
      )}

      <details className="mt-3 rounded-tarjeta border border-oliva/15 bg-white px-4 py-2">
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <ChevronDownIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-texto-suave" />
          Más filtros: precio y cercanía
        </summary>
        <div className="grid gap-3 py-3 sm:grid-cols-2">
          <div>
            <label htmlFor="filtro-precio" className="font-semibold">
              Nivel de precio
            </label>
            <select
              id="filtro-precio"
              className="desplegable mt-1"
              value={nivelPrecio ?? ''}
              onChange={(e) => setNivelPrecio(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Cualquier precio</option>
              {NIVELES.map((n) => (
                <option key={n.valor} value={String(n.valor)}>
                  {n.texto}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {ubicacion ? (
              <>
                <button
                  type="button"
                  className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                  onClick={quitarCercania}
                >
                  <Icono icono={MapPinIcon} tamano="chico" /> Cerca de mí (quitar)
                </button>
                <button
                  type="button"
                  className="text-sm font-semibold text-primario underline"
                  onClick={elegirPuntoEnMapa}
                >
                  Cambiar mi punto
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                  onClick={pedirUbicacion}
                  disabled={buscandoUbicacion}
                >
                  {buscandoUbicacion ? (
                    <>
                      <Icono icono={ArrowPathIcon} tamano="chico" className="animate-spin" /> Buscando tu ubicación…
                    </>
                  ) : (
                    <>
                      <Icono icono={MapPinIcon} tamano="chico" /> Usar mi ubicación
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="text-sm font-semibold text-primario underline"
                  onClick={elegirPuntoEnMapa}
                >
                  Elegir mi punto en el mapa
                </button>
              </>
            )}
            {hayFiltros && (
              <button
                type="button"
                className="inline-flex min-h-boton items-center gap-2 text-sm font-semibold text-primario underline"
                onClick={limpiar}
              >
                <Icono icono={XMarkIcon} tamano="chico" /> Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </details>

      {avisoUbicacion && (
        <p role="alert" className="mt-2 rounded-tarjeta bg-advertencia/10 p-3 text-advertencia">
          {avisoUbicacion}{' '}
          <button type="button" className="font-semibold underline" onClick={elegirPuntoEnMapa}>
            Elegir mi punto en el mapa
          </button>
        </p>
      )}

      <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-[44fr_56fr]">
        <section aria-label="Mapa de comercios" className="min-w-0">
          {modoPunto && (
            <p role="status" className="mb-2 rounded-tarjeta bg-info/10 p-3 text-info">
              Toca el mapa donde estés parado para calcular las distancias.
            </p>
          )}
          <div className="min-w-0 lg:sticky lg:top-4">
            {marcadores.isLoading && <Cargando texto="Cargando el mapa…" />}
            {marcadores.isError && (
              <ErrorRecargar
                mensaje={mensajeDeApi(marcadores.error)}
                onReintentar={() => marcadores.refetch()}
              />
            )}
            {marcadores.data && (
              <div className="relative min-w-0 overflow-hidden rounded-tarjeta">
                <MapaExplorar
                  marcadores={marcadores.data}
                  punto={ubicacion}
                  modoPunto={modoPunto}
                  onElegirPunto={(lat, lng) => {
                    setUbicacion({ lat, lng });
                    setModoPunto(false);
                  }}
                  altoClase="h-72 md:h-[36rem]"
                />
                <div className="pointer-events-none absolute left-3 top-3 z-[500] flex max-w-[calc(100%-1.5rem)]">
                  <p className="max-w-full truncate rounded-full bg-oliva/90 px-3 py-1.5 text-sm font-semibold text-white" role="status">
                    {total} comercio{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Lista de comercios" className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              {total} comercio{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Ordenar</span>
              <span className="relative inline-flex items-center">
                <select
                  value={ubicacion ? 'cercania' : orden}
                  disabled={Boolean(ubicacion)}
                  onChange={(e) => setOrden(e.target.value as 'destacados' | 'nombre' | 'cercania')}
                  className="appearance-none rounded-full border border-oliva/15 bg-white py-2 pl-3 pr-9 text-sm font-semibold disabled:opacity-60"
                >
                  <option value="destacados">Ordenar: Relevancia</option>
                  <option value="nombre">Ordenar: Nombre</option>
                  <option value="cercania">Ordenar: Cercanía</option>
                </select>
                <ChevronDownIcon aria-hidden="true" className="pointer-events-none absolute right-3 h-4 w-4 text-texto-suave" />
              </span>
            </label>
          </div>

          {negocios.isLoading && <Cargando texto="Cargando negocios…" />}
          {negocios.isError && (
            <ErrorRecargar
              mensaje={mensajeDeApi(negocios.error)}
              onReintentar={() => negocios.refetch()}
            />
          )}
          {negocios.data && negocios.data.total === 0 && (
            <Vacio>
              Sin resultados. Prueba quitar filtros o buscar por otra palabra, por ejemplo “café”.
            </Vacio>
          )}
          {negocios.data && negocios.data.total > 0 && (
            <ul className="mt-3 flex snap-x gap-4 overflow-x-auto pb-2 md:snap-none md:flex-col md:overflow-visible md:pb-0">
              {negocios.data.contenido.map((n) => (
                <TarjetaNegocio
                  key={n.id}
                  negocio={n}
                  esFavorito={favoritos.includes(n.id)}
                  onAlternarFav={() => alternarFav(n.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
    </div>
  );
}
