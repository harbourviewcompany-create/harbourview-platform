-- Intelligence Hub Migration

CREATE TABLE IF NOT EXISTS personalized_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_insights JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  embedding vector(1024)
);

ALTER TABLE intelligence_signals ADD COLUMN IF NOT EXISTS sources JSONB;
ALTER TABLE intelligence_signals ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0.8;

CREATE TABLE IF NOT EXISTS observability_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE personalized_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own briefs" ON personalized_briefs FOR SELECT USING (auth.uid() = user_id);