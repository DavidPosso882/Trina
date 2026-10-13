import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cobrarPedido, cobrarSuscripcion, mensajeDeApi } from '../lib/api';
import { precio } from '../lib/formato';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Icono } from './Icono';

const esquema = z.object({
  tarjeta: z
    .string()
    .refine((v) => /^\d{16}$/.test(v.replace(/\s/g, '')), 'Escribí los 16 números de la tarjeta')
});

type Valores = z.infer<typeof esquema>;

function nuevaClaveIdempotencia(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const azar = Math.floor(Math.random() * 16);
    return (c === 'x' ? azar : (azar & 0x3) | 0x8).toString(16);
  });
}

/**
 * Pago simulado (RF-28/RF-34): sirve para un pedido del cliente o para la suscripción Destacada
 * del comerciante. Pide la tarjeta de prueba y cobra con una clave de idempotencia nueva en cada
 * intento; la clave evita cobrar dos veces si se repite el envío.
 */
export function FormularioPago({
  pedidoId,
  suscripcionId,
  montoCop,
  titulo,
  onAprobado
}: {
  pedidoId?: number;
  suscripcionId?: number;
  montoCop: number;
  titulo?: string;
  onAprobado: () => void | Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { tarjeta: '' }
  });

  const pagar = async (v: Valores) => {
    setError(null);
    try {
      const tarjeta = v.tarjeta.replace(/\s/g, '');
      const clave = nuevaClaveIdempotencia();
      const resultado =
        pedidoId != null
          ? await cobrarPedido(pedidoId, tarjeta, clave)
          : await cobrarSuscripcion(suscripcionId!, tarjeta, clave);
      if (resultado.estado === 'APROBADO') {
        await onAprobado();
      } else {
        setError(
          `No se pudo procesar el pago: ${resultado.motivo ?? 'el banco lo rechazó'}. Podés probar con otra tarjeta.`
        );
      }
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form className="mt-4 space-y-4 rounded-tarjeta bg-superficie p-4 shadow" onSubmit={handleSubmit(pagar)} noValidate>
      <h2 className="font-display text-seccion">{titulo ?? `Pagar ahora (${precio(montoCop)})`}</h2>
      <p className="text-sm text-texto-suave">
        Es un pago de prueba: usá la tarjeta 4111 1111 1111 1111 para que se apruebe.
      </p>
      <div>
        <label htmlFor="tarjeta" className="font-semibold">
          Número de la tarjeta
        </label>
        <input
          id="tarjeta"
          className="campo mt-1"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4111 1111 1111 1111"
          maxLength={19}
          aria-describedby="tarjeta-ayuda tarjeta-error"
          {...register('tarjeta')}
        />
        <p id="tarjeta-ayuda" className="mt-1 text-sm text-texto-suave">
          No guardamos los datos de tu tarjeta.
        </p>
        {formState.errors.tarjeta && (
          <p id="tarjeta-error" role="alert" className="mt-1 flex items-start gap-2 font-semibold text-error">
            <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-1" />
            <span>{formState.errors.tarjeta.message}</span>
          </p>
        )}
      </div>
      {error && (
        <p role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-campo bg-error/10 p-3 text-error">
          <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
          <span>{error}</span>
        </p>
      )}
      <button className="btn-principal px-6 py-3" type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Procesando el pago…' : `Pagar ${precio(montoCop)}`}
      </button>
    </form>
  );
}
