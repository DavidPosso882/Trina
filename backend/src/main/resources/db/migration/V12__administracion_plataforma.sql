-- V12: administración de plataforma (RF-43 a RF-47). Bitácora de auditoría y aseguramiento de la
-- bandera de cambio de clave obligatorio (ya presente en V1; IF NOT EXISTS la hace idempotente).
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cambio_clave_obligatorio BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuario(id),
  accion VARCHAR(40) NOT NULL,
  entidad VARCHAR(60) NOT NULL,
  entidad_id BIGINT,
  detalle TEXT,
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auditoria_filtro_idx ON auditoria (creado_en, usuario_id, entidad);
