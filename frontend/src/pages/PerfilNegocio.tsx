import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
  PlusIcon,
  ShareIcon,
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
import { useFavoritos } from '../lib/favoritos';
import { diaDeSemana, fecha, precio } from '../lib/formato';
import { Aviso } from '../components/negocio/Aviso';
import { Dialogo } from '../components/Dialogo';
import { Lightbox } from '../components/Lightbox';
import { Cargando, ErrorRecargar, Vacio } from '../components/Estados';
import { Icono } from '../components/Icono';
import { BotonAtras } from '../components/TituloAtras';

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
    <main className="mx-auto max-w-4xl px-4 pb-40 pt-4 md:pt-6">
      <div className="mb-3">
        <BotonAtras />
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(27,33,23,0.35)]">
      <TarjetaPortada
        id={id}
        nombre={negocio.data.nombre}
        categoria={negocio.data.categoria}
        estadoAbierto={negocio.data.abiertoAhora}
        nivelPrecio={negocio.data.nivelPrecio ?? null}
        distanciaKm={negocio.data.distanciaKm ?? null}
        telefono={negocio.data.telefono ?? null}
        whatsapp={negocio.data.whatsapp ?? null}
        aprobado={negocio.data.estado === 'APROBADO'}
        esHospedaje={negocio.data.tipoReserva === 'ALOJAMIENTO'}
        onIrACatalogo={() => setSeccion('catalogo')}
      />
      <Navegacion seccion={seccion} onCambiar={setSeccion} />

      {seccion === 'informacion' && (
        <div className="px-4 pb-6 md:px-6">
        <Informacion
          id={id}
          descripcion={negocio.data.descripcion ?? null}
          direccion={negocio.data.direccion ?? null}
          latitud={negocio.data.latitud ?? null}
          longitud={negocio.data.longitud ?? null}
        />
        </div>
      )}
      <div className="px-4 pb-6 md:px-6">
        {seccion === 'catalogo' && <Catalogo id={id} nombre={negocio.data.nombre} esHospedaje={negocio.data.tipoReserva === 'ALOJAMIENTO'} />}
        {seccion === 'resenas' && <Resenas id={id} />}
      </div>
      </div>
    </main>
  );
}

/** PU-03 Tarjeta del negocio: carrusel glass con badge, favorito, nombre y barra de acciones. */
function TarjetaPortada({
  id,
  nombre,
  categoria,
  estadoAbierto,
  nivelPrecio,
  distanciaKm,
  telefono,
  whatsapp,
  aprobado,
  esHospedaje,
  onIrACatalogo
}: {
  id: number;
  nombre: string;
  categoria: string | null;
  estadoAbierto?: boolean;
  nivelPrecio: number | null;
  distanciaKm: number | null;
  telefono: string | null;
  whatsapp: string | null;
  aprobado: boolean;
  esHospedaje?: boolean;
  onIrACatalogo: () => void;
}) {
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const esCliente = !sesion || sesion.rol === 'CLIENTE';
  const { ids: favoritos, alternar: alternarFav } = useFavoritos();
  const esFavorito = favoritos.includes(id);
  const resenas = useQuery({ queryKey: ['resenas', id], queryFn: () => getResenas(id), retry: false });
  const promedio = resenas.data?.promedio;
  const cantidad = resenas.data?.cantidad ?? 0;
  const imagenes = useQuery({ queryKey: ['imagenes', id], queryFn: () => listarImagenes(id), retry: false });
  const [activa, setActiva] = useState(0);
  const carrusel = useRef<HTMLDivElement | null>(null);
  const ordenadas = useMemo(
    () =>
      [...(imagenes.data ?? [])].sort(
        (a, b) => Number(b.principal) - Number(a.principal) || a.orden - b.orden
      ),
    [imagenes.data]
  );
  const irA = (indice: number) => {
    setActiva(indice);
    const el = carrusel.current;
    if (el) el.scrollTo({ left: indice * el.clientWidth, behavior: 'smooth' });
  };
  useEffect(() => {
    if (ordenadas.length < 2) return;
    const temporizador = setTimeout(() => {
      const siguiente = (activa + 1) % ordenadas.length;
      setActiva(siguiente);
      const el = carrusel.current;
      if (el) el.scrollTo({ left: siguiente * el.clientWidth, behavior: 'smooth' });
    }, 5000);
    return () => clearTimeout(temporizador);
  }, [activa, ordenadas.length]);
  const [copiado, setCopiado] = useState(false);
  const compartir = async () => {
    const url = window.location.href;
    const datos = { title: nombre, text: `Mira ${nombre} en TRINA`, url };
    const nav = navigator as Navigator & { share?: (datos: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share(datos);
      } catch {
        /* El usuario canceló el diálogo. */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };
  const alDeslizar = () => {
    const el = carrusel.current;
    if (!el || ordenadas.length === 0) return;
    setActiva(Math.round(el.scrollLeft / el.clientWidth));
  };
  const enlaceWa = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola, te escribo desde TRINA por ${nombre}. ¿Me puedes dar más información?`
      )}`
    : null;
  const abierto = estadoAbierto ?? false;
  const { carrito, cantidadTotal } = useCarrito();
  const mostrarPedido = !esHospedaje && (!carrito || carrito.negocioId === id);
  const hayItems = mostrarPedido && cantidadTotal > 0;
  const hayAcciones = Boolean(telefono || enlaceWa || (aprobado && esCliente) || mostrarPedido);
  return (
    <section aria-label={nombre}>
      <div className="relative">
        {ordenadas.length > 0 ? (
          <div
            ref={carrusel}
            onScroll={alDeslizar}
            className="flex h-80 snap-x snap-mandatory overflow-x-auto md:h-[26rem] lg:h-[30rem]"
          >
            {ordenadas.map((imagen, indice) => (
              <img
                key={imagen.id}
                src={imagen.url}
                alt={`Foto ${indice + 1} de ${nombre}`}
                loading={indice === 0 ? 'eager' : 'lazy'}
                className="h-full w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
        ) : (
          <div
            className="flex h-80 flex-col items-center justify-center gap-2 bg-gradient-to-br from-primario to-lima-oscura text-white/80 md:h-[26rem] lg:h-[30rem]"
            role="img"
            aria-label={`${nombre} todavía no tiene fotos`}
          >
            <Icono icono={PhotoIcon} tamano="grande" />
            <span className="text-sm font-semibold">Este negocio todavía no subió fotos.</span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"
        />
        {ordenadas.length > 1 && (
          <div className="absolute inset-x-0 top-3 flex justify-center gap-1.5">
            {ordenadas.map((imagen, indice) => (
              <button
                key={imagen.id}
                type="button"
                onClick={() => irA(indice)}
                aria-label={`Ver foto ${indice + 1}`}
                aria-current={indice === activa}
                className={`h-2 rounded-full transition-all ${
                  indice === activa ? 'w-6 bg-white' : 'w-2 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold backdrop-blur-md">
          <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                abierto ? 'bg-lima' : 'bg-error'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                abierto ? 'bg-lima' : 'bg-error'
              }`}
            />
          </span>
          <span className={abierto ? 'text-exito' : 'text-error'}>
            {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
          </span>
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={compartir}
            aria-label={`Compartir ${nombre}`}
            title="Compartir"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-oliva/70 backdrop-blur-md transition hover:bg-white/90"
          >
            <Icono icono={ShareIcon} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!sesion) {
                navigate('/favoritos');
                return;
              }
              alternarFav(id);
            }}
            aria-pressed={esFavorito}
            aria-label={esFavorito ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition hover:bg-white/90 ${
              esFavorito ? 'text-error' : 'text-oliva/70'
            }`}
          >
            <HeartIcon className="h-5 w-5" fill={esFavorito ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
        {copiado && (
          <p
            role="status"
            className="absolute right-4 top-[4.25rem] rounded-full bg-oliva px-3 py-1 text-xs font-semibold text-white shadow-lg"
          >
            ¡Enlace copiado!
          </p>
        )}
        <div className="absolute inset-x-5 bottom-24">
          <h1 className="font-display text-2xl font-bold text-white md:text-4xl">{nombre}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/85">
            {promedio != null ? (
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <Icono icono={StarIcon} tamano="chico" className="text-dorado" />
                {promedio.toFixed(1).replace('.', ',')} ({cantidad})
              </span>
            ) : (
              <span>Sin calificar</span>
            )}
            <span aria-hidden="true">·</span>
            <span>{categoria ?? 'Negocio local'}</span>
            <span aria-hidden="true">·</span>
            <span>{nivelPrecioTexto(nivelPrecio)}</span>
            {distanciaKm != null && (
              <>
                <span aria-hidden="true">·</span>
                <span>{distanciaTexto(distanciaKm)}</span>
              </>
            )}
          </p>
        </div>
      </div>
      {hayAcciones && (
        <div className="relative z-10 mx-4 -mt-14 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-lg backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-2xl gap-2">
            {telefono && (
              <a
                href={`tel:${telefono}`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-oliva/15 bg-white px-3 text-sm font-semibold text-[#1A2218]"
              >
                <Icono icono={PhoneIcon} tamano="chico" /> Llamar
              </a>
            )}
            {enlaceWa && (
              <a
                href={enlaceWa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-oliva/15 bg-white px-3 text-sm font-semibold text-[#1A2218]"
              >
                <Icono icono={ChatBubbleLeftRightIcon} tamano="chico" /> WhatsApp
              </a>
            )}
            {aprobado && esCliente && !esHospedaje && (
              <Link
                to={`/reservar/${id}`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#1A2218] px-3 text-sm font-bold text-white shadow-lg"
              >
                <Icono icono={CalendarDaysIcon} tamano="chico" /> Reservar
              </Link>
            )}
            {aprobado && esCliente && esHospedaje && (
              <button
                type="button"
                onClick={onIrACatalogo}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#1A2218] px-3 text-sm font-bold text-white shadow-lg"
              >
                <Icono icono={CalendarDaysIcon} tamano="chico" /> Reservar
              </button>
            )}
            {mostrarPedido && (
              <Link
                to="/carrito"
              aria-label={`Ver tu pedido${nombre ? ` en ${nombre}` : ''}${hayItems ? ` (${cantidadTotal} productos)` : ''}`}
              className={`relative inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border px-3 text-sm shadow-lg ${hayItems ? 'animar-carrito border-lima bg-lima font-bold text-oliva' : 'border-oliva/15 bg-white font-semibold text-[#1A2218]'}`}
            >
              <Icono icono={ShoppingCartIcon} tamano="chico" /> Pedido
              {hayItems && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-oliva px-1 text-[11px] font-extrabold text-white"
                >
                  {cantidadTotal > 99 ? '99+' : cantidadTotal}
                </span>
              )}
            </Link>
            )}
          </div>
          {aprobado && !esCliente && (
            <p className="mt-2 text-center text-xs text-texto-suave">
              Para reservar necesitas una cuenta de cliente.
            </p>
          )}
        </div>
      )}
      <div className="h-4" />
    </section>
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
      className="sticky top-0 z-10 mt-2 flex gap-1 border-b border-tinta-cafe/10 bg-white/95 px-4 backdrop-blur md:px-6"
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
    <section className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
      {descripcion && (
        <div className="border-b border-tinta-cafe/10 py-5">
          <h2 className="text-seccion">Sobre el negocio</h2>
          <p className="mt-2">{descripcion}</p>
        </div>
      )}

      <div className="py-5">
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

      </div>
      <aside className="h-fit rounded-2xl bg-fondo p-4 md:p-5 lg:sticky lg:top-16">
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
      </aside>
    </section>
  );
}

function Catalogo({ id, nombre, esHospedaje }: { id: number; nombre: string; esHospedaje?: boolean }) {
  const catalogo = useQuery({ queryKey: ['catalogo', id], queryFn: () => getCatalogo(id), retry: false });
  const { carrito, esDeOtroNegocio, agregar } = useCarrito();
  const [itemPendiente, setItemPendiente] = useState<ItemCatalogo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [visor, setVisor] = useState<{ fotos: string[]; indice: number; titulo: string } | null>(null);

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
    agregar({ id, nombre }, { id: item.id, nombre: item.nombre, precioCop: item.precioCop, imagenUrl: item.imagenUrl ?? null });
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
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {(item.imagenUrl || (item.imagenes?.length ?? 0) > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        const fotos = [
                          ...(item.imagenUrl ? [item.imagenUrl] : []),
                          ...(item.imagenes ?? [])
                        ];
                        if (fotos.length > 0) setVisor({ fotos, indice: 0, titulo: item.nombre });
                      }}
                      aria-label={`Ver fotos de ${item.nombre}`}
                      className="relative block h-16 w-16 shrink-0 rounded-campo"
                    >
                      <img
                        src={item.imagenUrl ?? item.imagenes![0]}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 rounded-campo bg-crema object-cover"
                      />
                      {(item.imagenes?.length ?? 0) > 0 && (
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-oliva px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                          +{item.imagenes!.length}
                        </span>
                      )}
                    </button>
                  )}
                  <div className="min-w-0">
                  <p className="font-semibold">{item.nombre}</p>
                  {item.descripcion && <p className="text-sm text-texto-suave">{item.descripcion}</p>}
                  <p className="mt-1 font-display text-cifra-menor">
                    {precio(item.precioCop)}
                    {esHospedaje && <span className="text-sm font-semibold text-texto-suave"> /noche</span>}
                  </p>
                  {item.capacidad != null && (
                    <p className="mt-0.5 text-xs font-semibold text-texto-suave">
                      Hasta {item.capacidad} {item.capacidad === 1 ? 'persona' : 'personas'}
                    </p>
                  )}
                  {!item.disponible && (
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-advertencia">
                      <Icono icono={ExclamationTriangleIcon} tamano="chico" />
                      No disponible por ahora
                    </p>
                  )}
                  </div>
                </div>
                {esHospedaje ? (
                  <Link
                    to={`/reservar/${id}?item=${item.id}`}
                    aria-disabled={!item.disponible}
                    onClick={(e) => {
                      if (!item.disponible) e.preventDefault();
                    }}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${item.disponible ? 'bg-[#1A2218] text-white shadow' : 'cursor-not-allowed bg-oliva/10 text-texto-suave'}`}
                  >
                    <Icono icono={CalendarDaysIcon} tamano="chico" /> Reservar
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-secundario inline-flex shrink-0 items-center gap-2 px-4 py-2"
                    disabled={!item.disponible}
                    onClick={() => pedirAgregar(item)}
                  >
                    <Icono icono={PlusIcon} /> Agregar
                  </button>
                )}
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
          Tienes productos de <strong>{carrito?.negocioNombre}</strong> en el carrito. Si agregas{' '}
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
        <div className="fixed inset-x-0 bottom-24 z-30 border-t border-tinta-cafe/10 bg-primario-claro p-3 sm:bottom-0">
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
      {visor != null && (
        <Lightbox
          fotos={visor.fotos}
          indice={visor.indice}
          titulo={visor.titulo}
          onCambiar={(i) => setVisor({ ...visor, indice: i })}
          onCerrar={() => setVisor(null)}
        />
      )}
    </section>
  );
}

const esquemaResena = z.object({
  calificacion: z
    .number({ invalid_type_error: 'Elige una calificación de 1 a 5 estrellas.' })
    .int()
    .min(1, 'Elige una calificación de 1 a 5 estrellas.')
    .max(5, 'Elige una calificación de 1 a 5 estrellas.'),
  comentario: z.string().trim().min(5, 'Cuéntanos qué te pareció (mínimo 5 letras).')
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
          className={n <= llenas ? 'text-dorado' : 'text-oliva/20'}
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
                  Si este es tu negocio, puedes reportar reseñas desde{' '}
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
              ingresa a tu cuenta
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
      <h3 className="text-seccion">{mia ? 'Editar mi reseña' : 'Cuenta tu experiencia'}</h3>

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
