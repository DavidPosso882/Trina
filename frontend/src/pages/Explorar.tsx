import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  getCategorias,
  listarNegocios,
  mapaNegocios,
  mensajeDeApi,
  type FichaNegocio,
  type FiltrosExplorar
} from '../lib/api';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';
import { Icono } from '../components/Icono';
import { MapaExplorar } from '../components/Mapa';

/** Búsqueda sin tildes para que “cafe” encuentre “Café”. */
function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const NIVELES = [
  { valor: 1, texto: '$ Económico' },
  { valor: 2, texto: '$$ Medio' },
  { valor: 3, texto: '$$$ Alto' }
];

// Meta en cifras: el vacío se etiqueta "Sin dato", nunca un guion suelto.
const nivelPrecioTexto = (nivel?: number | null) =>
  nivel ? '$'.repeat(Math.min(Math.max(nivel, 1), 3)) : 'Sin dato';

/** PU-02 Explorar: lista y mapa con búsqueda, categoría, abierto ahora, precio y cercanía (RF-21/23/24). */
export default function Explorar() {
  const [parametros, setParametros] = useSearchParams();
  const categoriaParam = parametros.get('categoria') ?? '';
  const qParam = parametros.get('q') ?? '';

  const [texto, setTexto] = useState(qParam);
  const [busqueda, setBusqueda] = useState(qParam);
  const [categoriaId, setCategoriaId] = useState<number | null>(
    /^\d+$/.test(categoriaParam) ? Number(categoriaParam) : null
  );
  const [abiertoAhora, setAbiertoAhora] = useState(false);
  const [nivelPrecio, setNivelPrecio] = useState<number | null>(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
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
      orden: ubicacion ? 'cercania' : 'destacados',
      size: 30
    }),
    [busqueda, categoriaId, abiertoAhora, nivelPrecio, ubicacion]
  );

  const negocios = useQuery({
    queryKey: ['explorar-negocios', filtros],
    queryFn: () => listarNegocios(filtros)
  });

  const marcadores = useQuery({
    queryKey: ['explorar-mapa', filtros],
    queryFn: () => mapaNegocios(filtros),
    enabled: vista === 'mapa'
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
      setAvisoUbicacion('Tu navegador no permite usar tu ubicación. Elegí tu punto en el mapa.');
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
        setAvisoUbicacion('No pudimos usar tu ubicación. Elegí tu punto de referencia en el mapa.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const elegirPuntoEnMapa = () => {
    setVista('mapa');
    setModoPunto(true);
    setAvisoUbicacion(null);
  };

  const quitarCercania = () => {
    setUbicacion(null);
    setModoPunto(false);
    setAvisoUbicacion(null);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-4">
      <h1 className="font-display text-titulo-menor">Explorar</h1>

      <form role="search" className="mt-3 flex gap-2" onSubmit={buscar}>
        <label htmlFor="buscar" className="sr-only">
          Buscar
        </label>
        <input
          id="buscar"
          className="campo"
          placeholder="Negocio, categoría o producto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="btn-principal inline-flex items-center gap-2 px-4 py-2">
          <Icono icono={MagnifyingGlassIcon} /> Buscar
        </button>
      </form>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="filtro-categoria" className="font-semibold">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            className="campo mt-1"
            value={categoriaId ?? ''}
            disabled={categorias.isLoading}
            onChange={(e) => cambiarCategoria(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todas las categorías</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-precio" className="font-semibold">
            Nivel de precio
          </label>
          <select
            id="filtro-precio"
            className="campo mt-1"
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
      </div>

      {categorias.isError && (
        <p role="alert" className="mt-2 flex items-start gap-2 rounded-campo bg-error/10 p-3 text-error">
          <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
          <span>
            No pudimos cargar las categorías.{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => categorias.refetch()}
            >
              Intentar de nuevo
            </button>
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex min-h-boton items-center gap-2">
          <input
            type="checkbox"
            checked={abiertoAhora}
            onChange={(e) => setAbiertoAhora(e.target.checked)}
          />
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primario" />
          Abierto ahora
        </label>
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

      {avisoUbicacion && (
        <p role="alert" className="mt-2 flex items-start gap-2 rounded-campo bg-advertencia/10 p-3 text-advertencia">
          <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
          <span>
            {avisoUbicacion}{' '}
            <button type="button" className="font-semibold underline" onClick={elegirPuntoEnMapa}>
              Elegir mi punto en el mapa
            </button>
          </span>
        </p>
      )}

      <div className="mt-4 flex gap-1 border-b border-tinta-cafe/10" role="tablist" aria-label="Vista">
        <button
          role="tab"
          aria-selected={vista === 'lista'}
          className={`-mb-px inline-flex min-h-boton items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
            vista === 'lista' ? 'border-primario text-primario' : 'border-transparent text-texto-suave'
          }`}
          onClick={() => setVista('lista')}
        >
          <Icono icono={ListBulletIcon} tamano="chico" /> Lista
        </button>
        <button
          role="tab"
          aria-selected={vista === 'mapa'}
          className={`-mb-px inline-flex min-h-boton items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
            vista === 'mapa' ? 'border-primario text-primario' : 'border-transparent text-texto-suave'
          }`}
          onClick={() => setVista('mapa')}
        >
          <Icono icono={MapIcon} tamano="chico" /> Mapa
        </button>
      </div>

      {vista === 'lista' && (
        <>
          {negocios.isLoading && <Cargando texto="Cargando negocios…" />}
          {negocios.isError && (
            <ErrorRecargar
              mensaje={mensajeDeApi(negocios.error)}
              onReintentar={() => negocios.refetch()}
            />
          )}
          {negocios.data && negocios.data.total === 0 && (
            <Vacio>
              Sin resultados. Probá quitar filtros o buscar por otra palabra, por ejemplo “café”.
            </Vacio>
          )}
          {negocios.data && negocios.data.total > 0 && (
            <>
              <p className="mt-3 text-sm text-texto-suave" role="status">
                {negocios.data.total === negocios.data.contenido.length
                  ? `${negocios.data.total} negocio${negocios.data.total === 1 ? '' : 's'}`
                  : `Mostrando ${negocios.data.contenido.length} de ${negocios.data.total} negocios`}
              </p>
              <ul className="mt-1 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
                {negocios.data.contenido.map((n) => (
                  <FilaNegocio key={n.id} negocio={n} />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {vista === 'mapa' && (
        <>
          {modoPunto && (
            <p role="status" className="mt-3 flex items-start gap-2 rounded-campo bg-info/10 p-3 text-info">
              <Icono icono={MapPinIcon} className="mt-0.5" />
              <span>Tocá el mapa donde estés parado para calcular las distancias.</span>
            </p>
          )}
          {ubicacion && !modoPunto && (
            <p className="mt-3 flex items-start gap-2 text-sm text-texto-suave">
              <Icono icono={MapPinIcon} tamano="chico" className="mt-0.5" />
              <span>
                Punto de referencia: {ubicacion.lat.toFixed(4).replace('.', ',')},{' '}
                {ubicacion.lng.toFixed(4).replace('.', ',')}
              </span>
            </p>
          )}
          {marcadores.isLoading && <Cargando texto="Cargando el mapa…" />}
          {marcadores.isError && (
            <ErrorRecargar
              mensaje={mensajeDeApi(marcadores.error)}
              onReintentar={() => marcadores.refetch()}
            />
          )}
          {marcadores.data && (
            <div className="mt-3">
              <MapaExplorar
                marcadores={marcadores.data}
                punto={ubicacion}
                modoPunto={modoPunto}
                onElegirPunto={(lat, lng) => {
                  setUbicacion({ lat, lng });
                  setModoPunto(false);
                }}
                altoClase="h-[30rem]"
              />
              <p className="mt-2 text-sm text-texto-suave">
                {marcadores.data.length} negocio{marcadores.data.length === 1 ? '' : 's'} en el mapa.
                Tocá un pin para ver la tarjeta y abrir el perfil.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

/** Fila editorial: nombre y estado a la izquierda; precio y distancia en cifras a la derecha. */
function FilaNegocio({ negocio: n }: { negocio: FichaNegocio }) {
  return (
    <li className="py-4">
      <Link to={`/negocios/${n.id}`} className="group flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-display text-seccion group-hover:text-primario">{n.nombre}</h2>
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
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-texto-suave">Precio</p>
          <p className={n.nivelPrecio ? 'font-display text-cifra-menor' : 'text-sm text-texto-suave'}>
            {nivelPrecioTexto(n.nivelPrecio)}
          </p>
          {n.distanciaKm != null && (
            <>
              <p className="mt-1 text-xs text-texto-suave">Distancia</p>
              <p className="font-display text-cifra-menor">
                {n.distanciaKm.toFixed(1).replace('.', ',')} km
              </p>
            </>
          )}
        </div>
      </Link>
    </li>
  );
}
