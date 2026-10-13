import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import App from './App';
import Inicio from './pages/Inicio';
import Ingresar from './pages/Ingresar';
import Registro from './pages/Registro';
import RecuperarClave from './pages/RecuperarClave';
import RestablecerClave from './pages/RestablecerClave';
import Privacidad from './pages/Privacidad';
import { useSesion } from './lib/auth';

// El mapa y las pantallas pesadas se cargan solo cuando se usan (code-splitting §8 UI)
const Explorar = lazy(() => import('./pages/Explorar'));
const PerfilNegocio = lazy(() => import('./pages/PerfilNegocio'));
const Panel = lazy(() => import('./pages/Panel'));
const Admin = lazy(() => import('./pages/Admin'));
const Carrito = lazy(() => import('./pages/Carrito'));
const ConfirmarPedido = lazy(() => import('./pages/ConfirmarPedido'));
const MisPedidos = lazy(() => import('./pages/MisPedidos'));
const DetallePedido = lazy(() => import('./pages/DetallePedido'));
const Reservar = lazy(() => import('./pages/Reservar'));
const MisReservas = lazy(() => import('./pages/MisReservas'));
const DetalleReserva = lazy(() => import('./pages/DetalleReserva'));
const MiCuenta = lazy(() => import('./pages/MiCuenta'));
const Notificaciones = lazy(() => import('./pages/Notificaciones'));

const conCarga = (nodo: ReactNode) => (
  <Suspense fallback={<p className="p-4">Cargando…</p>}>{nodo}</Suspense>
);

/** Rutas del panel: sin sesión → ingresar; rol que no es COMERCIANTE → sin permiso. */
function SoloComerciante({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useSesion();
  if (cargando) return <p className="p-4" role="status">Cargando tu sesión…</p>;
  if (!sesion) return <Navigate to="/ingresar" replace />;
  if (sesion.rol !== 'COMERCIANTE') return <Navigate to="/sin-permiso" replace />;
  return <>{children}</>;
}

/** Rutas del panel admin: sin sesión → ingresar; rol que no es ADMINISTRADOR → sin permiso. */
function SoloAdmin({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useSesion();
  if (cargando) return <p className="p-4" role="status">Cargando tu sesión…</p>;
  if (!sesion) return <Navigate to="/ingresar" replace />;
  if (sesion.rol !== 'ADMINISTRADOR') return <Navigate to="/sin-permiso" replace />;
  return <>{children}</>;
}

/**
 * Rutas del cliente (PC-01 a PC-07): piden sesión y, si no hay, mandan a Ingresar guardando
 * la pantalla para volver después de entrar.
 */
function SoloLogueado({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <p className="p-4" role="status">Cargando tu sesión…</p>;
  if (!sesion) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  }
  return <>{children}</>;
}

function NoPermiso() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">No tenés permiso para ver esta página</h1>
      <p className="text-texto-suave">Ingresá con la cuenta correcta o volvé al inicio.</p>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Inicio /> }, // PU-01
      { path: 'explorar', element: conCarga(<Explorar />) }, // PU-02
      { path: 'negocios/:id', element: conCarga(<PerfilNegocio />) }, // PU-03
      { path: 'ingresar', element: <Ingresar /> }, // PU-04
      { path: 'registro', element: <Registro /> }, // PU-05 (RF-01)
      { path: 'recuperar-clave', element: <RecuperarClave /> }, // RF-03 E1
      { path: 'restablecer-clave', element: <RestablecerClave /> }, // RF-03 E2/E3
      { path: 'privacidad', element: <Privacidad /> }, // PU-07 (RF-48)
      // Área del cliente (PC-01 a PC-07)
      { path: 'carrito', element: conCarga(<SoloLogueado><Carrito /></SoloLogueado>) },
      { path: 'pedido/confirmar', element: conCarga(<SoloLogueado><ConfirmarPedido /></SoloLogueado>) },
      { path: 'pedidos', element: conCarga(<SoloLogueado><MisPedidos /></SoloLogueado>) },
      { path: 'pedidos/:id', element: conCarga(<SoloLogueado><DetallePedido /></SoloLogueado>) },
      { path: 'reservar/:negocioId', element: conCarga(<SoloLogueado><Reservar /></SoloLogueado>) },
      { path: 'reservas', element: conCarga(<SoloLogueado><MisReservas /></SoloLogueado>) },
      { path: 'reservas/:id', element: conCarga(<SoloLogueado><DetalleReserva /></SoloLogueado>) },
      { path: 'cuenta', element: conCarga(<SoloLogueado><MiCuenta /></SoloLogueado>) },
      { path: 'notificaciones', element: conCarga(<SoloLogueado><Notificaciones /></SoloLogueado>) },
      { path: 'panel/*', element: <SoloComerciante>{conCarga(<Panel />)}</SoloComerciante> }, // PM-01…PM-11
      { path: 'admin/*', element: <SoloAdmin>{conCarga(<Admin />)}</SoloAdmin> }, // PA-01…PA-07
      { path: 'sin-permiso', element: <NoPermiso /> }
    ]
  }
]);
