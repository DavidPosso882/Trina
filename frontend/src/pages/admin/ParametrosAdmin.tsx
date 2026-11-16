import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarParametro,
  getPlanes,
  listarAdminParametros,
  mensajeDeApi,
  type ParametroAdmin
} from '../../lib/api';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { precio } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { Icono } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

/** Reglas de RF-45: solo comision_pct tiene rango validado (0-30). */
function validarParametro(clave: string, valor: string): string | null {
  if (valor.trim() === '') return 'Escribe un valor.';
  if (clave === 'comision_pct') {
    const n = Number(valor.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 30) {
      return 'La comisión tiene que ser un número entre 0 y 30.';
    }
  }
  return null;
}

/** PA-05 Parámetros y planes: comisión 0-30 y vista de los planes vigentes (RF-45/RF-33). */
export default function ParametrosAdmin() {
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parametros = useQuery({ queryKey: ['admin-parametros'], queryFn: listarAdminParametros });
  const planes = useQuery({ queryKey: ['planes'], queryFn: getPlanes, staleTime: 5 * 60_000 });

  return (
    <main className="animar-admin pb-20 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2218]">Parámetros y planes</h1>
        <p className="mt-1 text-sm text-gray-500">
        Ajusta los valores del sistema. La comisión se valida entre 0 y 30.
      </p>
      </div>

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

      {parametros.isLoading && <Cargando texto="Cargando los parámetros…" />}
      {parametros.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(parametros.error)} onReintentar={() => parametros.refetch()} />
      )}
      {parametros.data && parametros.data.length === 0 && <Vacio>No hay parámetros cargados.</Vacio>}
      {parametros.data && parametros.data.length > 0 && (
        <section className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md" aria-label="Listado de parámetros">
        <ul className="flex flex-col gap-3">
          {parametros.data.map((p) => (
            <FilaParametro
              key={p.clave}
              parametro={p}
              onAviso={(texto) => {
                setError(null);
                setAviso(texto);
              }}
              onError={(texto) => {
                setAviso(null);
                setError(texto);
              }}
            />
          ))}
        </ul>
        </section>
      )}

      <section className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md" aria-label="Planes de membresía">
        <h2 className="text-lg font-bold text-[#1A2218]">Planes de membresía</h2>
        <p className="mt-1 text-sm text-gray-500">
          Los planes se definen en la configuración inicial de la plataforma; aquí los ves como referencia.
        </p>
        {planes.isLoading && <Cargando texto="Cargando los planes…" />}
        {planes.isError && (
          <ErrorRecargar mensaje={mensajeDeApi(planes.error)} onReintentar={() => planes.refetch()} />
        )}
        {planes.data && planes.data.length === 0 && <Vacio>No hay planes cargados.</Vacio>}
        {planes.data && planes.data.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
            <caption className="sr-only">Planes de membresía vigentes</caption>
            <thead>
              <tr className="text-sm text-gray-500">
                <th scope="col" className="py-2">
                  Plan
                </th>
                <th scope="col" className="py-2">
                  Precio
                </th>
                <th scope="col" className="py-2 text-right">
                  Destacados
                </th>
              </tr>
            </thead>
            <tbody>
              {planes.data.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 first:border-0 hover:bg-[#F8F9FA]">
                  <td className="py-2 font-bold text-[#1A2218]">
                    {p.nombre} {!p.activo && <span className="text-sm text-gray-500">(inactivo)</span>}
                  </td>
                  <td className="py-2">{p.precioMensualCop === 0 ? 'Gratis' : `${precio(p.precioMensualCop)}/mes`}</td>
                  <td className="py-2 text-right">{p.maxDestacados}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function FilaParametro({
  parametro,
  onAviso,
  onError
}: {
  parametro: ParametroAdmin;
  onAviso: (texto: string) => void;
  onError: (texto: string) => void;
}) {
  const cliente = useQueryClient();
  const [valor, setValor] = useState(parametro.valor);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const guardar = useMutation({
    mutationFn: () => actualizarParametro(parametro.clave, valor.trim()),
    onSuccess: async (p) => {
      setErrorLocal(null);
      setValor(p.valor);
      onAviso(`El parámetro ${p.clave} quedó actualizado a ${p.valor}.`);
      await cliente.invalidateQueries({ queryKey: ['admin-parametros'] });
    },
    onError: (e) => onError(mensajeDeApi(e))
  });

  const enviar = () => {
    const problema = validarParametro(parametro.clave, valor);
    if (problema) {
      setErrorLocal(problema);
      return;
    }
    setErrorLocal(null);
    guardar.mutate();
  };

  return (
    <li className="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
      <p className="font-mono font-bold text-[#1A2218]">{parametro.clave}</p>
      {parametro.descripcion && <p className="mt-1 text-sm text-gray-500">{parametro.descripcion}</p>}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={`valor-${parametro.clave}`} className="font-semibold">
            Valor
          </label>
          <input
            id={`valor-${parametro.clave}`}
            className="campo mt-1"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-describedby={errorLocal ? `valor-${parametro.clave}-error` : undefined}
          />
          {errorLocal && (
            <p id={`valor-${parametro.clave}-error`} role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{errorLocal}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200/70 bg-white px-6 py-3 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4] disabled:opacity-60"
          disabled={guardar.isPending}
          onClick={enviar}
        >
          <Icono icono={CheckIcon} tamano="chico" />
          {guardar.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </li>
  );
}
