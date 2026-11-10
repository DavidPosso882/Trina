# Integracion Trina-Daniela

Header: Integrar zip de companera (frontend movil) con nuestro trabajo auth y correo de ayer en rama Daniela_Trina, sin romper builds ni tests. Conflictos Ingresar y Registro se resuelven con visual de ella y funcionalidad mostrar-clave nuestra.

## Specs

S1: "descargué un zip de github con unos cambios que mi compañera hizo posteriormente a lo que estuvimos trabajando ayer, quiero que revises y hagas el cruce de información para que me digas que implementó, todo esta en el directorio "Trina-Daniela_Trina" y el directorio donde estamos trabajado el proyecto está en "Trina", ambos en nuestro workspace"
S2: "si, quiero que prepares el plan para integrar lo que hizo mi compñera con lo que estuvimos trabajando nostros, sin que se rompa nada. Y por ejemplo donde haya conflictos como "mostrar clave" quiero que se mantenga nuestra funcionalidad de mostrar la clave, pero permitiendo todos los cambios visuales que ella hizo en el diseño"
S3: "dale, inicia con el plan"

## Tasks

- T1 -> S2: Preservar lo nuestro: respaldo seguro mas commit unidad auth-correo. Route: git. Commit: pendiente.
- T2 -> S1,S2: Integrar frontend sin conflicto desde zip (App, Mapa, TarjetaNegocio, estilos, Explorar, Inicio, Notificaciones, PerfilNegocio, RecuperarClave). Route: frontend. Commit: pendiente.
- T3 -> S2,S3: Merge Ingresar: visual ella mas verClave nuestro mas manejo de clave temporal. Route: pagina Ingresar. Commit: pendiente.
- T4 -> S2,S3: Merge Registro: visual ella mas toggle clave nuestro mas flujo por rol. Route: pagina Registro. Commit: pendiente.
- T5 -> S1,S2: Assets y limpieza (imagen login, carpeta recursoG, excluir generados). Route: frontend assets. Commit: pendiente.
- T6 -> S2: Verificacion build frontend y tests backend mas QA manual. Route: checks. Commit: n/a.
- T7 -> S2,S3,S4: Cierre con commit integracion e informe. Route: git/docs. Commit: pendiente.

## Log

L1: plan para integrar lo de companera con lo nuestro sin romper, manteniendo mostrar-clave y permitiendo visuales de ella
L2: iniciar con el plan
L3: Cruce previo: backend ZIP igual a HEAD e83bfe6, sin cambios de ella. Nuestros cambios locales de correo y auth no estan en zip.

L4: Integrado y verificado. Commit auth 7cd40d5 preservado. Commit integracion 82cb445 (13 archivos, visual de ella + verClave y espera COMERCIANTE nuestros). Checks: build frontend OK 2.14s, backend 23/23 verde.
