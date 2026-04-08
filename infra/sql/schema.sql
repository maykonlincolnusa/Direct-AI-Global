CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_status') THEN
    CREATE TYPE video_status AS ENUM (
      'pending',
      'transcribing',
      'transcribed',
      'detecting_clips',
      'processing_clips',
      'processed',
      'failed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clip_status') THEN
    CREATE TYPE clip_status AS ENUM (
      'pending',
      'queued_for_processing',
      'processed',
      'scheduled',
      'published',
      'manual_publish_required',
      'failed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduled_post_status') THEN
    CREATE TYPE scheduled_post_status AS ENUM (
      'scheduled',
      'publishing',
      'published',
      'manual_publish_required',
      'failed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE platform_type AS ENUM ('youtube', 'instagram');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generated_content_status') THEN
    CREATE TYPE generated_content_status AS ENUM (
      'pending',
      'analyzed',
      'script_generated',
      'clip_selected',
      'synthetic_content_required',
      'ready_for_render',
      'queued_for_scheduling',
      'scheduled',
      'failed'
    );
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'facebook';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'x';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'tiktok';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'pinterest';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  origin_type TEXT NOT NULL DEFAULT 'source_video',
  trend_id UUID,
  status video_status NOT NULL DEFAULT 'pending',
  transcript_segments JSONB,
  transcript_text TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE videos ADD COLUMN IF NOT EXISTS origin_type TEXT NOT NULL DEFAULT 'source_video';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS trend_id UUID;

CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  trend_id UUID,
  generated_content_id UUID,
  origin_type TEXT NOT NULL DEFAULT 'video_clip',
  start_time NUMERIC(10, 3) NOT NULL,
  end_time NUMERIC(10, 3) NOT NULL,
  score INTEGER NOT NULL,
  viral_score INTEGER,
  reason TEXT NOT NULL,
  status clip_status NOT NULL DEFAULT 'pending',
  processed_url TEXT,
  subtitle_url TEXT,
  metadata_variants JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clips_time_range_valid CHECK (end_time > start_time)
);

ALTER TABLE clips ADD COLUMN IF NOT EXISTS trend_id UUID;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS generated_content_id UUID;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS origin_type TEXT NOT NULL DEFAULT 'video_clip';

CREATE INDEX IF NOT EXISTS clips_video_id_idx ON clips(video_id);
CREATE INDEX IF NOT EXISTS clips_status_idx ON clips(status);
CREATE INDEX IF NOT EXISTS clips_score_idx ON clips(score DESC);

CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  source TEXT NOT NULL,
  volume INTEGER NOT NULL DEFAULT 0,
  velocity NUMERIC(10, 4) NOT NULL DEFAULT 0,
  score INTEGER,
  novelty NUMERIC(10, 4),
  emotional_impact NUMERIC(10, 4),
  controversy NUMERIC(10, 4),
  summary_json JSONB,
  raw_payload_json JSONB,
  source_metadata JSONB,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic, source)
);

CREATE INDEX IF NOT EXISTS trends_score_idx ON trends(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS trends_last_seen_idx ON trends(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata_json JSONB,
  content_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trend_signals_trend_idx ON trend_signals(trend_id, created_at DESC);

CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
  clip_id UUID,
  script TEXT NOT NULL,
  status generated_content_status NOT NULL DEFAULT 'pending',
  mode TEXT NOT NULL DEFAULT 'synthetic',
  strategy_json JSONB,
  script_url TEXT,
  render_instructions_json JSONB,
  output_metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_content_trend_idx ON generated_content(trend_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generated_content_status_idx ON generated_content(status);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status scheduled_post_status NOT NULL DEFAULT 'scheduled',
  platform platform_type NOT NULL,
  caption TEXT NOT NULL,
  published_url TEXT,
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clip_id, platform)
);

CREATE INDEX IF NOT EXISTS scheduled_posts_scheduled_at_idx ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS scheduled_posts_status_idx ON scheduled_posts(status);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_type NOT NULL UNIQUE,
  credentials_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  status TEXT NOT NULL,
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publish_logs_clip_platform_idx ON publish_logs(clip_id, platform);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'videos_trend_id_fkey'
      AND table_name = 'videos'
  ) THEN
    ALTER TABLE videos
      ADD CONSTRAINT videos_trend_id_fkey
      FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'clips_trend_id_fkey'
      AND table_name = 'clips'
  ) THEN
    ALTER TABLE clips
      ADD CONSTRAINT clips_trend_id_fkey
      FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'clips_generated_content_id_fkey'
      AND table_name = 'clips'
  ) THEN
    ALTER TABLE clips
      ADD CONSTRAINT clips_generated_content_id_fkey
      FOREIGN KEY (generated_content_id) REFERENCES generated_content(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'generated_content_clip_id_fkey'
      AND table_name = 'generated_content'
  ) THEN
    ALTER TABLE generated_content
      ADD CONSTRAINT generated_content_clip_id_fkey
      FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE SET NULL;
  END IF;
END $$;
