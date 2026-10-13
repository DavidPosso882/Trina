import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { api, mensajeAmable } from '../lib/api';
import { useSesion } from '../lib/auth';
import { Aviso } from '../components/negocio/Aviso';
import { Icono } from '../components/Icono';

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Escribí tu nombre (mínimo 2 letras).'),
  email: z.string().trim().email('Ese correo no parece válido.'),
  password: z
    .string()
    .min(8, 'La contraseña necesita mínimo 8 caracteres, con letras y números.')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'La contraseña necesita mínimo 8 caracteres, con letras y números.'),
  rol: z.enum(['CLIENTE', 'COMERCIANTE'], {
    errorMap: () => ({ message: 'Elegí si vas a comprar o a ofrecer tus productos.' })
  }),
  consentimiento: z.boolean().refine((v) => v, {
    message: 'Necesitás aceptar la política de datos para continuar.'
  }),
  esResidente: z.enum(['', 'si', 'no'])
});

type Valores = z.infer<typeof esquema>;

/** PU-05 Registro (RF-01): crea la cuenta, entra directo y redirige según el rol. */
export default function Registro() {
  const { entrar } = useSesion();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [avisoEntrar, setAvisoEntrar] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { rol: 'CLIENTE', consentimiento: false, esResidente: '' }
  });

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
    // El registro no devuelve token: ingresamos con las mismas credenciales para entrar directo.
    try {
      const rol = await entrar(email, v.password);
      navigate(rol === 'COMERCIANTE' ? '/panel' : '/', { replace: true });
    } catch {
      setAvisoEntrar(
        'Tu cuenta quedó creada. El ingreso automático no salió; ingresá con tu correo y contraseña.'
      );
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Crear cuenta</h1>
      <p className="mt-1 text-texto-suave">Es gratis y te toma un par de minutos.</p>

      {avisoEntrar && (
        <div className="mt-4">
          <Aviso tipo="exito">
            {avisoEntrar}{' '}
            <Link to="/ingresar" className="font-bold underline">
              Ingresar
            </Link>
          </Aviso>
        </div>
      )}

      <form className="mt-4 space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
        <div>
          <label htmlFor="nombre" className="font-semibold">
            Nombre
          </label>
          <input
            id="nombre"
            className="campo mt-1"
            autoComplete="name"
            aria-describedby="nombre-error"
            {...register('nombre')}
          />
          {formState.errors.nombre && (
            <p id="nombre-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.nombre.message}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="font-semibold">
            Correo
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

        <div>
          <label htmlFor="password" className="font-semibold">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            className="campo mt-1"
            autoComplete="new-password"
            aria-describedby="password-ayuda password-error"
            {...register('password')}
          />
          <p id="password-ayuda" className="mt-1 text-sm text-texto-suave">
            Mínimo 8 caracteres, con letras y números.
          </p>
          {formState.errors.password && (
            <p id="password-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.password.message}</span>
            </p>
          )}
        </div>

        <fieldset>
          <legend className="font-semibold">¿Qué vas a hacer en TRINA?</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-3 rounded-campo border-2 p-3" style={{ borderColor: '#8a8f98' }}>
              <input type="radio" value="CLIENTE" className="mt-1" {...register('rol')} />
              <span>
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Icono icono={ShoppingBagIcon} tamano="chico" /> Quiero comprar
                </span>
                <span className="block text-sm text-texto-suave">
                  Descubrí negocios, pedí productos, reservá y calificá.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-campo border-2 p-3" style={{ borderColor: '#8a8f98' }}>
              <input type="radio" value="COMERCIANTE" className="mt-1" {...register('rol')} />
              <span>
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Icono icono={BuildingStorefrontIcon} tamano="chico" /> Quiero vender
                </span>
                <span className="block text-sm text-texto-suave">
                  Publicá tu negocio, tu catálogo y gestioná pedidos y reservas.
                </span>
              </span>
            </label>
          </div>
          {formState.errors.rol && (
            <p role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.rol.message}</span>
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor="esResidente" className="font-semibold">
            ¿Sos residente del municipio? <span className="font-normal text-texto-suave">(opcional)</span>
          </label>
          <select id="esResidente" className="campo mt-1" {...register('esResidente')}>
            <option value="">Prefiero no decirlo</option>
            <option value="si">Sí, vivo en el municipio</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              aria-describedby="consentimiento-error"
              {...register('consentimiento')}
            />
            <span>
              Acepto la{' '}
              <Link to="/privacidad" className="font-semibold text-primario underline">
                política de tratamiento de datos
              </Link>{' '}
              y el uso de mi información para operar la plataforma.
            </span>
          </label>
          {formState.errors.consentimiento && (
            <p id="consentimiento-error" role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
              <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
              <span>{formState.errors.consentimiento.message}</span>
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
          {formState.isSubmitting ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
        </button>
      </form>

      <p className="mt-4 text-center">
        ¿Ya tenés cuenta?{' '}
        <Link to="/ingresar" className="font-semibold text-primario underline">
          Ingresar
        </Link>
      </p>
    </main>
  );
}
