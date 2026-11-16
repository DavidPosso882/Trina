# Admin v3 — shell full-height sin desbordes + cutout radial + sistema global
Objetivo: corregir remontados/desalineados/sobresalientes; sidebar pegado con cutout radial; transiciones suaves; mismo sistema de tarjetas en las 7 páginas admin. Branch: Daniela_Trina. Delivery: single. Tests: `tsc --noEmit` + `npm run build`.

## Specs
- S1: "pantalla raíz como contenedor Flexbox de pantalla completa sin desbordamientos (flex h-screen w-full overflow-hidden bg-[#F8F9FA])", sidebar "pegada al borde sin márgenes externos ni esquinas flotantes", "w-64 flex-shrink-0 bg-[#1A2218] text-white flex flex-col justify-between py-6 pl-4 pr-0 relative z-20".
- S2: pestaña activa "exactamente al borde derecho (right-0) con curvas cóncavas before y after mediante radial-gradient", "bg-[#F8F9FA] text-[#1A2218] font-bold rounded-l-full py-3 pl-4 pr-6 relative flex items-center gap-3 whitespace-nowrap", icono en círculo menta/lima, inactivas blanco translúcido; colapsar en "-right-3.5 top-7 z-30 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md".
- S3: "transiciones fluidas con Framer Motion (AnimatePresence con desvanecimiento suave de 250ms y layoutId animado en el selector del menú)".
- S4: principal "flex-1 h-screen overflow-y-auto p-6 lg:p-8 min-w-0", cabecera "flex flex-wrap items-center justify-between gap-4 mb-6" con buscador, notificaciones (campana + punto #94B839), tarjeta Administrador y "+ Nuevo registro" lima.
- S5: KPIs en "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" e inferiores en "grid-cols-1 lg:grid-cols-2 gap-5" con min-w-0 y overflow-hidden "para evitar que el gráfico de anillo, las filas o los botones se corten o se monten".
- S6: "este mismo sistema global de tarjetas blancas rounded-3xl, encabezados de tabla en verde menta (bg-[#F0FDF4]), buscadores tipo cápsula y botones en #94B839 y #1A2218 a todas las demás ventanas del panel".

## Tasks
- T1 (S1+S2, inline): root flex + sidebar pegado + cutout radial + colapso. Route: inline. Status: pending.
- T2 (S3, inline): transiciones 250ms + selector animado. Route: inline. Status: pending.
- T3 (S4+S5, inline): Resumen v3 (header, grids estrictas, sin recortes). Route: inline. Status: pending.
- T4 (S6, inline): sistema global en las 6 páginas admin restantes. Route: inline. Status: pending.
- T5 (S1-S6, checks): tsc + build + revisión. Route: inline. Status: pending.

## Log
- L1: brief v3 verbatim.
- L2: framer-motion NO está instalado → se implementa fade 250ms + transiciones con CSS (mismo resultado visual, cero dependencias nuevas); layoutId deslizante no existe sin la lib (el selector usa transition-colors + cutout). h-dvh disponible (Tailwind 3.4) para móvil.
- L3: implementado T1-T5, tsc 0 + build OK. Cutout radial verificado en CSS + sidebar; 7 páginas admin con main uniforme y tablas con thead menta; bounce del colapso sobre la divisoria (-right-3.5). Sin commits.
- L4: revertida la v3 a pedido (quedó horrible) — vuelve la v2 (sidebar flotante, cutout box-shadow, grids asimétricas, thead clásico). tsc 0 + build OK, web-dev reiniciado. Sin commits.
