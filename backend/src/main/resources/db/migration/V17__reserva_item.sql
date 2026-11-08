-- V11: la reserva puede apuntar a un producto/habitación del catálogo. Nunca editar V1-V15.
ALTER TABLE reserva ADD COLUMN item_id BIGINT NULL REFERENCES catalogo_item(id);
CREATE INDEX reserva_item_idx ON reserva (item_id);
