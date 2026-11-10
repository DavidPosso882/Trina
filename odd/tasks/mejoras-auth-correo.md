# Mejoras auth + correo

Header: 4 mejoras de autenticación y notificaciones copiadas/adaptadas de proyecto_final_avanzada_backend y ProyectoFinalEstructuraDatos2025_1. Rama Daniela_Trina.

## Specs

S1: "1) Que se pueda ver u ocultar la contraseña cuando se está logueando el usuario como en "crear cuenta"."
S2: "2) Notificación al correo electrónico que ingresa el usuario cuando se ha creado una cuenta, en caso de que desee vender tiene que entrar en un tiempo de espera para su aprobación por parte de los administradores de Trina."
S3: "3) Notificación en el cambio de contraseña y token valido por tiempo."
S4: "4) Token de inicio de sesión valido para una hora"
S5: "Todas esas funcionalidades las puedes copiar y adaptar desde el proyecto "proyecto_final_avanzada_backend" que se encuentra en "~/Github"."
S6: "El correo usado para enviar las notifiaciones a los usuarios es "monedero.virtual20251@gmail.com" (para ello puedes revisar las credenciales y configuración en "ProyectoFinalEstructuraDatos2025_1" y copiar lo que necesites)"

## Tasks

- T1 -> S1: ver/ocultar clave en Ingresar (+ Registro por coherencia). Route: frontend. Commit: pendiente.
- T2 -> S2,S5,S6: email bienvenida + aviso espera aprobación comerciante. Route: backend mail + cuenta. Commit: pendiente.
- T3 -> S3,S5,S6: email cambio clave + token recuperación con expiración. Route: backend auth/recuperación. Commit: pendiente.
- T4 -> S4,S5: JWT login 60 min verificable. Route: backend jwt + config. Commit: pendiente.

## Log

L1: "haz las siguientes mejoras: 1) Que se pueda ver u ocultar la contraseña cuando se está logueando el usuario como en "crear cuenta". 2) Notificación al correo electrónico que ingresa el usuario cuando se ha creado una cuenta, en caso de que desee vender tiene que entrar en un tiempo de espera para su aprobación por parte de los administradores de Trina. 3) Notificación en el cambio de contraseña y token valido por tiempo. 4) Token de inicio de sesión valido para una hora Todas esas funcionalidades las puedes copiar y adaptar desde el proyecto "proyecto_final_avanzada_backend" que se encuentra en "~/Github". El correo usado para enviar las notifiaciones a los usuarios es "monedero.virtual20251@gmail.com" (para ello puedes revisar las credenciales y configuración en "ProyectoFinalEstructuraDatos2025_1" y copiar lo que necesites)"
L2: Verificación independiente observó token en logs; se corrigió: RecuperacionClaveService ya no registra el token, CuentaControllerTest usa mock de CorreoService con ArgumentCaptor. Tests 16/16 + 10/10 en verde, E2E maildev y JWT 3600s verificados.
L3: El usuario reportó que la cuenta para vender se creaba directamente sin espera. Se corrigió: AuthService.registrar deja COMERCIANTE con activo=false, login devuelve 401 pendiente de aprobación, Registro.tsx no intenta auto-ingreso y muestra aviso de espera. E2E vender1794194132@trina.co: registro 201 id 9016, login bloqueado con mensaje pendiente, Correo enviado vía Gmail.
L4: Verificación 2: tests Auth 7/7 + Cuenta 16/16 = 23/23 verdes tras agregar registroComercianteQuedaPendienteDeAprobacion (401 pendiente). .gitignore línea 2 ignora .env y git status no lo lista (no versionado, sin leer contenido por política). Sin token en logs verificado por grep.
