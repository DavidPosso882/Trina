-- V5: pagos simulados con comisión (RF-28/RF-29). Nunca se guarda el PAN: solo marca y últimos 4.
-- `suscripcion_id` queda nullable para cuando llegue el pago de membresías (RF-24); todavía no hay
-- tabla `suscripcion`, por eso no lleva FK.
CREATE TABLE pago (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedido(id),
  suscripcion_id BIGINT,
  proveedor VARCHAR(30) NOT NULL DEFAULT 'SIMULADOR',
  estado VARCHAR(30) NOT NULL
    CHECK (estado IN ('INICIADO','APROBADO','RECHAZADO','REEMBOLSADO')),
  monto_cop INTEGER NOT NULL CHECK (monto_cop > 0),
  comision_cop INTEGER NOT NULL DEFAULT 0 CHECK (comision_cop >= 0),
  neto_cop INTEGER NOT NULL DEFAULT 0 CHECK (neto_cop >= 0),
  referencia VARCHAR(120),
  marca_tarjeta VARCHAR(40),
  ultimos4 VARCHAR(4),
  clave_idempotencia VARCHAR(120) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pago_clave_idempotencia_uk ON pago (clave_idempotencia);
CREATE INDEX pago_pedido_idx ON pago (pedido_id);
