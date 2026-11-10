import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import fotoLogin from '../assets/login-cafetal.jpg';
import { ApiError, mensajeAmable } from '../lib/api';
import { useSesion } from '../lib/auth';
import { Icono } from '../components/Icono';

const esquema = z.object({
  email: z.string().email('Ese correo no parece válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
  recordar: z.boolean().optional()
});

type Valores = z.infer<typeof esquema>;

function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches
  );
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 768px)');
    const actualizar = () => setEsMovil(!consulta.matches);
    actualizar();
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);
  return esMovil;
}

type Metodos = {
  register: ReturnType<typeof useForm<Valores>>['register'];
  formState: ReturnType<typeof useForm<Valores>>['formState'];
  handleSubmit: ReturnType<typeof useForm<Valores>>['handleSubmit'];
};

/** PU-04 Ingresar — redirige según rol (RF-02 E1). */
export default function Ingresar() {
  const { entrar } = useSesion();
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const estado = ubicacion.state as { desde?: string; mensaje?: string } | null;
  const [error, setError] = useState<string | null>(null);
  const [verClave, setVerClave] = useState(false);
  const { register, handleSubmit, formState } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      email: typeof localStorage !== 'undefined' ? (localStorage.getItem('trina-email') ?? '') : '',
      password: '',
      recordar: true
    }
  });
  const esMovil = useEsMovil();

  const enviar = async (v: Valores) => {
    setError(null);
    try {
      const rol = await entrar(v.email.trim(), v.password);
      try {
        if (v.recordar) localStorage.setItem('trina-email', v.email.trim());
        else localStorage.removeItem('trina-email');
      } catch {
        /* sin almacenamiento, igual entra */
      }
      if (estado?.desde) {
        navigate(estado.desde, { replace: true });
      } else {
        navigate(rol === 'ADMINISTRADOR' ? '/admin' : rol === 'COMERCIANTE' ? '/panel' : '/', {
          replace: true
        });
      }
    } catch (e) {
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

  const metodos: Metodos = { register, formState, handleSubmit };
  const comunes = { estado, error, setError, verClave, setVerClave, enviar };

  if (esMovil) return <MovilLogin metodos={metodos} {...comunes} />;
  return <EscritorioLogin metodos={metodos} {...comunes} />;
}

type Comunes = {
  estado: { desde?: string; mensaje?: string } | null;
  error: string | null;
  setError: (e: string | null) => void;
  verClave: boolean;
  setVerClave: (v: boolean | ((p: boolean) => boolean)) => void;
  enviar: (v: Valores) => Promise<void>;
};

/** Móvil: imagen superior con velo bosque + bottom sheet blanca. */
function MovilLogin({
  metodos,
  estado,
  error,
  setError,
  verClave,
  setVerClave,
  enviar
}: { metodos: Metodos } & Comunes) {
  const navigate = useNavigate();
  const { register, formState, handleSubmit } = metodos;
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#1A2218]">
      <img src={fotoLogin} alt="" aria-hidden="true" className="absolute inset-0 z-0 h-full w-full bg-cover bg-center object-cover" />
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-[#1A2218]/70" />
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Volver"
        className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white shadow-md transition hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="relative z-10 m-auto mx-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-[#1A2218]">Bienvenido de nuevo</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Entra a tu cuenta para seguir explorando lo mejor de tu ciudad
        </p>

        {estado?.mensaje && (
          <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            {estado.mensaje}
          </p>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
          <div>
            <label htmlFor="email-movil" className="text-sm font-semibold text-[#1A2218]">
              Correo electrónico
            </label>
            <div className="relative mt-1">
              <input
                id="email-movil"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                aria-describedby="email-movil-error"
                aria-invalid={!!formState.errors.email}
                className="w-full rounded-2xl border border-gray-200 bg-white p-3.5 pl-4 pr-11 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/20"
                {...register('email')}
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <Icono icono={EnvelopeIcon} tamano="chico" />
              </span>
            </div>
            {formState.errors.email && (
              <p id="email-movil-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                <span>{formState.errors.email.message}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="clave-movil" className="text-sm font-semibold text-[#1A2218]">
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="clave-movil"
                type={verClave ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby="clave-movil-error"
                aria-invalid={!!formState.errors.password}
                className="w-full rounded-2xl border border-gray-200 bg-white p-3.5 pl-4 pr-11 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/20"
                {...register('password')}
              />
              <span className="absolute inset-y-0 right-2 flex items-center">
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verClave}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#1A2218] focus-visible:outline-2 focus-visible:outline-[#94B839]"
                >
                  <Icono icono={verClave ? EyeSlashIcon : EyeIcon} tamano="chico" />
                </button>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-11 hidden items-center text-gray-300">
                <Icono icono={LockClosedIcon} tamano="chico" />
              </span>
            </div>
            {formState.errors.password && (
              <p id="clave-movil-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                <span>{formState.errors.password.message}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="recordar-movil" className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1A2218]">
              <input
                id="recordar-movil"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-[#94B839]"
                {...register('recordar')}
              />
              Recordarme
            </label>
            <Link
              to="/recuperar-clave"
              className="text-xs font-semibold text-[#1A2218] hover:text-[#94B839] focus-visible:outline-2 focus-visible:outline-[#94B839]"
            >
              ¿Olvidaste tu contraseña?
            </Link>
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
            className="w-full rounded-full bg-[#94B839] py-3.5 text-base font-extrabold text-[#1A2218] shadow-md transition-all hover:bg-[#1A2218] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839] disabled:opacity-60"
          >
            {formState.isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-500">O inicia sesión con</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setError('El inicio con Google aún no está disponible.')}
            aria-label="Iniciar sesión con Google"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7 3-3.1c1.9-1.8 2-3.4 2-5.6z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.2 21.3 7.3 24 12 24z" />
              <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
              <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.3 6.6l3.9 3c.9-2.9 3.6-5 6.8-5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setError('El inicio con Apple aún no está disponible.')}
            aria-label="Iniciar sesión con Apple"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94B839]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#1A2218]">
              <path d="M17.05 20.28c-.98.95-2.05.81-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.9-.84 1.58.13 2.77.75 3.55 1.9-3.27 1.96-2.5 6.24.5 7.45-.6 1.58-1.93 2.7-3.03 3.66zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          </button>
        </div>

        <p className="mt-6 pb-2 text-center text-xs font-medium text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="font-bold text-[#1A2218] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#94B839]"
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </main>
  );
}

/** Escritorio: tarjeta de dos columnas sobre bosque mate. */
function EscritorioLogin({
  metodos,
  estado,
  error,
  setError,
  verClave,
  setVerClave,
  enviar
}: { metodos: Metodos } & Comunes) {
  const navigate = useNavigate();
  const { register, formState, handleSubmit } = metodos;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1A2218] px-4 py-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)]">
        <div className="px-6 pt-6 md:px-8 md:pt-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#1A2218] transition hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid md:grid-cols-2">
          <section aria-labelledby="titulo-login" className="flex flex-col justify-center p-6 md:p-8">
            <h1 id="titulo-login" className="text-xl font-extrabold text-[#1A2218] sm:text-2xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Entra a tu cuenta para seguir explorando lo mejor de tu ciudad.
            </p>

            {estado?.mensaje && (
              <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {estado.mensaje}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setError('El inicio con Google aún no está disponible.')}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-[#1A2218] transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7 3-3.1c1.9-1.8 2-3.4 2-5.6z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.2 21.3 7.3 24 12 24z" />
                  <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
                  <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.3 6.6l3.9 3c.9-2.9 3.6-5 6.8-5z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => setError('El inicio con Apple aún no está disponible.')}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-[#1A2218] transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#1A2218]">
                  <path d="M17.05 20.28c-.98.95-2.05.81-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.9-.84 1.58.13 2.77.75 3.55 1.9-3.27 1.96-2.5 6.24.5 7.45-.6 1.58-1.93 2.7-3.03 3.66zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="my-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">o</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(enviar)} noValidate>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-[#1A2218]">
                  Correo electrónico
                </label>
                <div className="relative mt-1">
                  <input
                    id="email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    aria-describedby="email-error"
                    aria-invalid={!!formState.errors.email}
                    className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-11 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/20"
                    {...register('email')}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                    <Icono icono={EnvelopeIcon} tamano="chico" />
                  </span>
                </div>
                {formState.errors.email && (
                  <p id="email-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                    <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                    <span>{formState.errors.email.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="clave" className="text-sm font-semibold text-[#1A2218]">
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <input
                    id="clave"
                    type={verClave ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-describedby="clave-error"
                    aria-invalid={!!formState.errors.password}
                    className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-11 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/20"
                    {...register('password')}
                  />
                  <span className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => setVerClave((v) => !v)}
                      aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={verClave}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#1A2218] focus-visible:outline-2 focus-visible:outline-[#94B839]"
                    >
                      <Icono icono={verClave ? EyeSlashIcon : EyeIcon} tamano="chico" />
                    </button>
                  </span>
                </div>
                {formState.errors.password && (
                  <p id="clave-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                    <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                    <span>{formState.errors.password.message}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label htmlFor="recordar" className="inline-flex cursor-pointer items-center gap-2 font-medium text-gray-600">
                  <input
                    id="recordar"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-[#94B839]"
                    {...register('recordar')}
                  />
                  Recordarme
                </label>
                <Link
                  to="/recuperar-clave"
                  className="font-semibold text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
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
                className="min-h-[48px] w-full rounded-full bg-[#94B839] px-6 text-base font-bold text-[#1A2218] shadow-[0_16px_32px_-16px_rgba(148,184,57,0.7)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60"
              >
                {formState.isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link
                to="/registro"
                className="font-bold text-[#1A2218] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                Regístrate gratis
              </Link>
            </p>
          </section>

          <aside aria-hidden="true" className="relative hidden bg-white p-6 pt-0 md:block md:p-8 md:pl-0 md:pt-0">
            <div className="relative h-full min-h-[400px] overflow-hidden rounded-2xl lg:min-h-[440px]">
              <img
                src={fotoLogin}
                alt="Paisaje cafetero entre montañas"
                className="absolute inset-0 h-full w-full rounded-2xl object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-[#1A2218]/70 p-4 text-white backdrop-blur-sm">
                <p className="text-sm font-bold">Del cafetal a tu mesa</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">
                  Descubre negocios locales, reserva y pide sin filas.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
