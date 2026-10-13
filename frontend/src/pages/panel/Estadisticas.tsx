import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  EyeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { getEstadisticas, getProductosMasVistos, mensajeDeApi } from '../../lib/api';
import { precio } from '../../lib/formato';
import { Icono, type IconoSvg } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

/** PM-10 Estadísticas: resumen y productos más vistos en 7 o 30 días (RF-40/RF-42). */
export default function Estadisticas() {
  const [dias, setDias] = useState(7);

  const resumen = useQuery({
    queryKey: ['estadisticas', dias],
    queryFn: () => getEstadisticas(dias)
  });
  const top = useQuery({
    queryKey: ['productos-mas-vistos', dias],
    queryFn: () => getProductosMasVistos(dias, 5)
  });

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Estadísticas</h1>
      <p className="mt-1 text-texto-suave">Mirá cómo te está yendo en TRINA.</p>

      <div className="mt-3 flex gap-1" aria-label="Elegir período">
        {[7, 30].map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={dias === d}
            className={`rounded-campo px-3 py-2 ${dias === d ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
            onClick={() => setDias(d)}
          >
            Últimos {d} días
          </button>
        ))}
      </div>

      <section className="mt-4" aria-label="Resumen del período">
        {resumen.isLoading && <Cargando texto="Cargando tu resumen…" />}
        {resumen.isError && (
          <ErrorRecargar mensaje={mensajeDeApi(resumen.error)} onReintentar={() => resumen.refetch()} />
        )}
        {resumen.data && (
          <>
            <dl className="grid grid-cols-2 gap-3">
              <Dato icono={EyeIcon} etiqueta="Visitas al perfil" valor={String(resumen.data.visitas)} />
              <Dato icono={ShoppingBagIcon} etiqueta="Pedidos" valor={String(resumen.data.pedidos)} />
              <Dato icono={CalendarDaysIcon} etiqueta="Reservas" valor={String(resumen.data.reservas)} />
              <Dato icono={BanknotesIcon} etiqueta="Ingresos" valor={precio(resumen.data.ingresosCop)} />
            </dl>
            {resumen.data.visitas === 0 && resumen.data.pedidos === 0 && resumen.data.reservas === 0 && (
              <div className="mt-3">
                <Vacio>
                  Todavía no hay movimiento en este período. Compartí tu perfil con tus clientes y volvé a
                  mirar acá.
                </Vacio>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-6 border-t border-tinta-cafe/10 pt-4" aria-label="Productos más vistos">
        <h2 className="text-seccion">Productos más vistos</h2>
        {top.isLoading && <Cargando texto="Cargando el ranking…" />}
        {top.isError && (
          <ErrorRecargar mensaje={mensajeDeApi(top.error)} onReintentar={() => top.refetch()} />
        )}
        {top.data && top.data.length === 0 && (
          <p className="mt-2 text-texto-suave">
            Todavía no hay visitas a tus productos en este período. Cuando tus clientes abran tu catálogo,
            acá vas a ver cuáles miran más.
          </p>
        )}
        {top.data && top.data.length > 0 && (
          <table className="mt-2 w-full text-left">
            <caption className="sr-only">Productos ordenados por cantidad de visitas</caption>
            <thead>
              <tr className="border-b border-tinta-cafe/10 text-sm text-texto-suave">
                <th scope="col" className="py-2">
                  #
                </th>
                <th scope="col" className="py-2">
                  Producto
                </th>
                <th scope="col" className="py-2 text-right">
                  Visitas
                </th>
              </tr>
            </thead>
            <tbody>
              {top.data.map((item, indice) => (
                <tr key={item.itemId ?? `${item.nombre}-${indice}`} className="border-b border-tinta-cafe/10 last:border-0">
                  <td className="py-2 text-texto-suave">{indice + 1}</td>
                  <td className="py-2 font-semibold">{item.nombre}</td>
                  <td className="py-2 text-right">{item.visitas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: IconoSvg; etiqueta: string; valor: string }) {
  return (
    <div className="border-t border-tinta-cafe/10 pt-2">
      <dt className="flex items-center gap-2 text-sm text-texto-suave">
        <Icono icono={icono} tamano="chico" /> {etiqueta}
      </dt>
      <dd className="font-display text-cifra-menor leading-none">{valor}</dd>
    </div>
  );
}
