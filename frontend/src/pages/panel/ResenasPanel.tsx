import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BuildingStorefrontIcon,
  EyeSlashIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid';
import { getResenas, mensajeDeApi, reportarResena, type Negocio, type Resena } from '../../lib/api';
import { fecha } from '../../lib/formato';
import { Aviso } from '../../components/negocio/Aviso';
import { ConNegocio } from '../../components/negocio/ConNegocio';
import { DialogoMotivo } from '../../components/DialogoMotivo';
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

/** PM-11 Reseñas: lo que dicen tus clientes y reporte de reseñas con motivo (RF-39). */
export default function ResenasPanel() {
  return <ConNegocio>{(negocio) => <ListaResenas negocio={negocio} />}</ConNegocio>;
}

function ListaResenas({ negocio }: { negocio: Negocio }) {
  const publicado = negocio.estado === 'APROBADO';
  const resenas = useQuery({
    queryKey: ['resenas', negocio.id],
    queryFn: () => getResenas(negocio.id),
    enabled: publicado,
    retry: false
  });

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-titulo">Reseñas</h1>
        {publicado && (
          <Link to={`/negocios/${negocio.id}`} className="text-sm font-semibold text-primario">
            Ver mi perfil público →
          </Link>
        )}
      </div>
      <p className="mt-1 text-texto-suave">
        Si una reseña no corresponde, podés reportarla y el equipo de TRINA la revisa.
      </p>

      {!publicado && (
        <div className="mt-4">
          <Aviso tipo="info">
            Tu negocio todavía no está publicado, así que aún no recibe reseñas. Cuando esté aprobado vas a
            verlas acá.
          </Aviso>
          <Link
            to="/panel/negocio"
            className="btn-secundario mt-3 inline-flex items-center gap-2 px-6 py-3"
          >
            <Icono icono={BuildingStorefrontIcon} tamano="chico" /> Ver mi negocio
          </Link>
        </div>
      )}

      {publicado && resenas.isLoading && <Cargando texto="Cargando tus reseñas…" />}
      {publicado && resenas.isError && (
        <ErrorRecargar mensaje={mensajeDeApi(resenas.error)} onReintentar={() => resenas.refetch()} />
      )}
      {publicado && resenas.data && resenas.data.resenas.length === 0 && (
        <Vacio>
          Todavía no tenés reseñas. Cuando tus clientes califiquen tu negocio, aparecen acá.
        </Vacio>
      )}
      {publicado && resenas.data && resenas.data.cantidad > 0 && (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-b border-t border-tinta-cafe/10 py-3">
          <div>
            <dt className="text-xs text-texto-suave">Promedio</dt>
            <dd className="flex items-center gap-2">
              {resenas.data.promedio != null ? (
                <>
                  <span className="font-display text-cifra-menor leading-none">
                    {resenas.data.promedio.toFixed(1).replace('.', ',')}
                  </span>
                  <Icono
                    icono={StarIcon}
                    tamano="chico"
                    className="text-oro-cosecha"
                    etiqueta={`${resenas.data.promedio.toFixed(1).replace('.', ',')} de 5 estrellas`}
                  />
                </>
              ) : (
                <span className="text-sm text-texto-suave">Sin dato</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-suave">Reseñas</dt>
            <dd className="text-sm font-semibold">{resenas.data.cantidad}</dd>
          </div>
        </dl>
      )}
      {publicado && resenas.data && resenas.data.resenas.length > 0 && (
        <ul className="mt-2 divide-y divide-tinta-cafe/10 border-b border-tinta-cafe/10">
          {resenas.data.resenas.map((r) => (
            <FilaResena key={r.id} resena={r} />
          ))}
        </ul>
      )}
    </main>
  );
}

function FilaResena({ resena }: { resena: Resena }) {
  const cliente = useQueryClient();
  const [reportando, setReportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportar = useMutation({
    mutationFn: (motivo: string) => reportarResena(resena.id, motivo),
    onSuccess: async () => {
      setReportando(false);
      setError(null);
      await cliente.invalidateQueries({ queryKey: ['resenas', resena.negocioId] });
    },
    onError: (e) => setError(mensajeDeApi(e))
  });

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{resena.clienteNombre}</span>
        <Estrellas valor={resena.calificacion} etiqueta={`${resena.calificacion} de 5 estrellas`} />
        {resena.verificada && (
          <span className="inline-flex items-center gap-1 rounded-campo bg-primario-claro px-2 py-0.5 text-sm text-exito">
            <Icono icono={CheckBadgeIcon} tamano="chico" /> Compra verificada
          </span>
        )}
        {!resena.visible && (
          <span className="inline-flex items-center gap-1 rounded-campo bg-texto-suave/10 px-2 py-0.5 text-sm text-texto-suave">
            <Icono icono={EyeSlashIcon} tamano="chico" /> Ocultada por TRINA
          </span>
        )}
      </div>
      <p className="mt-1">{resena.comentario}</p>
      <p className="mt-1 text-sm text-texto-suave">{fecha(resena.creadoEn)}</p>

      {resena.reportada ? (
        <p className="mt-2 flex items-start gap-1 text-sm font-semibold text-advertencia">
          <Icono icono={FlagIcon} tamano="chico" className="mt-0.5" />
          <span>
            Reportada{resena.motivoReporte ? `: ${resena.motivoReporte}` : ''}. El equipo de TRINA la está
            revisando.
          </span>
        </p>
      ) : (
        <button
          type="button"
          className="btn-secundario mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm"
          onClick={() => {
            setError(null);
            setReportando(true);
          }}
        >
          <Icono icono={FlagIcon} tamano="chico" /> Reportar reseña
        </button>
      )}

      <DialogoMotivo
        abierto={reportando}
        titulo="¿Reportar esta reseña?"
        descripcion={`Vas a reportar la reseña de ${resena.clienteNombre}. Contanos por qué no corresponde.`}
        textoConfirmar="Reportar reseña"
        peligro={false}
        guardando={reportar.isPending}
        error={error}
        onCerrar={() => {
          setReportando(false);
          setError(null);
        }}
        onConfirmar={(motivo) => reportar.mutate(motivo)}
      />
    </li>
  );
}
