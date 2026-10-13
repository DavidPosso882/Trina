-- V1: base mínima para probar el pipeline Flyway + JPA.
-- El ER completo (§4 diseño) entra en V2. Nunca editar una migración aplicada.
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE TABLE usuario (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(120) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(40),
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('CLIENTE','COMERCIANTE','ADMINISTRADOR')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  es_residente BOOLEAN,
  token_version INT NOT NULL DEFAULT 0,
  cambio_clave_obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  version_consentimiento VARCHAR(20),
  consentimiento_en TIMESTAMPTZ,
  eliminado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuario_email_uk ON usuario (lower(email));

CREATE TABLE categoria_negocio (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  icono VARCHAR(80),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  orden INT NOT NULL DEFAULT 0
);

CREATE TABLE negocio (
  id BIGSERIAL PRIMARY KEY,
  propietario_id BIGINT NOT NULL UNIQUE REFERENCES usuario(id),
  categoria_id BIGINT REFERENCES categoria_negocio(id),
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT,
  direccion VARCHAR(200),
  latitud NUMERIC(9,6) CHECK (latitud BETWEEN -90 AND 90),
  longitud NUMERIC(9,6) CHECK (longitud BETWEEN -180 AND 180),
  estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR'
    CHECK (estado IN ('BORRADOR','PENDIENTE','CORRECCION_SOLICITADA','RECHAZADO','APROBADO','SUSPENDIDO')),
  motivo_revision TEXT,
  acepta_pedidos BOOLEAN NOT NULL DEFAULT TRUE,
  acepta_reservas BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX negocio_estado_idx ON negocio (estado);

CREATE TABLE parametro_sistema (
  clave VARCHAR(80) PRIMARY KEY,
  valor VARCHAR(200) NOT NULL,
  descripcion VARCHAR(300)
);

-- Semillas de demostración (pendientes de validación PO, P-02)
INSERT INTO categoria_negocio (nombre, orden) VALUES
  ('Restaurantes',1),('Cafés',2),('Hospedajes',3),('Artesanías',4),
  ('Tiendas',5),('Servicios',6),('Experiencias y turismo',7);
INSERT INTO parametro_sistema (clave, valor, descripcion) VALUES
  ('comision_pct','5','Porcentaje de comisión sobre pagos SANDBOX (0-30)'),
  ('destacada_precio_cop','19900','Precio mensual plan Destacada (demo)'),
  ('max_destacados_basica','2','Tope destacados plan Básico'),
  ('max_destacados_destacada','6','Tope destacados plan Destacada'),
  ('max_imagenes','10','Máx fotos por negocio'),
  ('max_mb_imagen','5','Máx MB por foto'),
  ('pedido_expira_min','30','Expiración PENDIENTE_PAGO'),
  ('reserva_expira_horas','24','Expiración sin respuesta');
