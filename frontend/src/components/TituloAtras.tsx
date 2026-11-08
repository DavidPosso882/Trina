import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Icono } from './Icono';

/** Flecha para volver a la pantalla anterior (con repliegue al inicio si no hay historial). */
export function BotonAtras({ etiqueta = 'Volver a la pantalla anterior' }: { etiqueta?: string }) {
  const navigate = useNavigate();
  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  };
  return (
    <button
      type="button"
      onClick={volver}
      aria-label={etiqueta}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-oliva/50 transition-colors hover:bg-oliva/10 hover:text-oliva"
    >
      <Icono icono={ArrowLeftIcon} />
    </button>
  );
}

/** Título de ventana con flecha para volver al lado del nombre. */
export function TituloAtras({ titulo, subtitulo }: { titulo: ReactNode; subtitulo?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <BotonAtras />
        <h1 className="font-display text-titulo">{titulo}</h1>
      </div>
      {subtitulo != null && <p className="mt-1 text-texto-suave">{subtitulo}</p>}
    </div>
  );
}
