import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { recuperarClave, mensajeDeApi } from '../lib/api';
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
  const navigate = useNavigate();
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
    <main className="flex min-h-screen items-center justify-center bg-[#1A2218] px-4 py-6">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Volver"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#1A2218] transition hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A2218] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-white">
              <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[#94B839]" />
              Trina
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-[#1A2218] sm:text-4xl">
            Recuperar <span className="text-[#84cc16]">contraseña</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Te enviamos un enlace para crear una contraseña nueva. El enlace vence a los 30 minutos
            y sirve una sola vez.
          </p>

          {estado?.temporal && (
            <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Entraste con una contraseña temporal. Para poder usar TRINA, pide el enlace y crea tu
              propia contraseña.
            </p>
          )}

          {enviado ? (
            <div className="mt-5 space-y-4">
              <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                Si <strong>{getValues('email').trim()}</strong> está registrado, te enviamos un
                enlace para cambiar la contraseña. Revisa tu correo y, si no lo ves, mira la
                carpeta de spam.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="inline-flex min-h-[48px] items-center gap-1.5 font-semibold text-[#1A2218]"
                >
                  <Icono icono={ArrowLeftIcon} tamano="chico" />
                  Usar otro correo
                </button>
                <Link
                  to="/restablecer-clave"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#1A2218] px-6 font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
                >
                  Ya tengo el enlace
                  <Icono icono={ArrowRightIcon} tamano="chico" className="text-white" />
                </Link>
              </div>
              <p className="text-center text-sm text-gray-500">
                <Link
                  to="/ingresar"
                  className="font-bold text-[#1A2218] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#94B839]"
                >
                  Volver a ingresar
                </Link>
              </p>
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-[#1A2218]">
                  Correo de tu cuenta
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  aria-describedby="email-error"
                  aria-invalid={!!formState.errors.email}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/25"
                  {...register('email')}
                />
                {formState.errors.email && (
                  <p id="email-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                    <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                    <span>{formState.errors.email.message}</span>
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
              <button
                type="submit"
                disabled={formState.isSubmitting}
                className="min-h-[52px] w-full rounded-full bg-[#1A2218] px-6 text-base font-bold text-white shadow-[0_16px_32px_-16px_rgba(26,34,24,0.7)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839] disabled:opacity-60"
              >
                {formState.isSubmitting ? 'Enviando…' : 'Enviarme el enlace'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link
                  to="/ingresar"
                  className="font-bold text-[#1A2218] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#94B839]"
                >
                  Volver a ingresar
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
