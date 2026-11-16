import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRightIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  GlobeAmericasIcon,
  MagnifyingGlassIcon,
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
import { Campana } from '../../components/Campana';
import { useSesion } from '../../lib/auth';

const NOMBRE_ROL: Record<string, string> = {
  CLIENTE: 'Clientes',
  COMERCIANTE: 'Comerciantes',
  ADMINISTRADOR: 'Administradores'
};

/** Color por estado para la dona (bosque + lima protagonistas). */
const COLOR_ESTADO: Record<string, string> = {
  APROBADO: '#1A2218',
  PENDIENTE: '#94B839',
  CORRECCION_SOLICITADA: '#E9A13B',
  RECHAZADO: '#C8322B',
  BORRADOR: '#9AA79E',
  SUSPENDIDO: '#5F5850'
};

/** Porcentaje honesto (0 % si no hay base); nunca se inventa. */
function porcentaje(parte: number, total: number): string {
  if (!total) return '0 %';
  return `${Math.round((parte / total) * 100)} %`;
}

/** PA-01 Resumen v2: héroes + KPIs + cola con avatares + dona de estados. */
export default function ResumenAdmin() {
  const { sesion } = useSesion();
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
      <main className="animar-admin pb-20 pt-2">
        <Cargando texto="Cargando el resumen…" />
      </main>
    );
  }
  if (estadisticas.isError || !estadisticas.data) {
    return (
      <main className="animar-admin pb-20 pt-2">
        <ErrorRecargar
          mensaje={mensajeDeApi(estadisticas.error)}
          onReintentar={() => estadisticas.refetch()}
        />
      </main>
    );
  }

  const e = estadisticas.data;
  const totalNegocios = e.negociosPorEstado.reduce((suma, n) => suma + n.cantidad, 0);
  const publicados =
    e.negociosPorEstado.find((n) => n.estado === 'APROBADO')?.cantidad ?? 0;
  const comerciantes =
    e.usuariosPorRol.find((u) => u.rol === 'COMERCIANTE')?.cantidad ?? 0;
  const vacio = totalNegocios === 0 && e.usuariosTotales === 0;
  const inicial = (sesion?.nombre ?? 'A').trim().charAt(0).toUpperCase() || 'A';

  const totalDona = Math.max(1, totalNegocios);
  let acumulado = 0;
  const segmentos = e.negociosPorEstado.map((n) => {
    const inicio = (acumulado / totalDona) * 100;
    acumulado += n.cantidad;
    const fin = (acumulado / totalDona) * 100;
    return `${COLOR_ESTADO[n.estado] ?? '#9AA79E'} ${inicio.toFixed(1)}% ${fin.toFixed(1)}%`;
  });
  const fondoDona =
    e.negociosPorEstado.length === 0
      ? '#F0FDF4'
      : `conic-gradient(${segmentos.join(', ')})`;

  return (
    <main className="animar-admin pb-20 pt-2">
      {/* Cabecera despejada */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2218]">Resumen</h1>
          <p className="mt-1 text-sm text-gray-500">Cómo está TRINA hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/negocios"
            aria-label="Buscar negocios"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/70 bg-white text-[#1A2218] shadow-md transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
          >
            <Icono icono={MagnifyingGlassIcon} />
          </Link>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/70 bg-white text-[#1A2218] shadow-md">
            <Campana />
          </span>
          <span className="flex items-center gap-3 rounded-full border border-gray-200/70 bg-white py-1.5 pl-1.5 pr-5 shadow-md">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A2218] text-sm font-extrabold text-white"
            >
              {inicial}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-[#1A2218]">
                {sesion?.nombre ?? 'Administración'}
              </span>
              <span className="block text-xs text-gray-500">Administrador</span>
            </span>
          </span>
        </div>
      </div>

      {/* Fila secundaria: acción principal. */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Link
          to="/admin/negocios"
          className="inline-flex items-center gap-1 rounded-full bg-[#94B839] px-5 py-2.5 text-sm font-extrabold text-[#1A2218] shadow-sm transition-all hover:bg-[#1A2218] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
        >
          <span aria-hidden="true" className="text-base leading-none">+</span> Nuevo registro
        </Link>
      </div>

      {vacio && (
        <div className="mt-4">
          <Vacio>Todavía no hay negocios ni usuarios registrados.</Vacio>
        </div>
      )}

      {/* KPIs: 2 protagonistas + 4 blancas */}
      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiHeroe
          icono={BuildingStorefrontIcon}
          etiqueta="Negocios"
          valor={String(totalNegocios)}
          detalle={`${porcentaje(publicados, totalNegocios)} publicados`}
          destino="/admin/negocios"
        />
        <KpiHeroe
          icono={BanknotesIcon}
          etiqueta="Comisiones"
          valor={precio(e.comisionesCop)}
          detalle="acumulado COP"
          destino="/admin/parametros"
        />
        <Kpi
          icono={ShoppingBagIcon}
          etiqueta="Pedidos totales"
          valor={String(e.pedidosTotales)}
          detalle="total general"
          destino="/admin/negocios"
        />
        <Kpi
          icono={StarIcon}
          etiqueta="Membresías activas"
          valor={String(e.membresiasActivas)}
          detalle="planes vigentes"
          destino="/admin/parametros"
          iconoDorado
        />
        <Kpi
          icono={UsersIcon}
          etiqueta="Usuarios"
          valor={String(e.usuariosTotales)}
          detalle={`${porcentaje(comerciantes, e.usuariosTotales)} vendedores`}
          destino="/admin/usuarios"
        />
        <Kpi
          icono={GlobeAmericasIcon}
          etiqueta="No residentes"
          valor={String(e.usuariosNoResidentes)}
          detalle={`${porcentaje(e.usuariosNoResidentes, e.usuariosTotales)} del total`}
          destino="/admin/usuarios"
        />
      </dl>

      {/* Bento inferior asimétrico */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section
          className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md lg:col-span-3"
          aria-label="Cola de revisión"
        >
          <h2 className="text-lg font-bold text-[#1A2218]">Cola de revisión</h2>
          {vendedores.isLoading || negocios.isLoading ? (
            <p className="mt-3 text-sm text-gray-500">Cargando pendientes…</p>
          ) : vendedores.isError || negocios.isError ? (
            <p className="mt-3 text-sm">
              No pudimos cargar la cola.{' '}
              <button
                type="button"
                className="font-semibold text-[#1A2218] underline"
                onClick={() => {
                  vendedores.refetch();
                  negocios.refetch();
                }}
              >
                Intentar de nuevo
              </button>
            </p>
          ) : (vendedores.data?.length ?? 0) + (negocios.data?.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm font-semibold text-[#1A2218]">
              Al día: sin pendientes por revisar.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              <FilaCola
                icono={UsersIcon}
                texto={`Vendedores por aprobar (${vendedores.data?.length ?? 0})`}
                destino="/admin/usuarios?rol=COMERCIANTE&activo=false"
              />
              <FilaCola
                icono={BuildingStorefrontIcon}
                texto={`Negocios por revisar (${negocios.data?.length ?? 0})`}
                destino="/admin/negocios?estado=PENDIENTE"
              />
            </ul>
          )}
        </section>

        <section
          className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md lg:col-span-2"
          aria-label="Negocios por estado"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1A2218]">Negocios por estado</h2>
            <Link
              to="/admin/negocios"
              aria-label="Ver todos los negocios"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200/70 text-[#1A2218] transition hover:bg-[#F0FDF4]"
            >
              <Icono icono={ArrowUpRightIcon} tamano="chico" />
            </Link>
          </div>
          {e.negociosPorEstado.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Todavía no hay negocios para mostrar.</p>
          ) : (
            <>
              <div className="mx-auto mt-2 h-40 w-40">
                <div
                  className="flex h-full w-full items-center justify-center rounded-full"
                  style={{ background: fondoDona }}
                  role="img"
                  aria-label={`Total de negocios: ${totalNegocios}`}
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                    <span className="font-display text-3xl font-extrabold leading-none text-[#1A2218]">
                      {totalNegocios}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      total
                    </span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {e.negociosPorEstado.map((n) => (
                  <li key={n.estado} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-[#1A2218]">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: COLOR_ESTADO[n.estado] ?? '#9AA79E' }}
                      />
                      <span className="truncate">
                        {etiquetaEstado(n.estado)} ({n.cantidad})
                      </span>
                    </span>
                    <Link
                      to={`/admin/negocios?estado=${n.estado}`}
                      className="shrink-0 rounded-full bg-[#1A2218] px-3 py-1 text-xs font-bold text-white transition hover:brightness-125"
                    >
                      Ver →
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section
        className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md"
        aria-label="Usuarios por rol"
      >
        <h2 className="text-lg font-bold text-[#1A2218]">Usuarios por rol</h2>
        {e.usuariosPorRol.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Todavía no hay usuarios para mostrar.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {e.usuariosPorRol.map((u) => (
              <li key={u.rol} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm font-semibold text-[#1A2218]">
                  {NOMBRE_ROL[u.rol] ?? u.rol}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-bold text-[#1A2218]">{u.cantidad}</span>
                  <Link
                    to={`/admin/usuarios?rol=${u.rol}`}
                    className="rounded-full bg-[#1A2218] px-3 py-1 text-xs font-bold text-white transition hover:brightness-125"
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

/** Fila de cola con avatar circular menta. */
function FilaCola({ icono, texto, destino }: { icono: IconoSvg; texto: string; destino: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#F8F9FA] p-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0FDF4] text-[#94B839]">
          <Icono icono={icono} />
        </span>
        <span className="truncate text-sm font-bold text-[#1A2218]">{texto}</span>
      </span>
      <Link
        to={destino}
        className="shrink-0 rounded-full bg-[#1A2218] px-4 py-1.5 text-xs font-bold text-white transition hover:brightness-125"
      >
        Revisar →
      </Link>
    </li>
  );
}

/** KPI protagonista: degradado bosque, acentos lima. */
function KpiHeroe({
  icono,
  etiqueta,
  valor,
  detalle,
  destino
}: {
  icono: IconoSvg;
  etiqueta: string;
  valor: string;
  detalle: string;
  destino: string;
}) {
  return (
    <div className="min-w-0 rounded-3xl bg-gradient-to-br from-[#1A2218] to-[#293526] p-5 text-white shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#94B839]">
          <Icono icono={icono} />
        </span>
        <Link
          to={destino}
          aria-label={`Ver ${etiqueta.toLowerCase()}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#94B839] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
        >
          <Icono icono={ArrowUpRightIcon} tamano="chico" />
        </Link>
      </div>
      <p className="mt-3 break-words font-display text-3xl font-extrabold leading-none">{valor}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white/70">{etiqueta}</p>
      <p className="mt-2">
        <span className="inline-block rounded-full bg-[#94B839]/20 px-2.5 py-0.5 text-xs font-semibold text-[#BEE36E]">
          {detalle}
        </span>
      </p>
    </div>
  );
}

/** KPI blanca nítida con icono en cápsula menta. */
function Kpi({
  icono,
  etiqueta,
  valor,
  detalle,
  destino,
  iconoDorado = false
}: {
  icono: IconoSvg;
  etiqueta: string;
  valor: string;
  detalle: string;
  destino: string;
  iconoDorado?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-gray-200/70 bg-white p-5 shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0FDF4]">
          <Icono icono={icono} className={iconoDorado ? 'text-[#E9A13B]' : 'text-[#1A2218]'} />
        </span>
        <Link
          to={destino}
          aria-label={`Ver ${etiqueta.toLowerCase()}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200/70 text-[#1A2218] transition hover:bg-[#F0FDF4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
        >
          <Icono icono={ArrowUpRightIcon} tamano="chico" />
        </Link>
      </div>
      <p className="mt-3 break-words font-display text-3xl font-extrabold leading-none text-[#1A2218]">
        {valor}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-500">{etiqueta}</p>
      <p className="mt-2">
        <span className="inline-block rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#1A2218]">
          {detalle}
        </span>
      </p>
    </div>
  );
}
