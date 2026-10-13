-- V15: dataset de demostración del hito §8.2 (negocios, catálogos, pedidos, reservas y reseñas).
--
-- SOLO carga datos cuando `app.seed-demo=true`. El guardado lo hace el placeholder ${seedDemo},
-- que DemoSeedConfig completa con el valor de la propiedad `app.seed-demo` (default false): con el
-- flag apagado la migración se aplica igual (Flyway versionado obligatorio) pero no inserta filas,
-- así que en producción nunca aparecen cuentas de demostración.
--
-- Cuentas demo (todas con la clave "demo1234", hash BCrypt precalculado con BCryptPasswordEncoder):
--   comerciante1@trina.local .. comerciante4@trina.local  → COMERCIANTE
--   cliente1@trina.local                                  → CLIENTE
-- El administrador lo siembra AdminSeed, no esta migración.
--
-- Para regenerar el hash de "demo1234":
--   jshell --class-path <spring-security-crypto>.jar <<'EOF'
--   new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("demo1234");
--   EOF
-- Cualquier hash BCrypt válido de "demo1234" sirve; el salt cambia en cada regeneración.
--
-- Los ids 8xxx/9xxx son fijos para que pedidos, reservas y reseñas referencien filas concretas.
-- Todos los INSERT son idempotentes (ON CONFLICT DO NOTHING) y al final se adelantan las
-- secuencias para que los ids fijos no choquen con los futuros inserts de la aplicación.
-- Se usa el mismo usuario para las dos reseñas porque el índice único es (negocio_id, cliente_id).

-- 4 comerciantes: negocio.propietario_id es UNIQUE (V1), así que cada negocio necesita su dueño.
-- Se agrega un cuarto comerciante a los tres pedidos por el hito para cubrir los 4 negocios.
INSERT INTO usuario (id, email, password_hash, nombre, rol, version_consentimiento, consentimiento_en)
SELECT v.id, v.email, v.password_hash, v.nombre, v.rol, 'v1', now()
FROM (VALUES
  (9001, 'comerciante1@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Mariana Restrepo', 'COMERCIANTE'),
  (9002, 'comerciante2@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Andrés Gómez', 'COMERCIANTE'),
  (9003, 'comerciante3@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Carolina Mesa', 'COMERCIANTE'),
  (9004, 'comerciante4@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Julián Castro', 'COMERCIANTE'),
  (9010, 'cliente1@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Valentina Ríos', 'CLIENTE')
) AS v(id, email, password_hash, nombre, rol)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- 4 negocios APROBADOS. categoria_id referencia las categorías de V1 (1 Restaurantes, 2 Cafés,
-- 3 Hospedajes, 4 Artesanías). 8002 queda con membresía DESTACADA ACTIVA más abajo.
INSERT INTO negocio (
    id, propietario_id, categoria_id, nombre, descripcion, direccion, telefono, whatsapp,
    latitud, longitud, estado, acepta_pedidos, acepta_reservas,
    tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio)
SELECT v.id, v.propietario_id, v.categoria_id, v.nombre, v.descripcion, v.direccion, v.telefono,
       v.whatsapp, v.latitud, v.longitud, 'APROBADO', v.acepta_pedidos, v.acepta_reservas,
       v.tipo_reserva, v.capacidad_reservas, v.duracion_reserva_min, v.nivel_precio
FROM (VALUES
  (8001, 9001, 2, 'Café Las Palmas', 'Café de especialidad del Quindío con repostería artesanal.', 'Cra. 6 #12-34, Armenia', '3001234567', '573001234567', 4.533900, -75.681100, TRUE, TRUE, 'FRANJA', 8, 60, 2),
  (8002, 9002, 1, 'Restaurante El Trapiche', 'Cocina paisa tradicional en el corazón de Salento.', 'Calle Real #5-67, Salento', '3107654321', '573107654321', 4.637400, -75.572000, TRUE, TRUE, 'FRANJA', 12, 90, 2),
  (8003, 9003, 3, 'Hotel Mirador del Quindío', 'Hospedaje con vista al valle del Cocora.', 'Cra. 9 #8-21, Filandia', '3201112233', '573201112233', 4.674700, -75.658300, FALSE, TRUE, 'ALOJAMIENTO', 6, 1440, 3),
  (8004, 9004, 4, 'Artesanías del Café', 'Tejidos wayuu y café de finca tostado en Montenegro.', 'Calle 20 #7-45, Montenegro', '3154445566', '573154445566', 4.566700, -75.750000, TRUE, FALSE, 'FRANJA', 10, 60, 1)
) AS v(id, propietario_id, categoria_id, nombre, descripcion, direccion, telefono, whatsapp,
       latitud, longitud, acepta_pedidos, acepta_reservas,
       tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- Categorías internas del catálogo (2 por negocio).
INSERT INTO catalogo_categoria (id, negocio_id, nombre, orden)
SELECT v.id, v.negocio_id, v.nombre, v.orden
FROM (VALUES
  (8101, 8001, 'Bebidas calientes', 1),
  (8102, 8001, 'Repostería', 2),
  (8103, 8002, 'Platos fuertes', 1),
  (8104, 8002, 'Sopas', 2),
  (8105, 8003, 'Alojamiento', 1),
  (8106, 8003, 'Desayunos', 2),
  (8107, 8004, 'Tejidos', 1),
  (8108, 8004, 'Café', 2)
) AS v(id, negocio_id, nombre, orden)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- 8 ítems variados (productos y servicios) con precios en COP > 0.
INSERT INTO catalogo_item (
    id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion,
    precio_cop, disponible, destacado, activo)
SELECT v.id, v.negocio_id, v.catalogo_categoria_id, v.tipo, v.nombre, v.descripcion,
       v.precio_cop, TRUE, v.destacado, TRUE
FROM (VALUES
  (8201, 8001, 8101, 'producto', 'Capuchino de la casa', 'Espresso doble con leche texturizada.', 8500, TRUE),
  (8202, 8001, 8102, 'producto', 'Torta de zanahoria', 'Porción con frosting de queso crema.', 7500, FALSE),
  (8203, 8002, 8103, 'producto', 'Bandeja paisa', 'Frijoles, chicharrón, carne y arepa.', 32000, TRUE),
  (8204, 8002, 8104, 'producto', 'Sancocho de gallina', 'Con papa criolla y mazorca.', 26000, FALSE),
  (8205, 8003, 8105, 'servicio', 'Noche en habitación doble', 'Incluye desayuno y parqueadero.', 180000, FALSE),
  (8206, 8003, 8106, 'producto', 'Desayuno típico', 'Huevos, arepa, chocolate y fruta.', 15000, FALSE),
  (8207, 8004, 8107, 'producto', 'Mochila wayuu', 'Tejida a mano, colores naturales.', 120000, FALSE),
  (8208, 8004, 8108, 'producto', 'Café tostado 500 g', 'Café de finca con tueste medio.', 24000, TRUE)
) AS v(id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, destacado)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- El negocio 8002 queda DESTACADO con una suscripción ACTIVA vigente (30 días).
INSERT INTO membresia_suscripcion (id, negocio_id, plan_id, estado, inicio, fin)
SELECT 8501, 8002, p.id, 'ACTIVA', now(), now() + interval '30 days'
FROM membresia_plan p
WHERE p.codigo = 'DESTACADA' AND '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- 1 pedido COMPLETADO y 1 PENDIENTE del cliente demo.
INSERT INTO pedido (id, cliente_id, negocio_id, estado, metodo_pago, total_cop, nota, creado_en)
SELECT v.id, v.cliente_id, v.negocio_id, v.estado, v.metodo_pago, v.total_cop, v.nota, v.creado_en
FROM (VALUES
  (8301, 9010, 8001, 'COMPLETADO', 'SANDBOX', 16000, 'Para llevar.', now() - interval '10 days'),
  (8302, 9010, 8002, 'PENDIENTE', 'EN_LOCAL', 32000, 'Mesa para dos.', now() - interval '2 days')
) AS v(id, cliente_id, negocio_id, estado, metodo_pago, total_cop, nota, creado_en)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- Líneas de los pedidos: copias de nombre y precio (RN-03).
INSERT INTO pedido_item (id, pedido_id, catalogo_item_id, nombre_copia, precio_unitario_cop, cantidad)
SELECT v.id, v.pedido_id, v.catalogo_item_id, v.nombre_copia, v.precio_unitario_cop, v.cantidad
FROM (VALUES
  (8401, 8301, 8201, 'Capuchino de la casa', 8500, 1),
  (8402, 8301, 8202, 'Torta de zanahoria', 7500, 1),
  (8403, 8302, 8203, 'Bandeja paisa', 32000, 1)
) AS v(id, pedido_id, catalogo_item_id, nombre_copia, precio_unitario_cop, cantidad)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- 1 reserva CONFIRMADA del cliente demo en el restaurante (que acepta reservas).
INSERT INTO reserva (id, cliente_id, negocio_id, estado, inicio, fin, personas, nota, creado_en)
SELECT 8701, 9010, 8002, 'CONFIRMADA', now() + interval '3 days', now() + interval '3 days' + interval '90 minutes', 2, 'Mesa cerca de la ventana.', now()
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- 2 reseñas visibles del cliente demo (la de 8001 queda verificada por el pedido COMPLETADO; la de
-- 8002 no, porque su pedido sigue PENDIENTE).
INSERT INTO resena (id, negocio_id, cliente_id, calificacion, comentario, verificada, visible, creado_en)
SELECT v.id, v.negocio_id, v.cliente_id, v.calificacion, v.comentario, v.verificada, TRUE, v.creado_en
FROM (VALUES
  (8801, 8001, 9010, 5, 'El capuchino es el mejor del centro y la torta es fresca.', TRUE, now() - interval '9 days'),
  (8802, 8002, 9010, 4, 'La bandeja paisa es generosa; el servicio puede ser más rápido.', FALSE, now() - interval '1 day')
) AS v(id, negocio_id, cliente_id, calificacion, comentario, verificada, creado_en)
WHERE '${seedDemo}' = 'true'
ON CONFLICT DO NOTHING;

-- Adelanta las secuencias por encima de los ids fijos. Solo corre si el demo quedó insertado.
SELECT setval(pg_get_serial_sequence('usuario', 'id'), (SELECT MAX(id) FROM usuario))
WHERE EXISTS (SELECT 1 FROM usuario WHERE id BETWEEN 9001 AND 9099);

SELECT setval(pg_get_serial_sequence('negocio', 'id'), (SELECT MAX(id) FROM negocio))
WHERE EXISTS (SELECT 1 FROM negocio WHERE id BETWEEN 8001 AND 8099);

SELECT setval(pg_get_serial_sequence('catalogo_categoria', 'id'), (SELECT MAX(id) FROM catalogo_categoria))
WHERE EXISTS (SELECT 1 FROM catalogo_categoria WHERE id BETWEEN 8101 AND 8199);

SELECT setval(pg_get_serial_sequence('catalogo_item', 'id'), (SELECT MAX(id) FROM catalogo_item))
WHERE EXISTS (SELECT 1 FROM catalogo_item WHERE id BETWEEN 8201 AND 8299);

SELECT setval(pg_get_serial_sequence('pedido', 'id'), (SELECT MAX(id) FROM pedido))
WHERE EXISTS (SELECT 1 FROM pedido WHERE id BETWEEN 8301 AND 8399);

SELECT setval(pg_get_serial_sequence('pedido_item', 'id'), (SELECT MAX(id) FROM pedido_item))
WHERE EXISTS (SELECT 1 FROM pedido_item WHERE id BETWEEN 8401 AND 8499);

SELECT setval(pg_get_serial_sequence('membresia_suscripcion', 'id'), (SELECT MAX(id) FROM membresia_suscripcion))
WHERE EXISTS (SELECT 1 FROM membresia_suscripcion WHERE id BETWEEN 8501 AND 8599);

SELECT setval(pg_get_serial_sequence('reserva', 'id'), (SELECT MAX(id) FROM reserva))
WHERE EXISTS (SELECT 1 FROM reserva WHERE id BETWEEN 8701 AND 8799);

SELECT setval(pg_get_serial_sequence('resena', 'id'), (SELECT MAX(id) FROM resena))
WHERE EXISTS (SELECT 1 FROM resena WHERE id BETWEEN 8801 AND 8899);
