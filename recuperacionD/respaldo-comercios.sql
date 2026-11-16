--
-- PostgreSQL database dump
--

\restrict MPvhtgC3TGB6jgNaTKcG4G4aYZSDp5qUv5VKFHkfWKN4IxeEEXKckFlylkzzahu

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categoria_negocio; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (1, 'Restaurantes', NULL, true, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (2, 'Cafés', NULL, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (3, 'Hospedajes', NULL, true, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (4, 'Artesanías', NULL, true, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (5, 'Tiendas', NULL, true, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (6, 'Servicios', NULL, true, 6) ON CONFLICT DO NOTHING;
INSERT INTO public.categoria_negocio (id, nombre, icono, activa, orden) VALUES (7, 'Experiencias y turismo', NULL, true, 7) ON CONFLICT DO NOTHING;


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9001, 'comerciante1@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Mariana Restrepo', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-07 17:28:49.63175+00', NULL, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9002, 'comerciante2@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Andrés Gómez', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-07 17:28:49.63175+00', NULL, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9003, 'comerciante3@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Carolina Mesa', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-07 17:28:49.63175+00', NULL, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9004, 'comerciante4@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Julián Castro', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-07 17:28:49.63175+00', NULL, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9010, 'cliente1@trina.local', '$2a$10$0KRWDc3sxDwwOqHXM5NzHuymS2HWYaIBvoNNtx0WGqlQzj9ovuYaG', 'Valentina Ríos', NULL, 'CLIENTE', true, NULL, 0, false, 'v1', '2026-11-07 17:28:49.63175+00', NULL, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9011, 'admin@trina.local', '$2a$10$TzONvEGaPJgMTUb4USu.mOvwl4vICC6Q3lHV9gNe8YkyLMyAwncbi', 'Administrador TRINA', NULL, 'ADMINISTRADOR', true, NULL, 0, false, 'v1', '2026-11-07 17:28:52.433061+00', NULL, '2026-11-07 17:28:52.325686+00', '2026-11-07 17:28:52.325686+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9012, 'correo@gmail.com', '$2a$10$b/PJgSrwghXmIUmRKFWvdOwRR68xuz5671YLc9KjKiotu2YTvK4CK', 'daniela', NULL, 'CLIENTE', true, true, 0, false, 'v1', '2026-11-07 23:13:10.549286+00', NULL, '2026-11-07 23:13:10.48552+00', '2026-11-07 23:13:10.48552+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9013, 'comerciante@gmail.com', '$2a$10$KoOIJLo/TQ/8Q0t/Q4SlDeHqw3edoAslDUQ6E102T7SLpl2duPsKK', 'dani c', NULL, 'COMERCIANTE', true, true, 0, false, 'v1', '2026-11-07 23:15:20.696761+00', NULL, '2026-11-07 23:15:20.619377+00', '2026-11-07 23:15:20.619377+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9014, 'gloria@trina.local', '$2a$10$pP8iSciEmuTlKz7FCX5zXuKHyewBZwo845vROVwHvAeuYzJCToRz.', 'Asados Donde Gloria', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:48.937447+00', NULL, '2026-11-08 00:09:48.877096+00', '2026-11-08 00:09:48.877096+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9015, 'puerta@trina.local', '$2a$10$xdQDfx1TC3wnWg1EmeVOu..imi7r1TdCqpqWj08WQgpsORPKZSqGm', 'Restaurante Puerta de Alcalá', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:49.114704+00', NULL, '2026-11-08 00:09:49.05608+00', '2026-11-08 00:09:49.05608+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9016, 'polos@trina.local', '$2a$10$iSKUJZZADc9XR4xWGCEOtOzdC4yEuZpNxHVz5mbvVSOChANw29faO', 'Polo''s Café', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:49.186202+00', NULL, '2026-11-08 00:09:49.127842+00', '2026-11-08 00:09:49.127842+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9017, 'simona@trina.local', '$2a$10$CuESlDaOrg8RjD0woStD5u5KI6HyLO3yfkUFUvEeDiTEUmqG2li16', 'SiMona Pizzería', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:49.261714+00', NULL, '2026-11-08 00:09:49.203574+00', '2026-11-08 00:09:49.203574+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9018, 'guadua@trina.local', '$2a$10$TgaqTITZeRclAJWpSOhxLODuXj2dD2gA8wMjAHbAyb0EVO2qQVDqS', 'Hotel Ecológico de la Guadua', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:49.329106+00', NULL, '2026-11-08 00:09:49.271272+00', '2026-11-08 00:09:49.271272+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9019, 'cielo@trina.local', '$2a$10$zfrK7GUqwguHOV9YytRCH.IeH.4cspKtJMIrM.JYsJg4GHtmecHH6', 'Hotel El Cielo en la Tierra', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:49.399976+00', NULL, '2026-11-08 00:09:49.341707+00', '2026-11-08 00:09:49.341707+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9020, 'saman@trina.local', '$2a$10$0L9FZ6XB8yZACYp8c9hmwOQCvgw2K4Lbf3fvspVHtFBkC823RLcsS', 'Bosques del Samán Hotel', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:09:49.468977+00', NULL, '2026-11-08 00:09:49.411109+00', '2026-11-08 00:09:49.411109+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9021, 'choriceria@trina.local', '$2a$10$iRxEzX9joY580VBSkOlrXOuLg58SDKHmueK.86Z.aGf0YC9yQGLre', 'Choricería Don Chorizo', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:13:31.946477+00', NULL, '2026-11-08 00:13:31.886892+00', '2026-11-08 00:13:31.886892+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9022, 'paisas@trina.local', '$2a$10$d2XC9ojJ4jxaTugd1bAlKu71hkXG8uurIPsxdoP8g3nF0hLDO5s/i', 'Restaurante Los Paisas', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:18:28.143959+00', NULL, '2026-11-08 00:18:28.085799+00', '2026-11-08 00:18:28.085799+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9023, 'porvenir@trina.local', '$2a$10$N4ULKXrb.ig60B1zJB6V.eArdBzalxhBkcwPLpzhrzL/0I5wr8qzm', 'Asadero El Porvenir', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:18:28.218632+00', NULL, '2026-11-08 00:18:28.16068+00', '2026-11-08 00:18:28.16068+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9024, 'tamal@trina.local', '$2a$10$3Kahhl6IEqQFaa9J4U/fbOPCSxEZ7AiHVhWqHHNkcKct7jxHgI2xC', 'Parador El Tamal Tolimense', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:18:28.28694+00', NULL, '2026-11-08 00:18:28.228793+00', '2026-11-08 00:18:28.228793+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9025, 'bambu@trina.local', '$2a$10$v3wBMXfkFjfg7hhKfgQQFeKjJbKscZDKXwji6dqXXPNUb.WIg9pES', 'Finca Hotel Mirador del Bambú', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 00:18:28.356894+00', NULL, '2026-11-08 00:18:28.298838+00', '2026-11-08 00:18:28.298838+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9030, 'danielita@gmail.com', '$2a$10$6e1anM4UyQafABlQ2qwz5ear1z6wI4j1W8fNWoMvBHXNkWGjb4z56', 'dani', NULL, 'CLIENTE', true, true, 0, false, 'v1', '2026-11-08 01:02:16.816754+00', NULL, '2026-11-08 01:02:16.748997+00', '2026-11-08 01:02:16.748997+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9031, 'comerciante.prueba@trina.local', '$2a$10$.63.KIiSTRzAMT3o9Poqz.98SIKqnul8jTcQri.ETE2Nmc.IWFY/e', 'Comerciante Prueba', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 03:37:39.46174+00', NULL, '2026-11-08 03:37:39.399559+00', '2026-11-08 03:37:39.399559+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9032, 'cliente.prueba@trina.local', '$2a$10$GynAyNrK1PzZJ1L0.n/pjOuszeK7YXpCZ89m38amzCP..A254XCoa', 'Cliente Prueba', NULL, 'CLIENTE', true, NULL, 0, false, 'v1', '2026-11-08 05:53:11.885705+00', NULL, '2026-11-08 05:53:11.825295+00', '2026-11-08 05:53:11.825295+00') ON CONFLICT DO NOTHING;
INSERT INTO public.usuario (id, email, password_hash, nombre, telefono, rol, activo, es_residente, token_version, cambio_clave_obligatorio, version_consentimiento, consentimiento_en, eliminado_en, creado_en, actualizado_en) VALUES (9033, 'hospedaje.alcala@trina.local', '$2a$10$CHjyCnIB6yRLe5Q1jZUuSuk7PGmXiN1MhIiaoMMFN5UTzZG29XzUq', 'Hospedaje Alcalá', NULL, 'COMERCIANTE', true, NULL, 0, false, 'v1', '2026-11-08 06:36:34.634845+00', NULL, '2026-11-08 06:36:34.575527+00', '2026-11-08 06:36:34.575527+00') ON CONFLICT DO NOTHING;


--
-- Data for Name: negocio; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8016, 9024, 1, 'Parador El Tamal Tolimense', 'Tamales tolimenses y lechona los fines de semana.', 'Vía Alcalá - Ulloa Km 1, Alcalá, Valle', 4.677000, -75.779000, 'APROBADO', NULL, true, true, '2026-11-08 00:18:28.292446+00', '2026-11-08 00:18:28.292446+00', '3109990033', '573109990033', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8013, 9021, 1, 'Choricería Don Chorizo', 'Chorizos artesanales, morcilla y picadas al carbón en la zona rural.', 'Vereda La Cuchilla, Alcalá, Valle', 4.669800, -75.789200, 'APROBADO', NULL, true, true, '2026-11-08 00:13:31.955582+00', '2026-11-08 00:13:31.955582+00', '3108889900', '573108889900', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8008, 9016, 2, 'Polo''s Café', 'Café de origen y repostería frente al parque principal.', 'Carrera 8 #5-01 Parque Principal, Alcalá, Valle', 4.673800, -75.781200, 'APROBADO', NULL, true, true, '2026-11-08 00:09:49.197832+00', '2026-11-08 00:09:49.197832+00', '3103334455', '573103334455', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8005, 9013, 1, 'La delicia de Daniela', 'Restaurante', 'CLL3', 4.674555, -75.786904, 'PENDIENTE', NULL, true, false, '2026-11-07 23:15:45.849868+00', '2026-11-07 23:15:45.849868+00', '345789', '679000', 'FRANJA', 10, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8010, 9018, 3, 'Hotel Ecológico de la Guadua', 'Hospedaje sostenible en el Paisaje Cultural Cafetero.', 'Vereda El Edén, Alcalá, Valle', 4.671500, -75.786500, 'APROBADO', NULL, true, false, '2026-11-08 00:09:49.335547+00', '2026-11-08 00:09:49.335547+00', '3105556677', '573105556677', 'FRANJA', 10, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8011, 9019, 3, 'Hotel El Cielo en la Tierra', 'Complejo turístico con piscinas y restaurante.', 'Vía Alcalá - Cartago, Alcalá, Valle', 4.678200, -75.777500, 'APROBADO', NULL, true, false, '2026-11-08 00:09:49.407159+00', '2026-11-08 00:09:49.407159+00', '3106667788', '573106667788', 'FRANJA', 10, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8012, 9020, 3, 'Bosques del Samán Hotel', 'Hotel temático de flora y fauna de la región cafetera.', 'Finca El Edén, Alcalá, Valle', 4.679800, -75.774500, 'APROBADO', NULL, true, false, '2026-11-08 00:09:49.474032+00', '2026-11-08 00:09:49.474032+00', '3107778899', '573107778899', 'FRANJA', 10, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8001, 9001, 2, 'Café Las Palmas', 'Café de especialidad del Quindío con repostería artesanal.', 'Cra. 6 #12-34, Armenia', 4.533900, -75.681100, 'SUSPENDIDO', 'Fuera de Alcalá Valle: directorio enfocado solo en Alcalá', true, true, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00', '3001234567', '573001234567', 'FRANJA', 8, 60, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8002, 9002, 1, 'Restaurante El Trapiche', 'Cocina paisa tradicional en el corazón de Salento.', 'Calle Real #5-67, Salento', 4.637400, -75.572000, 'SUSPENDIDO', 'Fuera de Alcalá Valle: directorio enfocado solo en Alcalá', true, true, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00', '3107654321', '573107654321', 'FRANJA', 12, 90, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8003, 9003, 3, 'Hotel Mirador del Quindío', 'Hospedaje con vista al valle del Cocora.', 'Cra. 9 #8-21, Filandia', 4.674700, -75.658300, 'SUSPENDIDO', 'Fuera de Alcalá Valle: directorio enfocado solo en Alcalá', false, true, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00', '3201112233', '573201112233', 'ALOJAMIENTO', 6, 1440, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8004, 9004, 4, 'Artesanías del Café', 'Tejidos wayuu y café de finca tostado en Montenegro.', 'Calle 20 #7-45, Montenegro', 4.566700, -75.750000, 'SUSPENDIDO', 'Fuera de Alcalá Valle: directorio enfocado solo en Alcalá', true, false, '2026-11-07 17:28:49.63175+00', '2026-11-07 17:28:49.63175+00', '3154445566', '573154445566', 'FRANJA', 10, 60, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8017, 9025, 3, 'Finca Hotel Mirador del Bambú', 'Alojamiento rural con vista cafetera.', 'Vereda El Congal, Alcalá, Valle', 4.670500, -75.790000, 'APROBADO', NULL, true, false, '2026-11-08 00:18:28.364788+00', '2026-11-08 00:18:28.364788+00', '3109990044', '573109990044', 'FRANJA', 10, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8006, 9014, 1, 'Asados Donde Gloria', 'Asados y cocina colombiana: empanadas y carnes a la parrilla.', 'Calle 6 centro, Alcalá, Valle', 4.674500, -75.782000, 'APROBADO', NULL, true, true, '2026-11-08 00:09:49.027969+00', '2026-11-08 00:09:49.027969+00', '3101112233', '573101112233', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8007, 9015, 1, 'Restaurante Puerta de Alcalá', 'Bandeja paisa, sancocho y pescado. Precios razonables.', 'Carrera 7 centro, Alcalá, Valle', 4.675200, -75.783500, 'APROBADO', NULL, true, true, '2026-11-08 00:09:49.121988+00', '2026-11-08 00:09:49.121988+00', '3102223344', '573102223344', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8009, 9017, 1, 'SiMona Pizzería', 'Pizza artesanal y ambiente familiar.', 'Carrera 9, Alcalá, Valle', 4.674100, -75.784200, 'APROBADO', NULL, true, true, '2026-11-08 00:09:49.266612+00', '2026-11-08 00:09:49.266612+00', '3104445566', '573104445566', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8014, 9022, 1, 'Restaurante Los Paisas', 'Comida típica paisa y almuerzos ejecutivos.', 'Calle 5 #6-10, Alcalá, Valle', 4.672500, -75.780500, 'APROBADO', NULL, true, true, '2026-11-08 00:18:28.151702+00', '2026-11-08 00:18:28.151702+00', '3109990011', '573109990011', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8015, 9023, 1, 'Asadero El Porvenir', 'Pollo asado y carnes al carbón.', 'Carrera 6 #4-20, Alcalá, Valle', 4.676000, -75.785000, 'APROBADO', NULL, true, true, '2026-11-08 00:18:28.223569+00', '2026-11-08 00:18:28.223569+00', '3109990022', '573109990022', 'FRANJA', 20, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8018, 9031, 2, 'Café Central Alcalá', 'Café de origen y repostería para pruebas.', 'Carrera 8 #4-10, Alcalá, Valle', 4.673000, -75.782800, 'APROBADO', NULL, true, true, '2026-11-08 03:37:39.574984+00', '2026-11-08 03:37:39.574984+00', '3100001122', '573100001122', 'FRANJA', 5, 60, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.negocio (id, propietario_id, categoria_id, nombre, descripcion, direccion, latitud, longitud, estado, motivo_revision, acepta_pedidos, acepta_reservas, creado_en, actualizado_en, telefono, whatsapp, tipo_reserva, capacidad_reservas, duracion_reserva_min, nivel_precio) VALUES (8019, 9033, 3, 'Hotel Campestre Los Guaduales', 'Hospedaje campestre con vista cafetera, a 5 minutos del parque principal.', 'Vereda La Cuchilla, Alcalá, Valle', 4.668000, -75.789000, 'APROBADO', NULL, true, true, '2026-11-08 06:39:08.905654+00', '2026-11-08 06:39:08.905654+00', '3109998877', '573109998877', 'ALOJAMIENTO', 10, 1440, NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: catalogo_categoria; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8101, 8001, 'Bebidas calientes', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8102, 8001, 'Repostería', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8103, 8002, 'Platos fuertes', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8104, 8002, 'Sopas', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8105, 8003, 'Alojamiento', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8106, 8003, 'Desayunos', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8107, 8004, 'Tejidos', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8108, 8004, 'Café', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_categoria (id, negocio_id, nombre, orden) VALUES (8109, 8018, 'Bebidas', 0) ON CONFLICT DO NOTHING;


--
-- Data for Name: catalogo_item; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8201, 8001, 8101, 'producto', 'Capuchino de la casa', 'Espresso doble con leche texturizada.', 8500, NULL, true, true, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8202, 8001, 8102, 'producto', 'Torta de zanahoria', 'Porción con frosting de queso crema.', 7500, NULL, true, false, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8203, 8002, 8103, 'producto', 'Bandeja paisa', 'Frijoles, chicharrón, carne y arepa.', 32000, NULL, true, true, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8204, 8002, 8104, 'producto', 'Sancocho de gallina', 'Con papa criolla y mazorca.', 26000, NULL, true, false, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8205, 8003, 8105, 'servicio', 'Noche en habitación doble', 'Incluye desayuno y parqueadero.', 180000, NULL, true, false, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8206, 8003, 8106, 'producto', 'Desayuno típico', 'Huevos, arepa, chocolate y fruta.', 15000, NULL, true, false, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8207, 8004, 8107, 'producto', 'Mochila wayuu', 'Tejida a mano, colores naturales.', 120000, NULL, true, false, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8208, 8004, 8108, 'producto', 'Café tostado 500 g', 'Café de finca con tueste medio.', 24000, NULL, true, true, true, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8210, 8018, NULL, 'producto', 'Pandebono prueba', NULL, 5000, 'catalogo/8018/dd677aec-c6de-413c-a34c-bb3495515ed6.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8209, 8018, NULL, 'producto', 'Cafe americano', 'delicioso cafe', 6500, 'catalogo/8018/89a5fadb-dbba-474c-9e8d-f3be5c6e0db0.webp', true, false, true, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8223, 8019, NULL, 'servicio', 'Habitación Doble Cafetera', 'Cama doble, baño privado y balcón con vista.', 120000, NULL, true, false, true, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8224, 8006, NULL, 'servicio', 'Mesa VIP prueba', NULL, 50000, NULL, true, false, false, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8225, 8006, NULL, 'servicio', 'Mesa test', NULL, 10000, NULL, true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8226, 8019, NULL, 'servicio', 'Suite Test', NULL, 200000, NULL, true, false, false, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8211, 8006, NULL, 'producto', 'Picada Don Gloria', 'Especialidad de la casa.', 45000, 'catalogo/8006/df64572d-cf6f-4570-b47b-a3d929c93091.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8212, 8007, NULL, 'producto', 'Bandeja paisa', 'Especialidad de la casa.', 28000, 'catalogo/8007/33a70372-be52-4e3a-92b0-fdca70477382.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8213, 8008, NULL, 'producto', 'Café americano', 'Especialidad de la casa.', 6000, 'catalogo/8008/d26adb3d-21b3-44f8-955a-d65664fe188d.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8214, 8009, NULL, 'producto', 'Pizza personal', 'Especialidad de la casa.', 22000, 'catalogo/8009/589839ff-0ec1-47b1-b64e-e673f2b89469.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8215, 8010, NULL, 'servicio', 'Noche en cabaña', 'Especialidad de la casa.', 120000, 'catalogo/8010/3706da09-2956-459a-9d1e-d858e7a1f402.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8216, 8011, NULL, 'servicio', 'Día de sol + piscina', 'Especialidad de la casa.', 35000, 'catalogo/8011/2cc11de5-469b-4608-bd3b-4203d2b59487.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8217, 8012, NULL, 'servicio', 'Tour cafetero', 'Especialidad de la casa.', 25000, 'catalogo/8012/cf2b820b-8dc7-4a54-a589-3cef44548a41.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8218, 8013, NULL, 'producto', 'Chorizada para 2', 'Especialidad de la casa.', 30000, 'catalogo/8013/3b1319f0-03c1-4ccc-b07a-ff0bda1dd7e3.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8219, 8014, NULL, 'producto', 'Sudado de carne', 'Especialidad de la casa.', 18000, 'catalogo/8014/a02f055d-0167-47a3-9a40-faee418ee644.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8220, 8015, NULL, 'producto', 'Pollo asado entero', 'Especialidad de la casa.', 38000, 'catalogo/8015/fd0ca629-7f44-4cec-ad36-4e8fae3e16c8.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8221, 8016, NULL, 'producto', 'Lechona tolimense', 'Especialidad de la casa.', 15000, 'catalogo/8016/a154b868-cc00-4539-a8f0-b856e21182d0.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8222, 8017, NULL, 'servicio', 'Noche en habitación', 'Especialidad de la casa.', 90000, 'catalogo/8017/3882412a-9bc2-4464-bc99-d3da64cff049.jpg', true, false, false, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_item (id, negocio_id, catalogo_categoria_id, tipo, nombre, descripcion, precio_cop, clave_imagen, disponible, destacado, activo, capacidad) VALUES (8227, 8018, NULL, 'producto', 'oblea', NULL, 6000, NULL, true, false, false, NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: horario_atencion; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (1, 8005, 1, '08:00:00', '18:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (2, 8005, 2, '08:00:00', '18:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (3, 8005, 3, '08:00:00', '18:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (4, 8005, 4, '08:00:00', '18:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (5, 8005, 5, '08:00:00', '18:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (181, 8018, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (182, 8018, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (183, 8018, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (184, 8018, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (185, 8018, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (186, 8018, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (187, 8018, 7, '00:45:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (90, 8006, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (91, 8006, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (92, 8006, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (93, 8006, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (94, 8006, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (95, 8006, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (96, 8006, 7, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (97, 8008, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (98, 8008, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (99, 8008, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (100, 8008, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (101, 8008, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (102, 8008, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (103, 8008, 7, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (104, 8007, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (105, 8007, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (106, 8007, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (107, 8007, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (108, 8007, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (109, 8007, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (110, 8007, 7, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (111, 8013, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (112, 8013, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (113, 8013, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (114, 8013, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (115, 8013, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (116, 8013, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (117, 8013, 7, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (118, 8011, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (119, 8011, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (120, 8011, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (121, 8011, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (122, 8011, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (123, 8011, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (124, 8011, 7, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (125, 8016, 1, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (126, 8016, 2, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (127, 8016, 3, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (128, 8016, 4, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (129, 8016, 5, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (130, 8016, 6, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (131, 8016, 7, '06:00:00', '23:59:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (132, 8009, 1, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (133, 8009, 2, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (134, 8009, 3, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (135, 8009, 4, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (136, 8009, 5, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (137, 8009, 6, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (138, 8009, 7, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (139, 8014, 1, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (140, 8014, 2, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (141, 8014, 3, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (142, 8014, 4, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (143, 8014, 5, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (144, 8014, 6, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (145, 8014, 7, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (146, 8015, 1, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (147, 8015, 2, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (148, 8015, 3, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (149, 8015, 4, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (150, 8015, 5, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (151, 8015, 6, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (152, 8015, 7, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (153, 8010, 1, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (154, 8010, 2, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (155, 8010, 3, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (156, 8010, 4, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (157, 8010, 5, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (158, 8010, 6, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (159, 8010, 7, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (160, 8017, 1, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (161, 8017, 2, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (162, 8017, 3, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (163, 8017, 4, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (164, 8017, 5, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (165, 8017, 6, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (166, 8017, 7, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (167, 8012, 1, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (168, 8012, 2, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (169, 8012, 3, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (170, 8012, 4, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (171, 8012, 5, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (172, 8012, 6, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.horario_atencion (id, negocio_id, dia_semana, abre, cierra) VALUES (173, 8012, 7, '08:00:00', '12:00:00') ON CONFLICT DO NOTHING;


--
-- Data for Name: imagen_negocio; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.imagen_negocio (id, negocio_id, clave_objeto, clave_miniatura, principal, orden) VALUES (9, 8018, 'negocios/8018/35abb198-88b6-470e-b268-45c09d9a690d.jpg', 'negocios/8018/35abb198-88b6-470e-b268-45c09d9a690d_m.jpg', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.imagen_negocio (id, negocio_id, clave_objeto, clave_miniatura, principal, orden) VALUES (10, 8018, 'negocios/8018/84f87ef6-220d-4637-b5f0-0460280c3f06.jpg', 'negocios/8018/84f87ef6-220d-4637-b5f0-0460280c3f06_m.jpg', false, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.imagen_negocio (id, negocio_id, clave_objeto, clave_miniatura, principal, orden) VALUES (11, 8018, 'negocios/8018/88aed603-9aa3-487c-842d-03c8757363e2.jpg', 'negocios/8018/88aed603-9aa3-487c-842d-03c8757363e2_m.jpg', false, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.imagen_negocio (id, negocio_id, clave_objeto, clave_miniatura, principal, orden) VALUES (12, 8019, 'negocios/8019/15caf19a-f8a4-45df-a1a7-6c61096a53c0.jpg', 'negocios/8019/15caf19a-f8a4-45df-a1a7-6c61096a53c0_m.jpg', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.imagen_negocio (id, negocio_id, clave_objeto, clave_miniatura, principal, orden) VALUES (13, 8019, 'negocios/8019/6f93b7c4-4685-41af-80d9-51a53765972d.jpg', 'negocios/8019/6f93b7c4-4685-41af-80d9-51a53765972d_m.jpg', false, 1) ON CONFLICT DO NOTHING;


--
-- Data for Name: membresia_suscripcion; Type: TABLE DATA; Schema: public; Owner: trina
--

INSERT INTO public.membresia_suscripcion (id, negocio_id, plan_id, estado, inicio, fin) VALUES (8501, 8002, 2, 'ACTIVA', '2026-11-07 17:28:49.63175+00', '2026-12-07 17:28:49.63175+00') ON CONFLICT DO NOTHING;


--
-- Name: catalogo_categoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.catalogo_categoria_id_seq', 8109, true);


--
-- Name: catalogo_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.catalogo_item_id_seq', 8227, true);


--
-- Name: categoria_negocio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.categoria_negocio_id_seq', 7, true);


--
-- Name: horario_atencion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.horario_atencion_id_seq', 187, true);


--
-- Name: imagen_negocio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.imagen_negocio_id_seq', 13, true);


--
-- Name: membresia_suscripcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.membresia_suscripcion_id_seq', 8501, true);


--
-- Name: negocio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.negocio_id_seq', 8019, true);


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trina
--

SELECT pg_catalog.setval('public.usuario_id_seq', 9033, true);


--
-- PostgreSQL database dump complete
--

\unrestrict MPvhtgC3TGB6jgNaTKcG4G4aYZSDp5qUv5VKFHkfWKN4IxeEEXKckFlylkzzahu


-- Ajusta las secuencias para que los próximos inserts no choquen con los ids restaurados.
SELECT setval(pg_get_serial_sequence('usuario', 'id'), (SELECT MAX(id) FROM usuario));
SELECT setval(pg_get_serial_sequence('negocio', 'id'), (SELECT MAX(id) FROM negocio));
SELECT setval(pg_get_serial_sequence('catalogo_categoria', 'id'), (SELECT MAX(id) FROM catalogo_categoria));
SELECT setval(pg_get_serial_sequence('catalogo_item', 'id'), (SELECT MAX(id) FROM catalogo_item));
SELECT setval(pg_get_serial_sequence('horario_atencion', 'id'), (SELECT MAX(id) FROM horario_atencion));
SELECT setval(pg_get_serial_sequence('imagen_negocio', 'id'), (SELECT MAX(id) FROM imagen_negocio));
SELECT setval(pg_get_serial_sequence('membresia_suscripcion', 'id'), (SELECT MAX(id) FROM membresia_suscripcion));
