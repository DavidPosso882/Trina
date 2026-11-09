import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BuildingStorefrontIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';
import { ProveedorSesion, useSesion } from './lib/auth';
import { ProveedorCarrito } from './lib/carrito';
import { Icono } from './components/Icono';

function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="TRINA inicio">
      <span aria-hidden="true" className="flex items-end gap-0.5">
        <span className="inline-block h-4 w-3 rounded-full bg-lima" />
        <span className="inline-block h-3 w-2.5 rounded-full bg-lima/40" />
      </span>
      <span className={`font-display font-extrabold tracking-tight text-white ${compacto ? 'text-2xl' : 'text-xl'}`}>
        Trina
      </span>
      <span className="rounded-full bg-lima px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-oliva">
        Explorar
      </span>
    </Link>
  );
}

/** Shell SVG Explorador: header/footer oliva + bottom nav pill en móvil (S1,S3). */
function Marco() {
  const { sesion, salir } = useSesion();
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
        <Outlet />
      </div>
    );
  }
  const enlacesNav = [
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
      <header className="bg-oliva text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
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

      <div className="flex w-full flex-1 flex-col">
        <Outlet />
      </div>

      <footer className="mt-auto hidden bg-oliva py-4 text-xs text-white/60 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <p>© 2026 TRINA · Explorando lo local</p>
          <div className="flex gap-4">
            <Link to="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link to="/privacidad" className="hover:text-white">Términos</Link>
            <Link to="/explorar" className="hover:text-white">Contacto</Link>
          </div>
        </div>
      </footer>

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
