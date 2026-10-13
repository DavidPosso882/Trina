-- V6: reservas con control de capacidad (RF-26, RF-27; RN-07). Sin pago de reservas (D-04).
-- El negocio define tipo (FRANJA/ALOJAMIENTO), capacidad simultánea y duración de franja (D-03).
-- No existe todavía la entidad Horario: la validación de horario de atención queda pendiente.
ALTER TABLE negocio ADD COLUMN tipo_reserva VARCHAR(20) NOT NULL DEFAULT 'FRANJA'
  CHECK (tipo_reserva IN ('FRANJA','ALOJAMIENTO'));
ALTER TABLE negocio ADD COLUMN capacidad_reservas INT NOT NULL DEFAULT 10
  CHECK (capacidad_reservas > 0);
ALTER TABLE negocio ADD COLUMN duracion_reserva_min INT NOT NULL DEFAULT 60
  CHECK (duracion_reserva_min > 0);

CREATE TABLE reserva (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES usuario(id),
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  estado VARCHAR(30) NOT NULL
    CHECK (estado IN ('PENDIENTE_CONFIRMACION','CONFIRMADA','RECHAZADA','CANCELADA','COMPLETADA')),
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ NOT NULL,
  personas INT NOT NULL CHECK (personas > 0),
  nota TEXT,
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fin > inicio)
);

-- Conteo de superpuestas por negocio (RN-07): intervalo [inicio, fin).
CREATE INDEX reserva_negocio_inicio_fin_idx ON reserva (negocio_id, inicio, fin);
CREATE INDEX reserva_cliente_estado_idx ON reserva (cliente_id, estado);
-- Expiración programada: PENDIENTE_CONFIRMACION con más de 24 horas.
CREATE INDEX reserva_estado_creado_idx ON reserva (estado, creado_en);
