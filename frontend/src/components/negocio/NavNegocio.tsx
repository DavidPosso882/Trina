import { NavLink } from 'react-router-dom';
import { BuildingStorefrontIcon, ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Icono, type IconoSvg } from '../Icono';

const SECCIONES: { to: string; texto: string; icono: IconoSvg }[] = [
  { to: '/panel/negocio', texto: 'Datos', icono: BuildingStorefrontIcon },
  { to: '/panel/negocio/horarios', texto: 'Horarios', icono: ClockIcon },
  { to: '/panel/negocio/fotos', texto: 'Fotos', icono: PhotoIcon }
];

/** Navegación entre las pantallas del negocio (PM-03, PM-04, PM-05). */
export function NavNegocio() {
  return (
    <nav aria-label="Secciones de mi negocio" className="flex flex-wrap gap-2">
      {SECCIONES.map((s) => (
        <NavLink
          key={s.to}
          to={s.to}
          end={s.to === '/panel/negocio'}
          className={({ isActive }) =>
            `btn-secundario inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
              isActive ? 'bg-primario-claro font-bold' : ''
            }`
          }
        >
          <Icono icono={s.icono} tamano="chico" />
          {s.texto}
        </NavLink>
      ))}
    </nav>
  );
}
