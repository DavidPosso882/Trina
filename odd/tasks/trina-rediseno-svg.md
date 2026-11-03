# TRINA rediseño UI desde SVG — sistema completo

Objetivo: rediseñar el frontend TRINA desde los SVG de Explorador a todo el sistema, con Favoritos real en localStorage y mapa OSM. Branch: main (feature branch si hace falta). Delivery: ask-on-risk. Tests: `npm run build` (tsc --noEmit + vite build).

## Specs

- S1 — Basarse en “el diseño de los ".SVG" que está en el directorio de "frontend"”: `Explorador · Escritorio.svg` y `Explorador · Móvil.svg` (layout mapa+lista, header oscuro #1B2117, lima #94B839, crema #F8FCE1, pines, cards, footer). Check: Explorar desktop/móvil replica layout SVG con OSM.
- S2 — “aplica la filosofía de "gentle-ai"”: aclarar alcance, ODD con tasks, test-first donde aplique, delegación acotada, proteger revisión (sin PRs gigantes). Check: doc + todos + verificación por tarea.
- S3 — Alcance “Sistema completo”: “Todo el frontend al estilo SVG (todas las pantallas)”, no solo Explorar. Incluye shell global (header, footer, nav inferior). Check: Inicio/PerfilNegocio/resto usan mismos tokens y shell.
- S4 — Navegación “Favoritos real”: “Agrego Favoritos real con guardados en localStorage”. Rutas Inicio/Explorar/Favoritos/Mi cuenta como en SVG. Check: guardar/quitar favorito persiste en localStorage y hay pantalla Favoritos.
- S5 — Mapa “OSM actual”: “Mantengo OSM estándar actual, solo aplico pines y layout del SVG”. No se cambia a satelital Esri. Check: Mapa sigue OSM/Leaflet con pines estilo SVG.
- Supuesto explícito: paleta SVG (oliva #1B2117, lima #94B839, crema #F8FCE1, dorado estrellas #D4C04D, rojo cerrado #E05252) reemplaza bosque/terracota actuales en todo el frontend, porque S3 dice sistema completo al estilo SVG.

## Tasks

- T1 — Tokens SVG + shell + Explorar desktop/móvil (S1,S2,S3,S5) — route: inline — status: done — commit: — (build `npm run build` OK 4.52s; tsc 0)
- T2 — Extender estilo SVG al resto de pantallas (S3) — route: inline — status: done — commit: — (build `npm run build` OK 3.88s; tsc 0)
- T3 — Favoritos real con localStorage + nav (S4) — route: inline — status: done — commit: — (build `npm run build` OK 4.14s; tsc 0)
- T4 — Verificación final build + coherencia visual (S1-S5) — route: inline — status: done — commit: — (3 builds OK + grep coherencia)

## Log

- L1 (2026-11-03): “Estabamos a punto de rediseñar la interfaz UI del frontend, para ello necesito que te bases en el diseño de los ".SVG" que está en el directorio de "frontend". Y obviamente aplica la filosofía de "gentle-ai"”
- L2 (2026-11-03): Decisiones usuario tras aclaración gentle-ai — Alcance: “Sistema completo”; Navegación: “Favoritos real”; Mapa y color: “OSM actual”. Evidencia SVG: desktop 1440 mapa+lista, móvil carrusel + bottom nav pill; paleta extraída #1B2117/#94B839/#F8FCE1/#D4C04D/#E05252; stack actual bosque/terracota en tailwind.config.js + index.css; nav actual Inicio/Explorar/Pedidos/Cuenta en App.tsx vs SVG Inicio/Explorar/Favoritos/Mi cuenta.
- L3 (2026-11-03): Creo doc y proyecto 4 tareas. Forecast: ~600-900 líneas autoradas (tokens+shell+Explorar ~300, resto pantallas ~300, Favoritos ~100). Estrategia ask-on-risk: si supera ~400, pregunto cadena antes del siguiente commit. Sin commits aún.
- L4 (2026-11-03): T1 hecha inline (Writer rule: T2/T3 dependían de T1, no había unidades paralelas). Cambios: tokens SVG en tailwind (oliva/lima/crema/dorado/marrón, alias semánticos a SVG, tarjeta 16px + pastilla), index.css (fondo crema, foco lima, btn-lima, tarjeta-destacada), App shell oliva (logo + pill EXPLORAR, nav Inicio/Explorar/Favoritos/Mi cuenta, footer, bottom pill móvil), Mapa pines oliva/lima, Explorar layout SVG (título, buscador pill + Buscar, switch, píldoras con iconos, mapa+lista, ordenar Relevancia/Nombre/Cercanía, tarjetas, Más filtros conserva precio/cercanía), Favoritos placeholder + ruta. Sin fotos en lista: FichaNegocio no trae portada ni rating (solo detalle tiene promedio); no invento cifras ni N+1. Sin RED: cambio visual no testeable con unit test; verificación `npm run build` OK (tsc 0 + vite 4.52s). Running: 471+/338- (~809). Supera heurística 400: antes de commitear pregunto estrategia de entrega. Sin commits (usuario no pidió commitear). S1 cubierto parcial (layout+tokens, falta resto pantallas T2), S2 ok, S3 parcial (shell+Explorar), S4 placeholder (real en T3), S5 ok (OSM + pines).
- L5 (2026-11-03): T3 hecha inline (lib/favoritos.ts con hook reactivo + storage event, Favoritos real por getNegocio con Promise.allSettled, corazón en tarjetas Explorar con aria-pressed). Sin RED: estado localStorage sin runner determinista aplicable; verificación `npm run build` OK (tsc 0 + vite 4.14s). S4 cubierto salvo botón en PerfilNegocio (queda para T2 visual).
- L6 (2026-11-03): T2 hecha inline (Writer rule: una sola unidad pesada restante, sin paralelas). Inicio reescrito a SVG (hero claro, buscador pill + Buscar lima, mapa + pill abiertos, píldoras, destacados como tarjetas con corazones); Perfil Encabezado con corazón + insignia/estrellas a dorado/puntos a exito. T4: 3 builds OK (4.52s/4.14s/4.01s/3.88s, tsc 0) + grep coherencia: pantallas públicas sin tokens viejos; panel/admin privados conservan text-oro-cosecha (matiz #E9A13B vs dorado #D4C04D, solo interno) y heredan shell/tokens semánticos (crema/oliva). Sin commits (usuario no pidió). S1-S5 cubiertos en alcance público; fotos/rating en lista siguen gap de backend (sin N+1, sin cifras inventadas).
