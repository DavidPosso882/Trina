-- V9: fotografías del negocio (RF-12, RNF-05). En la base solo van las claves; los bytes viven en
-- MinIO (ADR-03). La miniatura es la que viaja en los listados. Nunca editar V1-V8.
CREATE TABLE imagen_negocio (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  clave_objeto VARCHAR(255) NOT NULL UNIQUE,
  clave_miniatura VARCHAR(255) NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  orden INT NOT NULL DEFAULT 0
);

-- Consulta por negocio en orden de exhibición (diseño §7.4).
CREATE INDEX imagen_negocio_negocio_orden_idx ON imagen_negocio (negocio_id, orden);
