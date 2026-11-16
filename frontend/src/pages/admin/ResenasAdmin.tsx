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
    <main className="animar-admin pb-20 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2218]">Reseñas</h1>
        <p className="mt-1 text-sm text-gray-500">
        Oculta una reseña que no corresponde: deja de mostrarse y no cuenta en el promedio.
      </p>
      </div>

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

      <div className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-4 shadow-md" aria-label="Filtrar reseñas">
        <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={reportadas}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${reportadas ? 'bg-[#1A2218] text-white shadow-sm' : 'border border-gray-200/70 bg-white text-gray-500 hover:bg-[#F0FDF4]'}`}
          onClick={() => setReportadas(true)}
        >
          <Icono icono={FlagIcon} tamano="chico" /> Reportadas
        </button>
        <button
          type="button"
          aria-pressed={!reportadas}
          className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold transition ${!reportadas ? 'bg-[#1A2218] text-white shadow-sm' : 'border border-gray-200/70 bg-white text-gray-500 hover:bg-[#F0FDF4]'}`}
          onClick={() => setReportadas(false)}
        >
          Todas
        </button>
        </div>
      </div>
      {resenas.isLoading && <Cargando texto="Cargando las reseñas…" />}
      {resenas.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(resenas.error)} onReintentar={() => resenas.refetch()} />
      )}
      {resenas.data && resenas.data.length === 0 && (
        <Vacio>{reportadas ? 'No hay reseñas reportadas.' : 'Todavía no hay reseñas.'}</Vacio>
      )}
      {resenas.data && resenas.data.length > 0 && (
        <section className="mt-4 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-md" aria-label="Listado de reseñas">
        <ul className="flex flex-col gap-3">
          {resenas.data.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-100 bg-[#F8F9FA] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#1A2218]">{r.clienteNombre}</span>
                <Estrellas valor={r.calificacion} etiqueta={`${r.calificacion} de 5 estrellas`} />
                <span className="text-sm text-gray-500">Negocio #{r.negocioId}</span>
                {r.reportada && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E9A13B]/10 px-2 py-0.5 text-sm font-semibold text-[#92400E]">
                    <Icono icono={FlagIcon} tamano="chico" /> Reportada
                  </span>
                )}
                {!r.visible && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-sm text-gray-500">
                    <Icono icono={EyeSlashIcon} tamano="chico" /> Oculta
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#1A2218]">{r.comentario}</p>
              {r.motivoReporte && <p className="mt-1 text-sm text-[#92400E]">Motivo del reporte: {r.motivoReporte}</p>}
              <p className="mt-1 text-sm text-gray-500">{fecha(r.creadoEn)}</p>
              <button
                type="button"
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 ${r.visible ? 'bg-[#C8322B]' : 'bg-[#1A2218]'}`}
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
        </section>
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
              className={porCambiar.visible ? 'rounded-full bg-[#C8322B] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60' : 'rounded-full bg-[#1A2218] px-4 py-3 text-sm font-bold text-white transition hover:brightness-125 disabled:opacity-60'}
                disabled={visibilidad.isPending}
                onClick={() => visibilidad.mutate({ resena: porCambiar, visible: !porCambiar.visible })}
              >
                {visibilidad.isPending ? 'Guardando…' : porCambiar.visible ? 'Ocultar reseña' : 'Mostrar reseña'}
              </button>
              <button type="button" className="rounded-full border border-gray-200/70 bg-white px-4 py-3 text-sm font-bold text-[#1A2218] transition hover:bg-[#F0FDF4]" onClick={() => setPorCambiar(null)}>
                Volver
              </button>
            </div>
          </>
        )}
      </Dialogo>
    </main>
  );
}
