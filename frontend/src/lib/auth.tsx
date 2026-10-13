import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Rol } from './api';

type Sesion = { id: number; email: string; nombre: string; rol: Rol } | null;

const Ctx = createContext<{
  sesion: Sesion;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<Rol>;
  salir: () => void;
}>({ sesion: null, cargando: true, entrar: async () => 'CLIENTE' as Rol, salir: () => {} });

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion>(null);
  // Con token guardado esperamos a /auth/me antes de dejar pasar rutas protegidas.
  const [cargando, setCargando] = useState(() => Boolean(sessionStorage.getItem('trina_token')));

  useEffect(() => {
    if (sessionStorage.getItem('trina_token')) {
      api.me().then(
        (yo) => {
          setSesion({ id: yo.id, email: yo.email, nombre: yo.nombre, rol: yo.rol });
          setCargando(false);
        },
        () => {
          sessionStorage.removeItem('trina_token');
          setCargando(false);
        }
      );
    }
  }, []);

  const entrar = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password);
    sessionStorage.setItem('trina_token', r.token);
    const yo = await api.me();
    setSesion({ id: yo.id, email: yo.email, nombre: yo.nombre, rol: yo.rol });
    return r.rol;
  }, []);

  const salir = useCallback(() => {
    api.logout().catch(() => {});
    sessionStorage.removeItem('trina_token');
    setSesion(null);
  }, []);

  return <Ctx.Provider value={{ sesion, cargando, entrar, salir }}>{children}</Ctx.Provider>;
}

export const useSesion = () => useContext(Ctx);
