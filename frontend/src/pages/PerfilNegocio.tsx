import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
  PlusIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid';
import {
  editarResena,
  getCatalogo,
  getHorarios,
  getNegocio,
  getResenas,
  listarImagenes,
  mensajeDeApi,
  publicarResena,
  type ItemCatalogo,
  type Resena
} from '../lib/api';
import { useSesion } from '../lib/auth';
import { useCarrito } from '../lib/carrito';
import { diaDeSemana, fecha, precio } from '../lib/formato';
import { Aviso } from '../components/negocio/Aviso';
import { Dialogo } from '../components/Dialogo';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';
import { Icono } from '../components/Icono';

type Seccion = 'informacion' | 'catalogo' | 'resenas';

// Meta en cifras: el vacío se etiqueta "Sin dato", nunca un guion suelto.
const nivelPrecioTexto = (nivel?: number | null) =>
  nivel ? '$'.repeat(Math.min(Math.max(nivel, 1), 3)) : 'Sin dato';

const distanciaTexto = (km?: number | null) =>
  km != null ? `${km.toFixed(1).replace('.', ',')} km` : 'Sin dato';

/** PU-03 Perfil del negocio: galería, datos, horarios, mapa, catálogo, reseñas y acciones. */
export default function PerfilNegocio() {
  const { id: idTexto } = useParams<{ id: string }>();
  const id = Number(idTexto);
  const valido = Number.isFinite(id) && id > 0;
  const [seccion, setSeccion] = useState<Seccion>('informacion');

  const negocio = useQuery({
    queryKey: ['negocio', id],
    queryFn: () => getNegocio(id),
    enabled: valido
  });

  if (!valido) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <ErrorRecargar mensaje="Ese negocio no existe." onReintentar={() => window.history.back()} textoBoton="Volver" />
        <Link to="/explorar" className="mt-3 inline-block font-semibold text-primario">
          Explorar negocios
        </Link>
      </main>
    );
  }

  if (negocio.isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <Cargando texto="Cargando el negocio…" />
      </main>
    );
  }

  if (negocio.isError || !negocio.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <ErrorRecargar mensaje={mensajeDeApi(negocio.error)} onReintentar={() => negocio.refetch()} />
        <Link to="/explorar" className="mt-3 inline-block font-semibold text-primario">
          Explorar negocios
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-40 pt-4">
      <Encabezado
        id={id}
        nombre={negocio.data.nombre}
        categoria={negocio.data.categoria}
        estadoAbierto={negocio.data.abiertoAhora}
        destacado={negocio.data.destacado}
        insignia={negocio.data.insignia ?? null}
        nivelPrecio={negocio.data.nivelPrecio ?? null}
        distanciaKm={negocio.data.distanciaKm ?? null}
      />
      <Acciones
        id={id}
        nombre={negocio.data.nombre}
        telefono={negocio.data.telefono ?? null}
        whatsapp={negocio.data.whatsapp ?? null}
        aprobado={negocio.data.estado === 'APROBADO'}
        onIrACatalogo={() => setSeccion('catalogo')}
      />
      <Galeria id={id} nombre={negocio.data.nombre} />
      <Navegacion seccion={seccion} onCambiar={setSeccion} />

      {seccion === 'informacion' && (
        <Informacion
          id={id}
          descripcion={negocio.data.descripcion ?? null}
          direccion={negocio.data.direccion ?? null}
          latitud={negocio.data.latitud ?? null}
          longitud={negocio.data.longitud ?? null}
        />
      )}
      {seccion === 'catalogo' && <Catalogo id={id} nombre={negocio.data.nombre} />}
      {seccion === 'resenas' && <Resenas id={id} />}
    </main>
  );
}

function Encabezado({
  id,
  nombre,
  categoria,
  estadoAbierto,
  destacado,
  insignia,
  nivelPrecio,
  distanciaKm
}: {
  id: number;
  nombre: string;
  categoria: string | null;
  estadoAbierto?: boolean;
  destacado?: boolean;
  insignia: string | null;
  nivelPrecio: number | null;
  distanciaKm: number | null;
}) {
  const resenas = useQuery({ queryKey: ['resenas', id], queryFn: () => getResenas(id), retry: false });
  const promedio = resenas.data?.promedio;
  return (
    <header className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-titulo">{nombre}</h1>
        {destacado && (
          <span className="inline-flex items-center gap-1 rounded-campo bg-oro-cosecha/20 px-2 py-1 text-sm font-semibold text-tinta-cafe">
            <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" />
            {insignia ?? 'Destacado'}
          </span>
        )}
      </div>

      {estadoAbierto !== undefined && (
        <p className="mt-2 flex items-center gap-2 font-semibold">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${estadoAbierto ? 'bg-primario' : 'bg-error'}`}
          />
          {estadoAbierto ? 'Abierto ahora' : 'Cerrado ahora'}
        </p>
      )}

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <dt className="text-xs text-texto-suave">Categoría</dt>
          <dd className="text-sm font-semibold">{categoria ?? 'Negocio local'}</dd>
        </div>
        <div>
          <dt className="text-xs text-texto-suave">Calificación</dt>
          <dd className="flex items-baseline gap-1">
            {promedio != null ? (
              <>
                <span className="font-display text-cifra-menor" aria-hidden="true">
                  {promedio.toFixed(1).replace('.', ',')}
                </span>
                <Icono
                  icono={StarIcon}
                  tamano="chico"
                  className="text-oro-cosecha"
                  etiqueta={`${promedio.toFixed(1).replace('.', ',')} de 5 estrellas`}
                />
                <span className="text-sm text-texto-suave">({resenas.data?.cantidad ?? 0})</span>
              </>
            ) : (
              <span className="text-sm text-texto-suave">Sin dato</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-texto-suave">Precio</dt>
          <dd className={nivelPrecio ? 'font-display text-cifra-menor' : 'text-sm text-texto-suave'}>
            {nivelPrecioTexto(nivelPrecio)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-texto-suave">Distancia</dt>
          <dd className={distanciaKm != null ? 'font-display text-cifra-menor' : 'text-sm text-texto-suave'}>
            {distanciaTexto(distanciaKm)}
          </dd>
        </div>
      </dl>
    </header>
  );
}

function Acciones({
  id,
  nombre,
  telefono,
  whatsapp,
  aprobado,
  onIrACatalogo
}: {
  id: number;
  nombre: string;
  telefono: string | null;
  whatsapp: string | null;
  aprobado: boolean;
  onIrACatalogo: () => void;
}) {
  const { sesion } = useSesion();
  const esCliente = !sesion || sesion.rol === 'CLIENTE';
  const enlaceWa = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola, te escribo desde TRINA por ${nombre}. ¿Me podés dar más información?`
      )}`
    : null;
  return (
    <section className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Acciones del negocio">
      {telefono && (
        <a className="btn-secundario inline-flex items-center justify-center gap-2 px-4 py-3" href={`tel:${telefono}`}>
          <Icono icono={PhoneIcon} /> Llamar
        </a>
      )}
      {enlaceWa && (
        <a
          className="btn-secundario inline-flex items-center justify-center gap-2 px-4 py-3 text-center"
          href={enlaceWa}
          target="_blank"
          rel="noreferrer"
        >
          <Icono icono={ChatBubbleLeftRightIcon} /> Escribir por WhatsApp
        </a>
      )}
      {aprobado && esCliente && (
        <>
          <button
            type="button"
            className="btn-principal inline-flex items-center justify-center gap-2 px-4 py-3"
            onClick={onIrACatalogo}
          >
            <Icono icono={ShoppingCartIcon} /> Agregar
          </button>
          <Link
            className="btn-secundario inline-flex items-center justify-center gap-2 px-4 py-3 text-center"
            to={`/reservar/${id}`}
          >
            <Icono icono={CalendarDaysIcon} /> Reservar
          </Link>
        </>
      )}
      {aprobado && !esCliente && (
        <div className="col-span-2 sm:w-full">
          <Aviso tipo="info">Para agregar productos o reservar necesitás una cuenta de cliente.</Aviso>
        </div>
      )}
      {!telefono && !whatsapp && (
        <div className="col-span-2 sm:w-full">
          <Aviso tipo="info">Este negocio todavía no cargó teléfono ni WhatsApp.</Aviso>
        </div>
      )}
    </section>
  );
}

function Galeria({ id, nombre }: { id: number; nombre: string }) {
  const imagenes = useQuery({ queryKey: ['imagenes', id], queryFn: () => listarImagenes(id), retry: false });
  const [activa, setActiva] = useState(0);
  const ordenadas = useMemo(
    () =>
      [...(imagenes.data ?? [])].sort(
        (a, b) => Number(b.principal) - Number(a.principal) || a.orden - b.orden
      ),
    [imagenes.data]
  );

  if (imagenes.isLoading) return <Cargando texto="Cargando las fotos…" />;
  if (imagenes.isError) {
    return (
      <div className="mt-4">
        <ErrorRecargar mensaje="No se pudieron cargar las fotos." onReintentar={() => imagenes.refetch()} />
      </div>
    );
  }
  if (ordenadas.length === 0) {
    return (
      <div
        className="mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-tarjeta bg-primario-claro text-texto-suave"
        role="img"
        aria-label={`${nombre} todavía no tiene fotos`}
      >
        <Icono icono={PhotoIcon} tamano="grande" />
        <span>Este negocio todavía no subió fotos.</span>
      </div>
    );
  }

  const seleccionada = ordenadas[Math.min(activa, ordenadas.length - 1)];
  return (
    <div className="mt-4">
      <img
        src={seleccionada.url}
        alt={`Foto de ${nombre}`}
        className="h-56 w-full rounded-tarjeta bg-primario-claro object-cover"
      />
      {ordenadas.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {ordenadas.map((imagen, indice) => (
            <button
              key={imagen.id}
              type="button"
              className={`shrink-0 rounded-campo border-2 ${indice === activa ? 'border-primario' : 'border-transparent'}`}
              aria-label={`Ver foto ${indice + 1} de ${nombre}`}
              aria-pressed={indice === activa}
              onClick={() => setActiva(indice)}
            >
              <img
                src={imagen.urlMiniatura}
                alt=""
                loading="lazy"
                className="h-16 w-16 rounded-campo object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Navegacion({ seccion, onCambiar }: { seccion: Seccion; onCambiar: (s: Seccion) => void }) {
  const botones: { valor: Seccion; texto: string }[] = [
    { valor: 'informacion', texto: 'Información' },
    { valor: 'catalogo', texto: 'Catálogo' },
    { valor: 'resenas', texto: 'Reseñas' }
  ];
  return (
    <nav
      className="sticky top-0 z-10 -mx-4 mt-4 flex gap-1 border-b border-tinta-cafe/10 bg-fondo px-4"
      aria-label="Secciones del negocio"
    >
      {botones.map((b) => (
        <button
          key={b.valor}
          type="button"
          aria-pressed={seccion === b.valor}
          className={`-mb-px inline-flex min-h-boton items-center border-b-2 px-3 text-sm font-semibold ${
            seccion === b.valor ? 'border-primario text-primario' : 'border-transparent text-texto-suave'
          }`}
          onClick={() => onCambiar(b.valor)}
        >
          {b.texto}
        </button>
      ))}
    </nav>
  );
}

function Informacion({
  id,
  descripcion,
  direccion,
  latitud,
  longitud
}: {
  id: number;
  descripcion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
}) {
  const horarios = useQuery({ queryKey: ['horarios', id], queryFn: () => getHorarios(id), retry: false });
  const hayCoordenadas = latitud != null && longitud != null;
  const enlaceMapa = hayCoordenadas
    ? `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=17/${latitud}/${longitud}`
    : direccion
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(direccion)}`
      : null;
  const embed = hayCoordenadas
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitud! - 0.006}%2C${latitud! - 0.004}%2C${longitud! + 0.004}&layer=mapnik&marker=${latitud}%2C${longitud}`
    : null;

  return (
    <section className="mt-4 border-t border-tinta-cafe/10">
      {descripcion && (
        <div className="border-b border-tinta-cafe/10 py-5">
          <h2 className="text-seccion">Sobre el negocio</h2>
          <p className="mt-2">{descripcion}</p>
        </div>
      )}

      <div className="border-b border-tinta-cafe/10 py-5">
        <h2 className="text-seccion">Dirección</h2>
        <p className="mt-2">{direccion ?? 'Todavía no cargó la dirección.'}</p>
        {embed && (
          <iframe
            title={`Mapa de la ubicación de ${id}`}
            src={embed}
            loading="lazy"
            className="mt-3 h-48 w-full rounded-campo border border-tinta-cafe/15"
          />
        )}
        {enlaceMapa && (
          <a
            className="mt-2 inline-flex min-h-boton items-center gap-2 font-semibold text-primario"
            href={enlaceMapa}
            target="_blank"
            rel="noreferrer"
          >
            <Icono icono={MapPinIcon} tamano="chico" /> Ver en el mapa
          </a>
        )}
      </div>

      <div className="py-5">
        <h2 className="text-seccion">Horarios</h2>
        {horarios.isLoading && (
          <p role="status" className="mt-2 flex items-center gap-2 text-texto-suave">
            <Icono icono={ArrowPathIcon} className="animate-spin" /> Cargando…
          </p>
        )}
        {horarios.isError && (
          <ErrorRecargar mensaje="No se pudieron cargar los horarios." onReintentar={() => horarios.refetch()} />
        )}
        {horarios.data && horarios.data.length === 0 && (
          <p className="mt-2 text-texto-suave">Todavía no cargó sus horarios.</p>
        )}
        {horarios.data && horarios.data.length > 0 && (
          <ul className="mt-2 divide-y divide-tinta-cafe/10">
            {[1, 2, 3, 4, 5, 6, 7].map((dia) => {
              const franjas = (horarios.data ?? []).filter((f) => f.diaSemana === dia);
              return (
                <li key={dia} className="flex justify-between gap-3 py-2.5">
                  <span className="font-semibold">{diaDeSemana(dia)}</span>
                  <span className="text-right">
                    {franjas.length === 0
                      ? 'Cerrado'
                      : franjas.map((f) => `${f.abre} a ${f.cierra}`).join(' y ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function Catalogo({ id, nombre }: { id: number; nombre: string }) {
  const catalogo = useQuery({ queryKey: ['catalogo', id], queryFn: () => getCatalogo(id), retry: false });
  const { carrito, esDeOtroNegocio, agregar } = useCarrito();
  const [itemPendiente, setItemPendiente] = useState<ItemCatalogo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (catalogo.isLoading) return <Cargando texto="Cargando el catálogo…" />;
  if (catalogo.isError) {
    return <ErrorRecargar mensaje="No se pudo cargar el catálogo." onReintentar={() => catalogo.refetch()} />;
  }

  const grupos = [
    ...catalogo.data!.categorias.map((g) => ({ titulo: g.categoria.nombre, items: g.items })),
    ...(catalogo.data!.sinCategoria.length > 0
      ? [{ titulo: 'Otros productos', items: catalogo.data!.sinCategoria }]
      : [])
  ];
  const hayItems = grupos.some((g) => g.items.length > 0);

  const agregarDirecto = (item: ItemCatalogo) => {
    agregar({ id, nombre }, { id: item.id, nombre: item.nombre, precioCop: item.precioCop });
    setAviso(`${item.nombre} se agregó a tu pedido.`);
  };
  const pedirAgregar = (item: ItemCatalogo) => {
    if (esDeOtroNegocio(id)) setItemPendiente(item);
    else agregarDirecto(item);
  };

  return (
    <section className="mt-4">
      <h2 className="font-display text-titulo-menor">Catálogo</h2>
      {aviso && (
        <div className="mt-2">
          <Aviso tipo="exito">
            {aviso}{' '}
            <Link to="/carrito" className="font-bold underline">
              Ver mi pedido
            </Link>
          </Aviso>
        </div>
      )}
      {!hayItems && <Vacio>Todavía no cargó su catálogo.</Vacio>}
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="mt-6">
          <h3 className="text-seccion">{grupo.titulo}</h3>
          <ul className="mt-1 divide-y divide-tinta-cafe/10 border-t border-tinta-cafe/10">
            {grupo.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">{item.nombre}</p>
                  {item.descripcion && <p className="text-sm text-texto-suave">{item.descripcion}</p>}
                  <p className="mt-1 font-display text-cifra-menor">{precio(item.precioCop)}</p>
                  {!item.disponible && (
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-advertencia">
                      <Icono icono={ExclamationTriangleIcon} tamano="chico" />
                      No disponible por ahora
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-secundario inline-flex shrink-0 items-center gap-2 px-4 py-2"
                  disabled={!item.disponible}
                  onClick={() => pedirAgregar(item)}
                >
                  <Icono icono={PlusIcon} /> Agregar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Dialogo
        abierto={itemPendiente !== null}
        titulo="Tu pedido es de otro negocio"
        onCerrar={() => setItemPendiente(null)}
      >
        <p>
          Tenés productos de <strong>{carrito?.negocioNombre}</strong> en el carrito. Si agregás{' '}
          <strong>{itemPendiente?.nombre}</strong>, se vacía y empieza un pedido en {nombre}.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-peligro px-4 py-3"
            onClick={() => {
              if (itemPendiente) {
                agregarDirecto(itemPendiente);
                setItemPendiente(null);
              }
            }}
          >
            Vaciar carrito y agregar
          </button>
          <button type="button" className="btn-secundario px-4 py-3" onClick={() => setItemPendiente(null)}>
            Cancelar
          </button>
        </div>
      </Dialogo>

      {carrito?.negocioId === id && carrito.items.length > 0 && (
        <div className="fixed inset-x-0 bottom-14 z-30 border-t border-tinta-cafe/10 bg-primario-claro p-3 sm:bottom-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold">
              <Icono icono={ShoppingCartIcon} tamano="chico" />
              {carrito.items.length} producto{carrito.items.length > 1 ? 's' : ''}
            </span>
            <Link to="/carrito" className="btn-principal px-4 py-2">
              Ver mi pedido
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

const esquemaResena = z.object({
  calificacion: z
    .number({ invalid_type_error: 'Elegí una calificación de 1 a 5 estrellas.' })
    .int()
    .min(1, 'Elegí una calificación de 1 a 5 estrellas.')
    .max(5, 'Elegí una calificación de 1 a 5 estrellas.'),
  comentario: z.string().trim().min(5, 'Contanos qué te pareció (mínimo 5 letras).')
});

type ValoresResena = z.infer<typeof esquemaResena>;

/** Calificación de 1 a 5 con la Star sólida dorada de Heroicons. */
function Estrellas({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const llenas = Math.round(valor);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={etiqueta}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icono
          key={n}
          icono={StarIcon}
          tamano="chico"
          className={n <= llenas ? 'text-oro-cosecha' : 'text-tinta-cafe/20'}
        />
      ))}
    </span>
  );
}

function Resenas({ id }: { id: number }) {
  const { sesion } = useSesion();
  const resenas = useQuery({ queryKey: ['resenas', id], queryFn: () => getResenas(id), retry: false });

  if (resenas.isLoading) return <Cargando texto="Cargando las reseñas…" />;
  if (resenas.isError) {
    return <ErrorRecargar mensaje="No se pudieron cargar las reseñas." onReintentar={() => resenas.refetch()} />;
  }

  const datos = resenas.data!;
  const mia = sesion ? datos.resenas.find((r) => r.clienteId === sesion.id) : undefined;

  return (
    <section className="mt-4">
      <div className="border-b border-tinta-cafe/10 py-4">
        <h2 className="font-display text-titulo-menor">
          {datos.promedio != null ? (
            <span className="flex flex-wrap items-center gap-2">
              <Estrellas
                valor={datos.promedio}
                etiqueta={`${datos.promedio.toFixed(1).replace('.', ',')} de 5 estrellas`}
              />
              <span aria-hidden="true">{datos.promedio.toFixed(1).replace('.', ',')}</span>
            </span>
          ) : (
            'Todavía sin calificación'
          )}
        </h2>
        <p className="mt-1 text-texto-suave">
          {datos.cantidad} reseña{datos.cantidad === 1 ? '' : 's'} de clientes.
        </p>
      </div>

      <div className="mt-4">
        {sesion ? (
          sesion.rol === 'CLIENTE' ? (
            <FormularioResena negocioId={id} mia={mia} />
          ) : (
            <Aviso tipo="info">
              Solo las cuentas de cliente pueden dejar reseñas.
              {sesion.rol === 'COMERCIANTE' && (
                <>
                  {' '}
                  Si este es tu negocio, podés reportar reseñas desde{' '}
                  <Link to="/panel/resenas" className="font-bold underline">
                    el panel
                  </Link>
                  .
                </>
              )}
            </Aviso>
          )
        ) : (
          <Aviso tipo="info">
            Para dejar tu reseña,{' '}
            <Link to="/ingresar" state={{ desde: `/negocios/${id}` }} className="font-bold underline">
              ingresá a tu cuenta
            </Link>
            .
          </Aviso>
        )}
      </div>

      {datos.resenas.length === 0 && <Vacio>Este negocio todavía no tiene reseñas.</Vacio>}
      <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
        {datos.resenas.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{r.clienteNombre}</span>
              <Estrellas valor={r.calificacion} etiqueta={`${r.calificacion} de 5 estrellas`} />
              {r.verificada && (
                <span className="inline-flex items-center gap-1 rounded-campo bg-primario-claro px-2 py-0.5 text-sm text-exito">
                  <Icono icono={CheckBadgeIcon} tamano="chico" />
                  Compra verificada
                </span>
              )}
              {mia?.id === r.id && (
                <span className="rounded-campo bg-info/10 px-2 py-0.5 text-sm text-info">Tu reseña</span>
              )}
            </div>
            <p className="mt-1">{r.comentario}</p>
            <p className="mt-1 text-sm text-texto-suave">{fecha(r.creadoEn)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FormularioResena({ negocioId, mia }: { negocioId: number; mia?: Resena }) {
  const cliente = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<ValoresResena>({
    resolver: zodResolver(esquemaResena),
    defaultValues: { calificacion: mia?.calificacion ?? 5, comentario: mia?.comentario ?? '' }
  });

  // Al publicar, la reseña propia aparece en el listado: precargamos la edición sin perder el aviso.
  useEffect(() => {
    if (mia) reset({ calificacion: mia.calificacion, comentario: mia.comentario });
  }, [mia, reset]);

  const enviar = async (v: ValoresResena) => {
    setAviso(null);
    setError(null);
    try {
      if (mia) await editarResena(mia.id, v);
      else await publicarResena(negocioId, v);
      await cliente.invalidateQueries({ queryKey: ['resenas', negocioId] });
      setAviso(mia ? 'Tu reseña quedó actualizada.' : '¡Gracias! Tu reseña quedó publicada.');
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  return (
    <form
      className="space-y-3 rounded-tarjeta border border-tinta-cafe/10 bg-superficie p-4"
      onSubmit={handleSubmit(enviar)}
      noValidate
    >
      <h3 className="text-seccion">{mia ? 'Editar mi reseña' : 'Contá tu experiencia'}</h3>

      <div>
        <label htmlFor="calificacion" className="font-semibold">
          Calificación
        </label>
        <select id="calificacion" className="campo mt-1" {...register('calificacion', { valueAsNumber: true })}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} estrella{n === 1 ? '' : 's'}
            </option>
          ))}
        </select>
        {formState.errors.calificacion && (
          <p role="alert" className="mt-1 flex items-center gap-2 font-semibold text-error">
            <Icono icono={ExclamationTriangleIcon} tamano="chico" />
            {formState.errors.calificacion.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="comentario" className="font-semibold">
          Comentario
        </label>
        <textarea
          id="comentario"
          rows={3}
          className="campo mt-1"
          placeholder="Ej.: El tinto y el pan de queso son espectaculares."
          {...register('comentario')}
        />
        {formState.errors.comentario && (
          <p role="alert" className="mt-1 flex items-center gap-2 font-semibold text-error">
            <Icono icono={ExclamationTriangleIcon} tamano="chico" />
            {formState.errors.comentario.message}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-campo bg-error/10 p-3 text-error">
          <Icono icono={ExclamationTriangleIcon} className="mt-0.5" />
          <span>{error}</span>
        </p>
      )}
      {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
      <button type="submit" className="btn-principal px-6 py-3" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Publicando…' : mia ? 'Guardar cambios' : 'Publicar reseña'}
      </button>
    </form>
  );
}
