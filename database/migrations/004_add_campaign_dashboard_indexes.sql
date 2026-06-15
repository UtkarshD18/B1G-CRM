CREATE INDEX IF NOT EXISTS idx_broadcast_uid_schedule ON broadcast(uid, schedule);
CREATE INDEX IF NOT EXISTS idx_broadcast_uid_created_at ON broadcast(uid, created_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_uid_created_at ON broadcast_log(uid, created_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_uid_updated_at ON broadcast_log(uid, updated_at);
