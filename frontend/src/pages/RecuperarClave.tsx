import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
            Entraste con una contraseña temporal. Para poder usar TRINA, pedí el enlace y creá tu
            propia contraseña.
          </Aviso>
        </div>
      )}

      {enviado ? (
        <div className="mt-4 space-y-4">
          <Aviso tipo="exito">
            Si <strong>{getValues('email').trim()}</strong> está registrado, te enviamos un enlace
            para cambiar la contraseña. Revisá tu correo y, si no lo ves, mirá la carpeta de spam.
          </Aviso>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/restablecer-clave" className="btn-principal px-6 py-3 text-center">
              Ya tengo el enlace
            </Link>
            <button
              type="button"
              className="btn-secundario px-6 py-3"
              onClick={() => setEnviado(false)}
            >
              Usar otro correo
            </button>
          </div>
        </div>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
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
          <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Enviando…' : 'Enviarme el enlace'}
          </button>
        </form>
      )}

      <p className="mt-4 text-center">
        <Link to="/ingresar" className="font-semibold text-primario underline">
          ← Volver a ingresar
        </Link>
      </p>
    </main>
  );
}
