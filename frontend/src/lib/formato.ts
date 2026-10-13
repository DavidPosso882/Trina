/** Formato de precios, fechas y días en es-CO con zona America/Bogota (RF-26, RNF-11). */

const ZONA = 'America/Bogota';

export const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const diaDeSemana = (numero: number): string => DIAS[numero] ?? `Día ${numero}`;

/** Precio en pesos colombianos sin decimales: $ 9.500 */
export function precio(cop: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(cop);
}

/** Fecha y hora cortas: 8 oct, 2:30 p. m. */
export function fechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: ZONA
  }).format(new Date(iso));
}

/** Solo la fecha: 8 oct 2026 */
export function fecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: ZONA }).format(
    new Date(iso)
  );
}

/** Solo la hora: 2:30 p. m. */
export function hora(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA
  }).format(new Date(iso));
}

/** Fecha exacta de hoy en Bogotá como YYYY-MM-DD para inputs date y la disponibilidad. */
export function fechaDeHoy(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/** Hora del final de una franja ("15:00") a partir del ISO que devuelve el servidor. */
export function horaDeFranja(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA
  }).format(new Date(iso));
}
