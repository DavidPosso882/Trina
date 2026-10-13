import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  crearComercianteAdmin,
  crearNegocioAdmin,
  listarAdminCategorias,
  mensajeDeApi,
  type ComercianteCreado
} from '../../lib/api';
import { BuildingStorefrontIcon, KeyIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Aviso } from '../../components/negocio/Aviso';
import { CampoArea, CampoSelect, CampoTexto } from '../../components/negocio/Campos';
import { Icono } from '../../components/Icono';

const esquemaComerciante = z.object({
  email: z.string().email('Ese correo no parece válido.'),
  nombre: z.string().trim().min(2, 'Escribí el nombre (mínimo 2 letras).'),
  telefono: z.string()
});

type ValoresComerciante = z.infer<typeof esquemaComerciante>;

const esquemaNegocio = z
  .object({
    nombre: z.string().trim().min(2, 'Escribí el nombre del negocio (mínimo 2 letras).'),
    categoriaId: z.string(),
    descripcion: z.string(),
    direccion: z.string(),
    latitud: z.string(),
    longitud: z.string(),
    telefono: z.string(),
    whatsapp: z.string(),
    estadoInicial: z.enum(['PENDIENTE', 'APROBADO'])
  })
  .superRefine((v, ctx) => {
    const coordenada = (valor: string, campo: 'latitud' | 'longitud', limite: number, ejemplo: string) => {
      if (valor.trim() === '') return;
      const n = Number(valor);
      if (!Number.isFinite(n) || n < -limite || n > limite) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [campo],
          message: `La ${campo} va entre -${limite} y ${limite}. Ej.: ${ejemplo}`
        });
      }
    };
    coordenada(v.latitud, 'latitud', 90, '4.538600');
    coordenada(v.longitud, 'longitud', 180, '-75.643300');
  });

type ValoresNegocio = z.infer<typeof esquemaNegocio>;

/** RF-47 E1/E3: alta asistida de un comerciante con clave temporal y su negocio. */
export function AltaAsistida({ onCreado }: { onCreado: (mensaje: string) => void }) {
  const [comerciante, setComerciante] = useState<ComercianteCreado | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorComerciante, setErrorComerciante] = useState<string | null>(null);
  const [errorNegocio, setErrorNegocio] = useState<string | null>(null);

  const categorias = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: listarAdminCategorias,
    staleTime: 5 * 60_000
  });

  const formComerciante = useForm<ValoresComerciante>({
    resolver: zodResolver(esquemaComerciante),
    defaultValues: { email: '', nombre: '', telefono: '' }
  });

  const formNegocio = useForm<ValoresNegocio>({
    resolver: zodResolver(esquemaNegocio),
    defaultValues: {
      nombre: '',
      categoriaId: '',
      descripcion: '',
      direccion: '',
      latitud: '',
      longitud: '',
      telefono: '',
      whatsapp: '',
      estadoInicial: 'PENDIENTE'
    }
  });

  const crearComerciante = formComerciante.handleSubmit(async (v) => {
    setErrorComerciante(null);
    setAviso(null);
    try {
      const creado = await crearComercianteAdmin({
        email: v.email.trim(),
        nombre: v.nombre.trim(),
        telefono: v.telefono.trim() || undefined
      });
      setComerciante(creado);
      formComerciante.reset();
    } catch (e) {
      setErrorComerciante(mensajeDeApi(e));
    }
  });

  const crearNegocio = formNegocio.handleSubmit(async (v) => {
    if (!comerciante) return;
    setErrorNegocio(null);
    setAviso(null);
    try {
      const creado = await crearNegocioAdmin({
        comercianteId: comerciante.id,
        nombre: v.nombre.trim(),
        categoriaId: v.categoriaId ? Number(v.categoriaId) : undefined,
        descripcion: v.descripcion.trim() || undefined,
        direccion: v.direccion.trim() || undefined,
        latitud: v.latitud.trim() === '' ? undefined : Number(v.latitud),
        longitud: v.longitud.trim() === '' ? undefined : Number(v.longitud),
        telefono: v.telefono.trim() || undefined,
        whatsapp: v.whatsapp.trim() || undefined,
        estadoInicial: v.estadoInicial
      });
      setAviso(
        `Se creó ${creado.nombre} para ${comerciante.nombre}. ${
          v.estadoInicial === 'APROBADO' ? 'Quedó publicado.' : 'Quedó en revisión.'
        }`
      );
      onCreado(`Alta asistida: se creó ${creado.nombre}.`);
    } catch (e) {
      setErrorNegocio(mensajeDeApi(e));
    }
  });

  const terminar = () => {
    setComerciante(null);
    setAviso(null);
    formNegocio.reset();
  };

  return (
    <section
      className="mt-4 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
      aria-label="Alta asistida de negocio"
    >
      <h2 className="text-seccion">Alta asistida</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Creá la cuenta del comerciante y su negocio de una vez. La clave temporal se muestra una sola vez.
      </p>

      {aviso && (
        <div className="mt-3">
          <Aviso tipo="exito">{aviso}</Aviso>
        </div>
      )}

      {comerciante && (
        <div className="mt-3 rounded-campo bg-advertencia/10 p-3" role="status">
          <p className="flex items-center gap-2 font-bold">
            <Icono icono={KeyIcon} tamano="chico" /> Clave temporal de {comerciante.nombre} ({comerciante.email})
          </p>
          <p className="mt-1 font-mono text-seccion">{comerciante.claveTemporal}</p>
          <p className="mt-1 text-sm">
            Anotala y entregásela: se muestra una sola vez y la persona va a tener que cambiarla al entrar.
          </p>
        </div>
      )}

      {!comerciante && (
        <form className="mt-3 space-y-3" onSubmit={crearComerciante} noValidate>
          <h3 className="font-bold">1. Cuenta del comerciante</h3>
          <CampoTexto
            etiqueta="Correo"
            registro={formComerciante.register('email')}
            error={formComerciante.formState.errors.email?.message}
            ayuda="Con este correo va a entrar a TRINA."
            type="email"
            autoComplete="email"
          />
          <CampoTexto
            etiqueta="Nombre"
            registro={formComerciante.register('nombre')}
            error={formComerciante.formState.errors.nombre?.message}
            ayuda="Ej.: Marta Gómez"
            autoComplete="name"
          />
          <CampoTexto
            etiqueta="Teléfono (opcional)"
            registro={formComerciante.register('telefono')}
            error={formComerciante.formState.errors.telefono?.message}
            ayuda="Ej.: 300 123 4567"
            type="tel"
            autoComplete="tel"
          />
          {errorComerciante && <Aviso tipo="error">{errorComerciante}</Aviso>}
          <button
            type="submit"
            className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
            disabled={formComerciante.formState.isSubmitting}
          >
            <Icono icono={PlusIcon} tamano="chico" />
            {formComerciante.formState.isSubmitting ? 'Creando…' : 'Crear comerciante'}
          </button>
        </form>
      )}

      {comerciante && (
        <form className="mt-4 space-y-3" onSubmit={crearNegocio} noValidate>
          <h3 className="font-bold">2. Negocio de {comerciante.nombre}</h3>
          <CampoTexto
            etiqueta="Nombre del negocio"
            registro={formNegocio.register('nombre')}
            error={formNegocio.formState.errors.nombre?.message}
            ayuda="Ej.: Café Plaza"
          />
          <CampoSelect
            etiqueta="Categoría (opcional)"
            registro={formNegocio.register('categoriaId')}
            error={formNegocio.formState.errors.categoriaId?.message}
            ayuda="Podés dejarla sin categoría y completarla después."
          >
            <option value="">Sin categoría…</option>
            {(categorias.data ?? [])
              .filter((c) => c.activa)
              .map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
          </CampoSelect>
          <CampoArea
            etiqueta="Descripción (opcional)"
            registro={formNegocio.register('descripcion')}
            error={formNegocio.formState.errors.descripcion?.message}
          />
          <CampoTexto
            etiqueta="Dirección (opcional)"
            registro={formNegocio.register('direccion')}
            error={formNegocio.formState.errors.direccion?.message}
            ayuda="Ej.: Calle 5 # 10-20, Salento"
          />
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto
              etiqueta="Latitud (opcional)"
              registro={formNegocio.register('latitud')}
              error={formNegocio.formState.errors.latitud?.message}
              type="number"
              step="0.000001"
              inputMode="decimal"
            />
            <CampoTexto
              etiqueta="Longitud (opcional)"
              registro={formNegocio.register('longitud')}
              error={formNegocio.formState.errors.longitud?.message}
              type="number"
              step="0.000001"
              inputMode="decimal"
            />
          </div>
          <CampoTexto
            etiqueta="Teléfono (opcional)"
            registro={formNegocio.register('telefono')}
            error={formNegocio.formState.errors.telefono?.message}
            type="tel"
          />
          <CampoTexto
            etiqueta="WhatsApp (opcional)"
            registro={formNegocio.register('whatsapp')}
            error={formNegocio.formState.errors.whatsapp?.message}
            ayuda="Con indicativo y sin espacios. Ej.: 573001234567"
            type="tel"
          />
          <CampoSelect
            etiqueta="Estado inicial"
            registro={formNegocio.register('estadoInicial')}
            error={formNegocio.formState.errors.estadoInicial?.message}
            ayuda="Publicado aparece de una en el directorio; en revisión pasa por la cola."
          >
            <option value="PENDIENTE">En revisión</option>
            <option value="APROBADO">Publicado</option>
          </CampoSelect>
          {errorNegocio && <Aviso tipo="error">{errorNegocio}</Aviso>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="btn-principal inline-flex items-center justify-center gap-2 px-6 py-3"
              disabled={formNegocio.formState.isSubmitting}
            >
              <Icono icono={BuildingStorefrontIcon} tamano="chico" />
              {formNegocio.formState.isSubmitting ? 'Creando…' : 'Crear negocio'}
            </button>
            <button type="button" className="btn-secundario px-6 py-3" onClick={terminar}>
              Terminar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
