Objetivo: unificar el panel admin con el diseño de Resumen. Rama: Daniela_Trina. Estrategia: ask-on-risk, un solo slice. Checks: `npm run build` en frontend.

## Specs
- S1: "necesito que el panel de administrador apliques el diseño de la ventana "resumen" a todas las demas para manteer la consistencia de diseño" — todas las rutas de `/admin/*` usan el mismo lenguaje que `ResumenAdmin.tsx`: `main.pb-20.pt-2` sin `mx-auto/max-w`, cabecera `h1.text-2xl.font-bold.text-[#1A2218]` + subtítulo `text-sm.text-gray-500`, cards `rounded-3xl.border-gray-200/70.bg-white.shadow-md`, listas `rounded-2xl.bg-[#F8F9FA]`, botones `rounded-full.bg-[#1A2218].text-white` y lima `bg-[#94B839]`.
- S2: No cambiar lógica ni datos: solo clases/layout visual en `NegociosAdmin`, `UsuariosAdmin`, `CategoriasAdmin`, `ParametrosAdmin`, `ResenasAdmin`, `AuditoriaAdmin`, `AltaAsistida`. Mantener queries, mutaciones, filtros y diálogos.
- S3: Verificación: `npm run build` en `frontend/` en verde y `docker compose ps` con `api` healthy si se corre.

## Tasks
- T1 (S1,S2): NegociosAdmin + AltaAsistida embebida — route: inline — status: done — commit: sin-commit, build verde 2026-11-16
- T2 (S1,S2): UsuariosAdmin — route: inline — status: done — commit: sin-commit, build verde 2026-11-16 (fix botón Ver RUT)
- T3 (S1,S2): Categorías + Reseñas — route: inline — status: done — commit: sin-commit, build verde 2026-11-16
- T4 (S1,S2): Parámetros + Auditoría — route: inline — status: done — commit: sin-commit, build verde 2026-11-16 (fix extra `>` en AuditoriaAdmin)
- T5 (S3): Verificación final build + cierre — route: inline — status: done — commit: `npm run build` verde (tsc + vite 1.42s, Admin-Bd1WpLoc.js 70.66 kB)

## Log
- L1 (2026-11-16): "necesito que el panel de administrador apliques el diseño de la ventana "resumen" a todas las demas para manteer la consistencia de diseño"
- L2 (2026-11-16): Build `npm run build` en verde tras fix UsuariosAdmin (onClick RUT) y AuditoriaAdmin (extra `>`). Sin cambios de lógica, solo clases/layout. Sin commit (no pedido).
