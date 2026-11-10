import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { api, mensajeAmable } from '../lib/api';
import { useSesion } from '../lib/auth';
import { Icono } from '../components/Icono';

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre (mínimo 2 letras).'),
  email: z.string().trim().email('Ese correo no parece válido.'),
  password: z
    .string()
    .min(8, 'La contraseña necesita mínimo 8 caracteres, con letras y números.')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'La contraseña necesita mínimo 8 caracteres, con letras y números.'),
  rol: z.enum(['CLIENTE', 'COMERCIANTE'], {
    errorMap: () => ({ message: 'Elige si vas a comprar o a ofrecer tus productos.' })
  }),
  consentimiento: z.boolean().refine((v) => v, {
    message: 'Necesitas aceptar la política de datos para continuar.'
  }),
  esResidente: z.enum(['', 'si', 'no'])
});

type Valores = z.infer<typeof esquema>;

/** PU-05 Registro (RF-01): tarjeta única sobre bosque; crea la cuenta y redirige según el rol. */
export default function Registro() {
  const { entrar } = useSesion();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [avisoEntrar, setAvisoEntrar] = useState<string | null>(null);
  const [verClave, setVerClave] = useState(false);
  const { register, handleSubmit, watch, formState } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { rol: 'CLIENTE', consentimiento: false, esResidente: '' }
  });
  const rolElegido = watch('rol');

  const enviar = async (v: Valores) => {
    setError(null);
    setAvisoEntrar(null);
    const email = v.email.trim();
    try {
      await api.registro({
        email,
        password: v.password,
        nombre: v.nombre.trim(),
        rol: v.rol,
        consentimiento: true,
        ...(v.esResidente ? { esResidente: v.esResidente === 'si' } : {})
      });
    } catch (e) {
      setError(mensajeAmable(e));
      return;
    }
    // El registro no devuelve token. Para COMERCIANTE la cuenta queda pendiente de aprobación
    // y no se intenta el ingreso automático. Para CLIENTE se entra directo.
    if (v.rol === 'COMERCIANTE') {
      setAvisoEntrar(
        'Tu cuenta quedó creada y pendiente de aprobación por un administrador de TRINA. Te avisaremos por correo cuando puedas ingresar a vender.'
      );
      return;
    }
    try {
      const rol = await entrar(email, v.password);
      navigate(rol === 'COMERCIANTE' ? '/panel' : '/', { replace: true });
    } catch {
      setAvisoEntrar(
        'Tu cuenta quedó creada. El ingreso automático no salió; ingresa con tu correo y contraseña.'
      );
    }
  };

  const tarjetaRol = (activo: boolean) =>
    `flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition focus-within:outline-2 focus-within:outline-[#94B839] ${
      activo
        ? 'border-[#94B839] bg-[#94B839]/10'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`;

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
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A2218] sm:text-4xl">Crear <span className="text-[#84cc16]">cuenta</span></h1>
          <p className="mt-1 text-sm text-gray-500">Es gratis y te toma un par de minutos.</p>

          {avisoEntrar && (
            <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {avisoEntrar}{' '}
              <Link to="/ingresar" className="font-bold underline">
                Ingresar
              </Link>
            </p>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
            <div>
              <label htmlFor="nombre" className="text-sm font-semibold text-[#1A2218]">
                Nombre
              </label>
              <input
                id="nombre"
                placeholder="Tu nombre"
                autoComplete="name"
                aria-describedby="nombre-error"
                aria-invalid={!!formState.errors.nombre}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/25"
                {...register('nombre')}
              />
              {formState.errors.nombre && (
                <p id="nombre-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                  <span>{formState.errors.nombre.message}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[#1A2218]">
                Correo
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

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-[#1A2218]">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={verClave ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-describedby="password-ayuda password-error"
                  aria-invalid={!!formState.errors.password}
                  className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-[#1A2218] placeholder:text-gray-400 focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/25"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verClave}
                  className="absolute inset-y-0 right-2 flex items-center rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#1A2218] focus-visible:outline-2 focus-visible:outline-[#94B839]"
                >
                  <Icono icono={verClave ? EyeSlashIcon : EyeIcon} tamano="chico" />
                </button>
              </div>
              <p id="password-ayuda" className="mt-1 text-sm text-gray-500">
                Mínimo 8 caracteres, con letras y números.
              </p>
              {formState.errors.password && (
                <p id="password-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                  <span>{formState.errors.password.message}</span>
                </p>
              )}
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-[#1A2218]">¿Qué vas a hacer en TRINA?</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className={tarjetaRol(rolElegido === 'CLIENTE')}>
                  <input type="radio" value="CLIENTE" className="mt-1 accent-[#5a8a0a]" {...register('rol')} />
                  <span>
                    <span className="inline-flex items-center gap-2 font-semibold text-[#1A2218]">
                      <Icono icono={ShoppingBagIcon} tamano="chico" /> Quiero comprar
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Descubre negocios, pide y reserva.
                    </span>
                  </span>
                </label>
                <label className={tarjetaRol(rolElegido === 'COMERCIANTE')}>
                  <input type="radio" value="COMERCIANTE" className="mt-1 accent-[#5a8a0a]" {...register('rol')} />
                  <span>
                    <span className="inline-flex items-center gap-2 font-semibold text-[#1A2218]">
                      <Icono icono={BuildingStorefrontIcon} tamano="chico" /> Quiero vender
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Publica tu negocio y gestiona pedidos.
                    </span>
                  </span>
                </label>
              </div>
              {formState.errors.rol && (
                <p role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                  <span>{formState.errors.rol.message}</span>
                </p>
              )}
            </fieldset>

            <div>
              <label htmlFor="esResidente" className="text-sm font-semibold text-[#1A2218]">
                ¿Eres residente del municipio? <span className="font-normal text-gray-500">(opcional)</span>
              </label>
              <select
                id="esResidente"
                className="mt-1 min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-[#1A2218] focus:border-[#94B839] focus:outline-none focus:ring-2 focus:ring-[#94B839]/25"
                {...register('esResidente')}
              >
                <option value="">Prefiero no decirlo</option>
                <option value="si">Sí, vivo en el municipio</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded accent-[#5a8a0a]"
                  aria-describedby="consentimiento-error"
                  {...register('consentimiento')}
                />
                <span>
                  Acepto la{' '}
                  <Link to="/privacidad" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                    política de tratamiento de datos
                  </Link>{' '}
                  y el uso de mi información para operar la plataforma.
                </span>
              </label>
              {formState.errors.consentimiento && (
                <p id="consentimiento-error" role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
                  <span>{formState.errors.consentimiento.message}</span>
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
              {formState.isSubmitting ? 'Creando tu cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/ingresar"
              className="font-bold text-[#1A2218] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#94B839]"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
