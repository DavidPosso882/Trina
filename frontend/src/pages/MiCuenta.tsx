import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownTrayIcon,
  BellIcon,
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

/** PC-06 Mi cuenta: datos, cambio de clave, descarga de datos y eliminación (RF-48/RF-49). */
export default function MiCuenta() {
  const { salir } = useSesion();
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
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <h1 className="font-display text-titulo">Mi cuenta</h1>
      <p className="mt-1 text-texto-suave">Desde acá manejás tus datos personales.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/pedidos"
          className="inline-flex min-h-boton items-center gap-2 rounded-campo bg-primario-claro px-3 py-2 text-primario"
        >
          <Icono icono={ReceiptPercentIcon} tamano="chico" /> Mis pedidos
        </Link>
        <Link
          to="/reservas"
          className="inline-flex min-h-boton items-center gap-2 rounded-campo bg-primario-claro px-3 py-2 text-primario"
        >
          <Icono icono={CalendarDaysIcon} tamano="chico" /> Mis reservas
        </Link>
        <Link
          to="/notificaciones"
          className="inline-flex min-h-boton items-center gap-2 rounded-campo bg-primario-claro px-3 py-2 text-primario"
        >
          <Icono icono={BellIcon} tamano="chico" /> Notificaciones
        </Link>
        <Link
          to="/privacidad"
          className="inline-flex min-h-boton items-center gap-2 rounded-campo bg-primario-claro px-3 py-2 text-primario"
        >
          <Icono icono={LockClosedIcon} tamano="chico" /> Política de privacidad
        </Link>
      </div>

      <FormularioDatos datos={datos.data} />
      <FormularioClave />
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
  nombre: z.string().trim().min(2, 'Escribí tu nombre (mínimo 2 letras).'),
  telefono: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^[+\d][\d\s()-]{6,}$/.test(v),
      'Escribí un teléfono válido. Ej.: 300 123 4567'
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
      className="mt-4 space-y-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
      onSubmit={handleSubmit(enviar)}
      noValidate
    >
      <h2 className="text-seccion">Tus datos</h2>
      <p className="text-sm text-texto-suave">Correo: {datos.email} (no se puede cambiar desde acá).</p>
      <div>
        <label htmlFor="nombre" className="font-semibold">
          Nombre
        </label>
        <input id="nombre" className="campo mt-1" autoComplete="name" {...register('nombre')} />
        <ErrorCampo mensaje={formState.errors.nombre?.message} />
      </div>
      <div>
        <label htmlFor="telefono" className="font-semibold">
          Teléfono
        </label>
        <input
          id="telefono"
          className="campo mt-1"
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
      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
      <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}

const esquemaClave = z
  .object({
    actual: z.string().min(1, 'Escribí tu contraseña actual.'),
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
        state: { mensaje: 'Tu contraseña quedó cambiada. Por seguridad, ingresá de nuevo.' }
      });
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form
      className="mt-4 space-y-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
      onSubmit={handleSubmit(enviar)}
      noValidate
    >
      <h2 className="text-seccion">Cambiar contraseña</h2>
      <div>
        <label htmlFor="actual" className="font-semibold">
          Contraseña actual
        </label>
        <input
          id="actual"
          type="password"
          className="campo mt-1"
          autoComplete="current-password"
          {...register('actual')}
        />
        <ErrorCampo mensaje={formState.errors.actual?.message} />
      </div>
      <div>
        <label htmlFor="nueva" className="font-semibold">
          Contraseña nueva
        </label>
        <input
          id="nueva"
          type="password"
          className="campo mt-1"
          autoComplete="new-password"
          aria-describedby="nueva-ayuda"
          {...register('nueva')}
        />
        <p id="nueva-ayuda" className="mt-1 text-sm text-texto-suave">
          Mínimo 8 caracteres, con letras y números.
        </p>
        <ErrorCampo mensaje={formState.errors.nueva?.message} />
      </div>
      <div>
        <label htmlFor="repetir" className="font-semibold">
          Repetir la contraseña nueva
        </label>
        <input
          id="repetir"
          type="password"
          className="campo mt-1"
          autoComplete="new-password"
          {...register('repetir')}
        />
        <ErrorCampo mensaje={formState.errors.repetir?.message} />
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Cambiando…' : 'Cambiar contraseña'}
      </button>
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
      setError('No se pudo preparar la descarga. Intentá de nuevo.');
    }
  };

  return (
    <section className="mt-6 border-t border-tinta-cafe/10 pt-4">
      <h2 className="text-seccion">Mis datos</h2>
      <p className="mt-1 text-texto-suave">
        Descargá una copia de tus datos personales y tu actividad en TRINA (pedidos y reservas).
      </p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button
        type="button"
        className="btn-secundario mt-3 inline-flex items-center gap-2 px-6 py-3"
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
      <button type="button" className="btn-peligro mt-3 px-6 py-3" onClick={() => setDialogo(true)}>
        Eliminar mi cuenta
      </button>

      <Dialogo abierto={dialogo} titulo="¿Eliminar tu cuenta?" onCerrar={() => setDialogo(false)}>
        <p>
          Tu nombre, correo y teléfono se anonimizan, se cierran tus sesiones y perdés el acceso a tus
          pedidos y reservas. Si tenés un negocio, queda oculto del directorio.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-peligro px-4 py-3" disabled={eliminando} onClick={eliminar}>
            {eliminando ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
          </button>
          <button type="button" className="btn-secundario px-4 py-3" onClick={() => setDialogo(false)}>
            Volver
          </button>
        </div>
      </Dialogo>
    </section>
  );
}
