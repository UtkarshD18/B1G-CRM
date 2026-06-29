CREATE TABLE IF NOT EXISTS whatsapp_forms (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  form_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_forms_uid ON whatsapp_forms(uid);

-- Insert seed data for the default user or any user so it shows up in the UI
INSERT INTO whatsapp_forms (uid, name, form_id, status)
VALUES 
  ('local-user-uid', 'New Test', '95049511181580', 'PUBLISHED'),
  ('local-user-uid', 'Contact Form', '95042830645439', 'PUBLISHED')
ON CONFLICT (form_id) DO NOTHING;
