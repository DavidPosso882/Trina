import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { mensajeDeApi, restablecerClave } from '../lib/api';
import { Icono } from '../components/Icono';

const esquema = z
  .object({
    nueva: z
      .string()
      .min(8, 'La contraseña necesita mínimo 8 caracteres, con letras y números.')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'La contraseña necesita mínimo 8 caracteres, con letras y números.'),
    repetir: z.string()
  })
  .refine((v) => v.nueva === v.repetir, {
    path: ['repetir'],
    message: 'Las dos contraseñas tienen que ser iguales.'
  });

type Valores = z.infer<typeof esquema>;

/** Acepta el enlace completo o solo el token; el token viaja en la URL del correo. */
function extraerToken(texto: string): string {
  const limpio = texto.trim();
  const coincidencia = limpio.match(/[?&]token=([^&\s]+)/);
  return coincidencia ? decodeURIComponent(coincidencia[1]) : limpio;
}

/**
 * RF-03 E2/E3: cambiar la contraseña con el token del enlace. También es la salida del flujo de
 * clave temporal (RF-47): al restablecer se limpia el cambio obligatorio.
 */
export default function RestablecerClave() {
  const [parametros, setParametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const [tokenManual, setTokenManual] = useState('');
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { nueva: '', repetir: '' }
  });

  const enviar = async (v: Valores) => {
    setError(null);
    try {
      await restablecerClave(token, v.nueva);
      setListo(true);
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 pb-20 pt-6">
        <h1 className="font-display text-titulo">Restablecer contraseña</h1>
        <p className="mt-1 text-texto-suave">
          El enlace del correo trae el token. Si lo abriste en otro dispositivo, pégalo aquí.
        </p>
        <div className="tarjeta-form mt-4 space-y-4">
          <div>
            <label htmlFor="token" className="font-semibold">
              Enlace o token
            </label>
            <input
              id="token"
              className="campo mt-1"
              placeholder="Pega el enlace o el token"
              value={tokenManual}
              onChange={(e) => setTokenManual(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/recuperar-clave"
              className="inline-flex min-h-boton items-center gap-1.5 font-semibold text-lima-oscura"
            >
              <Icono icono={ArrowLeftIcon} tamano="chico" />
              Pedir un enlace nuevo
            </Link>
            <button
              type="button"
              className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
              disabled={tokenManual.trim().length < 10}
              onClick={() => setParametros({ token: extraerToken(tokenManual) })}
            >
              Continuar
              <Icono icono={ArrowRightIcon} tamano="chico" className="text-white" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (listo) {
    return (
      <main className="mx-auto max-w-md px-4 pb-20 pt-6">
        <h1 className="flex items-center gap-2 font-display text-titulo">
          <Icono icono={CheckBadgeIcon} tamano="grande" className="text-primario" /> Contraseña nueva lista
        </h1>
        <div className="tarjeta-form mt-4 space-y-4">
          <p>
            Ya puedes ingresar con tu correo y la contraseña nueva. Por seguridad, cerramos las sesiones
            que estaban abiertas.
          </p>
          <div className="flex sm:items-center sm:justify-end">
            <Link
              to="/ingresar"
              className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              Ingresar
              <Icono icono={ArrowRightIcon} tamano="chico" className="text-white" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Crea tu contraseña nueva</h1>
      <p className="mt-1 text-texto-suave">Mínimo 8 caracteres, con letras y números.</p>
      <form className="tarjeta-form mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
        <div>
          <label htmlFor="nueva" className="font-semibold">
            Contraseña nueva
          </label>
          <input
            id="nueva"
            type="password"
            className="campo mt-1"
            autoComplete="new-password"
            aria-describedby="nueva-error"
            {...register('nueva')}
          />
          {formState.errors.nueva && (
            <p id="nueva-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.nueva.message}</span>
            </p>
          )}
        </div>
        <div>
          <label htmlFor="repetir" className="font-semibold">
            Repetir la contraseña
          </label>
          <input
            id="repetir"
            type="password"
            className="campo mt-1"
            autoComplete="new-password"
            aria-describedby="repetir-error"
            {...register('repetir')}
          />
          {formState.errors.repetir && (
            <p id="repetir-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.repetir.message}</span>
            </p>
          )}
        </div>
        {error && (
          <p role="alert" aria-live="assertive" className="flex items-start gap-1 rounded-campo bg-error/10 p-3 text-error">
            <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
            <span>{error}</span>
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/recuperar-clave"
            className="inline-flex min-h-boton items-center gap-1.5 font-semibold text-lima-oscura"
          >
            <Icono icono={ArrowLeftIcon} tamano="chico" />
            Pedir un enlace nuevo
          </Link>
          <button
            type="submit"
            className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? 'Guardando…' : 'Guardar contraseña nueva'}
            <Icono icono={ArrowRightIcon} tamano="chico" className="text-white" />
          </button>
        </div>
      </form>
    </main>
  );
}
