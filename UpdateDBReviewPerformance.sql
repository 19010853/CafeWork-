CREATE INDEX IF NOT EXISTS idx_reviews_cafe_id_created_at
ON reviews (cafe_id, created_at DESC);
