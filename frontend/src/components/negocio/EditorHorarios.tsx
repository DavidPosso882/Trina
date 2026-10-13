import type { Franja } from '../../lib/api';
import {
  DocumentDuplicateIcon,
  NoSymbolIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Icono } from '../Icono';

const DIAS = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 7, nombre: 'Domingo' }
];

/** El backend puede devolver "08:00:30"; en la grilla mostramos HH:mm. */
export function horaCorta(hora: string): string {
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

export function normalizarFranjas(franjas: Franja[]): Franja[] {
  return franjas.map((f) => ({
    diaSemana: f.diaSemana,
    abre: horaCorta(f.abre),
    cierra: horaCorta(f.cierra)
  }));
}

/** Devuelve el primer problema que impide guardar, o null si la grilla está bien. */
export function problemasDeHorarios(franjas: Franja[]): string | null {
  for (const f of franjas) {
    if (!f.abre || !f.cierra) return 'Completá la hora de apertura y la de cierre en cada franja.';
    if (f.abre === f.cierra) return 'En una franja, la apertura y el cierre no pueden ser la misma hora.';
  }
  return null;
}

function agrupar(franjas: Franja[]): Record<number, Franja[]> {
  const mapa: Record<number, Franja[]> = {};
  for (const d of DIAS) mapa[d.numero] = [];
  for (const f of franjas) {
    if (mapa[f.diaSemana]) mapa[f.diaSemana].push(f);
  }
  return mapa;
}

/**
 * Grilla Lun–Dom de franjas (RF-13) compartida por el asistente (PM-02) y Horarios (PM-04).
 * Un día sin franjas queda cerrado. Es controlada: quien la usa guarda al confirmar el paso.
 */
export function EditorHorarios({
  franjas,
  onCambiar,
  deshabilitado = false
}: {
  franjas: Franja[];
  onCambiar: (franjas: Franja[]) => void;
  deshabilitado?: boolean;
}) {
  const mapa = agrupar(franjas);
  const aplanar = (m: Record<number, Franja[]>) => DIAS.flatMap((d) => m[d.numero]);

  const cambiarDia = (dia: number, filas: Franja[]) => {
    const m = agrupar(franjas);
    m[dia] = filas;
    onCambiar(aplanar(m));
  };
  const agregar = (dia: number) =>
    cambiarDia(dia, [...mapa[dia], { diaSemana: dia, abre: '08:00', cierra: '18:00' }]);
  const quitar = (dia: number, indice: number) =>
    cambiarDia(
      dia,
      mapa[dia].filter((_, i) => i !== indice)
    );
  const editarHora = (dia: number, indice: number, campo: 'abre' | 'cierra', valor: string) =>
    cambiarDia(
      dia,
      mapa[dia].map((f, i) => (i === indice ? { ...f, [campo]: valor } : f))
    );
  const copiarATodos = (dia: number) => {
    const m = agrupar([]);
    for (const d of DIAS) m[d.numero] = mapa[dia].map((f) => ({ ...f, diaSemana: d.numero }));
    onCambiar(aplanar(m));
  };
  const plantilla = (dias: number[]) => {
    const m = agrupar(franjas);
    for (const d of dias) m[d] = [{ diaSemana: d, abre: '08:00', cierra: '18:00' }];
    onCambiar(aplanar(m));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-texto-suave">Atajos:</span>
        <button
          type="button"
          className="btn-secundario px-3 py-2 text-sm"
          onClick={() => plantilla([1, 2, 3, 4, 5])}
          disabled={deshabilitado}
        >
          Lunes a viernes, 8:00 a 18:00
        </button>
        <button
          type="button"
          className="btn-secundario px-3 py-2 text-sm"
          onClick={() => plantilla([1, 2, 3, 4, 5, 6, 7])}
          disabled={deshabilitado}
        >
          Todos los días, 8:00 a 18:00
        </button>
      </div>
      <p className="text-sm text-texto-suave">
        Podés cargar varias franjas por día (por ejemplo, cerrar al mediodía). Un día sin franjas queda
        como cerrado.
      </p>

      {DIAS.map((dia) => {
        const filas = mapa[dia.numero];
        return (
          <fieldset key={dia.numero} className="rounded-campo border-2 border-black/10 bg-superficie p-3">
            <legend className="px-2 font-semibold">{dia.nombre}</legend>
            {filas.length === 0 ? (
              <p className="flex items-center gap-2 text-texto-suave">
                <Icono icono={NoSymbolIcon} tamano="chico" />
                Cerrado
              </p>
            ) : (
              <div className="space-y-2">
                {filas.map((f, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`franja-${dia.numero}-${i}-abre`}>
                      Hora de apertura del {dia.nombre.toLowerCase()}
                    </label>
                    <input
                      id={`franja-${dia.numero}-${i}-abre`}
                      type="time"
                      required
                      className="campo w-32"
                      value={f.abre}
                      onChange={(e) => editarHora(dia.numero, i, 'abre', e.target.value)}
                      disabled={deshabilitado}
                    />
                    <span aria-hidden="true">a</span>
                    <label className="sr-only" htmlFor={`franja-${dia.numero}-${i}-cierra`}>
                      Hora de cierre del {dia.nombre.toLowerCase()}
                    </label>
                    <input
                      id={`franja-${dia.numero}-${i}-cierra`}
                      type="time"
                      required
                      className="campo w-32"
                      value={f.cierra}
                      onChange={(e) => editarHora(dia.numero, i, 'cierra', e.target.value)}
                      disabled={deshabilitado}
                    />
                    <button
                      type="button"
                      className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                      onClick={() => quitar(dia.numero, i)}
                      disabled={deshabilitado}
                      aria-label={`Quitar franja del ${dia.nombre.toLowerCase()}`}
                    >
                      <Icono icono={TrashIcon} tamano="chico" />
                      <span aria-hidden="true">Quitar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                onClick={() => agregar(dia.numero)}
                disabled={deshabilitado}
              >
                <Icono icono={PlusIcon} tamano="chico" />
                Agregar franja
              </button>
              {filas.length > 0 && (
                <>
                  <button
                    type="button"
                    className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                    onClick={() => copiarATodos(dia.numero)}
                    disabled={deshabilitado}
                  >
                    <Icono icono={DocumentDuplicateIcon} tamano="chico" />
                    Copiar a todos los días
                  </button>
                  <button
                    type="button"
                    className="btn-secundario inline-flex items-center gap-2 px-3 py-2 text-sm"
                    onClick={() => cambiarDia(dia.numero, [])}
                    disabled={deshabilitado}
                  >
                    <Icono icono={NoSymbolIcon} tamano="chico" />
                    Marcar cerrado
                  </button>
                </>
              )}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
