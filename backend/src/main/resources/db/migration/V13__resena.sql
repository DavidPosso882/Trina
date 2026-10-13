-- V13: reseñas de clientes y moderación (RF-38/RF-39, RN-08). Una reseña por cliente y negocio;
-- el promedio del negocio se calcula al vuelo solo con las visibles. Nunca editar V1-V12.
CREATE TABLE resena (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  cliente_id BIGINT NOT NULL REFERENCES usuario(id),
  calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  verificada BOOLEAN NOT NULL DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  reportada BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_reporte TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX resena_negocio_cliente_uk ON resena (negocio_id, cliente_id);
CREATE INDEX resena_negocio_visible_idx ON resena (negocio_id, visible);
