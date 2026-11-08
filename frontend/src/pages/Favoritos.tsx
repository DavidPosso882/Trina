import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartIcon } from '@heroicons/react/24/outline';
import { getNegocio, type FichaNegocio } from '../lib/api';
import { useSesion } from '../lib/auth';
import { useFavoritos } from '../lib/favoritos';
import { Cargando } from '../components/Estados';
import { Icono } from '../components/Icono';
import { TarjetaNegocio } from '../components/negocio/TarjetaNegocio';
import { TituloAtras } from '../components/TituloAtras';

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
        <TituloAtras titulo="Favoritos" />
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
      <TituloAtras titulo="Favoritos" />
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
        <ul className="mt-3 flex snap-x gap-4 overflow-x-auto pb-2 md:snap-none md:flex-col md:overflow-visible md:pb-0">
          {detalle.data.map((n) => (
            <TarjetaNegocio
              key={n.id}
              negocio={n}
              esFavorito
              onAlternarFav={() => quitar(n.id)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
