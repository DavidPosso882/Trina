# TRINA — Dirección visual propia + iconos Heroicons

> Implementación del plan visual aprobado: sistema de tokens, iconos vectoriales, rediseño de pantallas clave. Sin cambios de backend, flujos ni endpoints.

## Specs

- S1. Tokens con nombre: fondo blanco mercado `#FFFFFF` (se jubila el crema `#FFFBF4`), tinta café `#2B2118` (texto, reemplaza el slate), bosque `#1B6B47` como superficie protagonista, bosque-profundo `#0E3B28`, terracota `#B3472A` solo para precio/CTA/destacado, oro cosecha `#E9A13B` en dosis mínimas (estrellas, insignias).
- S2. Tipografía: Inter queda para cuerpo/UI; display nuevo **Archivo** 700–900 con tracking apretado, solo headlines, precios y cifras grandes. Escala tipográfica tokenizada (se eliminan los `text-[Npx]` arbitrarios).
- S3. Layout: se rompe el card-kit (`rounded-tarjeta+shadow` uniforme). Lista como filas editoriales con foto grande + precio/distancia en cifras oversize; tarjetas solo donde el encajonado da confianza (pedido, pago, formularios); sombras fuera, hairlines adentro. Héroe de portada: mini-mapa vivo con pines "abierto ahora" (la única audacia).
- S4. Copy: se unifica el verbo a **"Agregar"** en todo el flujo de pedido (hoy: "Hacer pedido" → "Agregar" → "Ver mi pedido" → "Continuar con el pedido"). Voseo, voz activa y accesibilidad (48px, foco visible, icono+texto) intactos.
- S5. Iconos: **"cambies los emojis generados por la IA, por iconos vectorizados elegantes (puedes usar los de https://heroicons.com/)"**. Reemplazo sistemático emoji→Heroicons (outline/solid 24px) en toda la UI, manteniendo siempre texto junto al icono. Vía preferida `@heroicons/react`; fallback: SVGs vendorados locales si no hay red/npm. 🟢/🔴 de estado pasan a dot CSS, ⭐ a Star sólida oro.
- S6. Lo que NO se toca: backend, flujos, endpoints, voseo, motion actual (solo user-triggered), inexistencia de tests UI (verificación: `tsc --noEmit` 0 + `vite build` OK tras cada tarea).

## Tasks

- T1 — S1/S2/S5-base/S6 — worker — `frontend/tailwind.config.js, frontend/index.html, frontend/src/index.css, frontend/src/components/*` — commit: pendiente autorización
- T2 — S3-portada/explorar/perfil/S4-parcial — worker (tras T1) — `frontend/src/pages/Inicio.tsx, frontend/src/pages/Explorar.tsx, frontend/src/pages/PerfilNegocio.tsx, frontend/src/components/Mapa.tsx` — commit: pendiente autorización
- T3 — S4-resto/S5-resto — worker (tras T2) — resto de `frontend/src/pages/**` (panel, admin, carrito, pedido, reservas, cuenta, auth) + `frontend/src/App.tsx` (shell: saludo + nav inferior) + `frontend/src/lib/estados.ts` y `frontend/src/lib/notificaciones.ts` (los strings emoji del lib se reemplazan acá, no página por página) — commit: pendiente autorización

## Log

- L1 (usuario, 13 oct 2026): "Continúa desarrollando el proyecto Trina"
- L2 (usuario, 13 oct 2026): "lo apruebo, pero también necesito que cambies los emojis generados por la IA, por iconos vectorizados elegantes (puedes usar los de https://heroicons.com/)"
- L3 (decisión): dirección "letrero de plaza" aprobada con Archivo como display; iconos Heroicons preferidos con fallback a SVG local; sin commits sin autorización explícita (regla de seguridad vigente).
- L4 (auditoría, evidencia): tokens en `tailwind.config.js:11-31` + `index.css:6-50`; card-kit en Inicio/Explorar/Perfil/Estados/NavPanel; tells presentes (crema+terracota, card-kit, `—`, middots funcionales, 1 ALL-CAPS, monospace justificado); ausentes (motion spam, eyebrows, palabra acentuada, gradientes); inconsistencia "Hacer pedido/Agregar/Ver mi pedido/Continuar".
- L5 (T1 verificado, 13 oct 2026): worker con `tsc` 0 + `build` OK; spot-check orquestador (config, `Icono.tsx`, scan 0 emojis en `components/`). Decisión: `lib/estados.ts` y `lib/notificaciones.ts` conservan emojis → entran al surface de T3. En componentes compartidos el verbo ya era "Agregar"; la unificación resta en pages (T2/T3).
- L6 (T2 verificado, 13 oct 2026): worker con `tsc` 0 + `build` OK en 2.32s; spot-check orquestador (0 emojis, 0 `text-[Npx]`, 0 middots en las 3 páginas). Héroe bosque-profundo + mini-mapa lazy + filas editoriales + hairlines + Star oro + "Agregar". `Mapa.tsx` intacto (base T1 suficiente). Gaps conocidos: Explorar sin fotos (evita N+1; foto en lista requeriría backend), "Distancia: Sin dato" visible cuando no hay coords (decidir si ocultar).
- L7 (T3, decisión orquestador): "A: incluir App.tsx" — el shell (saludo 👋 + nav 🏠🔍🧾👤) entra al surface para cumplir S5 en toda la UI. `.tarjeta-negocio` de `index.css` NO se elimina (la usa `components/negocio/EditorFotos.tsx`, fuera de surface); en archivos del surface se reemplaza su uso por hairlines/filas.
- L8 (T3 verificado, 13 oct 2026): worker con `tsc` 0 + `build` OK en 3.41s (lib con contrato clave→icono, 10 consumidores, App.tsx vectorizado, S4-remate con "Agregar"); orquestador fijó el middot restante del popup de `Mapa.tsx` y reverificó (0 emojis visibles, 0 `text-[Npx]`, `tsc` 0, `build` OK en 3.66s). Restos conocidos: campo `icono` huérfano en `CategoriasAdmin` (decisión de producto), fotos en Explorar requieren backend, CTA de paso conservan "Continuar/Confirmar" (dicen lo que hacen).
- L9 (pausa 13 oct 2026): `trina-ui-review.zip` entregado para revisión externa; servidores dados de baja (volumen `trina_pgdata_dev` con demo intacto); repo sigue untracked sin commits. Al retomar: E5 pendiente (usabilidad, Lighthouse, Playwright, cobertura, restauración, SMTP, P-01…P-07) + micro-decisiones visuales (Sin dato, icono huérfano, fotos Explorar) + commits por unidad si el usuario autoriza.
