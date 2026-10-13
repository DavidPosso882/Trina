import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BuildingStorefrontIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { crearPedido, mensajeDeApi, type Pedido } from '../lib/api';
import { useCarrito } from '../lib/carrito';
import { useSesion } from '../lib/auth';
import { precio } from '../lib/formato';
import { Aviso } from '../components/negocio/Aviso';
import { FormularioPago } from '../components/FormularioPago';
import { Icono } from '../components/Icono';

const esquema = z.object({
  metodoPago: z.enum(['SANDBOX', 'EN_LOCAL']),
  nota: z.string().max(300, 'La nota no puede pasar de 300 letras.').optional()
});

type Valores = z.infer<typeof esquema>;

/** PC-02 Confirmar y pagar: método de pago, nota, crea el pedido y cobra si es pago ahora (RF-25/28). */
export default function ConfirmarPedido() {
  const { carrito, totalCop, vaciar } = useCarrito();
  const { sesion } = useSesion();
  const navegar = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { metodoPago: 'SANDBOX', nota: '' }
  });

  if (sesion && sesion.rol !== 'CLIENTE') {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <h1 className="font-display text-titulo">Confirmar pedido</h1>
        <div className="mt-3">
          <Aviso tipo="info">Para confirmar un pedido necesitás una cuenta de cliente.</Aviso>
        </div>
        <Link to="/explorar" className="mt-3 inline-block font-semibold text-primario">
          Explorar negocios
        </Link>
      </main>
    );
  }

  if (!pedido && (!carrito || carrito.items.length === 0)) {
    return <Navigate to="/carrito" replace />;
  }

  const confirmar = async (v: Valores) => {
    if (!carrito) return;
    setError(null);
    try {
      const creado = await crearPedido({
        negocioId: carrito.negocioId,
        items: carrito.items.map((i) => ({ itemId: i.itemId, cantidad: i.cantidad })),
        metodoPago: v.metodoPago,
        nota: v.nota?.trim() ? v.nota.trim() : undefined
      });
      if (creado.metodoPago === 'EN_LOCAL') {
        navegar(`/pedidos/${creado.id}`, {
          state: { mensaje: 'Pedido enviado. Esperando al negocio.', tipo: 'exito' }
        });
      } else {
        setPedido(creado);
      }
      vaciar();
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  const yaPagando = pedido !== null;

  return (
    <main className="mx-auto max-w-xl px-4 pb-40 pt-6">
      <h1 className="font-display text-titulo">Confirmar pedido</h1>

      {!yaPagando && carrito && (
        <>
          <section
            className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
            aria-label="Resumen del pedido"
          >
            <h2 className="text-seccion">Pedido en {carrito.negocioNombre}</h2>
            <ul className="mt-2 divide-y divide-tinta-cafe/10">
              {carrito.items.map((item) => (
                <li key={item.itemId} className="flex justify-between py-2">
                  <span>
                    {item.cantidad} × {item.nombre}
                  </span>
                  <span className="font-semibold">{precio(item.precioCop * item.cantidad)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex items-baseline justify-between border-t border-tinta-cafe/10 pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-display text-cifra-menor leading-none">{precio(totalCop)}</span>
            </p>
            <Link
              to={`/negocios/${carrito.negocioId}`}
              className="mt-3 inline-flex min-h-boton items-center gap-2 font-semibold text-primario"
            >
              <Icono icono={PlusIcon} tamano="chico" /> Agregar más productos
            </Link>
          </section>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit(confirmar)} noValidate>
            <fieldset className="rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4">
              <legend className="font-bold">¿Cómo querés pagar?</legend>
              <label className="mt-3 flex min-h-boton items-center gap-3">
                <input type="radio" value="SANDBOX" {...register('metodoPago')} />
                <span>
                  <span className="inline-flex items-center gap-2">
                    <Icono icono={CreditCardIcon} tamano="chico" />
                    <strong>Pagar ahora (prueba)</strong>
                  </span>
                  <span className="block text-sm text-texto-suave">
                    Te pedimos la tarjeta de prueba en el siguiente paso.
                  </span>
                </span>
              </label>
              <label className="mt-2 flex min-h-boton items-center gap-3">
                <input type="radio" value="EN_LOCAL" {...register('metodoPago')} />
                <span>
                  <span className="inline-flex items-center gap-2">
                    <Icono icono={BuildingStorefrontIcon} tamano="chico" />
                    <strong>Pagar en el local</strong>
                  </span>
                  <span className="block text-sm text-texto-suave">Pagás cuando recogés el pedido.</span>
                </span>
              </label>
            </fieldset>

            <div>
              <label htmlFor="nota" className="font-semibold">
                Nota para el negocio (opcional)
              </label>
              <textarea
                id="nota"
                rows={3}
                className="campo mt-1"
                placeholder="Ej.: sin azúcar, por favor."
                aria-describedby="nota-ayuda"
                {...register('nota')}
              />
              <p id="nota-ayuda" className="mt-1 text-sm text-texto-suave">
                Contale algo que tenga que saber para preparar tu pedido.
              </p>
              {formState.errors.nota && (
                <p role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
                  <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                  <span>{formState.errors.nota.message}</span>
                </p>
              )}
            </div>

            {error && (
              <div role="alert" aria-live="assertive">
                <Aviso tipo="error">{error}</Aviso>
                <Link to="/carrito" className="mt-2 inline-block font-semibold text-primario">
                  Volver al carrito a corregirlo
                </Link>
              </div>
            )}

            <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Enviando el pedido…' : 'Confirmar pedido'}
            </button>
          </form>
        </>
      )}

      {yaPagando && (
        <>
          <Aviso tipo="info">
            Tu pedido #{pedido.id} quedó creado. Completá el pago para que el negocio lo reciba.
          </Aviso>
          <FormularioPago
            pedidoId={pedido.id}
            montoCop={pedido.totalCop}
            onAprobado={() =>
              navegar(`/pedidos/${pedido.id}`, {
                state: { mensaje: 'Pago aprobado. Tu pedido quedó esperando al negocio.', tipo: 'exito' }
              })
            }
          />
          <button
            type="button"
            className="mt-3 w-full py-2 font-semibold text-primario underline"
            onClick={() => navegar(`/pedidos/${pedido.id}`)}
          >
            Pagar más tarde desde Mis pedidos
          </button>
        </>
      )}
    </main>
  );
}
