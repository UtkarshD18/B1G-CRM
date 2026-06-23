ALTER TABLE web_private ADD COLUMN IF NOT EXISTS pay_mercadopago_id TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS pay_mercadopago_key TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS mercadopago_active SMALLINT DEFAULT 0;
