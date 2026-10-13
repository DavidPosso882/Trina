import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Icono } from '../Icono';

/** Estado vacío común: el comerciante todavía no creó su negocio. */
export function SinNegocioPanel() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Mi negocio</h1>
      <p className="mt-2">
        Todavía no creaste tu negocio. Creálo en unos minutos y empezá a mostrarte en TRINA.
      </p>
      <Link
        to="/panel/negocio/nuevo"
        className="btn-principal mt-4 inline-flex items-center gap-2 px-6 py-3"
      >
        <Icono icono={PlusIcon} />
        Crear mi negocio
      </Link>
    </main>
  );
}
