import { z } from 'zod';

/** Esquema compartido de datos del negocio: asistente PM-02 y datos PM-03. */
export const esquemaNegocio = z
  .object({
    nombre: z.string().trim().min(2, 'Escribí el nombre de tu negocio (mínimo 2 letras)'),
    categoriaId: z.string().min(1, 'Elegí la categoría que mejor lo describe'),
    descripcion: z.string(),
    direccion: z.string(),
    latitud: z.string(),
    longitud: z.string(),
    telefono: z.string(),
    whatsapp: z.string()
  })
  .superRefine((v, ctx) => {
    const revisar = (valor: string, campo: 'latitud' | 'longitud', limite: number, ejemplo: string) => {
      if (valor.trim() === '') return;
      const n = Number(valor);
      if (!Number.isFinite(n) || n < -limite || n > limite) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [campo],
          message: `La ${campo} va entre -${limite} y ${limite}. Ej.: ${ejemplo}`
        });
      }
    };
    revisar(v.latitud, 'latitud', 90, '4.538600');
    revisar(v.longitud, 'longitud', 180, '-75.643300');
  });

export type ValoresNegocio = z.infer<typeof esquemaNegocio>;

/** Vacío no toca el campo guardado; con texto manda el valor limpio. */
export const textoOpcional = (v: string) => (v.trim() === '' ? undefined : v.trim());

/** Vacío no toca la coordenada; con número la convierte. */
export const numeroOpcional = (v: string) => (v.trim() === '' ? undefined : Number(v));
