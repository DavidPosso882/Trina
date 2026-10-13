import type { ComponentType, SVGProps } from 'react';

/** Cualquier icono de Heroicons (24/outline o 24/solid). */
export type IconoSvg = ComponentType<SVGProps<SVGSVGElement>>;

const TAMANOS = {
  chico: 'h-4 w-4', // 16px — etiquetas y líneas densas
  medio: 'h-5 w-5', // 20px — botones y filas
  grande: 'h-6 w-6' // 24px — navegación y cabeceras
} as const;

export type TamanoIcono = keyof typeof TAMANOS;

/**
 * S5 — icono vectorial del sistema (Heroicons) con los tres tamaños de la UI.
 * Por defecto es decorativo: en TRINA el icono nunca va solo, siempre lo acompaña un texto visible.
 * Si el icono es lo único que nombra un control, el control debe llevar su `aria-label`;
 * `etiqueta` queda para el caso excepcional de un icono con significado propio.
 */
export function Icono({
  icono: Componente,
  tamano = 'medio',
  etiqueta,
  className = ''
}: {
  icono: IconoSvg;
  tamano?: TamanoIcono;
  etiqueta?: string;
  className?: string;
}) {
  return (
    <Componente
      className={`${TAMANOS[tamano]} shrink-0 ${className}`.trim()}
      aria-hidden={etiqueta ? undefined : true}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      focusable="false"
    />
  );
}
