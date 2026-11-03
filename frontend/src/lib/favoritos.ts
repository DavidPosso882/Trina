import { useCallback, useEffect, useState } from 'react';

const CLAVE = 'trina:favoritos:v1';
const EVENTO = 'trina:favoritos:cambio';

function leer(): number[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const lista = JSON.parse(crudo) as unknown;
    if (!Array.isArray(lista)) return [];
    return [...new Set(lista.filter((x): x is number => typeof x === 'number' && Number.isInteger(x)))];
  } catch {
    return [];
  }
}

function guardar(ids: number[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...new Set(ids)]));
  } catch {
    // localStorage lleno o bloqueado: no rompemos la UI por un favorito.
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export function esFavorito(id: number): boolean {
  return leer().includes(id);
}

export function agregarFavorito(id: number) {
  guardar([...leer(), id]);
}

export function quitarFavorito(id: number) {
  guardar(leer().filter((x) => x !== id));
}

export function alternarFavorito(id: number): boolean {
  const actual = leer();
  const estaba = actual.includes(id);
  guardar(estaba ? actual.filter((x) => x !== id) : [...actual, id]);
  return !estaba;
}

/** Hook reactivo: lee localStorage y se actualiza con cambios propios o de otra pestaña. */
export function useFavoritos() {
  const [ids, setIds] = useState<number[]>(() =>
    typeof window === 'undefined' ? [] : leer()
  );

  useEffect(() => {
    const refrescar = () => setIds(leer());
    window.addEventListener(EVENTO, refrescar);
    window.addEventListener('storage', refrescar);
    return () => {
      window.removeEventListener(EVENTO, refrescar);
      window.removeEventListener('storage', refrescar);
    };
  }, []);

  const alternar = useCallback((id: number) => {
    setIds((prev) => {
      const estaba = prev.includes(id);
      const siguiente = estaba ? prev.filter((x) => x !== id) : [...prev, id];
      guardar(siguiente);
      return siguiente;
    });
  }, []);

  const quitar = useCallback((id: number) => {
    setIds((prev) => {
      const siguiente = prev.filter((x) => x !== id);
      guardar(siguiente);
      return siguiente;
    });
  }, []);

  return { ids, alternar, quitar };
}
