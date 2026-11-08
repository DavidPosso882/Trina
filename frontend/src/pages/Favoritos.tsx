import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartIcon } from '@heroicons/react/24/outline';
import { getNegocio, type FichaNegocio } from '../lib/api';
import { useSesion } from '../lib/auth';
import { useFavoritos } from '../lib/favoritos';
import { Cargando } from '../components/Estados';
import { Icono } from '../components/Icono';

/** Favoritos real (S4): guardados en localStorage de este dispositivo, sin cuenta. */
export default function Favoritos() {
  const { ids, quitar } = useFavoritos();
  const { sesion } = useSesion();

  const detalle = useQuery({
    queryKey: ['favoritos', ...ids],
    queryFn: async (): Promise<FichaNegocio[]> => {
      const res = await Promise.allSettled(ids.map((id) => getNegocio(id)));
      return res
        .flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60_000
  });

  if (!sesion) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 md:pb-16">
        <h1 className="font-display text-titulo">Favoritos</h1>
        <p className="mt-1 text-texto-suave">
          Tus comercios guardados.
        </p>
        <div className="mt-4 rounded-tarjeta border border-oliva/10 bg-white p-6 text-center shadow-sm">
          <Icono icono={HeartIcon} tamano="grande" className="mx-auto text-texto-suave" />
          <p className="mt-2 font-semibold">Inicia sesión para ver tus favoritos</p>
          <p className="mt-1 text-sm text-texto-suave">
            Crea una cuenta o inicia sesión para guardar tus negocios favoritos.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link to="/registro" className="btn-lima px-6 py-2 text-sm">
              Crear cuenta
            </Link>
            <Link to="/ingresar" className="btn-secundario px-6 py-2 text-sm">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 md:pb-16">
      <h1 className="font-display text-titulo">Favoritos</h1>
      <p className="mt-1 text-texto-suave">
        Tus comercios guardados.
      </p>

      {ids.length === 0 && (
        <div className="mt-4 rounded-tarjeta border border-oliva/10 bg-white p-6 text-center shadow-sm">
          <Icono icono={HeartIcon} tamano="grande" className="mx-auto text-texto-suave" />
          <p className="mt-2 font-semibold">Todavía no tienes favoritos</p>
          <p className="mt-1 text-sm text-texto-suave">
            Toca el corazón en cualquier comercio para guardarlo aquí.
          </p>
          <Link to="/explorar" className="btn-lima mt-4 px-6 py-2 text-sm">
            Descubrir comercios
          </Link>
        </div>
      )}

      {ids.length > 0 && detalle.isLoading && <Cargando texto="Cargando tus favoritos…" />}

      {ids.length > 0 && detalle.data && detalle.data.length === 0 && (
        <div className="mt-4 rounded-tarjeta border border-oliva/10 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold">No pudimos cargar esos comercios</p>
          <p className="mt-1 text-sm text-texto-suave">
            Quizás ya no existen. Quítalos y vuelve a explorar.
          </p>
          <Link to="/explorar" className="btn-lima mt-4 px-6 py-2 text-sm">
            Volver a explorar
          </Link>
        </div>
      )}

      {detalle.data && detalle.data.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {detalle.data.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-3 rounded-tarjeta border border-oliva/10 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="max-w-full truncate text-xs font-semibold text-texto-suave">{n.categoria ?? 'Negocio local'}</p>
                <h2 className="line-clamp-2 font-display text-lg font-bold">{n.nombre}</h2>
                <p className="flex items-center gap-1 text-xs font-semibold">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${n.abiertoAhora ? 'bg-exito' : 'bg-error'}`}
                  />
                  <span className={n.abiertoAhora ? 'text-exito' : 'text-error'}>
                    {n.abiertoAhora ? 'Abierto' : 'Cerrado'}
                  </span>
                </p>
              </div>
              <Link
                to={`/negocios/${n.id}`}
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-oliva px-4 text-sm font-bold text-white"
              >
                Ver comercio
              </Link>
              <button
                type="button"
                onClick={() => quitar(n.id)}
                aria-label={`Quitar ${n.nombre} de favoritos`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-oliva/15 text-error"
              >
                <HeartIcon className="h-5 w-5" fill="currentColor" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
