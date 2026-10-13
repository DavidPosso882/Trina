import { NavLink } from 'react-router-dom';
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Icono, type IconoSvg } from '../Icono';

type Seccion = { to: string; texto: string; icono: IconoSvg; end?: boolean; claseIcono?: string };

const SECCIONES: Seccion[] = [
  { to: '/panel', texto: 'Inicio', icono: HomeIcon, end: true },
  { to: '/panel/pedidos', texto: 'Pedidos', icono: ShoppingBagIcon },
  { to: '/panel/reservas', texto: 'Reservas', icono: CalendarDaysIcon },
  { to: '/panel/negocio', texto: 'Mi negocio', icono: BuildingStorefrontIcon },
  { to: '/panel/catalogo', texto: 'Catálogo', icono: ClipboardDocumentListIcon },
  // S5 — la estrella de Destacado va en oro, en dosis mínima.
  { to: '/panel/membresia', texto: 'Membresía', icono: StarIcon, claseIcono: 'text-oro-cosecha' },
  { to: '/panel/estadisticas', texto: 'Estadísticas', icono: ChartBarIcon },
  { to: '/panel/resenas', texto: 'Reseñas', icono: ChatBubbleLeftEllipsisIcon }
];

/**
 * Navegación del panel (§2.3): lista horizontal con scroll en móvil y menú lateral en escritorio.
 * Cada enlace lleva icono + texto (nunca solo icono).
 */
export function NavPanel() {
  return (
    <nav
      aria-label="Secciones del panel"
      className="border-b bg-superficie lg:sticky lg:top-4 lg:mt-6 lg:ml-4 lg:w-56 lg:shrink-0 lg:rounded-tarjeta lg:border lg:p-2 lg:shadow"
    >
      <ul className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {SECCIONES.map((s) => (
          <li key={s.to}>
            <NavLink
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-campo px-3 py-2 ${
                  isActive ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'
                }`
              }
            >
              <Icono icono={s.icono} className={s.claseIcono} />
              {s.texto}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
