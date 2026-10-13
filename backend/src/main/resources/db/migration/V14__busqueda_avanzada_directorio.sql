-- V14: búsqueda avanzada del directorio (RF-20/RF-22/RF-23/RF-37).
-- nivel_precio: 1 = $, 2 = $$, 3 = $$$; NULL = sin declarar (queda fuera del filtro nivelPrecio).
ALTER TABLE negocio ADD COLUMN nivel_precio SMALLINT;
ALTER TABLE negocio
  ADD CONSTRAINT negocio_nivel_precio_chk
  CHECK (nivel_precio IS NULL OR nivel_precio BETWEEN 1 AND 3);
CREATE INDEX IF NOT EXISTS negocio_estado_categoria_idx ON negocio (estado, categoria_id);
