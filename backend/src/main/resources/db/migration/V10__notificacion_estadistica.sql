-- V10: notificaciones en plataforma (RF-32) y contadores diarios de vistas (RF-40 a 42).
-- El correo (RF-32 E4, P3) y la exportación quedan fuera de esta entrega. Nunca editar V1-V9.
CREATE TABLE notificacion (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(40) NOT NULL,
  mensaje TEXT NOT NULL,
  entidad_tipo VARCHAR(30),
  entidad_id BIGINT,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campana: últimas del usuario y contador de no leídas (RF-32, diseño §7.8).
CREATE INDEX notificacion_usuario_leida_creado_idx
  ON notificacion (usuario_id, leida, creado_en);

-- RF-40: visitas al perfil por negocio y día (diseño §7.7).
CREATE TABLE vista_perfil_diaria (
  negocio_id BIGINT NOT NULL REFERENCES negocio(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  contador INT NOT NULL DEFAULT 0,
  PRIMARY KEY (negocio_id, fecha)
);

-- RF-42: vistas de ítem por ítem y día (diseño §7.7).
CREATE TABLE vista_item_diaria (
  item_id BIGINT NOT NULL REFERENCES catalogo_item(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  contador INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, fecha)
);
