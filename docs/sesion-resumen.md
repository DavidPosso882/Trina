# Resumen de sesión — Trina (frontend + backend)

Fecha: 8 de noviembre de 2026. Todo verificado con `tsc` limpio y tests del backend en verde.

## 1. Español neutro en toda la interfaz
- Barrido de voseo en `frontend/src` (tenés→tienes, querés→quieres, podés→puedes, mirá→mira, elegí→elige, revisá→revisa, contanos→cuéntanos, explorá→explora, hacé→haz, ingresá→ingresa, volvé→vuelve, acá→aquí, etc.).
- Barrido de mensajes del backend (`src/main`, 43 archivos: AuthDto, NegocioDto, ReservaDto, PedidoDto, PagoDto, ResenaDto, HorarioDto, ApiExceptionHandler, etc.) porque esos textos se muestran en pantalla (registro, login, errores).
- Tests actualizados en consecuencia (3 archivos). Tests corridos: ImagenController (9), HorarioController (8), NegocioRevision (7), CatalogoController (16) — todos en verde.

## 2. Fondo y sistema de diseño
- Fondo general gris neutro frío claro `#F8F9FA` (se quitó el crema `#EDEFE7` y el degradado menta).
- Clases nuevas en `frontend/src/index.css`: `.tarjeta-form` (blanca, radio 20px, sombra oliva abajo-derecha), `.campo` actualizado (borde fino, radio 12px, placeholder en cursiva), `.desplegable` (angosto con flecha a la derecha), `.btn-principal-md/.btn-secundario-md/.btn-peligro-md` (compactos 44px), `.chip-filtro`, `.fondo-limpio` (banda blanca a todo ancho en Inicio y Explorar), `.etiqueta-negocio` (nombre sobre el pin), `.animar-carrito` (sacudida cada 6s).
- Formularios de autenticación (Ingresar, Registro, Recuperar/Restablecer) con tarjeta y pie: secundaria a la izquierda, primaria a la derecha con flechas.
- "Crear cuenta" en la barra principal y (luego quitado del hero de Inicio por pedido).

## 3. Mapa fijo en Alcalá + puntos
- Centro `4.6736, -75.7825`, límites cerrados `[[4.60,-75.86],[4.74,-75.70]]` (casco + zona rural), zoom 14, controles abajo-izquierda, escala y botón "Volver a Alcalá".
- 5 pines por zona explorada (destacados primero), popup con lista; a zoom ≥15 el nombre va sobre el punto.
- Pines en verdes de marca: normal `#5A8A0A`, destacado `#94B839`; punto de referencia azul.
- La búsqueda de mapa pide cercanos a Alcalá (`lat/lng + radioKm 15, orden cercanía`).

## 4. Negocios de prueba (DB local)
- 7 negocios reales de Alcalá creados vía API admin (`APROBADO`) + 1 choricería + 4 más + 1 de comerciante de prueba = 12 visibles + Café Central Alcalá.
- 6 abiertos (06:00–23:59) y 6 cerrados (08:00–12:00) para probar ambos estados.
- Los 4 del seed fuera de Alcalá (Armenia, Salento, Filandia, Montenegro) pasaron a `SUSPENDIDO`.
- 12 ítems de catálogo con foto que se crearon para probar se dieron de baja por pedido (catálogos vacíos de nuevo).
- Cuentas de prueba (rol COMERCIANTE, negocio APROBADO; usan la clave demo estándar del entorno local): `gloria@`, `puerta@`, `polos@`, `simona@`, `guadua@`, `cielo@`, `saman@`, `choriceria@`, `paisas@`, `porvenir@`, `tamal@`, `bambu@`, `comerciante.prueba@trina.local` (todos `@trina.local`).

## 5. Botones, layout y navegación
- Botones normalizados (44–48px táctil, sin desbordes) y tablas con scroll horizontal.
- Grilla de Explorar corregida (`44fr/56fr`, `min-w-0`, `overflow-x-clip`) — era la que sacaba contenido y mostraba franja lateral.
- Footer fijo al final (flex columna), página 404 amable, header con "Mi negocio" para comerciantes (barra + Mi cuenta).
- Flecha de volver junto al título en todas las ventanas (`TituloAtras` + `BotonAtras`).
- Favoritos con tarjeta idéntica a Explorar y corazón marcado; sin sesión redirige a /favoritos (pide crear cuenta o entrar). Pantalla Favoritos exige login.
- Perfil: tarjeta glass unificada (`max-w-4xl`), carrusel con avance cada 5s, botón compartir (Web Share + copiar enlace), botón Pedido con badge de cantidad y animación.

## 6. Fotos
- El API sirve `/media` público desde disco (nuevo `MediaWebConfig` + permiso en `SecurityConfig`) y Vite lo proxea al API (antes apuntaba a MinIO apagado).
- Volumen `mediadata` en compose para que no se borren al reconstruir.
- Se limpian filas huérfanas cuyas imágenes se habían perdido.
- El listado trae `imagenPrincipal` (miniatura) y el perfil la muestra; Inicio/Explorar la usan en miniaturas.
- Nuevo endpoint `POST /negocios/{id}/catalogo/items/{itemId}/imagen` (multipart `file`, JPG/PNG/WebP ≤5MB) + campo de foto en el formulario del ítem del panel y miniatura en la carta pública.

## 7. Carrito rediseñado
- Tarjeta blanca `rounded-3xl`, filas con foto en marco menta, título + precio único (sin duplicar), contador cápsula abajo-derecha (menos gris, más verde bosque), papelera discreta.
- Resumen con subtotal/envío/total y botón cápsula "Confirmar Pedido" verde bosque; "Vaciar carrito" en gris sutil.
- El carrito guarda `imagenUrl` del producto (los ítems viejos la toman al reagregar).

## 8. Infra y cómo correr
- `CORS_ALLOWED_ORIGINS` incluye `5173,5174,8081` (el 403 de registro era CORS por probar en 5174).
- Frontend dev: `http://localhost:5174/` (Vite propio) y `http://localhost:5173/` (docker web-dev); API `http://localhost:8080`.
- Tras cambiar `tailwind.config.js` o variables del tema, reiniciar Vite (los utilities quedan cacheados y no se nota el cambio).
- Rebuild API: `docker compose build api && docker compose up -d api`.

## Pendiente / a decidir
- Subir fotos reales a los productos desde cada panel (el mecanismo está probado).
- Verificación visual en móvil de: CTA del perfil vs bottom-nav, badges del mapa, slots de reserva a 2 líneas.
- Reintentar guardado en Engram cuando su servidor vuelva (falla con HTTP 404: contrato `engram.pi-http-runtime/v1` no disponible).
