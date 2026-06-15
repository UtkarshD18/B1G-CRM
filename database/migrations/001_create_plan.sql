\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS plan (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  allow_tag SMALLINT DEFAULT 0,
  allow_note SMALLINT DEFAULT 0,
  allow_chatbot SMALLINT DEFAULT 0,
  contact_limit INTEGER DEFAULT 0,
  allow_api SMALLINT DEFAULT 0,
  is_trial SMALLINT DEFAULT 0,
  price NUMERIC(12, 2) DEFAULT 0,
  price_strike NUMERIC(12, 2) DEFAULT 0,
  plan_duration_in_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plan_is_trial ON plan(is_trial);

INSERT INTO plan (
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days
)
SELECT
  'Trial',
  '10-day evaluation for onboarding teams',
  1,
  1,
  1,
  1000,
  1,
  1,
  0,
  0,
  10
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE title = 'Trial');

INSERT INTO plan (
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days
)
SELECT
  'Premium',
  'Core inbox, automation, and campaign workspace',
  1,
  1,
  1,
  100000,
  1,
  0,
  149,
  199,
  365
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE title = 'Premium');

INSERT INTO plan (
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days
)
SELECT
  'Platinum',
  'Broader automation, API, and scaling controls',
  1,
  1,
  1,
  250000,
  1,
  0,
  299,
  399,
  365
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE title = 'Platinum');
