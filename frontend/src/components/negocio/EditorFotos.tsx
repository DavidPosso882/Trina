import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  eliminarImagen,
  listarImagenes,
  marcarPrincipal,
  mensajeDeApi,
  subirImagen
} from '../../lib/api';
import { Aviso } from './Aviso';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Icono } from '../Icono';

const MAX_FOTOS = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

type Pendiente = { file: File; url: string };

/**
 * Fotos del negocio (RF-12) compartidas por el asistente (PM-02) y Fotos (PM-05):
 * lista las subidas, permite elegir principal, eliminar y encolar nuevas con vista previa.
 */
export function EditorFotos({
  negocioId,
  nombreNegocio,
  onCambio,
  onPendientes
}: {
  negocioId: number;
  nombreNegocio: string;
  onCambio?: (cantidad: number) => void;
  onPendientes?: (cantidad: number) => void;
}) {
  const qc = useQueryClient();
  const { data: imagenes, isLoading, isError, refetch } = useQuery({
    queryKey: ['imagenes', negocioId],
    queryFn: () => listarImagenes(negocioId),
    retry: false
  });

  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Las URLs de vista previa viven hasta que se sube, se quita o se sale del paso.
  const pendientesRef = useRef(pendientes);
  pendientesRef.current = pendientes;
  useEffect(
    () => () => pendientesRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    []
  );

  useEffect(() => {
    onCambio?.(imagenes?.length ?? 0);
  }, [imagenes, onCambio]);

  useEffect(() => {
    onPendientes?.(pendientes.length);
  }, [pendientes.length, onPendientes]);

  const elegir = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // permite volver a elegir el mismo archivo
    setError(null);
    setAviso(null);
    const validos: Pendiente[] = [];
    for (const file of files) {
      if (!TIPOS.includes(file.type)) {
        setError('Esta foto no se puede subir. Usá una imagen JPG, PNG o WebP.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError('La foto no puede superar los 5 MB. Probá con una más liviana.');
        continue;
      }
      validos.push({ file, url: URL.createObjectURL(file) });
    }
    if (validos.length > 0) setPendientes((p) => [...p, ...validos]);
  };

  const quitarPendiente = (indice: number) => {
    const p = pendientes[indice];
    if (p) URL.revokeObjectURL(p.url);
    setPendientes(pendientes.filter((_, i) => i !== indice));
  };

  const subirPendientes = async () => {
    if (pendientes.length === 0) return;
    setSubiendo(true);
    setError(null);
    setAviso(null);
    let subidas = 0;
    for (const p of pendientes) {
      try {
        await subirImagen(negocioId, p.file);
        subidas += 1;
      } catch (e) {
        setError(mensajeDeApi(e));
        break;
      }
    }
    pendientes.slice(0, subidas).forEach((p) => URL.revokeObjectURL(p.url));
    setPendientes(pendientes.slice(subidas));
    if (subidas > 0) {
      setAviso(subidas === 1 ? 'Subimos tu foto' : `Subimos ${subidas} fotos`);
      await qc.invalidateQueries({ queryKey: ['imagenes', negocioId] });
    }
    setSubiendo(false);
  };

  const marcarComoPrincipal = async (imagenId: number) => {
    setError(null);
    setAviso(null);
    try {
      await marcarPrincipal(negocioId, imagenId);
      await qc.invalidateQueries({ queryKey: ['imagenes', negocioId] });
      setAviso('Listo: esa foto ahora es la principal.');
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  const borrar = async (imagenId: number) => {
    if (!window.confirm('¿Querés eliminar esta foto? No se puede deshacer.')) return;
    setError(null);
    setAviso(null);
    try {
      await eliminarImagen(negocioId, imagenId);
      await qc.invalidateQueries({ queryKey: ['imagenes', negocioId] });
      setAviso('La foto quedó eliminada.');
    } catch (e) {
      setError(mensajeDeApi(e));
    }
  };

  const total = (imagenes?.length ?? 0) + pendientes.length;
  const puedeElegir = total < MAX_FOTOS;

  return (
    <div className="space-y-4">
      {isLoading && <p role="status">Cargando fotos…</p>}
      {isError && (
        <div className="space-y-2">
          <Aviso tipo="error">No pudimos cargar tus fotos. Revisá tu conexión e intentá de nuevo.</Aviso>
          <button type="button" className="btn-secundario px-4 py-2" onClick={() => refetch()}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {imagenes && (
        <>
          <p className="text-sm text-texto-suave">
            Tenés {imagenes.length} de {MAX_FOTOS} fotos. La principal se muestra primero en tu perfil.
          </p>
          {imagenes.length === 0 && (
            <p className="text-texto-suave">
              Todavía no subiste fotos. Subí al menos una para poder publicar tu negocio.
            </p>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imagenes.map((img, i) => (
              <li key={img.id} className="tarjeta-negocio space-y-2">
                <img
                  src={img.urlMiniatura}
                  alt={`Foto ${i + 1} de ${nombreNegocio}`}
                  loading="lazy"
                  className="h-28 w-full rounded-campo object-cover"
                />
                {img.principal ? (
                  <p className="flex items-center gap-1 text-sm font-semibold text-primario">
                    <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" /> Principal
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn-secundario inline-flex w-full items-center justify-center gap-2 px-2 py-2 text-sm"
                    onClick={() => marcarComoPrincipal(img.id)}
                    disabled={subiendo}
                  >
                    <Icono icono={StarIcon} tamano="chico" className="text-oro-cosecha" />
                    Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secundario inline-flex w-full items-center justify-center gap-2 px-2 py-2 text-sm"
                  onClick={() => borrar(img.id)}
                  disabled={subiendo}
                >
                  <Icono icono={TrashIcon} tamano="chico" />
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {pendientes.length > 0 && (
        <div>
          <h3 className="font-semibold">Para subir</h3>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pendientes.map((p, i) => (
              <li key={`${p.file.name}-${i}`} className="tarjeta-negocio space-y-2">
                <img
                  src={p.url}
                  alt={`Vista previa de ${p.file.name}`}
                  className="h-28 w-full rounded-campo object-cover"
                />
                <p className="truncate text-sm">{p.file.name}</p>
                <button
                  type="button"
                  className="btn-secundario w-full px-2 py-2 text-sm"
                  onClick={() => quitarPendiente(i)}
                  disabled={subiendo}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-principal mt-3 inline-flex items-center gap-2 px-6 py-3"
            onClick={subirPendientes}
            disabled={subiendo}
            aria-busy={subiendo}
          >
            {subiendo ? (
              'Subiendo…'
            ) : (
              <>
                <Icono icono={ArrowUpTrayIcon} />
                Subir {pendientes.length === 1 ? '1 foto' : `${pendientes.length} fotos`}
              </>
            )}
          </button>
        </div>
      )}

      {puedeElegir ? (
        <div>
          <label htmlFor="fotos" className="font-semibold">
            Agregar fotos
          </label>
          <input
            id="fotos"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="campo mt-1"
            onChange={elegir}
            aria-describedby="fotos-ayuda"
            disabled={subiendo}
          />
          <p id="fotos-ayuda" className="mt-1 text-sm text-texto-suave">
            JPG, PNG o WebP, hasta 5 MB por foto. Podés elegir varias a la vez. Ej.: la fachada de tu
            negocio y tus productos.
          </p>
        </div>
      ) : (
        <Aviso tipo="info">Ya tenés {MAX_FOTOS} fotos; eliminá una para subir otra.</Aviso>
      )}

      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
    </div>
  );
}
