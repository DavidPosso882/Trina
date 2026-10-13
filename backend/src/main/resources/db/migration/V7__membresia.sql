-- V7: membresías (RF-33 a RF-37, RN-05). El cobro queda fuera de este slice: toda suscripción
-- nace PENDIENTE_PAGO y el cableo con pagos (RF-28) llega después. Nunca editar V1-V6.
CREATE TABLE membresia_plan (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE CHECK (codigo IN ('BASICA','DESTACADA')),
  nombre VARCHAR(80) NOT NULL,
  precio_mensual_cop INTEGER NOT NULL CHECK (precio_mensual_cop >= 0),
  max_destacados INT NOT NULL CHECK (max_destacados > 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Semillas demo: Básica gratuita siempre disponible y Destacada pago mensual (P-02).
INSERT INTO membresia_plan (codigo, nombre, precio_mensual_cop, max_destacados, activo) VALUES
  ('BASICA','Básica',0,2,TRUE),
  ('DESTACADA','Destacada',19900,6,TRUE);

CREATE TABLE membresia_suscripcion (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  plan_id BIGINT NOT NULL REFERENCES membresia_plan(id),
  estado VARCHAR(20) NOT NULL
    CHECK (estado IN ('PENDIENTE_PAGO','ACTIVA','VENCIDA')),
  inicio TIMESTAMPTZ,
  fin TIMESTAMPTZ
);

-- RN-05: plan efectivo por negocio (ACTIVA con fin futuro) y barrido de vencidas.
CREATE INDEX membresia_suscripcion_negocio_estado_fin_idx
  ON membresia_suscripcion (negocio_id, estado, fin);
