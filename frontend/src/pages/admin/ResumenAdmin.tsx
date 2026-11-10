import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  GlobeAmericasIcon,
  ShoppingBagIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  getAdminEstadisticas,
  listarAdminNegocios,
  listarAdminUsuarios,
  mensajeDeApi
} from '../../lib/api';
import { etiquetaEstado } from '../../components/negocio/EstadoNegocio';
import { precio } from '../../lib/formato';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';
import { TituloAtras } from '../../components/TituloAtras';

const NOMBRE_ROL: Record<string, string> = {
  CLIENTE: 'Clientes',
  COMERCIANTE: 'Comerciantes',
  ADMINISTRADOR: 'Administradores'
};

/** PA-01 Resumen: indicadores globales de la plataforma (RF-41). */
export default function ResumenAdmin() {
  const estadisticas = useQuery({ queryKey: ['admin-estadisticas'], queryFn: getAdminEstadisticas });
  const vendedores = useQuery({
    queryKey: ['admin-cola-vendedores'],
    queryFn: () => listarAdminUsuarios({ rol: 'COMERCIANTE', activo: false })
  });
  const negocios = useQuery({
    queryKey: ['admin-cola-negocios'],
    queryFn: () => listarAdminNegocios('PENDIENTE')
  });

  if (estadisticas.isLoading) {
    return (
      <main className="mx-auto max-w-3xl lg:max-w-4xl xl:max-w-5xl px-4 pb-20 pt-6">
        <Cargando texto="Cargando el resumen…" />
      </main>
    );
  }
  if (estadisticas.isError || !estadisticas.data) {
    return (
      <main className="mx-auto max-w-3xl lg:max-w-4xl xl:max-w-5xl px-4 pb-20 pt-6">
        <ErrorRecargar
          mensaje={mensajeDeApi(estadisticas.error)}
          onReintentar={() => estadisticas.refetch()}
        />
      </main>
    );
  }

  const e = estadisticas.data;
  const totalNegocios = e.negociosPorEstado.reduce((suma, n) => suma + n.cantidad, 0);
  const vacio = totalNegocios === 0 && e.usuariosTotales === 0;

  return (
    <main className="mx-auto max-w-3xl lg:max-w-4xl xl:max-w-5xl px-4 pb-20 pt-6">
      <TituloAtras titulo="Resumen" />
      <p className="mt-1 text-texto-suave">Cómo está TRINA hoy.</p>

      <section className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4" aria-label="Cola de revisión">
        <h2 className="text-seccion">Cola de revisión</h2>
        {vendedores.isLoading || negocios.isLoading ? (
          <p className="mt-2 text-texto-suave">Cargando pendientes…</p>
        ) : vendedores.isError || negocios.isError ? (
          <p className="mt-2">
            No pudimos cargar la cola.{' '}
            <button
              type="button"
              className="font-semibold text-primario underline"
              onClick={() => {
                vendedores.refetch();
                negocios.refetch();
              }}
            >
              Intentar de nuevo
            </button>
          </p>
        ) : (vendedores.data?.length ?? 0) + (negocios.data?.length ?? 0) === 0 ? (
          <p className="mt-2 font-semibold text-exito">Al día: sin pendientes por revisar.</p>
        ) : (
          <ul className="mt-2 divide-y divide-tinta-cafe/10">
            <li className="flex items-center justify-between gap-3 py-2">
              <span className="flex items-center gap-2 font-semibold">
                <Icono icono={UsersIcon} tamano="chico" />
                Vendedores por aprobar
              </span>
              <span className="flex items-center gap-3">
                <span className="font-bold">{vendedores.data?.length ?? 0}</span>
                <Link
                  to="/admin/usuarios?rol=COMERCIANTE&activo=false"
                  className="text-sm font-semibold text-primario"
                >
                  Revisar →
                </Link>
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2">
              <span className="flex items-center gap-2 font-semibold">
                <Icono icono={BuildingStorefrontIcon} tamano="chico" />
                Negocios por revisar
              </span>
              <span className="flex items-center gap-3">
                <span className="font-bold">{negocios.data?.length ?? 0}</span>
                <Link
                  to="/admin/negocios?estado=PENDIENTE"
                  className="text-sm font-semibold text-primario"
                >
                  Revisar →
                </Link>
              </span>
            </li>
          </ul>
        )}
      </section>

      {vacio && <Vacio>Todavía no hay negocios ni usuarios registrados.</Vacio>}

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Indicador icono={BuildingStorefrontIcon} etiqueta="Negocios" valor={String(totalNegocios)} />
        <Indicador icono={ShoppingBagIcon} etiqueta="Pedidos totales" valor={String(e.pedidosTotales)} />
        <Indicador icono={BanknotesIcon} etiqueta="Comisiones" valor={precio(e.comisionesCop)} />
        <Indicador
          icono={StarIcon}
          etiqueta="Membresías activas"
          valor={String(e.membresiasActivas)}
          claseIcono="text-oro-cosecha"
        />
        <Indicador icono={UsersIcon} etiqueta="Usuarios" valor={String(e.usuariosTotales)} />
        <Indicador
          icono={GlobeAmericasIcon}
          etiqueta="No residentes"
          valor={`${e.usuariosNoResidentes} (${(e.proporcionNoResidentes * 100).toFixed(0)} %)`}
        />
      </dl>

      <section className="mt-6 border-t border-tinta-cafe/10 pt-4" aria-label="Negocios por estado">
        <h2 className="text-seccion">Negocios por estado</h2>
        {e.negociosPorEstado.length === 0 ? (
          <p className="mt-2 text-texto-suave">Todavía no hay negocios para mostrar.</p>
        ) : (
          <ul className="mt-2 divide-y divide-tinta-cafe/10">
            {e.negociosPorEstado.map((n) => (
              <li key={n.estado} className="flex items-center justify-between gap-3 py-2">
                <span>{etiquetaEstado(n.estado)}</span>
                <span className="flex items-center gap-3">
                  <span className="font-bold">{n.cantidad}</span>
                  <Link
                    to={`/admin/negocios?estado=${n.estado}`}
                    className="text-sm font-semibold text-primario"
                  >
                    Ver →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 border-t border-tinta-cafe/10 pt-4" aria-label="Usuarios por rol">
        <h2 className="text-seccion">Usuarios por rol</h2>
        {e.usuariosPorRol.length === 0 ? (
          <p className="mt-2 text-texto-suave">Todavía no hay usuarios para mostrar.</p>
        ) : (
          <ul className="mt-2 divide-y divide-tinta-cafe/10">
            {e.usuariosPorRol.map((u) => (
              <li key={u.rol} className="flex items-center justify-between gap-3 py-2">
                <span>{NOMBRE_ROL[u.rol] ?? u.rol}</span>
                <span className="flex items-center gap-3">
                  <span className="font-bold">{u.cantidad}</span>
                  <Link
                    to={`/admin/usuarios?rol=${u.rol}`}
                    className="text-sm font-semibold text-primario"
                  >
                    Ver →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Indicador({
  icono,
  etiqueta,
  valor,
  claseIcono = ''
}: {
  icono: IconoSvg;
  etiqueta: string;
  valor: string;
  claseIcono?: string;
}) {
  return (
    <div className="border-t border-tinta-cafe/10 pt-2">
      <dt className="flex items-center gap-2 text-sm text-texto-suave">
        <Icono icono={icono} tamano="chico" className={claseIcono} /> {etiqueta}
      </dt>
      <dd className="font-display text-cifra-menor leading-none">{valor}</dd>
    </div>
  );
}
