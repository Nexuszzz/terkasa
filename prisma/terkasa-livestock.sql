-- Additive upgrade for an existing UMKMan PostgreSQL database.
-- Existing products, business IDs, users, and transactions are preserved.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "livestock" JSONB;
