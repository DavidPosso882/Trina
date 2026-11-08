import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { recuperarClave, mensajeDeApi } from '../lib/api';
import { Aviso } from '../components/negocio/Aviso';
import { Icono } from '../components/Icono';

const esquema = z.object({
  email: z.string().trim().email('Ese correo no parece válido.')
});

type Valores = z.infer<typeof esquema>;

/**
 * RF-03 E1: pedir el enlace de recuperación. La respuesta es la misma exista o no la cuenta, así
 * que siempre mostramos el mismo mensaje tranquilizador.
 */
export default function RecuperarClave() {
  const ubicacion = useLocation();
  const estado = ubicacion.state as { temporal?: boolean; email?: string } | null;
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, getValues } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { email: estado?.email ?? '' }
  });

  const enviar = async (v: Valores) => {
    setError(null);
    try {
      await recuperarClave(v.email.trim());
      setEnviado(true);
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Recuperar contraseña</h1>
      <p className="mt-1 text-texto-suave">
        Te enviamos un enlace para crear una contraseña nueva. El enlace vence a los 30 minutos y
        sirve una sola vez.
      </p>

      {estado?.temporal && (
        <div className="mt-4">
          <Aviso tipo="info">
            Entraste con una contraseña temporal. Para poder usar TRINA, pide el enlace y crea tu
            propia contraseña.
          </Aviso>
        </div>
      )}

      {enviado ? (
        <>
        <div className="tarjeta-form mt-4 space-y-4">
          <Aviso tipo="exito">
            Si <strong>{getValues('email').trim()}</strong> está registrado, te enviamos un enlace
            para cambiar la contraseña. Revisa tu correo y, si no lo ves, mira la carpeta de spam.
          </Aviso>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="inline-flex min-h-boton items-center gap-1.5 font-semibold text-lima-oscura"
              onClick={() => setEnviado(false)}
            >
              <Icono icono={ArrowLeftIcon} tamano="chico" />
              Usar otro correo
            </button>
            <Link
              to="/restablecer-clave"
              className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              Ya tengo el enlace
              <Icono icono={ArrowRightIcon} tamano="chico" className="text-white" />
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center">
          <Link to="/ingresar" className="font-semibold text-primario underline">
            Volver a ingresar
          </Link>
        </p>
        </>
      ) : (
        <form className="tarjeta-form mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
          <div>
            <label htmlFor="email" className="font-semibold">
              Correo de tu cuenta
            </label>
            <input
              id="email"
              type="email"
              className="campo mt-1"
              autoComplete="email"
              aria-describedby="email-error"
              {...register('email')}
            />
            {formState.errors.email && (
              <p id="email-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
                <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                <span>{formState.errors.email.message}</span>
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
              to="/ingresar"
              className="inline-flex min-h-boton items-center gap-1.5 font-semibold text-lima-oscura"
            >
              <Icono icono={ArrowLeftIcon} tamano="chico" />
              Volver a ingresar
            </Link>
            <button
              type="submit"
              className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? 'Enviando…' : 'Enviarme el enlace'}
              <Icono icono={ArrowRightIcon} tamano="chico" className="text-white" />
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
