# Informe de pruebas — TRINA (E5)

**Fecha:** 13 de octubre de 2026.
**Alcance:** pruebas automatizadas del backend, verificación del frontend, smoke E2E manual y pendientes E5.
**Referencias:** SRS §8 (criterios de hito y entrega), `docs/estado-hito.md` (matriz P1/P2/P3), `docs/desarrollo.md` (§6–§7, cómo reproducir), `odd/tasks/STAND-BY-2026-10-11.md` (bitácora de sesiones con evidencia por slice).

---

## 1. Backend — suite automatizada

| Dato | Valor |
|---|---|
| Comando | `cd backend && mvn -B test` |
| Resultado (13 oct 2026) | `Tests run: 240, Failures: 0, Errors: 0, Skipped: 0` — **BUILD SUCCESS** en 1m36s |
| Clases de prueba | 25 (`backend/src/test/...`) |
| Base en pruebas | H2 con `ddl-auto: create-drop` y Flyway desactivado; `DemoDataMigrationTest` usa Testcontainers contra PostgreSQL 16 real (se saltea sin daemon Docker) |
| Migraciones | Flyway `V1`–`V15` aplicadas limpio contra PostgreSQL 16 real (sesión 21); `ddl-auto: validate` impide divergencias |

Cobertura por módulo (conteo de pruebas por slice, de la bitácora): Auth 14 · Directorio 4+ · Alta negocio 5+ · Revisión admin · Catálogo 13 · Pedidos 20 · Pagos 15 · Reservas 21 · Membresías 17 · Horarios 8 · Fotos 9 · Notificaciones 11 · Estadísticas 10 · Cuenta/recuperación 16 · Admin ops 11 · Cobro-suscripción + reseñas 22 · Búsqueda avanzada 13 · Demo seed 13 · Precisión (catálogo propio, horario en pedido/reserva, WebP) 11.

## 2. Frontend — verificación

| Dato | Valor |
|---|---|
| Tipos | `npx tsc --noEmit` → exit 0 (13 oct 2026) |
| Compilación | `npm run build` → OK en 3.61s (chunks Panel 76 kB / Admin 41 kB / mapa 296 kB con lazy) |
| Pruebas UI | No hay (sin infra Vitest ni config ESLint; `npm test`/`npm run lint` sin cablear). Verificación por contrato con el backend + compilación |

## 3. Smoke E2E manual (PostgreSQL real, sesión 21, vigente)

Registro → login → 409 duplicado → `/me` → categorías → crear negocio → completar datos + horarios → envío 422 sin foto → foto 201 → PENDIENTE → admin APROBADO → perfil público con contacto/coordenadas → ítem → pedido EN_LOCAL (ACEPTAR→LISTO→COMPLETADO) → pedido SANDBOX + pago APROBADO (6000/300/5700) → 3 notificaciones → stats (2 pedidos, 12000). Todo verde. En este ciclo se cazaron 4 bugs reales (tipo `nivel_precio`, health SMTP, MinIO inalcanzable → `LocalStorageAdapter`, serialización de ficha).

## 4. Brechas cerradas en este ciclo (13 oct 2026)

- 6 pantallas P1 que faltaban: registro (RF-01), recuperación/restablecimiento + camino de clave temporal (RF-03/RF-47), mapa y filtros en Explorar (RF-09/21/22/23/24), catálogo del comerciante con endpoint propio (RF-15/16/18), política pública (RF-48/PU-07).
- Reglas de negocio: pedido valida negocio abierto (422), reserva valida inicio de FRANJA en horario, WebP real decodificable (`imageio-webp` + test).
- Resultado P1 actual: **29 completos, 5 parciales, 0 sin pantalla** (ver `estado-hito.md` §2).

## 5. Pendientes E5 (no bloquean el hito, bloquean la entrega final)

1. Prueba de usabilidad RNF-01 (5 comerciantes + 3 clientes, SUS ≥ 70).
2. Medición RNF-02 (Lighthouse móvil, búsqueda < 2 s, p95 API < 500 ms) y auditoría RNF-07 (Lighthouse ≥ 90).
3. Compatibilidad RNF-08 (navegadores objetivo, 360–1920 px).
4. E2E automatizado (Playwright) — hoy solo smoke manual.
5. Cobertura ≥ 60 % en módulos críticos (sin medir; hay 240 pruebas).
6. Prueba de restauración RNF-10 (≤ 4 h, pérdida ≤ 24 h).
7. Correo transaccional (SMTP real; hoy MailHog/log) y decisiones PO P-01…P-07.

## 6. Cómo reproducir

```bash
cd backend && mvn -B test        # 240/240 esperado, BUILD SUCCESS
cd frontend && npx tsc --noEmit  # exit 0 esperado
npm run build                    # build OK esperado
```
