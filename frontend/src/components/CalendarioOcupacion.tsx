const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const aISO = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Mini calendario mensual que marca en oscuro los días ya reservados. */
export function CalendarioOcupacion({
  ocupadas,
  anio,
  mes,
  minISO,
  onMes
}: {
  /** Fechas ISO (YYYY-MM-DD) ocupadas. */
  ocupadas: Set<string>;
  anio: number;
  mes: number;
  /** No permite ver meses anteriores a este ISO. */
  minISO?: string;
  onMes: (anio: number, mes: number) => void;
}) {
  const primero = new Date(anio, mes, 1);
  // La semana empieza en lunes: 0 = lunes.
  const desfase = (primero.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const anterior = mes === 0 ? { anio: anio - 1, mes: 11 } : { anio, mes: mes - 1 };
  const siguiente = mes === 11 ? { anio: anio + 1, mes: 0 } : { anio, mes: mes + 1 };
  const puedeAtras = !minISO || aISO(anterior.anio, anterior.mes, 1) >= minISO.slice(0, 7) + '-01' || `${anterior.anio}-${String(anterior.mes + 1).padStart(2, '0')}` >= minISO.slice(0, 7);

  return (
    <div className="rounded-2xl border border-oliva/10 bg-fondo p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMes(anterior.anio, anterior.mes)}
          disabled={!puedeAtras}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-oliva hover:bg-oliva/10 disabled:opacity-30"
        >
          ‹
        </button>
        <p className="font-display text-lg font-bold" aria-live="polite">
          {MESES[mes]} {anio}
        </p>
        <button
          type="button"
          onClick={() => onMes(siguiente.anio, siguiente.mes)}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full text-oliva hover:bg-oliva/10"
        >
          ›
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Disponibilidad de ${MESES[mes]} ${anio}`}>
        {DIAS.map((d) => (
          <span key={d} className="pb-1 text-xs font-bold uppercase text-texto-suave">
            {d}
          </span>
        ))}
        {Array.from({ length: desfase }).map((_, i) => (
          <span key={`vacio-${i}`} />
        ))}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1;
          const iso = aISO(anio, mes, dia);
          const ocupado = ocupadas.has(iso);
          const pasado = minISO != null && iso < minISO;
          return (
            <span
              key={iso}
              role="gridcell"
              aria-label={`${dia} de ${MESES[mes]}${ocupado ? ', reservado' : ''}`}
              className={`flex aspect-square items-center justify-center rounded-full text-sm ${
                ocupado
                  ? 'bg-oliva font-bold text-white'
                  : pasado
                    ? 'text-texto-suave/40'
                    : 'bg-white text-oliva'
              }`}
            >
              {dia}
            </span>
          );
        })}
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-texto-suave">
        <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-oliva" />
        Días en oscuro ya están reservados: elige otras fechas.
      </p>
    </div>
  );
}
