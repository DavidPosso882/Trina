import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  listarAdminUsuarios,
  mensajeDeApi,
  type AdminUsuario,
  type FiltrosUsuarios,
  type Rol
} from '../../lib/api';
import {
  KeyIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useSesion } from '../../lib/auth';
import { Aviso } from '../../components/negocio/Aviso';
import { Dialogo } from '../../components/Dialogo';
import { Icono } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

const ROLES: Rol[] = ['CLIENTE', 'COMERCIANTE', 'ADMINISTRADOR'];

/** PA-03 Usuarios: filtros, activar/desactivar, cambiar rol y sin autodesactivación (RF-43). */
export default function UsuariosAdmin() {
  const { sesion } = useSesion();
  const [parametros] = useSearchParams();
  const rolInicial = parametros.get('rol') ?? '';

  const [q, setQ] = useState('');
  const [rol, setRol] = useState(rolInicial);
  const [activo, setActivo] = useState('');
  const [filtros, setFiltros] = useState<FiltrosUsuarios>(rolInicial ? { rol: rolInicial } : {});
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambioEstado, setCambioEstado] = useState<AdminUsuario | null>(null);
  const [cambioRol, setCambioRol] = useState<{ usuario: AdminUsuario; rol: Rol } | null>(null);

  const cliente = useQueryClient();
  const usuarios = useQuery({
    queryKey: ['admin-usuarios', filtros],
    queryFn: () => listarAdminUsuarios(filtros)
  });

  const estado = useMutation({
    mutationFn: ({ id, activo: nuevo }: { id: number; activo: boolean }) =>
      cambiarEstadoUsuario(id, nuevo),
    onSuccess: async (u) => {
      setError(null);
      setAviso(`La cuenta de ${u.nombre} quedó ${u.activo ? 'activa' : 'desactivada'}.`);
      setCambioEstado(null);
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setCambioEstado(null);
    }
  });

  const rolMutation = useMutation({
    mutationFn: ({ id, rol: nuevo }: { id: number; rol: Rol }) => cambiarRolUsuario(id, nuevo),
    onSuccess: async (u) => {
      setError(null);
      setAviso(`${u.nombre} ahora tiene el rol ${u.rol}.`);
      setCambioRol(null);
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setCambioRol(null);
    }
  });

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    setFiltros({
      rol: rol || undefined,
      activo: activo === '' ? undefined : activo === 'true',
      q: q.trim() || undefined
    });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Usuarios</h1>
      <p className="mt-1 text-texto-suave">Buscá, cambiá de rol y activá o desactivá cuentas.</p>

      {aviso && (
        <div className="mt-3">
          <Aviso tipo="exito">{aviso}</Aviso>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      <form className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4" onSubmit={aplicar}>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="font-semibold">
              Buscar
            </label>
            <input
              id="q"
              className="campo mt-1"
              placeholder="Nombre o correo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rol" className="font-semibold">
              Rol
            </label>
            <select id="rol" className="campo mt-1" value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="">Todos</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="activo" className="font-semibold">
              Estado
            </label>
            <select id="activo" className="campo mt-1" value={activo} onChange={(e) => setActivo(e.target.value)}>
              <option value="">Todas</option>
              <option value="true">Activas</option>
              <option value="false">Desactivadas</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn-secundario mt-3 inline-flex items-center gap-2 px-6 py-3">
          <Icono icono={MagnifyingGlassIcon} tamano="chico" /> Filtrar
        </button>
      </form>

      {usuarios.isLoading && <Cargando texto="Cargando los usuarios…" />}
      {usuarios.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(usuarios.error)} onReintentar={() => usuarios.refetch()} />
      )}
      {usuarios.data && usuarios.data.length === 0 && <Vacio>No hay usuarios con esos filtros.</Vacio>}
      {usuarios.data && usuarios.data.length > 0 && (
        <div className="mt-4 overflow-x-auto border-y border-tinta-cafe/10">
          <table className="w-full min-w-[680px] text-left">
            <caption className="sr-only">Usuarios registrados en TRINA</caption>
            <thead>
              <tr className="border-b border-tinta-cafe/10 text-sm text-texto-suave">
                <th scope="col" className="px-4 py-3">
                  Nombre
                </th>
                <th scope="col" className="px-4 py-3">
                  Correo
                </th>
                <th scope="col" className="px-4 py-3">
                  Rol
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.data.map((u) => {
                const soyYo = u.id === sesion?.id;
                return (
                  <tr key={u.id} className="border-b border-tinta-cafe/10 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{u.nombre}</span>
                      {u.cambioClaveObligatorio && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-campo bg-advertencia/10 px-2 py-0.5 text-sm text-advertencia">
                          <Icono icono={KeyIcon} tamano="chico" /> Cambio de clave pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-texto-suave">{u.email}</td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`rol-${u.id}`}>
                        Rol de {u.nombre}
                      </label>
                      <select
                        id={`rol-${u.id}`}
                        className="campo px-3 py-2"
                        value={u.rol}
                        onChange={(e) => {
                          const nuevo = e.target.value as Rol;
                          if (nuevo !== u.rol) setCambioRol({ usuario: u, rol: nuevo });
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-2 rounded-campo bg-primario-claro px-2 py-1 text-sm font-semibold text-exito">
                          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primario" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-campo bg-error/10 px-2 py-1 text-sm font-semibold text-error">
                          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-error" />
                          Desactivada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className={u.activo ? 'btn-peligro px-3 py-2 text-sm' : 'btn-secundario px-3 py-2 text-sm'}
                        disabled={soyYo}
                        title={soyYo ? 'No podés desactivar tu propia cuenta.' : undefined}
                        onClick={() => {
                          setError(null);
                          setAviso(null);
                          setCambioEstado(u);
                        }}
                      >
                        {u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                      </button>
                      {soyYo && (
                        <p className="mt-1 text-xs text-texto-suave">No podés desactivar tu propia cuenta.</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo
        abierto={cambioEstado !== null}
        titulo={cambioEstado?.activo ? '¿Desactivar la cuenta?' : '¿Activar la cuenta?'}
        onCerrar={() => setCambioEstado(null)}
      >
        {cambioEstado && (
          <>
            <p>
              {cambioEstado.activo
                ? `${cambioEstado.nombre} (${cambioEstado.email}) no va a poder ingresar hasta que la actives de nuevo.`
                : `${cambioEstado.nombre} (${cambioEstado.email}) va a poder ingresar otra vez.`}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={cambioEstado.activo ? 'btn-peligro px-4 py-3' : 'btn-principal px-4 py-3'}
                disabled={estado.isPending}
                onClick={() => estado.mutate({ id: cambioEstado.id, activo: !cambioEstado.activo })}
              >
                {estado.isPending
                  ? 'Guardando…'
                  : cambioEstado.activo
                    ? 'Desactivar cuenta'
                    : 'Activar cuenta'}
              </button>
              <button type="button" className="btn-secundario px-4 py-3" onClick={() => setCambioEstado(null)}>
                Volver
              </button>
            </div>
          </>
        )}
      </Dialogo>

      <Dialogo
        abierto={cambioRol !== null}
        titulo="¿Cambiar el rol de la cuenta?"
        onCerrar={() => setCambioRol(null)}
      >
        {cambioRol && (
          <>
            <p>
              {cambioRol.usuario.nombre} va a pasar de <strong>{cambioRol.usuario.rol}</strong> a{' '}
              <strong>{cambioRol.rol}</strong>.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-principal px-4 py-3"
                disabled={rolMutation.isPending}
                onClick={() => rolMutation.mutate({ id: cambioRol.usuario.id, rol: cambioRol.rol })}
              >
                {rolMutation.isPending ? 'Guardando…' : 'Cambiar rol'}
              </button>
              <button type="button" className="btn-secundario px-4 py-3" onClick={() => setCambioRol(null)}>
                Volver
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </main>
  );
}
