import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, EyeSlashIcon, FlagIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  cambiarVisibilidadResena,
  listarAdminResenas,
  mensajeDeApi,
  type Resena
} from '../../lib/api';
import { fecha } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { Dialogo } from '../../components/Dialogo';
import { Icono } from '../../components/Icono';
import { Cargando, ErrorRecargar, Vacio } from '../../components/Estados';

/** S5 — calificación con Star sólida en oro cosecha; las vacías van en outline. */
function Estrellas({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const llenas = Math.round(valor);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={etiqueta}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icono
          key={n}
          icono={StarIcon}
          tamano="chico"
          className={n <= llenas ? 'text-oro-cosecha' : 'text-oro-cosecha/30'}
        />
      ))}
    </span>
  );
}

/** PA-06 Reseñas reportadas: cola de moderación y visibilidad (RF-39). */
export default function ResenasAdmin() {
  const cliente = useQueryClient();
  const [reportadas, setReportadas] = useState(true);
  const [porCambiar, setPorCambiar] = useState<Resena | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resenas = useQuery({
    queryKey: ['admin-resenas', reportadas],
    queryFn: () => listarAdminResenas(reportadas)
  });

  const visibilidad = useMutation({
    mutationFn: ({ resena, visible }: { resena: Resena; visible: boolean }) =>
      cambiarVisibilidadResena(resena.id, visible),
    onSuccess: async (r) => {
      setError(null);
      setAviso(`La reseña de ${r.clienteNombre} quedó ${r.visible ? 'visible' : 'oculta'}.`);
      setPorCambiar(null);
      await cliente.invalidateQueries({ queryKey: ['admin-resenas'] });
      await cliente.invalidateQueries({ queryKey: ['resenas', r.negocioId] });
    },
    onError: (e) => {
      setAviso(null);
      setError(mensajeDeApi(e));
      setPorCambiar(null);
    }
  });

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <h1 className="font-display text-titulo">Reseñas</h1>
      <p className="mt-1 text-texto-suave">
        Ocultá una reseña que no corresponde: deja de mostrarse y no cuenta en el promedio.
      </p>

      {aviso && (
        <div className="mt-3">
          <Aviso tipo="exito">{aviso}</Aviso>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      <div className="mt-3 flex gap-2" aria-label="Filtrar reseñas">
        <button
          type="button"
          aria-pressed={reportadas}
          className={`inline-flex items-center gap-2 rounded-campo px-3 py-2 ${reportadas ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => setReportadas(true)}
        >
          <Icono icono={FlagIcon} tamano="chico" /> Reportadas
        </button>
        <button
          type="button"
          aria-pressed={!reportadas}
          className={`rounded-campo px-3 py-2 ${!reportadas ? 'bg-primario-claro font-bold text-primario' : 'text-texto-suave'}`}
          onClick={() => setReportadas(false)}
        >
          Todas
        </button>
      </div>

      {resenas.isLoading && <Cargando texto="Cargando las reseñas…" />}
      {resenas.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(resenas.error)} onReintentar={() => resenas.refetch()} />
      )}
      {resenas.data && resenas.data.length === 0 && (
        <Vacio>{reportadas ? 'No hay reseñas reportadas.' : 'Todavía no hay reseñas.'}</Vacio>
      )}
      {resenas.data && resenas.data.length > 0 && (
        <ul className="mt-4 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
          {resenas.data.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.clienteNombre}</span>
                <Estrellas valor={r.calificacion} etiqueta={`${r.calificacion} de 5 estrellas`} />
                <span className="text-sm text-texto-suave">Negocio #{r.negocioId}</span>
                {r.reportada && (
                  <span className="inline-flex items-center gap-1 rounded-campo bg-advertencia/10 px-2 py-0.5 text-sm font-semibold text-advertencia">
                    <Icono icono={FlagIcon} tamano="chico" /> Reportada
                  </span>
                )}
                {!r.visible && (
                  <span className="inline-flex items-center gap-1 rounded-campo bg-texto-suave/10 px-2 py-0.5 text-sm text-texto-suave">
                    <Icono icono={EyeSlashIcon} tamano="chico" /> Oculta
                  </span>
                )}
              </div>
              <p className="mt-1">{r.comentario}</p>
              {r.motivoReporte && <p className="mt-1 text-sm text-advertencia">Motivo del reporte: {r.motivoReporte}</p>}
              <p className="mt-1 text-sm text-texto-suave">{fecha(r.creadoEn)}</p>
              <button
                type="button"
                className={`mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm ${r.visible ? 'btn-peligro' : 'btn-principal'}`}
                onClick={() => {
                  setError(null);
                  setAviso(null);
                  setPorCambiar(r);
                }}
              >
                <Icono icono={r.visible ? EyeSlashIcon : EyeIcon} tamano="chico" />
                {r.visible ? 'Ocultar reseña' : 'Mostrar reseña'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialogo
        abierto={porCambiar !== null}
        titulo={porCambiar?.visible ? '¿Ocultar la reseña?' : '¿Mostrar la reseña?'}
        onCerrar={() => setPorCambiar(null)}
      >
        {porCambiar && (
          <>
            <p>
              {porCambiar.visible
                ? `La reseña de ${porCambiar.clienteNombre} deja de mostrarse en el perfil y no cuenta en el promedio.`
                : `La reseña de ${porCambiar.clienteNombre} vuelve a mostrarse en el perfil.`}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={porCambiar.visible ? 'btn-peligro px-4 py-3' : 'btn-principal px-4 py-3'}
                disabled={visibilidad.isPending}
                onClick={() => visibilidad.mutate({ resena: porCambiar, visible: !porCambiar.visible })}
              >
                {visibilidad.isPending ? 'Guardando…' : porCambiar.visible ? 'Ocultar reseña' : 'Mostrar reseña'}
              </button>
              <button type="button" className="btn-secundario px-4 py-3" onClick={() => setPorCambiar(null)}>
                Volver
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </main>
  );
}
