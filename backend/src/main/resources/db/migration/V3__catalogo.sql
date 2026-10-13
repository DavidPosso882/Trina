-- V3: catálogo digital (RF-15 a RF-18) — categorías internas e ítems del negocio.
-- El ítem se da de baja con activo = false (baja lógica) y sigue visible para el comerciante.
CREATE TABLE catalogo_categoria (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  nombre VARCHAR(80) NOT NULL,
  orden INT NOT NULL DEFAULT 0
);
CREATE INDEX catalogo_categoria_negocio_idx ON catalogo_categoria (negocio_id, orden);

CREATE TABLE catalogo_item (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  catalogo_categoria_id BIGINT REFERENCES catalogo_categoria(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('producto','servicio')),
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  precio_cop INTEGER NOT NULL CHECK (precio_cop > 0),
  clave_imagen VARCHAR(255),
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  destacado BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX catalogo_item_publico_idx ON catalogo_item (negocio_id, activo, disponible);
