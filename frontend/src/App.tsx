import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ShoppingCartIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';
import { ProveedorSesion, useSesion } from './lib/auth';
import { ProveedorCarrito, useCarrito } from './lib/carrito';
import { Icono } from './components/Icono';

function Logo({ compacto = false, sobreClaro = false }: { compacto?: boolean; sobreClaro?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="TRINA inicio">
      <span aria-hidden="true" className="flex items-end gap-0.5">
        <span className="inline-block h-4 w-3 rounded-full bg-lima" />
        <span className="inline-block h-3 w-2.5 rounded-full bg-lima/40" />
      </span>
      <span className={`font-display font-extrabold tracking-tight ${sobreClaro ? 'text-[#1A2218]' : 'text-white'} ${compacto ? 'text-2xl' : 'text-xl'}`}>
        Trina
      </span>
      <span className="rounded-full bg-[#94B839] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-[#1A2218]">
        Explorar
      </span>
    </Link>
  );
}

/** Shell SVG Explorador: header/footer oliva + bottom nav pill en móvil (S1,S3). */
function Marco() {
  const { sesion, salir } = useSesion();
  const { cantidadTotal } = useCarrito();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sinMarco =
    pathname === '/ingresar' ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/recuperar-clave') ||
    pathname.startsWith('/restablecer-clave');
  if (sinMarco) {
    return (
      <div className="flex min-h-screen flex-col">
        <div key={pathname} className="animar-cambio-ruta flex w-full flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    );
  }
  // El admin gestiona, no opera como usuario: su nav es de administración (sin
  // Favoritos, Explorar ni Mi negocio). La campana y el avatar se mantienen.
  const enlacesNav =
    sesion?.rol === 'ADMINISTRADOR'
      ? [
          { a: '/admin', texto: 'Resumen', icono: ChartPieIcon, fin: true },
          { a: '/admin/usuarios', texto: 'Usuarios', icono: UsersIcon, fin: false },
          { a: '/admin/negocios', texto: 'Negocios', icono: BuildingStorefrontIcon, fin: false }
        ]
      : [
          { a: '/', texto: 'Inicio', icono: HomeIcon, fin: true },
          { a: '/explorar', texto: 'Explorar', icono: MagnifyingGlassIcon, fin: false },
          { a: '/favoritos', texto: 'Favoritos', icono: HeartIcon, fin: false },
          { a: sesion ? '/cuenta' : '/ingresar', texto: 'Mi cuenta', icono: UserIcon, fin: false },
          ...(sesion?.rol === 'COMERCIANTE'
            ? [{ a: '/panel', texto: 'Mi negocio', icono: BuildingStorefrontIcon, fin: false }]
            : [])
        ];
  const inicial = (sesion?.nombre ?? 'M').trim().charAt(0).toUpperCase() || 'M';
  return (
    <div className="flex min-h-screen flex-col bg-crema text-texto">
      <header className="hidden bg-oliva text-white md:block">
        <div className="mx-auto flex max-w-7xl xl:max-w-[1440px] items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <nav aria-label="Navegación principal" className="hidden items-center gap-6 text-sm md:flex">
            {enlacesNav.map((e) => (
              <NavLink
                key={e.texto}
                to={e.a}
                end={e.fin}
                className={({ isActive }) =>
                  `font-semibold transition-colors ${isActive ? 'text-lima' : 'text-white/70 hover:text-white'}`
                }
              >
                {e.texto}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {sesion ? (
              <>
                <Link
                  to="/notificaciones"
                  aria-label="Notificaciones"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <BellIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/cuenta"
                  aria-label="Mi cuenta"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-lima text-base font-extrabold text-oliva"
                >
                  {inicial}
                </Link>
                <button
                  type="button"
                  className="hidden px-3 py-2 text-sm font-semibold text-white/70 hover:text-white sm:block"
                  onClick={() => {
                    salir();
                    navigate('/');
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/ingresar" className="btn-lima px-5 py-2 text-sm">
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-white/40 px-5 text-sm font-bold text-white hover:bg-white/10"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navbar superior solo móvil: hamburguesa + logo claro + cuenta/carrito. */}
      <div className="border-b border-gray-100 bg-white md:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <button
            type="button"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1A2218] hover:bg-gray-100"
          >
            {menuAbierto ? (
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <Logo sobreClaro />
          <div className="flex items-center gap-1">
            <Link
              to={sesion ? '/cuenta' : '/ingresar'}
              aria-label="Mi cuenta"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#1A2218] hover:bg-gray-100"
            >
              <UserIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              to="/carrito"
              aria-label={cantidadTotal > 0 ? `Carrito, ${cantidadTotal} productos` : 'Carrito'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#1A2218] hover:bg-gray-100"
            >
              <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
              {cantidadTotal > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#94B839] px-1 text-[11px] font-extrabold text-[#1A2218]">
                  {cantidadTotal > 99 ? '99+' : cantidadTotal}
                </span>
              )}
            </Link>
          </div>
        </div>
        {menuAbierto && (
          <nav aria-label="Menú" className="border-t border-gray-100 px-4 py-2">
            <ul>
              {enlacesNav.map((e) => (
                <li key={e.texto}>
                  <NavLink
                    to={e.a}
                    end={e.fin}
                    onClick={() => setMenuAbierto(false)}
                    className={({ isActive }) =>
                      `flex min-h-boton items-center gap-3 rounded-xl px-3 font-semibold ${isActive ? 'bg-[#F0FDF4] text-[#1A2218]' : 'text-[#1A2218]/70 hover:bg-gray-50'}`
                    }
                  >
                    <Icono icono={e.icono} tamano="chico" />
                    {e.texto}
                  </NavLink>
                </li>
              ))}
              {sesion && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      salir();
                      setMenuAbierto(false);
                      navigate('/');
                    }}
                    className="flex min-h-boton w-full items-center gap-3 rounded-xl px-3 font-semibold text-[#1A2218]/70 hover:bg-gray-50"
                  >
                    <Icono icono={ArrowRightOnRectangleIcon} tamano="chico" />
                    Cerrar sesión
                  </button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </div>

      <div key={pathname} className="animar-cambio-ruta flex w-full flex-1 flex-col">
        <Outlet />
      </div>

      <footer className="mt-auto hidden bg-oliva py-4 text-xs text-white/60 md:block">
        <div className="mx-auto flex max-w-7xl xl:max-w-[1440px] items-center justify-between px-4">
          <p>© 2026 TRINA · Explorando lo local</p>
          <div className="flex gap-4">
            <Link to="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link to="/privacidad" className="hover:text-white">Términos</Link>
            <Link to="/explorar" className="hover:text-white">Contacto</Link>
          </div>
        </div>
      </footer>

      {pathname !== '/explorar' && (
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-3 bottom-3 z-50 md:hidden"
      >
        <div className="flex items-stretch justify-around rounded-full bg-oliva px-2 py-2 text-white shadow-lg">
          {enlacesNav.map((enlace) => (
            <NavLink
              key={enlace.texto}
              to={enlace.a}
              end={enlace.fin}
              className={({ isActive }) =>
                `flex min-h-boton flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold ${
                  isActive ? 'text-lima' : 'text-white/70'
                }`
              }
            >
              <Icono icono={enlace.icono} tamano="grande" />
              {enlace.texto}
            </NavLink>
          ))}
        </div>
      </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ProveedorSesion>
      <ProveedorCarrito>
        <Marco />
      </ProveedorCarrito>
    </ProveedorSesion>
  );
}
