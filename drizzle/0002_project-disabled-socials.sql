ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "owner_social_urls" text[] DEFAULT '{}' NOT NULL;
