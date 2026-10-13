import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { NavAdmin } from '../components/admin/NavAdmin';
import ResumenAdmin from './admin/ResumenAdmin';
import NegociosAdmin from './admin/NegociosAdmin';
import UsuariosAdmin from './admin/UsuariosAdmin';
import CategoriasAdmin from './admin/CategoriasAdmin';
import ParametrosAdmin from './admin/ParametrosAdmin';
import ResenasAdmin from './admin/ResenasAdmin';
import AuditoriaAdmin from './admin/AuditoriaAdmin';

/** Marco del admin: menú lateral en escritorio y lista con scroll en móvil (§2.3). */
function MarcoAdmin() {
  return (
    <div className="mx-auto max-w-6xl lg:flex lg:items-start lg:gap-6">
      <NavAdmin />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

/** Rutas del panel del administrador (PA-01 a PA-07); la protección vive en routes.tsx. */
export default function Admin() {
  return (
    <Routes>
      <Route element={<MarcoAdmin />}>
        <Route index element={<ResumenAdmin />} />
        <Route path="negocios" element={<NegociosAdmin />} />
        <Route path="usuarios" element={<UsuariosAdmin />} />
        <Route path="categorias" element={<CategoriasAdmin />} />
        <Route path="parametros" element={<ParametrosAdmin />} />
        <Route path="resenas" element={<ResenasAdmin />} />
        <Route path="auditoria" element={<AuditoriaAdmin />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
