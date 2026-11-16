import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { NavAdmin } from '../components/admin/NavAdmin';
import {
  getAdminEstadisticas,
  getPlanes,
  listarAuditoria,
  listarAdminCategorias,
  listarAdminNegocios,
  listarAdminParametros,
  listarAdminResenas,
  listarAdminUsuarios
} from '../lib/api';
import ResumenAdmin from './admin/ResumenAdmin';
import NegociosAdmin from './admin/NegociosAdmin';
import UsuariosAdmin from './admin/UsuariosAdmin';
import CategoriasAdmin from './admin/CategoriasAdmin';
import ParametrosAdmin from './admin/ParametrosAdmin';
import ResenasAdmin from './admin/ResenasAdmin';
import AuditoriaAdmin from './admin/AuditoriaAdmin';

/** Marco del admin: sidebar fijo a la izquierda en escritorio, solo el contenido scrollea.
 *  Pre-carga las listas en segundo plano para que cambiar de sección sea instantáneo. */
function MarcoAdmin() {
  const consultas = useQueryClient();
  useEffect(() => {
    const anticipar = () => {
      consultas.prefetchQuery({ queryKey: ['admin-estadisticas'], queryFn: getAdminEstadisticas });
      consultas.prefetchQuery({ queryKey: ['admin-cola-negocios'], queryFn: () => listarAdminNegocios('PENDIENTE') });
      consultas.prefetchQuery({
        queryKey: ['admin-cola-vendedores'],
        queryFn: () => listarAdminUsuarios({ rol: 'COMERCIANTE', activo: false })
      });
      consultas.prefetchQuery({ queryKey: ['admin-negocios', ''], queryFn: () => listarAdminNegocios(undefined) });
      consultas.prefetchQuery({ queryKey: ['admin-usuarios', {}], queryFn: () => listarAdminUsuarios({}) });
      consultas.prefetchQuery({ queryKey: ['admin-categorias'], queryFn: listarAdminCategorias });
      consultas.prefetchQuery({ queryKey: ['admin-parametros'], queryFn: listarAdminParametros });
      consultas.prefetchQuery({ queryKey: ['planes'], queryFn: getPlanes });
      consultas.prefetchQuery({ queryKey: ['admin-resenas', true], queryFn: () => listarAdminResenas(true) });
      consultas.prefetchQuery({ queryKey: ['admin-auditoria', {}], queryFn: () => listarAuditoria({}) });
    };
    anticipar();
  }, [consultas]);
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <NavAdmin />
      <div className="min-w-0 lg:pl-64">
        <div className="px-4 pb-20 pt-4 lg:px-6 lg:pt-6">
          <Outlet />
        </div>
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
