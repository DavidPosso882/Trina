# TRINA — Esqueleto full-stack sólido (Sprint 3 anticipado)

> Timebox: 50 min hasta 20:30 COT del 11-oct-2026. Alcance: monorepo + docker-compose local + backend base + frontend base + CI mínimo. Sin Auth completo hoy.

## Decisión build (respuesta a "el que creas mejor")
**Maven** sobre Gradle. Motivo: estándar en UQ/Spring, `spring-boot-starter-parent` + Flyway + Testcontainers funcionan sin config extra, CI con `mvn -B verify` es trivial, y el equipo ya tiene Maven 3.9 + Java 21 instalados. Gradle solo aportaría si necesitaran builds políglotas o caché avanzada, que no es el caso con 14 días de construcción.

## Estructura monorepo
```
trina/
├── backend/              # Spring Boot 3.3.x, Java 21, Maven, monolito modular
│   └── src/main/java/co/edu/uniquindio/trina/
│       ├── auth/ usuario/ negocio/ catalogo/ pedido/ reserva/
│       ├── pago/ membresia/ resena/ estadistica/ notificacion/
│       ├── admin/ almacenamiento/ compartido/
├── frontend/             # React 18 + Vite 5 + TS + Router + Query + HF/Zod + Tailwind 3
│   └── src/ (routes PU/PC/PM/PA, tokens TRINA, leaflet lazy)
├── docker-compose.yml    # db, minio, api, web(caddy), maildev
├── Caddyfile.dev
├── .env.example
└── .github/workflows/ci.yml
```

## ADRs de hoy
- **ADR-01bis:** Maven (ver arriba).
- **ADR-05:** Docker Compose como entorno local canónico. `db` no expone puerto fuera de red salvo perfil dev. Secretos solo por `.env`, nunca al repo.
- **ADR-06:** Flyway como única vía de cambio de esquema. V1 trae `usuario, categoria_negocio, negocio, parametro_sistema` mínimo para probar el pipeline; el ER completo entra en la próxima tarea.
- **ADR-07:** Tailwind con tokens TRINA (`--color-primario #1B6B47` etc.) + Inter. Sin librería de componentes aún para no hipotecar el DCU.

## Tareas (proyección en `todo` visible)
1. [x] Plan + ADRs + estructura
2. [ ] Backend base compila + `/actuator/health` + OpenAPI + Flyway V1 + test de contexto
3. [ ] Frontend base compila + rutas placeholder + tokens + mapa lazy
4. [ ] Compose + CI + doc Stand-by para mañana

## Lo NO hecho hoy (para mañana)
- Auth JWT completo (RF-01/02/04), entidades completas (§4 ER), endpoints reales, MinIO real, Bucket4j, JWT `ver`, mail real.
- Valores semilla finales (P-02), área municipio (P-05), SMTP (P-06), política UQ (P-07) → defaults de demostración.

## Skills sugeridas para que investigues y agregues
| Necesidad TRINA | Skill a buscar/crear | Por qué |
|---|---|---|
| Backend Spring Boot (TDD, capas, seguridad) | `backend-spring-boot` o `java-tdd` | Patrones web→aplicación→dominio, `@PreAuthorize` + propiedad, manejo global de errores §5.9 |
| Postgres + Flyway + JPA | `postgres-flyway` | Migraciones versionadas, `unaccent`, Haversine, índices §4.3 |
| Docker + Caddy + backup | `devops-docker` | Compose prod/dev, HTTPS auto, `pg_dump` + MinIO RNF-10 |
| Seguridad/SecOps | `devsecops-review` o `owasp-check` | BCrypt, JWT `ver`, EXIF strip, no tarjetas, `npm audit` + OWASP dep-check RNF-03 E5 |
| QA E2E + usabilidad | `qa-playwright` + `usability-test` | Flujos P1 en teléfono real + protocolo RNF-01 §9 |
| API contract | `openapi-contract` | springdoc + validación contrato en CI RNF-09 E2 |

## Evidencia esperada al cerrar
- `mvn -B verify` en backend (o al menos `compile` si no hay red para deps).
- `npm run build` en frontend.
- `docker compose config` válido.
