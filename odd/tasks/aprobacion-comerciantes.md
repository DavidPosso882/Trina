# Aprobacion comerciantes + persistencia registro + privacidad v2

Header: Persistencia del registro sin clave, privacidad Ley 1581 v2, y flujo completo de
aprobacion de vendedores con bloqueo pesimista de 15 min. Rama Daniela_Trina.

## Specs

S1: "1) Persistencia de los datos ingresados en el formulario de registro, ya que al ir a las politicas de tratamiento de datos y regresar, se pierden."
S2: "2) Mejorar la redaccion en las politicas de privacidad, con el estandar para este tipo de aplicaciones y tratamiento de datos."
S3: "El usuario crea su cuenta como vendedor, entonces recibe en su correo personal la confirmacion de la casi creacion de cuenta, pero con el proceso de espera de aceptacion que debe de otorgarle uno de los admins de Trina. En los correos de los admins debe llegar el mensaje del usuario (vendedor) esperando la confirmacion para la aceptacion de su creacion de cuenta, a la vez que debe de llegar la notificacion a su cuenta de admin dentro de Trina, para aceptar la confirmacion desde alli. Al aceptar esta confirmacion, se debe de sincronizar con las otras cuentas admins, para evitar aceptacion doble. Al aceptar la creacion de cuenta del vendedor, debe de enviarsele una notificacion a ese vendedor, notificandole que su cuenta ha sido creada con exito."
S4: "impleméntalo"

Acuerdos (respuestas del usuario): persistencia guarda todo menos la clave; aprobacion desde
gestion de usuarios existente; anti-doble con bloqueo pesimista al abrir (expira 15 min);
privacidad con Ley 1581 de Colombia; notificacion al vendedor por correo e in-app.

## Tasks

- T1 -> S3: Backend aprobacion (endpoints tomar/liberar/aprobar, bloqueo 15min, correos a admins y vendedor, notifs in-app, auditoria, V18, tests). Route: worker backend. Commit: pendiente.
- T2 -> S1: Frontend persistencia Registro sin clave (borrador por pestana, se limpia al crear). Route: frontend Registro. Commit: pendiente.
- T3 -> S3: Frontend admin aprobar en gestion de usuarios (boton, estado de bloqueo, mensajes). Route: frontend admin + api. Commit: pendiente.
- T4 -> S2: Politica v2 Ley 1581 en servidor + versionConsentimiento v2 + ajuste de test. Route: backend usuario (dentro de T1) + verificacion. Commit: pendiente.
- T5 -> S1,S2,S3,S4: Verificacion build + tests + cierre con commits. Route: checks. Commit: pendiente.

## Log

L1: correcciones pedidas (persistencia, privacidad, flujo de correos vendedor-admins)
L2: acuerdos D1-D4 registrados arriba
L3: "impleméntalo"

L4: Implementado inline (delegacion no disponible). Backend 40/40 verde (6 tests nuevos). Frontend tsc+vite OK 3.9s.
