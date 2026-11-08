import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCarrito } from '../lib/carrito';
import { useQuery } from '@tanstack/react-query';
import { getCatalogo } from '../lib/api';
import { precio } from '../lib/formato';
import { Dialogo } from '../components/Dialogo';
import { Icono } from '../components/Icono';
import { Vacio } from '../components/Estados';
import { TituloAtras } from '../components/TituloAtras';

/** PC-01 Carrito: revisa cantidades y total antes de confirmar (RF-30). */
export default function Carrito() {
  const { carrito, totalCop, cantidadTotal, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [confirmarVaciado, setConfirmarVaciado] = useState(false);
  const catalogo = useQuery({
    queryKey: ['catalogo-carrito', carrito?.negocioId],
    queryFn: () => getCatalogo(carrito!.negocioId),
    enabled: !!carrito,
    retry: false,
    staleTime: 5 * 60_000
  });
  const fotos = useMemo(() => {
    const mapa = new Map<number, string>();
    catalogo.data?.categorias.forEach((g) =>
      g.items.forEach((i) => {
        if (i.imagenUrl) mapa.set(i.id, i.imagenUrl);
      })
    );
    catalogo.data?.sinCategoria.forEach((i) => {
      if (i.imagenUrl) mapa.set(i.id, i.imagenUrl);
    });
    return mapa;
  }, [catalogo.data]);

  if (!carrito || carrito.items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <TituloAtras titulo="Tu carrito" />
        <Vacio>Aún no tienes productos en tu pedido. ¡Explora los negocios del pueblo!</Vacio>
        <Link to="/explorar" className="btn-principal mt-4 inline-block px-6 py-3">
          Explorar negocios
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-40 pt-6">
      <TituloAtras
        titulo={<>Tu pedido en {carrito.negocioNombre}</>}
        subtitulo="Revisa las cantidades. Vas a pagar al confirmar."
      />

      <section
        aria-label="Productos del pedido"
        className="mt-4 rounded-3xl bg-white p-4 shadow-[0_24px_60px_-24px_rgba(27,33,23,0.25)] md:p-6"
      >
        <ul className="divide-y divide-oliva/10">
          {carrito.items.map((item) => {
            const foto = item.imagenUrl ?? fotos.get(item.itemId) ?? null;
            return (
            <li key={item.itemId} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              {foto ? (
                <img
                  src={foto}
                  alt=""
                  loading="lazy"
                  className="h-20 w-20 shrink-0 rounded-2xl bg-[#F0FDF4] object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#F0FDF4] font-display text-2xl font-extrabold text-oliva/60"
                >
                  {item.nombre.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-bold text-[#1A2218]">{item.nombre}</p>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:text-red-500"
                    aria-label={`Eliminar ${item.nombre} del pedido`}
                    onClick={() => quitar(item.itemId)}
                  >
                    <Icono icono={TrashIcon} tamano="chico" />
                  </button>
                </div>
                <p className="mt-0.5 font-bold text-[#1A2218]">{precio(item.precioCop)}</p>
                <div className="mt-auto flex justify-end pt-2">
                  <div className="flex items-center gap-1 rounded-full border border-oliva/10 bg-fondo p-1">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-oliva/10 text-oliva"
                      aria-label={`Quitar una unidad de ${item.nombre}`}
                      onClick={() => cambiarCantidad(item.itemId, item.cantidad - 1)}
                    >
                      <Icono icono={MinusIcon} tamano="chico" />
                    </button>
                    <span
                      className="min-w-[2ch] text-center text-sm font-bold text-[#1A2218]"
                      aria-label={`Cantidad de ${item.nombre}`}
                    >
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A2218] text-white shadow"
                      aria-label={`Agregar una unidad de ${item.nombre}`}
                      onClick={() => cambiarCantidad(item.itemId, item.cantidad + 1)}
                    >
                      <Icono icono={PlusIcon} tamano="chico" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-oliva/10 pt-4">
          <dl className="space-y-1">
            <div className="flex items-baseline justify-between text-sm text-texto-suave">
              <dt>Subtotal</dt>
              <dd>{precio(totalCop)}</dd>
            </div>
            <div className="flex items-baseline justify-between text-sm text-texto-suave">
              <dt>Envío</dt>
              <dd>Recoges en el local</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <dt className="font-bold text-[#1A2218]">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-[#1A2218]">
                {precio(totalCop)}
              </dd>
            </div>
          </dl>
          <Link
            to="/pedido/confirmar"
            className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#1A2218] text-base font-bold text-white shadow-lg"
          >
            Confirmar Pedido ({cantidadTotal})
          </Link>
          <p className="mt-2 text-center text-sm text-texto-suave">
            Recoges en: {carrito.negocioNombre}
          </p>
        </div>
      </section>

      <button
        type="button"
        className="mt-3 w-full py-2 text-sm font-medium text-gray-400 hover:text-red-500"
        onClick={() => setConfirmarVaciado(true)}
      >
        Vaciar carrito
      </button>

      <Dialogo abierto={confirmarVaciado} titulo="¿Vaciar el carrito?" onCerrar={() => setConfirmarVaciado(false)}>
        <p>Se van a quitar todos los productos de {carrito.negocioNombre}.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-peligro px-4 py-3"
            onClick={() => {
              vaciar();
              setConfirmarVaciado(false);
            }}
          >
            Sí, vaciar carrito
          </button>
          <button type="button" className="btn-secundario px-4 py-3" onClick={() => setConfirmarVaciado(false)}>
            Cancelar
          </button>
        </div>
      </Dialogo>
    </main>
  );
}
