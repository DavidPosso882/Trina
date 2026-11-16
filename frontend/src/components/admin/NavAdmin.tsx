import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  TagIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Icono, type IconoSvg } from '../Icono';
import { useSesion } from '../../lib/auth';

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

/** Sidebar bosque pegado al borde con pestaña recortada; lista horizontal en móvil. */
export function NavAdmin() {
  const { salir } = useSesion();
  const navigate = useNavigate();

  return (
    <>
      {/* Móvil: lista horizontal con scroll (el rail no se aplasta al teléfono). */}
      <nav aria-label="Secciones de administración" className="sticky top-0 z-30 border-b border-gray-100 bg-white lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-3 py-2">
          {SECCIONES.map((s) => (
            <li key={s.to} className="shrink-0">
              <NavLink
                to={s.to}
                end={s.end}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition-colors duration-200 ${
                    isActive ? 'bg-[#1A2218] font-bold text-white shadow-sm' : 'text-gray-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono icono={s.icono} className={isActive ? 'text-[#94B839]' : undefined} />
                    {s.texto}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Escritorio: panel fijo de arriba abajo, solo el contenido de la derecha scrollea. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden h-screen w-64 flex-col justify-between bg-[#1A2218] p-4 text-white supports-[height:100dvh]:h-[100dvh] lg:flex">
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2" aria-label="TRINA administración">
            <span aria-hidden="true" className="flex shrink-0 items-end gap-0.5">
              <span className="inline-block h-4 w-3 rounded-full bg-lima" />
              <span className="inline-block h-3 w-2.5 rounded-full bg-lima/40" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              Trina
            </span>
            <span className="rounded-full bg-[#94B839] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-[#1A2218]">
              Explorar
            </span>
          </div>

          <ul className="mt-8 flex min-h-0 flex-col gap-2 overflow-y-auto">
            {SECCIONES.map((s) => (
              <li key={s.to}>
                <NavLink
                  to={s.to}
                  end={s.end}
                  className={({ isActive }) =>
                    isActive
                      ? 'relative flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-full bg-[#F8F9FA] px-4 py-3 font-bold text-[#1A2218] shadow-md transition-all duration-500 ease-out'
                      : 'relative flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-full px-4 py-3 text-white/75 transition-all duration-500 ease-out hover:bg-white/10 hover:text-white'
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ease-out ${
                          isActive ? 'bg-[#F0FDF4] text-[#1A2218]' : 'bg-white/10 text-white/75'
                        }`}
                      >
                        <Icono icono={s.icono} />
                      </span>
                      <span className="truncate">{s.texto}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => {
            salir();
            navigate('/');
          }}
          className="flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-full px-4 py-3 text-white/75 transition-all duration-500 ease-out hover:bg-white/10 hover:text-white"
        >
          <Icono icono={ArrowRightOnRectangleIcon} tamano="chico" />
          <span>Salir</span>
        </button>
      </aside>
    </>
  );
}
