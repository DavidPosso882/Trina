import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

/** Un solo negocio por carrito (RF-30); se guarda en localStorage para no perderlo al recargar. */
export type ItemCarrito = {
  itemId: number;
  nombre: string;
  precioCop: number;
  cantidad: number;
};

export type Carrito = {
  negocioId: number;
  negocioNombre: string;
  items: ItemCarrito[];
};

const CLAVE = 'trina_carrito_v1';

function leerCarrito(): Carrito | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Carrito;
    if (
      !datos ||
      typeof datos.negocioId !== 'number' ||
      typeof datos.negocioNombre !== 'string' ||
      !Array.isArray(datos.items)
    ) {
      return null;
    }
    const items = datos.items.filter(
      (i) =>
        i &&
        typeof i.itemId === 'number' &&
        typeof i.nombre === 'string' &&
        typeof i.precioCop === 'number' &&
        Number.isInteger(i.cantidad) &&
        i.cantidad > 0
    );
    return items.length > 0 ? { ...datos, items } : null;
  } catch {
    return null;
  }
}

type Contexto = {
  carrito: Carrito | null;
  totalCop: number;
  cantidadTotal: number;
  /** true si el carrito tiene productos de otro negocio: hay que confirmar antes de mezclar. */
  esDeOtroNegocio: (negocioId: number) => boolean;
  agregar: (negocio: { id: number; nombre: string }, item: { id: number; nombre: string; precioCop: number }) => void;
  cambiarCantidad: (itemId: number, cantidad: number) => void;
  quitar: (itemId: number) => void;
  vaciar: () => void;
};

const Ctx = createContext<Contexto>({
  carrito: null,
  totalCop: 0,
  cantidadTotal: 0,
  esDeOtroNegocio: () => false,
  agregar: () => {},
  cambiarCantidad: () => {},
  quitar: () => {},
  vaciar: () => {}
});

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const [carrito, setCarrito] = useState<Carrito | null>(() => leerCarrito());

  useEffect(() => {
    if (carrito && carrito.items.length > 0) {
      localStorage.setItem(CLAVE, JSON.stringify(carrito));
    } else {
      localStorage.removeItem(CLAVE);
    }
  }, [carrito]);

  const esDeOtroNegocio = useCallback(
    (negocioId: number) => carrito !== null && carrito.items.length > 0 && carrito.negocioId !== negocioId,
    [carrito]
  );

  const agregar = useCallback(
    (negocio: { id: number; nombre: string }, item: { id: number; nombre: string; precioCop: number }) => {
      setCarrito((actual) => {
        const items = actual && actual.negocioId === negocio.id ? actual.items : [];
        const existente = items.find((i) => i.itemId === item.id);
        const siguientes = existente
          ? items.map((i) => (i.itemId === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))
          : [...items, { itemId: item.id, nombre: item.nombre, precioCop: item.precioCop, cantidad: 1 }];
        return { negocioId: negocio.id, negocioNombre: negocio.nombre, items: siguientes };
      });
    },
    []
  );

  const cambiarCantidad = useCallback((itemId: number, cantidad: number) => {
    setCarrito((actual) => {
      if (!actual) return actual;
      const items = actual.items
        .map((i) => (i.itemId === itemId ? { ...i, cantidad: Math.max(1, Math.min(99, cantidad)) } : i))
        .filter((i) => i.cantidad > 0);
      return items.length > 0 ? { ...actual, items } : null;
    });
  }, []);

  const quitar = useCallback((itemId: number) => {
    setCarrito((actual) => {
      if (!actual) return actual;
      const items = actual.items.filter((i) => i.itemId !== itemId);
      return items.length > 0 ? { ...actual, items } : null;
    });
  }, []);

  const vaciar = useCallback(() => setCarrito(null), []);

  const { totalCop, cantidadTotal } = useMemo(() => {
    const items = carrito?.items ?? [];
    return {
      totalCop: items.reduce((suma, i) => suma + i.precioCop * i.cantidad, 0),
      cantidadTotal: items.reduce((suma, i) => suma + i.cantidad, 0)
    };
  }, [carrito]);

  return (
    <Ctx.Provider
      value={{ carrito, totalCop, cantidadTotal, esDeOtroNegocio, agregar, cambiarCantidad, quitar, vaciar }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCarrito = () => useContext(Ctx);
