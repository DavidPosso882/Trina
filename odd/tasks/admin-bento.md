# Rediseño admin Bento — shell claro + sidebar + Resumen
Objetivo: panel admin limpio y unificado tipo Bento sobre lienzo claro, sin tocar lógica ni endpoints. Branch: Daniela_Trina. Delivery: single (un slice coherente). Tests: `tsc --noEmit` + `npm run build`.

## Specs
- S1: "elimina la barra superior oscura actual e integra el logotipo de Trina junto a su etiqueta 'EXPLORAR' en verde lima (#94B839) directamente en la cabecera de la barra lateral izquierda (w-64 bg-white border-r border-gray-100 p-5 flex flex-col justify-between relative), incluyendo un botón circular colapsable en el borde derecho"
- S2: "destacando la opción activa 'Resumen' en una cápsula sólida verde bosque oscuro (bg-[#1A2218] text-white rounded-full px-4 py-2.5 shadow-sm) con ícono en verde lima (#94B839), seguida por 'Negocios', 'Usuarios', 'Categorías', 'Parámetros y planes', 'Reseñas' y 'Auditoría' en gris suave, más 'Salir' en la base"
- S3: "en el área principal, organiza una cabecera despejada con el título 'Resumen' en verde bosque (text-2xl font-bold text-[#1A2218]) y subtítulo 'Cómo está TRINA hoy.' a la izquierda, acompañado a la derecha por botones circulares blancos de búsqueda y notificaciones (con punto indicador #94B839) junto a la tarjeta de perfil del administrador"
- S4: "además de una fila secundaria con un selector cápsula de periodo y el botón de acción principal '+ Nuevo registro' en verde lima brillante (bg-[#94B839] text-[#1A2218] font-extrabold rounded-full px-5 py-2.5 shadow-sm hover:bg-[#1A2218] hover:text-white transition-all)"
- S5: "distribuye las métricas clave ('Negocios: 19', 'Pedidos totales: 2', 'Comisiones: $0', 'Membresías activas: 1', 'Usuarios: 25' y 'No residentes: 0') en tarjetas KPI independientes de esquinas muy redondeadas (bg-white rounded-3xl border border-gray-100 p-5 shadow-sm) que incorporen un botón circular con flecha diagonal ↗ en su esquina superior derecha, cifras grandes en #1A2218 y etiquetas porcentuales en cápsulas verde menta pastel (bg-[#F0FDF4] text-[#1A2218] text-xs font-semibold px-2.5 py-0.5 rounded-full)"
- S6: "finaliza la zona inferior con dos módulos asimétricos de estilo Bento (rounded-3xl bg-white border border-gray-100 p-6 shadow-sm): a la izquierda, la tarjeta 'Cola de revisión' estructurada como tabla estilizada con encabezado en verde menta suave (bg-[#F0FDF4] rounded-2xl text-[#1A2218]) listando 'Vendedores por aprobar (0)' y 'Negocios por revisar (1)' con botones cápsula 'Revisar →' en #1A2218, y a la derecha, la tarjeta 'Negocios por estado' con flecha ↗ superior y barras de progreso gruesas redondeadas en verde bosque (#1A2218) y verde lima (#94B839) sobre pistas menta (#F0FDF4) para visualizar proporcionalmente 'En revisión (1)' y 'Publicado (18)' junto a sus botones cápsula 'Ver →'"
- S7: lienzo principal claro `bg-[#F8F9FA]`; shell compartido para las 7 páginas admin; móvil mantiene navegación horizontal con scroll (sin aplastar el rail); sin datos inventados.

## Tasks
- T1 (S1, inline): MarcoAdmin fondo claro full-width + App oculta header oscuro global solo en /admin. Route: inline. Status: pending.
- T2 (S1+S2, inline): NavAdmin sidebar w-64 colapsable + cápsula activa bosque + Salir en base + fallback móvil horizontal. Route: inline. Status: pending.
- T3 (S3+S4+S5+S6, inline): ResumenAdmin Bento (cabecera + KPIs + Cola tabla + Estados con barras). Route: inline. Status: pending.
- T4 (S1-S7, checks): tsc + build + revisión responsive/visual. Route: inline. Status: pending.

## Log
- L1: brief verbatim del usuario (rediseño admin Bento con clases exactas).
- L2: decisiones: gentle-design es solo mockups (no production) → se implementa directo con guía gentle-ui-design (composition + adaptive). Sin selector de periodo funcional (getAdminEstadisticas no acepta periodo; no se inventa): la fila secundaria lleva '+ Nuevo registro' → /admin/negocios (donde vive AltaAsistida). Cápsulas % solo con porcentajes reales computados (publicados, reparto por rol, no residentes); resto, contexto absoluto honesto. Campana se reutiliza (dropdown + punto). Sin commits.
- L3: implementado T1-T3. tsc 0 + build OK. Desvíos menores del brief: cápsulas con contexto honesto donde no hay % definible; Usuarios por rol se conserva como tercer módulo (no se elimina info); resto de páginas admin heredan shell claro sin cambios internos.
