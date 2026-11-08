import { useCallback, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Icono } from './Icono';

/** Visor de fotos a pantalla completa: grande, iterable y con X para cerrar. */
export function Lightbox({
  fotos,
  indice,
  titulo,
  onCambiar,
  onCerrar
}: {
  fotos: string[];
  indice: number;
  titulo: string;
  onCambiar: (indice: number) => void;
  onCerrar: () => void;
}) {
  const total = fotos.length;
  const anterior = useCallback(() => onCambiar((indice - 1 + total) % total), [indice, total, onCambiar]);
  const siguiente = useCallback(() => onCambiar((indice + 1) % total), [indice, total, onCambiar]);

  useEffect(() => {
    const alTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
      else if (e.key === 'ArrowLeft') anterior();
      else if (e.key === 'ArrowRight') siguiente();
    };
    window.addEventListener('keydown', alTeclar);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', alTeclar);
      document.body.style.overflow = '';
    };
  }, [anterior, siguiente, onCerrar]);

  if (total === 0) return null;
  const actual = fotos[((indice % total) + total) % total];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}: ${titulo}`}
      className="fixed inset-0 z-[100] flex flex-col bg-oliva/95 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <p className="truncate text-sm font-semibold text-white/80" onClick={(e) => e.stopPropagation()}>
          {titulo} · {indice + 1} de {total}
        </p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar visor"
          autoFocus
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
        >
          <Icono icono={XMarkIcon} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-14"
        onClick={(e) => e.stopPropagation()}
      >
        {total > 1 && (
          <button
            type="button"
            onClick={anterior}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:left-4"
          >
            <Icono icono={ChevronLeftIcon} />
          </button>
        )}
        <img
          key={actual}
          src={actual}
          alt={`Foto ${indice + 1} de ${total} de ${titulo}`}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
        />
        {total > 1 && (
          <button
            type="button"
            onClick={siguiente}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:right-4"
          >
            <Icono icono={ChevronRightIcon} />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-5" onClick={(e) => e.stopPropagation()}>
          {fotos.map((f, i) => (
            <button
              key={`${f}-${i}`}
              type="button"
              onClick={() => onCambiar(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === indice}
              className={`h-2 rounded-full transition-all ${i === indice ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
