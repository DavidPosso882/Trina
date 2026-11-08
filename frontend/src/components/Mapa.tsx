import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, ScaleControl, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowPathIcon, ExclamationTriangleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { MarcadorNegocio } from '../lib/api';
import { Icono } from './Icono';

/** Centro fijo en Alcalá, Valle del Cauca y sus aledaños (Ulloa, Cartago, Quindío cercano). */
const CENTRO_POR_DEFECTO: [number, number] = [4.6736, -75.7825];

/** Límites cerrados: foco en Alcalá y su zona rural (veredas, ~8 km a la redonda). */
const LIMITES_ALCALA: [[number, number], [number, number]] = [
  [4.6, -75.86],
  [4.74, -75.7]
];

// S5 — Leaflet arma los pines con HTML, fuera del árbol de React: los SVG de Heroicons van incrustados.
const svgPin = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" aria-hidden="true" style="width:34px;height:34px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))"><path fill-rule="evenodd" clip-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`;

const svgRayos = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" aria-hidden="true" style="width:18px;height:18px"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 4.136a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 0 1-1.061 1.06l-1.591-1.59a.75.75 0 0 1 0-1.061Zm12.728 0a.75.75 0 0 1 0 1.06l-1.591 1.592a.75.75 0 0 1-1.06-1.061l1.59-1.591a.75.75 0 0 1 1.061 0Zm-6.816 4.496a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.68ZM3 10.5a.75.75 0 0 1 .75-.75H6a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10.5Zm14.25 0a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H18a.75.75 0 0 1-.75-.75Zm-8.962 3.712a.75.75 0 0 1 0 1.061l-1.591 1.591a.75.75 0 1 1-1.061-1.06l1.591-1.592a.75.75 0 0 1 1.06 0Z"/></svg>`;

// Leaflet arma los pines con imágenes por ruta; usamos divIcon para no depender de esos assets.
function iconoPin(destacado: boolean) {
  const color = destacado ? '#94B839' : '#5A8A0A';
  return L.divIcon({
    className: '',
    html: svgPin(color),
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  });
}

function iconoGrupo(cantidad: number) {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:9999px;background:#5A8A0A;color:#fff;font-weight:700;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)">${cantidad}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
}

function iconoReferencia() {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#1D4ED8;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)">${svgRayos}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
}

type Grupo = { lat: number; lng: number; items: MarcadorNegocio[]; total: number };

/** Máximo de pines que se muestran por zona explorada para no saturar el mapa. */
const MAX_POR_ZONA = 5;

function ordenarZona(items: MarcadorNegocio[]): MarcadorNegocio[] {
  return [...items].sort((a, b) => {
    if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
    return a.id - b.id;
  });
}

/**
 * Agrupación simple por grilla según el zoom: evita cientos de pines encimados sin sumar una
 * librería de clusters. A zoom cercano cada negocio va con su pin propio.
 * Por zona explorada se muestran hasta MAX_POR_ZONA negocios cercanos (destacados primero).
 */
function agrupar(marcadores: MarcadorNegocio[], zoom: number): Grupo[] {
  const celda = zoom >= 15 ? 0 : zoom >= 13 ? 0.004 : zoom >= 11 ? 0.015 : 0.05;
  if (celda === 0) {
    return marcadores.map((m) => ({ lat: m.latitud, lng: m.longitud, items: [m], total: 1 }));
  }
  const grupos = new Map<string, Grupo>();
  for (const m of marcadores) {
    const clave = `${Math.round(m.latitud / celda)}:${Math.round(m.longitud / celda)}`;
    const actual = grupos.get(clave);
    if (actual) actual.items.push(m);
    else grupos.set(clave, { lat: m.latitud, lng: m.longitud, items: [m], total: 0 });
  }
  return [...grupos.values()].map((g) => {
    const ordenados = ordenarZona(g.items);
    return {
      lat: g.items.reduce((suma, i) => suma + i.latitud, 0) / g.items.length,
      lng: g.items.reduce((suma, i) => suma + i.longitud, 0) / g.items.length,
      items: ordenados.slice(0, MAX_POR_ZONA),
      total: g.items.length
    };
  });
}

function CapturarClic({
  activo,
  onPunto
}: {
  activo: boolean;
  onPunto: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (activo) onPunto(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function Recentrar({ punto }: { punto: { lat: number; lng: number } | null }) {
  const mapa = useMap();
  const anterior = useRef<string | null>(null);
  useEffect(() => {
    if (!punto) return;
    const clave = `${punto.lat.toFixed(5)}:${punto.lng.toFixed(5)}`;
    if (anterior.current === clave) return;
    anterior.current = clave;
    mapa.setView([punto.lat, punto.lng], Math.max(mapa.getZoom(), 15));
  }, [punto, mapa]);
  return null;
}

function AjustarAVista({ marcadores, activo }: { marcadores: MarcadorNegocio[]; activo: boolean }) {
  const mapa = useMap();
  const firma = useRef('');
  useEffect(() => {
    if (!activo || marcadores.length === 0) return;
    const nueva = marcadores
      .map((m) => m.id)
      .sort((a, b) => a - b)
      .join(',');
    if (nueva === firma.current) return;
    firma.current = nueva;
    if (marcadores.length === 1) {
      mapa.setView([marcadores[0].latitud, marcadores[0].longitud], 15);
      return;
    }
    mapa.fitBounds(
      L.latLngBounds(marcadores.map((m) => [m.latitud, m.longitud] as [number, number])),
      { padding: [30, 30], maxZoom: 15 }
    );
  }, [marcadores, mapa, activo]);
  return null;
}

/** Botón flotante para volver al centro de Alcalá sin perderse en la zona rural. */
function VolverAAlcala() {
  const mapa = useMap();
  return (
    <button
      type="button"
      onClick={() => mapa.setView([CENTRO_POR_DEFECTO[0], CENTRO_POR_DEFECTO[1]], 14)}
      className="absolute left-3 top-3 z-[500] rounded-full bg-oliva px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-oliva/90"
      aria-label="Volver a Alcalá"
    >
      Volver a Alcalá
    </button>
  );
}

function ContenidoMapa({
  marcadores,
  punto,
  modoPunto,
  onElegirPunto
}: {
  marcadores: MarcadorNegocio[];
  punto: { lat: number; lng: number } | null;
  modoPunto: boolean;
  onElegirPunto?: (lat: number, lng: number) => void;
}) {
  const mapa = useMap();
  const [zoom, setZoom] = useState(mapa.getZoom());
  const [limites, setLimites] = useState<L.LatLngBounds | null>(null);
  useMapEvents({
    zoomend: () => {
      setZoom(mapa.getZoom());
      setLimites(mapa.getBounds());
    },
    moveend: () => setLimites(mapa.getBounds())
  });
  useEffect(() => {
    setLimites(mapa.getBounds());
  }, [mapa]);
  const grupos = useMemo(() => agrupar(marcadores, zoom), [marcadores, zoom]);
  const visibles = useMemo(
    () => (limites ? grupos.filter((g) => limites.contains([g.lat, g.lng])) : grupos),
    [grupos, limites]
  );

  return (
    <>
      <CapturarClic activo={modoPunto} onPunto={(lat, lng) => onElegirPunto?.(lat, lng)} />
      <Recentrar punto={punto} />
      {/* Fijo en Alcalá: no auto-encuadramos a los marcadores para no salir de la zona. */}
      <AjustarAVista marcadores={marcadores} activo={false} />
      {punto && (
        <Marker position={[punto.lat, punto.lng]} icon={iconoReferencia()}>
          <Popup>Tu punto de referencia para calcular la distancia.</Popup>
        </Marker>
      )}
      {visibles.map((grupo) =>
        grupo.total === 1 ? (
          <Marker
            key={grupo.items[0].id}
            position={[grupo.lat, grupo.lng]}
            icon={iconoPin(grupo.items[0].destacado)}
          >
            <Tooltip
              permanent={zoom >= 15}
              direction="top"
              offset={[0, -34]}
              opacity={1}
              className="etiqueta-negocio"
            >
              {grupo.items[0].nombre}
            </Tooltip>
            <Popup>
              <strong>{grupo.items[0].nombre}</strong>
              <p style={{ margin: '2px 0' }}>{grupo.items[0].categoria ?? 'Negocio local'}</p>
              <p style={{ margin: '2px 0' }}>
                <span
                  aria-hidden="true"
                  className={`mr-1 inline-block h-2 w-2 rounded-full ${
                    grupo.items[0].abiertoAhora ? 'bg-primario' : 'bg-error'
                  }`}
                />{' '}
                {grupo.items[0].abiertoAhora ? 'Abierto ahora' : 'Cerrado'}
              </p>
              <Link to={`/negocios/${grupo.items[0].id}`} className="font-bold text-primario">
                Ver el perfil →
              </Link>
            </Popup>
          </Marker>
        ) : (
          <Marker
            key={`grupo-${grupo.lat.toFixed(4)}-${grupo.lng.toFixed(4)}`}
            position={[grupo.lat, grupo.lng]}
            icon={iconoGrupo(grupo.total)}
            eventHandlers={{
              click: () => mapa.setView([grupo.lat, grupo.lng], Math.min(mapa.getZoom() + 2, 18))
            }}
          >
            <Popup>
              <strong>{grupo.total} negocios aquí (mostrando {grupo.items.length})</strong>
              <ul style={{ margin: '6px 0', paddingLeft: '16px' }}>
                {grupo.items.map((n) => (
                  <li key={n.id} style={{ margin: '2px 0' }}>
                    <Link to={`/negocios/${n.id}`} className="font-bold text-primario">
                      {n.nombre}
                    </Link>{' '}
                    <span>· {n.abiertoAhora ? 'Abierto' : 'Cerrado'}</span>
                  </li>
                ))}
              </ul>
              {grupo.total > grupo.items.length && (
                <p style={{ margin: '2px 0' }}>Acércate para ver los {grupo.total - grupo.items.length} restantes.</p>
              )}
            </Popup>
          </Marker>
        )
      )}
    </>
  );
}

/**
 * Mapa del directorio (RF-09/RF-24): pines agrupados por grilla, tarjeta con enlace al perfil y
 * punto de referencia opcional para la búsqueda por cercanía.
 */
export function MapaExplorar({
  marcadores,
  punto = null,
  modoPunto = false,
  onElegirPunto,
  altoClase = 'h-[26rem]'
}: {
  marcadores: MarcadorNegocio[];
  punto?: { lat: number; lng: number } | null;
  modoPunto?: boolean;
  onElegirPunto?: (lat: number, lng: number) => void;
  altoClase?: string;
}) {
  // Mapa fijo en Alcalá: no seguimos al primer marcador para no salir de la zona.
  const centro: [number, number] = punto ? [punto.lat, punto.lng] : CENTRO_POR_DEFECTO;

  return (
    <div className="relative z-0">
      <MapContainer
        center={centro}
        zoom={14}
        minZoom={13}
        maxZoom={18}
        maxBounds={LIMITES_ALCALA}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        scrollWheelZoom
        doubleClickZoom
        dragging
        touchZoom
        keyboard
        worldCopyJump
        aria-label="Mapa de negocios"
        className={`${altoClase} w-full rounded-tarjeta border-2`}
        style={{ borderColor: '#1B2117' }}
      >
        <ZoomControl position="bottomleft" />
        <ScaleControl position="bottomleft" imperial={false} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          keepBuffer={6}
        />
        <VolverAAlcala />
        <ContenidoMapa
          marcadores={marcadores}
          punto={punto}
          modoPunto={modoPunto}
          onElegirPunto={onElegirPunto}
        />
      </MapContainer>
      {marcadores.length === 0 && (
        <p className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-campo bg-superficie p-3 text-center shadow">
          Sin negocios con estos filtros. Prueba ampliar la búsqueda.
        </p>
      )}
    </div>
  );
}

/**
 * Selector de ubicación del asistente (RF-06): pin arrastrable sobre el mapa, toque para marcar
 * y "usar mi ubicación" con permiso; si se niega, quedan las coordenadas manuales como respaldo.
 */
export function SelectorUbicacion({
  lat,
  lng,
  onCambiar
}: {
  lat: number | null;
  lng: number | null;
  onCambiar: (lat: number, lng: number) => void;
}) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const punto = lat !== null && lng !== null ? { lat, lng } : null;
  const centro: [number, number] = punto ? [punto.lat, punto.lng] : CENTRO_POR_DEFECTO;

  const usarMiUbicacion = () => {
    if (!('geolocation' in navigator)) {
      setAviso('Tu navegador no permite usar tu ubicación. Toca el mapa o escribe las coordenadas.');
      return;
    }
    setBuscando(true);
    setAviso(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscando(false);
        onCambiar(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setBuscando(false);
        setAviso('No pudimos usar tu ubicación. Toca el mapa o escribe las coordenadas a mano.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative z-0">
        <MapContainer
          center={centro}
          zoom={punto ? 16 : 14}
          minZoom={13}
          maxZoom={18}
          maxBounds={LIMITES_ALCALA}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          scrollWheelZoom
          keyboard
          aria-label="Mapa para marcar la ubicación de tu negocio"
          className="h-64 w-full rounded-tarjeta border-2"
          style={{ borderColor: '#8a8f98' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomleft" />
          <CapturarClic activo onPunto={onCambiar} />
          <Recentrar punto={punto} />
          {punto && (
            <Marker
              position={[punto.lat, punto.lng]}
              draggable
              icon={iconoPin(false)}
              eventHandlers={{
                dragend: (e) => {
                  const p = (e.target as L.Marker).getLatLng();
                  onCambiar(p.lat, p.lng);
                }
              }}
            >
              <Popup>Arrastra el pin para ajustar la ubicación de tu negocio.</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <button
        type="button"
        className="btn-secundario inline-flex items-center gap-2 px-4 py-2 text-sm"
        onClick={usarMiUbicacion}
        disabled={buscando}
      >
        <Icono
          icono={buscando ? ArrowPathIcon : MapPinIcon}
          className={buscando ? 'animate-spin' : undefined}
        />
        {buscando ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
      </button>
      {aviso && (
        <p role="alert" className="flex items-start gap-2 rounded-campo bg-advertencia/10 p-3 text-advertencia">
          <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
          <span>{aviso}</span>
        </p>
      )}
      <p className="text-sm text-texto-suave">
        Arrastra el pin o toca el mapa para marcar el punto exacto. Si prefieres, escribe las
        coordenadas abajo.
      </p>
    </div>
  );
}
