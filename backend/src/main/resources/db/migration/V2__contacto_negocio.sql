-- V2: contactos del negocio (RF-14). Horarios e imágenes llegan en V3.
ALTER TABLE negocio ADD COLUMN IF NOT EXISTS telefono VARCHAR(40);
ALTER TABLE negocio ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(40);
