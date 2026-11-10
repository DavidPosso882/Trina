import { Link, useNavigate } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import {
  BeakerIcon,
  BuildingStorefrontIcon,
  CakeIcon,
  FireIcon,
  HeartIcon,
  HomeModernIcon,
  SparklesIcon,
  TagIcon,
  TicketIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import type { FichaNegocio } from '../../lib/api';
import { useSesion } from '../../lib/auth';
import { Icono } from '../Icono';

type IconoSvg = ComponentType<SVGProps<SVGSVGElement>>;

/** Búsqueda sin tildes para que “cafe” encuentre “Café”. */
function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Meta en cifras: el vacío se etiqueta "Sin dato", nunca un guion suelto.
export const nivelPrecioTexto = (nivel?: number | null) =>
  nivel ? '$'.repeat(Math.min(Math.max(nivel, 1), 3)) : 'Sin dato';

/** Icono de la píldora por nombre de categoría (normalizado, sin tildes). */
export function iconoCategoria(nombre: string): IconoSvg {
  const n = sinTildes(nombre).toLowerCase();
  if (n.includes('restaurante')) return FireIcon;
  if (n.includes('cafe')) return BeakerIcon;
  if (n.includes('hospedaje') || n.includes('hotel') || n.includes('aloj')) return HomeModernIcon;
  if (n.includes('artesan')) return SparklesIcon;
  if (n.includes('tienda') || n.includes('mercado') || n.includes('comercio')) return BuildingStorefrontIcon;
  if (n.includes('servicio')) return WrenchScrewdriverIcon;
  if (n.includes('experiencia') || n.includes('tour') || n.includes('evento')) return TicketIcon;
  if (n.includes('comida') || n.includes('pan') || n.includes('dulce')) return CakeIcon;
  return TagIcon;
}

/** Tarjeta del negocio (S4): foto o inicial + categoría + estado + precio/distancia + favorito + ver. */
export function TarjetaNegocio({
  negocio: n,
  esFavorito,
  onAlternarFav
}: {
  negocio: FichaNegocio;
  esFavorito: boolean;
  onAlternarFav: () => void;
}) {
  const IconoCat = iconoCategoria(n.categoria ?? '');
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
    [nivelPrecioTexto(n.nivelPrecio), n.distanciaKm != null ? `${n.distanciaKm.toFixed(1).replace('.', ',')} km` : null, n.destacado && n.insignia ? n.insignia : null]
      .filter(Boolean)
      .join(' • ');
  return (
    <li
      className="w-72 shrink-0 snap-start rounded-3xl border border-gray-200/80 bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#94B839] hover:shadow-xl md:w-auto"
    >
      <div className="flex flex-row gap-4">
        <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-[#94B839]/5 shadow-sm">
          {n.imagenPrincipal ? (
            <img
              src={n.imagenPrincipal}
              alt=""
              loading="lazy"
              className="h-36 w-36 rounded-2xl object-cover"
            />
          ) : (
            <div aria-hidden="true" className="flex h-36 w-36 items-center justify-center rounded-2xl bg-[#94B839]/5 text-[#1A2218]/40">
              <Icono icono={IconoCat} tamano="grande" />
            </div>
          )}
          <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#1A2218] backdrop-blur-md">
            {n.categoria ?? 'Negocio local'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-h-[3.5rem] min-w-0 flex-1 font-display text-lg font-bold leading-7 text-[#1A2218]">{n.nombre}</h3>
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
          <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-gray-500">
            {[n.descripcion?.split('·')[0]?.trim() ?? n.categoria ?? 'Comercio local', n.direccion].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-2 inline-flex max-w-full items-center truncate rounded-lg bg-[#94B839]/15 px-2.5 py-1 text-xs font-medium text-[#1A2218]">
            <span aria-hidden="true" className="mr-1 text-[#94B839]">★</span>
            <span className="truncate">{detallePrecio}</span>
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
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
      </div>
    </li>
  );
}
