-- V4: pedidos para recoger (RF-25, RF-27, RF-31).
-- El cobro sandbox (RF-28/29) y la expiración programada llegan después: acá solo se registran los
-- estados del pedido, las copias de nombre y precio (RN-03) y el total.
CREATE TABLE pedido (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES usuario(id),
  negocio_id BIGINT NOT NULL REFERENCES negocio(id),
  estado VARCHAR(30) NOT NULL
    CHECK (estado IN ('PENDIENTE_PAGO','PENDIENTE','EN_PREPARACION','LISTO','COMPLETADO','RECHAZADO','CANCELADO')),
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('SANDBOX','EN_LOCAL')),
  total_cop INTEGER NOT NULL CHECK (total_cop > 0),
  nota TEXT,
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pedido_cliente_estado_idx ON pedido (cliente_id, estado);
CREATE INDEX pedido_negocio_estado_creado_idx ON pedido (negocio_id, estado, creado_en);

CREATE TABLE pedido_item (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedido(id),
  catalogo_item_id BIGINT REFERENCES catalogo_item(id),
  nombre_copia VARCHAR(120) NOT NULL,
  precio_unitario_cop INTEGER NOT NULL CHECK (precio_unitario_cop > 0),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);
-- Consulta del detalle: las líneas se cargan por pedido.
CREATE INDEX pedido_item_pedido_idx ON pedido_item (pedido_id);
