import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ApiError, mensajeAmable } from '../lib/api';
import { useSesion } from '../lib/auth';
import { Aviso } from '../components/negocio/Aviso';
import { Icono } from '../components/Icono';

const esquema = z.object({
  email: z.string().email('Ese correo no parece válido'),
  password: z.string().min(1, 'Escribí tu contraseña')
});

type Valores = z.infer<typeof esquema>;

/** PU-04 Ingresar — error dice cómo arreglarlo (RNF-01), redirige según rol (RF-02 E1). */
export default function Ingresar() {
  const { entrar } = useSesion();
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const estado = ubicacion.state as { desde?: string; mensaje?: string } | null;
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Valores>({ resolver: zodResolver(esquema) });

  const enviar = async (v: Valores) => {
    setError(null);
    try {
      const rol = await entrar(v.email.trim(), v.password);
      if (estado?.desde) {
        navigate(estado.desde, { replace: true });
      } else {
        navigate(rol === 'ADMINISTRADOR' ? '/admin' : rol === 'COMERCIANTE' ? '/panel' : '/', {
          replace: true
        });
      }
    } catch (e) {
      // RF-47: clave temporal; el backend no entrega token, así que mandamos a pedir el enlace.
      if (e instanceof ApiError && e.codigo === 'CAMBIO_CLAVE_REQUERIDO') {
        navigate('/recuperar-clave', {
          replace: true,
          state: { temporal: true, email: v.email.trim() }
        });
        return;
      }
      setError(mensajeAmable(e));
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Ingresar</h1>
      {estado?.mensaje && (
        <div className="mt-3">
          <Aviso tipo="exito">{estado.mensaje}</Aviso>
        </div>
      )}
      <form className="mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
        <div>
          <label htmlFor="email" className="font-semibold">
            Correo
          </label>
          <input
            id="email"
            type="email"
            className="campo mt-1"
            autoComplete="email"
            aria-describedby="email-ayuda email-error"
            {...register('email')}
          />
          <p id="email-ayuda" className="mt-1 text-sm text-texto-suave">
            El que usaste al crear tu cuenta.
          </p>
          {formState.errors.email && (
            <p id="email-error" role="alert" className="mt-1 flex items-start gap-1 text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.email.message}</span>
            </p>
          )}
        </div>
        <div>
          <label htmlFor="clave" className="font-semibold">
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            className="campo mt-1"
            autoComplete="current-password"
            aria-describedby="clave-error"
            {...register('password')}
          />
          {formState.errors.password && (
            <p id="clave-error" role="alert" className="mt-1 flex items-start gap-1 text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.password.message}</span>
            </p>
          )}
        </div>
        {error && (
          <p role="alert" aria-live="assertive" className="flex items-start gap-1 rounded-campo bg-error/10 p-3 text-error">
            <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
            <span>{error}</span>
          </p>
        )}
        <button className="btn-principal px-6 py-3" type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4">
        <Link to="/recuperar-clave" className="font-semibold text-primario underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <p className="mt-2">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="font-semibold text-primario underline">
          Crear cuenta
        </Link>
      </p>
    </main>
  );
}
