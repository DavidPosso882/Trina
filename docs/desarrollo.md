# Desarrollo — TRINA

Guía técnica para levantar, entender y verificar el proyecto TRINA. Complementa los documentos normativos `trina-requirements.md` (SRS), `trina-design.md` (arquitectura, datos y API) y `trina-ui-design.md` (interfaz).

---

## 1. Requisitos del entorno

| Herramienta | Versión | Para qué |
|---|---|---|
| Java (Temurin) | 21 | Backend Spring Boot 3.3.5 |
| Maven | 3.9+ | Compilar y probar el backend |
| Node.js | 22 | Frontend React 18 + Vite 5 |
| Docker + Compose v2 | Reciente | Entorno local canónico (PostgreSQL, MinIO, API, web, Caddy, MailHog) |
| Docker (daemon) | — | Una prueba de backend usa Testcontainers (se saltea si no hay Docker) |
| Git | — | Repositorio y CI |

Si trabajás solo con el backend, con Java 21, Maven y Docker alcanza. Si trabajás solo con el frontend, con Node 22 y una API disponible alcanza.

---

## 2. Arranque rápido

```bash
# 1. Variables de entorno (el archivo .env nunca se versiona)
cp env.example .env
# Completá los secretos; generá cada uno con:
openssl rand -hex 32        # úsalo para POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD y JWT_SECRET

# 2. Levantá el perfil de desarrollo (la imagen del API se compila sola con su etapa Maven)
docker compose --profile dev up --build
```

Servicios y direcciones:

| Servicio | URL |
|---|---|
| Aplicación web (Vite, perfil `dev`) | http://localhost:5173 |
| API | http://localhost:8080 |
| Estado del servicio | http://localhost:8080/actuator/health |
| Documentación OpenAPI (Swagger UI) | http://localhost:8080/swagger-ui.html (`SWAGGER_ENABLED=true` en Compose) |
| Correo de prueba (MailHog) | http://localhost:8025 |
| Demo con Caddy (perfil `demo`) | http://localhost:8081 |

Para la demo empaquetada (Caddy sirve la SPA compilada y hace de proxy):

```bash
cd frontend && npm ci && npm run build && cd ..
docker compose --profile demo up --build
```

Para detener: `Ctrl+C` o `docker compose down`. Los datos quedan en el volumen `pgdata` (`miniodata` solo se crea con el perfil `minio`).

---

## 3. Variables de entorno

Definidas en `env.example`; Compose las toma del `.env` de la raíz.

| Variable | Uso | Valor por defecto |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Base de datos | `trina` / `trina` / **obligatorio en `.env`** |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credenciales de MinIO | `trina-minio` / **obligatorio en `.env`** |
| `MINIO_BUCKET` | Bucket de imágenes | `trina-media` |
| `JWT_SECRET` | Firma HS256 (mínimo 32 bytes) | **obligatorio en `.env`** |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos | `http://localhost:5173,http://localhost:8081` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Administrador inicial (primer arranque) | `admin@trina.local` / vacío (ver §5) |
| `APP_SEED_DEMO` | Carga el dataset de demostración y permite la clave demo del admin | `false` |
| `APP_STORAGE` | `local` (desarrollo sin MinIO) o `minio` (requiere perfil `minio` + licencia AIStor, ver §4) | `local` |
| `MAIL_HOST` / `MAIL_PORT` | SMTP del entorno | `maildev` / `1025` |
| `SWAGGER_ENABLED` | Publica Swagger UI | `false` (Compose `dev` lo pone en `true`) |
| `DOMAIN` | Dominio del despliegue (placeholder, P-03) | vacío |

Reglas: el `.env` nunca se versiona; para producción, `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `JWT_SECRET` y `ADMIN_PASSWORD` son obligatorios; los secretos de cada entorno son distintos.

---

## 4. Perfiles de Docker Compose

| Perfil | Servicios | Uso |
|---|---|---|
| (sin perfil) | `db`, `api` | API y base de datos |
| `dev` | + `web-dev` (Vite, 5173) + `maildev` (MailHog, 8025) | Desarrollo diario |
| `demo` | + `caddy` (8081) | Demostración con la SPA compilada y HTTPS/dominio cuando exista P-03 |
| `minio` | + `minio`, `minio-init` | S3 propio (requiere licencia AIStor válida, ver abajo) |

Detalles útiles:

- `minio-init` crea el bucket `trina-media` con reintentos hasta que MinIO responde (la imagen AIStor es mínima y no admite healthcheck clásico).
- `api` espera a que `db` esté sana; MinIO es dependencia opcional (`required: false`) y solo se usa con el perfil `minio`.
- `web-dev` monta `./frontend` y usa un volumen anónimo para `node_modules`. Su proxy `/api` apunta al servicio `api` vía `VITE_API_PROXY` (en host, Vite usa `http://localhost:8080`; el `localhost` hardcodeado no resuelve dentro de la red de Compose).
- `maildev` (MailHog) captura los correos salientes en desarrollo; el health de correo del API está desactivado a propósito (`management.health.mail.enabled: false`).
- Validá la composición con `docker compose config` (requiere un `.env` con valores aunque sean dummy).

---

## 5. Datos de demostración y cuentas

Con `APP_SEED_DEMO=true`:

- La migración `V15__datos_demo.sql` carga 4 comerciantes, 1 cliente, 4 negocios aprobados (uno con plan Destacada), categorías internas, 8 ítems, 2 pedidos, 1 reserva y 2 reseñas.
- `AdminSeed` crea el administrador inicial si no existe. Si `ADMIN_PASSWORD` está vacío y el flag demo está encendido, usa la clave de demostración.

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@trina.local` | `admin1234` (solo con `APP_SEED_DEMO=true` y `ADMIN_PASSWORD` vacío) |
| Comerciantes | `comerciante1@trina.local` … `comerciante4@trina.local` | `demo1234` |
| Cliente | `cliente1@trina.local` | `demo1234` |

Sin el flag, los `INSERT` de V15 no cargan filas y el administrador solo se crea si `ADMIN_PASSWORD` tiene valor (en producción, obligatorio).

---

## 6. Backend

```bash
cd backend
mvn -B test          # pruebas (H2; DemoDataMigrationTest usa Testcontainers y se saltea sin Docker)
mvn -B verify        # compilación + pruebas + verificación
mvn -B package -DskipTests   # jar para la imagen Docker
mvn -B -Psecurity-check verify   # perfil opcional con OWASP dependency-check
```

- Última verificación registrada (11 oct 2026, `odd/tasks/STAND-BY-2026-10-11.md`): **229 pruebas, 0 fallos**.
- Las migraciones Flyway `V1` a `V15` crean el esquema y las semillas; `ddl-auto: validate` impide divergencias entre entidades y esquema.
- Swagger UI se publica en `/swagger-ui.html` solo con `SWAGGER_ENABLED=true`.
- Paquetes del backend (monolito modular, ADR-01): `admin`, `auth`, `usuario`, `negocio`, `catalogo`, `pedido`, `reserva`, `pago`, `membresia`, `resena`, `notificacion`, `estadistica`, `almacenamiento`, `compartido`.
- Puertos y adaptadores clave: `StoragePort` (MinIO o local), `PaymentGatewayPort` (simulador), `MailPort` (pendiente).
- Tareas programadas: expiración de pedidos sin pago (30 min), reservas sin respuesta (24 h), suscripciones vencidas y limpiezas nocturnas.

---

## 7. Frontend

```bash
cd frontend
npm ci
npm run dev          # Vite en 5173, con proxy /api → 8080 y /media → 9000
npm run build        # tsc --noEmit && vite build
npm run lint         # ESLint (script definido; falta el archivo de configuración en el repo)
npm test             # Vitest (todavía no hay archivos de prueba ni configuración)
```

- Rutas y pantallas por rol (React Router): públicas (`/`, `/explorar`, `/negocios/:id`), cliente (`/carrito`, `/pedido/confirmar`, `/pedidos`, `/reservas`, `/cuenta`, `/notificaciones`), comerciante (`/panel/*`) y administrador (`/admin/*`).
- Las rutas protegidas redirigen a `/ingresar` si no hay sesión y a `/sin-permiso` si el rol no corresponde.
- El token JWT vive en `sessionStorage`; el cliente de API normaliza errores según §6.2 del diseño de interfaz.
- El carrito vive en `localStorage` (ADR-08).
- `npm test` existe pero todavía no hay pruebas de interfaz escritas ni configuración de Vitest; la verificación de frontend hoy es `tsc --noEmit` + `vite build`. El script `npm run lint` también está definido, pero el repositorio todavía no tiene archivo de configuración de ESLint, así que hoy falla.
- El frontend incluye `frontend/Dockerfile` y `frontend/Caddyfile.prod` (imagen de producción con HTTPS cuando exista `DOMAIN`, P-03); la Compose canónica no los usa: el perfil `demo` sirve `frontend/dist` con el `Caddyfile.dev` de la raíz.

---

## 8. Estructura del monorepo

```text
trina/
├─ backend/                     API Spring Boot 3.3.5 (Java 21, Maven)
│  ├─ src/main/java/co/edu/uniquindio/trina/   módulos por funcionalidad
│  ├─ src/main/resources/db/migration/         Flyway V1..V15
│  ├─ src/test/                                25 clases de prueba
│  └─ Dockerfile
├─ frontend/                    SPA React 18 + Vite 5 + TypeScript + Tailwind
│  ├─ src/{pages,components,lib}
│  ├─ Dockerfile                imagen de producción (Caddy + dist)
│  └─ Caddyfile.prod            HTTPS con DOMAIN (P-03)
├─ docs/                        manuales, desarrollo, modelo de negocio, estado del hito
├─ odd/tasks/                   notas de trabajo del equipo (incluye el STAND-BY)
├─ docker-compose.yml           PostgreSQL, MinIO, API, web, Caddy, MailHog
├─ Caddyfile.dev                Proxy de la demo (SPA + /api + /media)
├─ env.example                  Plantilla de variables de entorno
└─ .github/workflows/ci.yml     Pipeline de integración
```

Nota: el SRS/diseño (§10.2) menciona una carpeta `deploy/` para el esqueleto; en el repositorio el despliegue quedó en `docker-compose.yml` y `Caddyfile.dev` en la raíz.

---

## 9. Base de datos y migraciones

Todas las migraciones son versionadas con Flyway (`backend/src/main/resources/db/migration/`):

| Migración | Contenido |
|---|---|
| `V1` | Base mínima: usuario, categoría, negocio, parámetros y semillas |
| `V2` | Contacto del negocio (teléfono y WhatsApp) |
| `V3` | Catálogo (categorías internas e ítems) |
| `V4` | Pedidos e ítems de pedido (copias RN-03) |
| `V5` | Pagos (idempotencia, comisión y neto) |
| `V6` | Reservas y parámetros del negocio |
| `V7` | Membresías (planes, suscripciones) |
| `V8` | Horarios de atención |
| `V9` | Imágenes del negocio |
| `V10` | Notificaciones y estadísticas diarias |
| `V11` | Recuperación de contraseña |
| `V12` | Administración de plataforma (auditoría, clave temporal) |
| `V13` | Reseñas |
| `V14` | Búsqueda avanzada (nivel de precio) |
| `V15` | Dataset de demostración (gate `APP_SEED_DEMO`) |

Reglas: no se edita una migración ya aplicada; todo cambio de esquema entra como una migración nueva; el perfil `test` corre con H2 y Flyway desactivado; la migración V15 se verifica además contra PostgreSQL real con Testcontainers.

---

## 10. Decisiones de arquitectura vigentes

Del documento de diseño (§8), con el estado actual:

| ADR | Decisión | Nota de implementación |
|---|---|---|
| ADR-01 | Monolito modular Spring Boot | Paquetes por funcionalidad; capas web/aplicación/dominio por convención |
| ADR-02 | PostgreSQL sin PostGIS | Latitud/longitud, recorte por rectángulo y Haversine en memoria/SQL |
| ADR-03 | Almacenamiento S3 (MinIO) tras `StoragePort` | Adaptador `local` disponible con `APP_STORAGE=local` para desarrollo sin MinIO |
| ADR-04 | SPA React única, responsiva, por rol | React 18 + Vite + TypeScript + Tailwind + TanStack Query |
| ADR-05 | JWT stateless de 60 min con `ver` | El reclamo `ver` se compara con `usuario.token_version`; el limitador de intentos es en memoria |
| ADR-06 | Mapa Leaflet con teselas OSM | Dependencia instalada; la vista de mapa en `Explorar` está pendiente |
| ADR-07 | Pagos tras `PaymentGatewayPort` con simulador | Tarjetas de prueba; idempotencia por `Idempotency-Key` |
| ADR-08 | Carrito en el navegador | `localStorage`; el servidor valida precios y disponibilidad |
| ADR-09 | Reservas como intervalos con bloqueo por negocio | `SELECT ... FOR UPDATE` + conteo de superposiciones (RN-07) |
| ADR-10 | Estadísticas con contadores diarios | `INSERT ... ON CONFLICT` por negocio y día |
| ADR-11 | Despliegue con Docker Compose y Caddy | Un servidor; HTTPS y dominio dependen de P-03 |
| ADR-12 | Contrato OpenAPI primero y migraciones Flyway | Swagger por entorno; esquema versionado V1..V15 |
| ADR-13 | Un negocio por comerciante | Restricción única sobre `negocio.propietario_id` |

---

## 11. Integración continua

`.github/workflows/ci.yml` corre en cada push a `main` y en cada pull request:

- **backend:** Java 21 (Temurin) y `mvn -B verify`.
- **frontend:** Node 22, `npm ci` y `npm run build` (incluye `tsc --noEmit`).

El pipeline exige que ambas partes compilen y que las pruebas del backend pasen antes de integrar.

---

## 12. Convenciones de trabajo

- Ramas cortas: `feature/RF-xx-descripcion`.
- Cada cambio pasa por revisión de otro integrante y por el pipeline en verde.
- Los mensajes de commit mencionan el requisito (RF-xx) y la tarea correspondiente.
- El contrato OpenAPI y la documentación afectada se actualizan en el mismo cambio (RNF-09).
- Los secretos viven solo en `.env`; nunca se versionan ni se copian a issues, commits o capturas.

---

## 13. Problemas frecuentes en desarrollo

1. **`docker compose up --build` falla al construir `api`.** Ya no debería: el Dockerfile es multi-etapa y compila el jar adentro (etapa Maven). Si falla la descarga de dependencias, revisá la red hacia Maven Central.
2. **`docker compose config` se queja de variables faltantes.** Es esperado: necesita el `.env` con los tres secretos (aunque sean dummy para validar).
3. **El health del API está en `DOWN` o no hay correo.** El health de correo está desactivado a propósito; si configurás SMTP, revisá `MAIL_HOST` y `MAIL_PORT`.
4. **Subir una foto devuelve error 500.** Con `APP_STORAGE=local` revisá permisos del volumen; con `minio`, necesitás licencia AIStor válida (sin licencia, AIStor niega hasta crear buckets: *No license is installed*) y el perfil `minio` levantado.
5. **Flyway falla con `validate-on-migrate`.** No edites migraciones ya aplicadas: creá una migración nueva y reiniciá; si el esquema local quedó desfasado, recreá el entorno de desarrollo.
6. **Un puerto está ocupado (5173, 8080, 8025, 8081).** Frená el proceso que lo usa o cambiá el mapeo del puerto en Compose.
7. **El frontend no responde contra la API.** Verificá que el API esté arriba en `http://localhost:8080/actuator/health`; el proxy de Vite manda `/api` a ese puerto.
8. **Las cuentas demo no existen.** Levantá el entorno con `APP_SEED_DEMO=true`; con el flag apagado, V15 no inserta filas.
9. **El buscador no encuentra por tildes.** El backend compara sin tildes y sin mayúsculas sobre el nombre del negocio, la categoría y los ítems activos; probá con “cafe”.
10. **Las pruebas se saltean.** `DemoDataMigrationTest` requiere Docker disponible; sin daemon, se saltea y el resto usa H2.
11. **`npm run lint` falla al arrancar.** Falta el archivo de configuración de ESLint; usá `npm run build` para validar tipos y compilación.
12. **Las imágenes `minio/minio` y `minio/mc` dan *access denied*.** Salieron de Docker Hub; usá las AIStor (`quay.io/minio/aistor/...`, ya cableadas) con licencia, o `APP_STORAGE=local`.
13. **`docker compose ps` no muestra contenedores que sí corren.** Solo lista lo gestionado por Compose: procesos sueltos (`java -jar`, `npm run dev`) o `docker run` manuales se ven con `docker ps` / `pgrep`.

---

## 14. Documentación relacionada

| Documento | Contenido |
|---|---|
| `trina-requirements.md` | SRS: requisitos funcionales y no funcionales, reglas de negocio, criterios de aceptación |
| `trina-design.md` | Arquitectura, UML, modelo de datos, API REST, ADRs, riesgos |
| `trina-ui-design.md` | Mapa del sitio, rutas, wireframes, sistema de diseño, mensajes |
| `docs/manual-usuario.md` | Manual de cliente y comerciante |
| `docs/manual-administrador.md` | Manual del panel administrativo |
| `docs/modelo-negocio.md` | Ingresos, costos, supuestos y qué valida el piloto |
| `docs/estado-hito.md` | Matriz de requisitos P1 y pendientes para la entrega final |
| `odd/tasks/` | Notas de trabajo y verificaciones del equipo |
