import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { NavPanel } from '../components/panel/NavPanel';
import InicioPanel from './panel/InicioPanel';
import AsistenteNegocio from './panel/AsistenteNegocio';
import MiNegocio from './panel/MiNegocio';
import Catalogo from './panel/Catalogo';
import Horarios from './panel/Horarios';
import Fotos from './panel/Fotos';
import PedidosPanel from './panel/PedidosPanel';
import DetallePedidoPanel from './panel/DetallePedidoPanel';
import ReservasPanel from './panel/ReservasPanel';
import DetalleReservaPanel from './panel/DetalleReservaPanel';
import Membresia from './panel/Membresia';
import Estadisticas from './panel/Estadisticas';
import ResenasPanel from './panel/ResenasPanel';

/** Marco con la navegación del panel: horizontal en móvil y lateral en escritorio (§2.3). */
function MarcoPanel() {
  return (
    <div className="mx-auto max-w-5xl lg:flex lg:items-start lg:gap-6">
      <NavPanel />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

/** Rutas del panel del comerciante (PM-01 a PM-11); la protección vive en routes.tsx. */
export default function Panel() {
  return (
    <Routes>
      <Route element={<MarcoPanel />}>
        <Route index element={<InicioPanel />} />
        <Route path="negocio" element={<MiNegocio />} />
        <Route path="negocio/nuevo" element={<AsistenteNegocio />} />
        <Route path="negocio/horarios" element={<Horarios />} />
        <Route path="negocio/fotos" element={<Fotos />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="pedidos" element={<PedidosPanel />} />
        <Route path="pedidos/:id" element={<DetallePedidoPanel />} />
        <Route path="reservas" element={<ReservasPanel />} />
        <Route path="reservas/:id" element={<DetalleReservaPanel />} />
        <Route path="membresia" element={<Membresia />} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="resenas" element={<ResenasPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/panel" replace />} />
    </Routes>
  );
}
