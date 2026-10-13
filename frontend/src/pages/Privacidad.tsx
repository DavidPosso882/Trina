import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { getPoliticaPrivacidad } from '../lib/api';
import { Icono } from '../components/Icono';
import { Cargando, ErrorRecargar } from '../components/Estados';

/** PU-07 Política de privacidad (RF-48): texto y versión vigentes directamente del servidor. */
export default function Privacidad() {
  const politica = useQuery({
    queryKey: ['politica-privacidad'],
    queryFn: getPoliticaPrivacidad,
    staleTime: 30 * 60_000
  });

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Política de tratamiento de datos</h1>
      <p className="mt-1 text-texto-suave">
        Así cuidamos tu información personal en TRINA. Aplica a clientes, comerciantes y visitantes.
      </p>

      {politica.isLoading && <Cargando texto="Cargando la política…" />}
      {politica.isError && (
        <ErrorRecargar
          mensaje="No pudimos cargar la política. Revisá tu conexión e intentá de nuevo."
          onReintentar={() => politica.refetch()}
        />
      )}
      {politica.data && (
        <article className="mt-4 space-y-3 border-t border-tinta-cafe/10 pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primario">
            <Icono icono={DocumentTextIcon} tamano="chico" /> Versión vigente: {politica.data.version}
          </p>
          <p className="text-texto">{politica.data.texto}</p>
        </article>
      )}

      <p className="mt-4">
        Desde{' '}
        <Link to="/cuenta" className="font-semibold text-primario underline">
          Mi cuenta
        </Link>{' '}
        podés descargar tus datos o eliminar tu cuenta cuando quieras.
      </p>
    </main>
  );
}
