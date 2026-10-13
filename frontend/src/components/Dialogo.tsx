import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Diálogo de confirmación (§5.3): resume la acción y el efecto; los botones usan verbos.
 * Cierra con Escape o tocando el fondo; el foco entra al diálogo al abrir.
 */
export function Dialogo({
  abierto,
  titulo,
  onCerrar,
  children
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (abierto) caja.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto/50 p-4"
      onClick={onCerrar}
    >
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="w-full max-w-md rounded-tarjeta bg-superficie p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={idTitulo} className="font-display text-titulo-menor">
          {titulo}
        </h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
