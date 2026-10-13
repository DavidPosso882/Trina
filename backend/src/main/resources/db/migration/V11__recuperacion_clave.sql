-- V11: tokens de recuperación de clave (RF-03). Un solo uso, guardados con hash SHA-256 y
-- vigentes 30 minutos; el enlace real se envía por correo cuando llegue el MailPort.
CREATE TABLE recuperacion_clave (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuario(id),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ
);
CREATE INDEX recuperacion_clave_usuario_idx ON recuperacion_clave (usuario_id);
