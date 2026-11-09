# Quitar capacidad de ítem de catálogo — solo reservas usan capacidadReservas del negocio
Objetivo: catálogo/pedido sin campo capacidad; reservas siguen con Negocio.capacidadReservas. Branch: actual. Estrategia: slice reversible (frontend + backend ignora ítem.capacidad, sin DROP todavía). Checks: tsc + mvn tests reserva/catalogo.

## Specs
- S1: "en el catalogo de los negocios en los productos (de los negocios que no son hospedaje) aparece un texto de \"hasta 4 personas\" pero en ese lugar deberia aparecer la descripción de dicho producto, corrigelo"
- S2: "es que en el catalogo de los negocios no debe cargar \"capacidad\" solo aplica para reservas en esos negocios no para catalogo y pedido"
- S3: Mantener Negocio.capacidadReservas para reservas (FRANJA cupo simultáneo, ALOJAMIENTO), validación personas 1-50 en Reservar sin usar item.capacidad.

## Tasks
- T1 (S2, inline, done): panel/Catalogo.tsx quitar input/schema/envío capacidad
- T2 (S1+S2, inline, done): PerfilNegocio.tsx quitar display capacidad, dejar descripción
- T3 (S2+S3, inline, done): Reservar.tsx + api.ts quitar uso item.capacidad, default 2 / max 50
- T4 (S2, inline, done): backend CatalogoDto/Service ignoran capacidad ítem (entidad conserva columna, sin migración), mantener Negocio.capacidadReservas
- T5 (S1+S2+S3, inline, done): tsc limpio, CatalogoControllerTest 16/16, ReservaControllerTest 25/25

## Log
- L1 (2026-11-08): "en el catalogo de los negocios en los productos (de los negocios que no son hospedaje) aparece un texto de \"hasta 4 personas\" pero en ese lugar deberia aparecer la descripción de dicho producto, corrigelo"
- L2 (2026-11-08): "es que en el catalogo de los negocios no debe cargar \"capacidad\" solo aplica para reservas en esos negocios no para catalogo y pedido"
- Explorador mw88iyu1-2-6d9o: dos capacidades distintas; pedido no usa capacidad; reserva FRANJA usa negocio.capacidadReservas; frontend reserva usaba item.capacidad para max/default (origen bug).
- Verificación 2026-11-08: tsc --noEmit EXIT 0; CatalogoControllerTest 16/16 verde; ReservaControllerTest 25/25 verde; grep confirma sin item.capacidad en frontend (solo entidad CatalogoItem + negocio reservas). Restaurado borrado ajeno docs/sesion-resumen.md.
