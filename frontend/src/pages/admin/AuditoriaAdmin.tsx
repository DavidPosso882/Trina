import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { listarAuditoria, mensajeDeApi, type FiltrosAuditoria } from '../../lib/api';
import { fechaHora } from '../../lib/formato';
import { Icono } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

/** PA-07 Auditoría: bitácora con filtros y paginación (RF-46). Las fechas se envían en UTC. */
export default function AuditoriaAdmin() {
  const [entidad, setEntidad] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({});

  const auditoria = useQuery({
    queryKey: ['admin-auditoria', filtros],
    queryFn: () => listarAuditoria(filtros)
  });

  const construir = (pagina: number): FiltrosAuditoria => {
    const numero = Number(usuarioId);
    return {
      desde: desde ? `${desde}T00:00:00Z` : undefined,
      hasta: hasta ? `${hasta}T23:59:59Z` : undefined,
      usuarioId: usuarioId.trim() !== '' && Number.isFinite(numero) ? numero : undefined,
      entidad: entidad.trim() || undefined,
      pagina,
      tamano: 20
    };
  };

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    setFiltros(construir(0));
  };

  const pagina = filtros.pagina ?? 0;
  const total = auditoria.data?.total ?? 0;
  const tamano = auditoria.data?.tamano ?? 20;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Auditoría</h1>
      <p className="mt-1 text-texto-suave">Historial de acciones administrativas de la plataforma.</p>

      <form className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4" onSubmit={aplicar}>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="entidad" className="font-semibold">
              Entidad
            </label>
            <input
              id="entidad"
              className="campo mt-1"
              placeholder="Ej.: NEGOCIO"
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="usuarioId" className="font-semibold">
              Usuario (id)
            </label>
            <input
              id="usuarioId"
              className="campo mt-1"
              inputMode="numeric"
              placeholder="Ej.: 3"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="desde" className="font-semibold">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              className="campo mt-1"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="hasta" className="font-semibold">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              className="campo mt-1"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-secundario mt-3 inline-flex items-center gap-2 px-6 py-3">
          <Icono icono={MagnifyingGlassIcon} tamano="chico" /> Filtrar
        </button>
      </form>

      {auditoria.isLoading && <Cargando texto="Cargando la auditoría…" />}
      {auditoria.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(auditoria.error)} onReintentar={() => auditoria.refetch()} />
      )}
      {auditoria.data && auditoria.data.contenido.length === 0 && (
        <Vacio>No hay registros con esos filtros.</Vacio>
      )}
      {auditoria.data && auditoria.data.contenido.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto border-y border-tinta-cafe/10">
            <table className="w-full min-w-[760px] text-left">
              <caption className="sr-only">Registros de auditoría</caption>
              <thead>
                <tr className="border-b border-tinta-cafe/10 text-sm text-texto-suave">
                  <th scope="col" className="px-4 py-3">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acción
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Entidad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Detalle
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditoria.data.contenido.map((r) => (
                  <tr key={r.id} className="border-b border-tinta-cafe/10 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">{fechaHora(r.creadoEn)}</td>
                    <td className="px-4 py-3">{r.usuarioId ?? 'Sin dato'}</td>
                    <td className="px-4 py-3 font-semibold">{r.accion}</td>
                    <td className="px-4 py-3">
                      {r.entidad}
                      {r.entidadId != null ? ` #${r.entidadId}` : ''}
                    </td>
                    <td className="px-4 py-3 text-texto-suave">{r.detalle ?? 'Sin dato'}</td>
                    <td className="px-4 py-3 text-texto-suave">{r.motivo ?? 'Sin dato'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-texto-suave">
                Página {pagina + 1} de {totalPaginas}
              </p>
              <p className="text-sm text-texto-suave">
                {total} registro{total === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secundario px-4 py-2 text-sm"
                disabled={pagina <= 0}
                onClick={() => setFiltros((f) => ({ ...f, pagina: pagina - 1 }))}
              >
                ← Anterior
              </button>
              <button
                type="button"
                className="btn-secundario px-4 py-2 text-sm"
                disabled={pagina + 1 >= totalPaginas}
                onClick={() => setFiltros((f) => ({ ...f, pagina: pagina + 1 }))}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
