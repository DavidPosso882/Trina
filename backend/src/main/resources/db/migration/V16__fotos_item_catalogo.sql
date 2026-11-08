-- V10: galería del producto (hasta 5 fotos) y capacidad opcional. Nunca editar V1-V15.
CREATE TABLE imagen_catalogo_item (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES catalogo_item(id),
  clave VARCHAR(255) NOT NULL UNIQUE,
  orden INT NOT NULL DEFAULT 0
);

CREATE INDEX imagen_catalogo_item_item_orden_idx ON imagen_catalogo_item (item_id, orden);

ALTER TABLE catalogo_item ADD COLUMN capacidad INT NULL CHECK (capacidad IS NULL OR capacidad > 0);
