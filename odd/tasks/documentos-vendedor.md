# Documentos vendedor RUT + cédula

Header: Registro COMERCIANTE exige RUT y cédula al crear cuenta, PDF e imagen como ViviGo, visible para admin. Rama Daniela_Trina.

## Specs

S1: "básandote en ViviGo, implementa el mecanismo para subir archivos como el RUT (y otros necesarios) cuando un usuario quiere ser vendedor y selecciona "Quiero Vender". ¿Entiendes lo que quiero?"
S2: "RUT obligatorio y cédula obligatoria, al momento de estar creando la cuenta, con extensión pdf e imagen, como está en vivigo"
S3: Patrón ViviGo observado: `documentoLegal` requerido, `accept="application/pdf"`, texto "Necesitamos un documento (Ej: RUT, Cédula) para verificar tu identidad. Máx 5MB.", subida previa vía ImagenServicio/Cloudinary que devuelve `respuesta.data.url` y luego se envía la URL en `CreacionAnfitrionDTO(documentoLegal)`. En Trina se adapta a StoragePort MinIO/S3 + validación por magia y descarga privada solo dueño/admin.
S4: Reglas Trina: solo COMERCIANTE exige ambos archivos al registrarse; CLIENTE no cambia; máx 5MB c/u; tipos reales PDF (%PDF), JPG, PNG, WEBP; rechazo 400 con mensaje amable; vendedor queda activo=false pendiente; admin puede ver/descargar ambos en revisión.

## Tasks

- T1 -> S1,S2,S4: Backend registro vendedor multipart + V19 columnas + storage `vendedores/{id}/` + validación magia/tamaño + tests. Route: backend auth/documentos. Commit: DONE (ver L4).
- T2 -> S1,S2,S4: Frontend Registro "Quiero vender" pide RUT + cédula (accept pdf/imagen, requeridos, 5MB) y envía multipart. Route: frontend Registro + api. Commit: DONE (ver L4).
- T3 -> S3,S4: Admin ver/descargar RUT + cédula en revisión + avisos con docs. Route: backend descarga privada + frontend admin. Commit: DONE (ver L4).
- T4 -> S1-S4: Verificación build + tests + cierre con commits. Route: checks. Commit: DONE (ver L4).

## Log

L1: "básandote en ViviGo, implementa el mecanismo para subir archivos como el RUT (y otros necesarios) cuando un usuario quiere ser vendedor y selecciona "Quiero Vender". ¿Entiendes lo que quiero?"
L2: "RUT obligatorio y cédula obligatoria, al momento de estar creando la cuenta, con extensión pdf e imagen, como está en vivigo"
L3: Patrón ViviGo confirmado en `Proyecto_Final_Software_2_Frontend/src/app/pages/editar-perfil/editar-perfil.html:423-453` y `editar-perfil.ts:119,359,419` + `proyecto_final_avanzada_backend/.../CreacionAnfitrionDTO.java` + `ImagenServicioImpl.java` + `UsuarioServicioImpl.java:132-155`. Trina ya tiene StoragePort MinIO (`StoragePort.java`, `MinioStorageAdapter`, `LocalStorageAdapter`) y fotos con validación real (`ImagenNegocioService.java`).
L4: T1+T2+T3 DONE. Backend 252/252 verde (incluye RegistroVendedorTest 5), frontend tsc+vite OK 4.16s. Reajuste pedido: DemoDataMigrationTest con outOfOrder(true) para re-ejecutar V15 idempotente con V16..V19 aplicadas; antes fallaba con V15 no aplicada estando en V19.
