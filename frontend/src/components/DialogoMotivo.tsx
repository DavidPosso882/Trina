import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Dialogo } from './Dialogo';
import { Icono } from './Icono';

/**
 * Diálogo de confirmación con motivo obligatorio (§5.3): resume la acción, pide el motivo y
 * usa botones con verbos ("Rechazar pedido"). Se usa en PM-07/PM-08 y en la revisión admin.
 */
export function DialogoMotivo({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  peligro = true,
  guardando = false,
  error,
  onCerrar,
  onConfirmar
}: {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  peligro?: boolean;
  guardando?: boolean;
  error?: string | null;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setMotivo('');
      setErrorLocal(null);
    }
  }, [abierto]);

  const confirmar = () => {
    if (motivo.trim().length < 5) {
      setErrorLocal('Contanos el motivo (mínimo 5 letras).');
      return;
    }
    setErrorLocal(null);
    onConfirmar(motivo.trim());
  };

  const mensaje = errorLocal ?? error ?? null;

  return (
    <Dialogo abierto={abierto} titulo={titulo} onCerrar={onCerrar}>
      <p>{descripcion}</p>
      <label htmlFor="motivo-dialogo" className="mt-3 block font-semibold">
        Motivo
      </label>
      <textarea
        id="motivo-dialogo"
        rows={3}
        className="campo mt-1"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        aria-describedby="motivo-ayuda motivo-error"
      />
      <p id="motivo-ayuda" className="mt-1 text-sm text-texto-suave">
        Esta nota queda guardada y la ve la otra parte.
      </p>
      {mensaje && (
        <p id="motivo-error" role="alert" className="mt-1 flex items-start gap-2 font-semibold text-error">
          <Icono icono={ExclamationTriangleIcon} tamano="chico" className="mt-1" />
          <span>{mensaje}</span>
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className={peligro ? 'btn-peligro px-4 py-3' : 'btn-principal px-4 py-3'}
          disabled={guardando}
          onClick={confirmar}
        >
          {guardando ? 'Guardando…' : textoConfirmar}
        </button>
        <button type="button" className="btn-secundario px-4 py-3" onClick={onCerrar}>
          Volver
        </button>
      </div>
    </Dialogo>
  );
}
