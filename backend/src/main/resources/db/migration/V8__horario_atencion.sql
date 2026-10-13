-- V8: horarios de atención (RF-13, RF-23; diseño §7.4). Una o más franjas por día; un día sin
-- filas queda cerrado. Una franja con cierra <= abre cruza la medianoche. Nunca editar V1-V7.
CREATE TABLE horario_atencion (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  abre TIME NOT NULL,
  cierra TIME NOT NULL
);

-- Consulta del perfil y del estado "abierto ahora" por negocio (diseño §7.4).
CREATE INDEX horario_atencion_negocio_dia_idx ON horario_atencion (negocio_id, dia_semana);
