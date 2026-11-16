# Admin Bento v2 — sidebar oscuro con pestaña recortada + héroes + dona
Objetivo: sidebar bosque sólido con cutout invertido, KPIs héroe con degradado, cola con avatares y dona de estados; revisar y corregir elementos mal puestos. Branch: Daniela_Trina. Delivery: single. Tests: `tsc --noEmit` + `npm run build`.

## Specs
- S1: "transforma la barra lateral izquierda en un panel sólido en verde bosque oscuro (bg-[#1A2218] text-white rounded-3xl py-6 pl-5 pr-0 shadow-xl flex flex-col justify-between)" con logo Trina + EXPLORAR lima arriba.
- S2: "al hacer clic sobre cualquiera de las opciones la opción activa toma el color del lienzo principal (bg-[#F8F9FA] text-[#1A2218] font-bold rounded-l-full py-3 px-4 relative) fusionándose hacia la derecha mediante pseudo-elementos (before y after con curvas exteriores suaves) mientras su ícono resalta dentro de un círculo verde menta/lima (bg-[#F0FDF4] text-[#94B839]) y las opciones inactivas permanecen en blanco translúcido (text-white/75 hover:text-white)".
- S3: "tarjetas con sombras definidas (rounded-3xl shadow-md border border-gray-200/70)", "indicadores principales ('Negocios: 19' y 'Comisiones: $0') en tarjetas protagonistas con degradado verde bosque oscuro (bg-gradient-to-br from-[#1A2218] to-[#293526] text-white) y acentos en verde lima (#94B839)", resto en blancas con íconos en #F0FDF4 y cifras en #1A2218.
- S4: "'Cola de revisión' como tarjeta blanca elevada con filas estilizadas que integran avatares circulares en #F0FDF4/#94B839" + Revisar → en #1A2218; "'Negocios por estado' en tarjeta con gráfico de anillo (donut chart) en verde bosque (#1A2218) y verde lima (#94B839) que muestre el total en el centro junto a las etiquetas y botones 'Ver →' de 'Publicado (18)' y 'En revisión (1)'".
- S5: "revisa que algunos elementos estan mal puestos" — auditar shell admin y corregir (overflow tabla en móvil, dropdowns, espaciados, solapes con nav inferior).

## Tasks
- T1 (S1+S2, inline): sidebar oscuro + cutout invertido (CSS) + colapso. Route: inline. Status: pending.
- T2 (S3+S4, inline): Resumen v2 (héroes, KPIs, cola avatares, dona). Route: inline. Status: pending.
- T3 (S5, inline): corrección de elementos mal puestos. Route: inline. Status: pending.
- T4 (S1-S5, checks): tsc + build + revisión. Route: inline. Status: pending.

## Log
- L1: brief v2 verbatim del usuario (reemplaza sidebar claro v1).
- L2: cutout con ::before/::after + box-shadow en index.css (Tailwind arbitrary frágil para esa geometría); dona con conic-gradient dinámico + lista accesible (no solo color); sin datos inventados.
- L3: implementado T1-T3, tsc 0 + build OK. T3 corrigió scroll del rail (flex min-h-0) y verificó wrappers/paddings/dropdown/bottom-pill del resto de páginas admin. Sin commits.
- L4: revertida la v3 a pedido (quedó horrible) — vuelve la v2. tsc 0 + build OK, web-dev reiniciado. Sin commits.
- L5: fix cutout v2 — radial-gradient exacto anclado a la esquina, gap-0 entre opciones, pseudos siempre renderizados con fundido de opacidad 200ms + transition-all en el link. tsc 0 + build OK, web-dev reiniciado.
- L6: cutout radial 18px delicado (sin desplazamientos), eliminado botón colapsable (se confundía con Volver) + fade de página 200ms al cambiar de sección. tsc 0 + build OK, web-dev reiniciado.
