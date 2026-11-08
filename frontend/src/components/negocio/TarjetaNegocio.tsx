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
  const inicial = n.nombre.trim().charAt(0).toUpperCase() || 'T';
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const alAlternar = () => {
    if (!sesion) {
      navigate('/favoritos');
      return;
    }
    onAlternarFav();
  };
  return (
    <li
      className={`w-64 shrink-0 snap-start rounded-tarjeta bg-white p-3 shadow-sm md:w-auto ${
        n.destacado ? 'tarjeta-negocio-destacada' : 'border border-oliva/10'
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row">
        {n.imagenPrincipal ? (
          <img
            src={n.imagenPrincipal}
            alt=""
            loading="lazy"
            className="h-28 w-full rounded-xl bg-crema object-cover md:h-24 md:w-28 md:shrink-0"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-28 items-center justify-center rounded-xl bg-crema md:h-24 md:w-28 md:shrink-0"
          >
            <span className="flex items-center gap-2 text-oliva/60">
              <Icono icono={IconoCat} tamano="grande" />
              <span className="font-display text-2xl font-extrabold">{inicial}</span>
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <span className="max-w-[60%] truncate rounded-full bg-crema px-2 py-0.5 text-xs font-semibold text-oliva/80">
              {n.categoria ?? 'Negocio local'}
            </span>
            <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${n.abiertoAhora ? 'text-exito' : 'text-error'}`}>
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${n.abiertoAhora ? 'bg-exito' : 'bg-error'}`} />
              {n.abiertoAhora ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold">{n.nombre}</h3>
          <p className="line-clamp-2 text-sm text-texto-suave">
            {[n.descripcion?.split('·')[0]?.trim() ?? n.categoria ?? 'Comercio local', n.direccion].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-3 flex items-start justify-between gap-3 border-t border-oliva/10 pt-3">
            <p className="min-w-0 pt-2 text-xs leading-relaxed text-texto-suave">
              {nivelPrecioTexto(n.nivelPrecio)}
              {n.distanciaKm != null ? ` · ${n.distanciaKm.toFixed(1).replace('.', ',')} km` : ''}
              {n.destacado && n.insignia ? ` · ${n.insignia}` : ''}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={alAlternar}
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
                className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-bold ${
                  n.destacado ? 'bg-lima text-oliva' : 'bg-oliva text-white'
                }`}
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
