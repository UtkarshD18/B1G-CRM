ALTER TABLE web_private ADD COLUMN IF NOT EXISTS meta_app_id TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS meta_app_secret TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS meta_waba_id TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS meta_business_account_id TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS meta_access_token TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT;

ALTER TABLE web_private ADD COLUMN IF NOT EXISTS insta_app_id TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS insta_app_secret TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS insta_business_account_id TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS insta_access_token TEXT;

ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_provider_active TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_openai_key TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_openai_model TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_gemini_key TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_gemini_model TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_claude_key TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_claude_model TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_openrouter_key TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_openrouter_model TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_ollama_url TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_ollama_model TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_custom_url TEXT;
ALTER TABLE web_private ADD COLUMN IF NOT EXISTS ai_custom_model TEXT;

ALTER TABLE web_private ADD COLUMN IF NOT EXISTS widget_domains TEXT;
