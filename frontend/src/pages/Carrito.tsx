import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCarrito } from '../lib/carrito';
import { precio } from '../lib/formato';
import { Dialogo } from '../components/Dialogo';
import { Icono } from '../components/Icono';
import { Vacio } from '../components/Estados';

/** PC-01 Carrito: revisa cantidades y total antes de confirmar (RF-30). */
export default function Carrito() {
  const { carrito, totalCop, cantidadTotal, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [confirmarVaciado, setConfirmarVaciado] = useState(false);

  if (!carrito || carrito.items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <h1 className="font-display text-titulo">Tu carrito</h1>
        <Vacio>Aún no tenés productos en tu pedido. ¡Explorá los negocios del pueblo!</Vacio>
        <Link to="/explorar" className="btn-principal mt-4 inline-block px-6 py-3">
          Explorar negocios
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-40 pt-6">
      <h1 className="font-display text-titulo">Tu pedido en {carrito.negocioNombre}</h1>
      <p className="mt-1 text-texto-suave">
        Revisá las cantidades. Vas a pagar al confirmar.
      </p>

      <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
        {carrito.items.map((item) => (
          <li key={item.itemId} className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-sm text-texto-suave">{precio(item.precioCop)} cada uno</p>
              </div>
              <p className="font-display text-cifra-menor leading-none">
                {precio(item.precioCop * item.cantidad)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-boton items-center gap-1 rounded-campo border-2 border-primario px-3 font-semibold text-primario"
                aria-label={`Quitar una unidad de ${item.nombre}`}
                onClick={() => cambiarCantidad(item.itemId, item.cantidad - 1)}
              >
                <Icono icono={MinusIcon} tamano="chico" /> Quitar
              </button>
              <span className="min-w-[2ch] text-center font-bold" aria-label={`Cantidad de ${item.nombre}`}>
                {item.cantidad}
              </span>
              <button
                type="button"
                className="inline-flex min-h-boton items-center gap-1 rounded-campo border-2 border-primario px-3 font-semibold text-primario"
                aria-label={`Agregar una unidad de ${item.nombre}`}
                onClick={() => cambiarCantidad(item.itemId, item.cantidad + 1)}
              >
                <Icono icono={PlusIcon} tamano="chico" /> Agregar
              </button>
              <button
                type="button"
                className="ml-auto inline-flex min-h-boton items-center gap-1 text-sm font-semibold text-error underline"
                onClick={() => quitar(item.itemId)}
              >
                <Icono icono={TrashIcon} tamano="chico" /> Eliminar del pedido
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4">
        <p className="flex items-baseline justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-display text-cifra-menor leading-none">{precio(totalCop)}</span>
        </p>
        <p className="mt-1 text-texto-suave">Recogés en: {carrito.negocioNombre}</p>
      </div>

      <Link to="/pedido/confirmar" className="btn-principal mt-4 block px-6 py-3 text-center">
        Continuar con el pedido ({cantidadTotal})
      </Link>
      <button
        type="button"
        className="mt-3 w-full py-2 text-sm font-semibold text-error underline"
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
