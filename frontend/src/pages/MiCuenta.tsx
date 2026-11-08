import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownTrayIcon,
  BellIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import {
  actualizarMe,
  cambiarClave,
  eliminarMiCuenta,
  getMisDatos,
  mensajeDeApi,
  type MisDatos
} from '../lib/api';
import { useSesion } from '../lib/auth';
import { Aviso } from '../components/negocio/Aviso';
import { Dialogo } from '../components/Dialogo';
import { Icono } from '../components/Icono';
import { Cargando, ErrorRecargar } from '../components/Estados';
import { TituloAtras } from '../components/TituloAtras';

/** PC-06 Mi cuenta: datos, cambio de clave, descarga de datos y eliminación (RF-48/RF-49). */
export default function MiCuenta() {
  const { salir, sesion } = useSesion();
  const navegar = useNavigate();
  const datos = useQuery({ queryKey: ['mis-datos'], queryFn: getMisDatos });

  if (datos.isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <Cargando texto="Cargando tu cuenta…" />
      </main>
    );
  }
  if (datos.isError || !datos.data) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(datos.error)} onReintentar={() => datos.refetch()} />
      </main>
    );
  }

  const alEliminar = () => {
    salir();
    navegar('/ingresar', {
      replace: true,
      state: { mensaje: 'Tu cuenta quedó eliminada. Gracias por haber estado en TRINA.' }
    });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-28 pt-6 md:pb-16">
      <TituloAtras titulo="Mi cuenta" />
      <p className="mt-1 text-texto-suave">Desde aquí manejas tus datos personales.</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Link
          to="/pedidos"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primario-claro px-3 text-sm font-semibold text-primario"
        >
          <Icono icono={ReceiptPercentIcon} tamano="chico" /> Mis pedidos
        </Link>
        <Link
          to="/reservas"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primario-claro px-3 text-sm font-semibold text-primario"
        >
          <Icono icono={CalendarDaysIcon} tamano="chico" /> Mis reservas
        </Link>
        <Link
          to="/notificaciones"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primario-claro px-3 text-sm font-semibold text-primario"
        >
          <Icono icono={BellIcon} tamano="chico" /> Notificaciones
        </Link>
        <Link
          to="/privacidad"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primario-claro px-3 text-sm font-semibold text-primario"
        >
          <Icono icono={LockClosedIcon} tamano="chico" /> Privacidad
        </Link>
        {sesion?.rol === 'COMERCIANTE' && (
          <Link
            to="/panel"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primario-claro px-3 text-sm font-semibold text-primario"
          >
            <Icono icono={BuildingStorefrontIcon} tamano="chico" /> Mi negocio
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <FormularioDatos datos={datos.data} />
      <FormularioClave />
      </div>
      <DescargarDatos datos={datos.data} />
      <ZonaPeligrosa onEliminar={alEliminar} />
    </main>
  );
}

/** Error de campo: icono + texto, nunca solo color (RNF-01). */
function ErrorCampo({ id, mensaje }: { id?: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-start gap-1 font-semibold text-error">
      <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-0.5" />
      <span>{mensaje}</span>
    </p>
  );
}

const esquemaDatos = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre (mínimo 2 letras).'),
  telefono: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^[+\d][\d\s()-]{6,}$/.test(v),
      'Escribe un teléfono válido. Ej.: 300 123 4567'
    )
});

type ValoresDatos = z.infer<typeof esquemaDatos>;

function FormularioDatos({ datos }: { datos: MisDatos }) {
  const cliente = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<ValoresDatos>({
    resolver: zodResolver(esquemaDatos),
    defaultValues: { nombre: datos.nombre, telefono: datos.telefono ?? '' }
  });

  const enviar = async (v: ValoresDatos) => {
    setAviso(null);
    setError(null);
    try {
      const actualizado = await actualizarMe({
        nombre: v.nombre.trim(),
        telefono: v.telefono.trim()
      });
      reset({ nombre: actualizado.nombre, telefono: actualizado.telefono ?? '' });
      await cliente.invalidateQueries({ queryKey: ['mis-datos'] });
      setAviso('Listo, tus datos quedaron guardados.');
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form
      className="tarjeta-form flex h-full flex-col gap-4"
      onSubmit={handleSubmit(enviar)}
      noValidate
    >
      <div>
        <h2 className="text-seccion">Tus datos</h2>
        <p className="mt-1 text-sm text-texto-suave">Correo: {datos.email} (no se puede cambiar desde aquí).</p>
      </div>
      <div className="grid gap-4">
        <div className="min-w-0">
          <label htmlFor="nombre" className="mb-1 block text-sm font-semibold">
            Nombre
          </label>
          <input id="nombre" className="campo" autoComplete="name" {...register('nombre')} />
          <ErrorCampo mensaje={formState.errors.nombre?.message} />
        </div>
        <div className="min-w-0">
          <label htmlFor="telefono" className="mb-1 block text-sm font-semibold">
            Teléfono
          </label>
          <input
            id="telefono"
            className="campo"
            inputMode="tel"
            autoComplete="tel"
            placeholder="300 123 4567"
            aria-describedby="telefono-ayuda"
            {...register('telefono')}
          />
          <p id="telefono-ayuda" className="mt-1 text-sm text-texto-suave">
            Lo usamos para avisarte de tus pedidos y reservas.
          </p>
          <ErrorCampo mensaje={formState.errors.telefono?.message} />
        </div>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
      <div className="mt-auto pt-1">
        <button type="submit" className="btn-principal-md w-full sm:w-auto" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

const esquemaClave = z
  .object({
    actual: z.string().min(1, 'Escribe tu contraseña actual.'),
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

type ValoresClave = z.infer<typeof esquemaClave>;

function FormularioClave() {
  const { salir } = useSesion();
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ValoresClave>({
    resolver: zodResolver(esquemaClave),
    defaultValues: { actual: '', nueva: '', repetir: '' }
  });

  const enviar = async (v: ValoresClave) => {
    setError(null);
    try {
      await cambiarClave(v.actual, v.nueva);
      // El cambio de clave cierra las sesiones abiertas: volvemos a ingresar.
      salir();
      navegar('/ingresar', {
        replace: true,
        state: { mensaje: 'Tu contraseña quedó cambiada. Por seguridad, ingresa de nuevo.' }
      });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form
      className="tarjeta-form flex h-full flex-col gap-4"
      onSubmit={handleSubmit(enviar)}
      noValidate
    >
      <h2 className="text-seccion">Cambiar contraseña</h2>
      <div className="min-w-0">
        <label htmlFor="actual" className="mb-1 block text-sm font-semibold">
          Contraseña actual
        </label>
        <input
          id="actual"
          type="password"
          className="campo"
          autoComplete="current-password"
          {...register('actual')}
        />
        <ErrorCampo mensaje={formState.errors.actual?.message} />
      </div>
      <div className="grid gap-4">
        <div className="min-w-0">
          <label htmlFor="nueva" className="mb-1 block text-sm font-semibold">
            Contraseña nueva
          </label>
          <input
            id="nueva"
            type="password"
            className="campo"
            autoComplete="new-password"
            aria-describedby="nueva-ayuda"
            {...register('nueva')}
          />
          <p id="nueva-ayuda" className="mt-1 text-sm text-texto-suave">
            Mínimo 8 caracteres, con letras y números.
          </p>
          <ErrorCampo mensaje={formState.errors.nueva?.message} />
        </div>
        <div className="min-w-0">
          <label htmlFor="repetir" className="mb-1 block text-sm font-semibold">
            Repetir la contraseña nueva
          </label>
          <input
            id="repetir"
            type="password"
            className="campo"
            autoComplete="new-password"
            {...register('repetir')}
          />
          <ErrorCampo mensaje={formState.errors.repetir?.message} />
        </div>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="mt-auto pt-1">
        <button type="submit" className="btn-principal-md w-full sm:w-auto" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  );
}

function DescargarDatos({ datos }: { datos: MisDatos }) {
  const [error, setError] = useState<string | null>(null);

  const descargar = () => {
    setError(null);
    try {
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'mis-datos-trina.json';
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      // Damos un respiro al navegador para iniciar la descarga antes de liberar la URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('No se pudo preparar la descarga. Intenta de nuevo.');
    }
  };

  return (
    <section className="tarjeta-form mt-4">
      <h2 className="text-seccion">Mis datos</h2>
      <p className="mt-1 text-texto-suave">
        Descarga una copia de tus datos personales y tu actividad en TRINA (pedidos y reservas).
      </p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button
        type="button"
        className="btn-secundario-md"
        onClick={descargar}
      >
        <Icono icono={ArrowDownTrayIcon} tamano="chico" /> Descargar mis datos (JSON)
      </button>
    </section>
  );
}

function ZonaPeligrosa({ onEliminar }: { onEliminar: () => void }) {
  const [dialogo, setDialogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    setError(null);
    setEliminando(true);
    try {
      await eliminarMiCuenta();
      setDialogo(false);
      onEliminar();
    } catch (e) {
      setError(mensajeDeApi(e));
      setDialogo(false);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <section className="mt-4 rounded-tarjeta border-2 border-error/40 bg-superficie p-4">
      <h2 className="text-seccion text-error">Eliminar mi cuenta</h2>
      <p className="mt-1 text-texto-suave">
        Se anonimizan tus datos personales y no vas a poder ingresar de nuevo. Esta acción no se puede
        deshacer.
      </p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button type="button" className="btn-peligro-md mt-3" onClick={() => setDialogo(true)}>
        Eliminar mi cuenta
      </button>

      <Dialogo abierto={dialogo} titulo="¿Eliminar tu cuenta?" onCerrar={() => setDialogo(false)}>
        <p>
          Tu nombre, correo y teléfono se anonimizan, se cierran tus sesiones y pierdes el acceso a tus
          pedidos y reservas. Si tienes un negocio, queda oculto del directorio.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-peligro-md" disabled={eliminando} onClick={eliminar}>
            {eliminando ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
          </button>
          <button type="button" className="btn-secundario-md" onClick={() => setDialogo(false)}>
            Volver
          </button>
        </div>
      </Dialogo>
    </section>
  );
}
