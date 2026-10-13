import { NavLink } from 'react-router-dom';
import {
  BuildingStorefrontIcon,
  ChartPieIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  TagIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Icono, type IconoSvg } from '../Icono';

type Seccion = { to: string; texto: string; icono: IconoSvg; end?: boolean };

const SECCIONES: Seccion[] = [
  { to: '/admin', texto: 'Resumen', icono: ChartPieIcon, end: true },
  { to: '/admin/negocios', texto: 'Negocios', icono: BuildingStorefrontIcon },
  { to: '/admin/usuarios', texto: 'Usuarios', icono: UsersIcon },
  { to: '/admin/categorias', texto: 'Categorías', icono: TagIcon },
  { to: '/admin/parametros', texto: 'Parámetros y planes', icono: Cog6ToothIcon },
  { to: '/admin/resenas', texto: 'Reseñas', icono: ChatBubbleLeftEllipsisIcon },
  { to: '/admin/auditoria', texto: 'Auditoría', icono: DocumentMagnifyingGlassIcon }
];

/** Menú lateral del admin en escritorio; lista horizontal con scroll en móvil (§2.3). */
export function NavAdmin() {
  return (
    <nav
      aria-label="Secciones de administración"
      className="border-b bg-superficie lg:sticky lg:top-4 lg:mt-6 lg:ml-4 lg:w-60 lg:shrink-0 lg:rounded-tarjeta lg:border lg:p-2 lg:shadow"
    >
      <p className="hidden px-3 pt-2 text-sm font-bold uppercase tracking-wide text-texto-suave lg:block">
        TRINA Admin
      </p>
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
              <Icono icono={s.icono} />
              {s.texto}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
