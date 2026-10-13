import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ProveedorSesion, useSesion } from './lib/auth';
import { ProveedorCarrito } from './lib/carrito';
import { Campana } from './components/Campana';
import { Icono } from './components/Icono';

/** Barra superior + inferior móvil según §2.3 del diseño UI. */
function Marco() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const enlacesNav = [
    { a: '/', texto: 'Inicio', icono: HomeIcon },
    { a: '/explorar', texto: 'Explorar', icono: MagnifyingGlassIcon },
    {
      a: sesion ? '/pedidos' : '/ingresar',
      texto: 'Pedidos',
      icono: ClipboardDocumentListIcon
    },
    { a: sesion ? '/cuenta' : '/ingresar', texto: 'Cuenta', icono: UserIcon }
  ];
  return (
    <div className="min-h-screen bg-fondo text-texto">
      <header className="flex items-center justify-between gap-2 border-b bg-superficie px-4 py-3">
        <Link to="/" className="text-xl font-bold text-primario">
          TRINA
        </Link>
        {sesion ? (
          <div className="flex items-center gap-2">
            <Campana />
            <Link to="/cuenta" className="max-w-[9rem] truncate text-sm font-semibold text-primario">
              Hola, {sesion.nombre}
            </Link>
            <button
              type="button"
              className="btn-secundario px-3 py-2 text-sm"
              onClick={() => {
                salir();
                navigate('/');
              }}
            >
              Salir
            </button>
          </div>
        ) : (
          <Link to="/ingresar" className="btn-secundario px-4 py-2">
            Ingresar
          </Link>
        )}
      </header>
      <Outlet />
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-superficie py-1 text-sm sm:hidden"
      >
        {enlacesNav.map((enlace) => (
          <Link
            key={enlace.texto}
            to={enlace.a}
            className="flex min-h-boton flex-col items-center justify-center gap-0.5 px-2 py-1"
          >
            <Icono icono={enlace.icono} tamano="grande" />
            {enlace.texto}
          </Link>
        ))}
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
