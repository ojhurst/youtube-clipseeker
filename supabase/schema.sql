-- YouTube ClipSeeker Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  identifier TEXT,
  subscriber_count TEXT,
  thumbnail TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
  channel_name TEXT,
  thumbnail TEXT,
  thumbnail_high TEXT,
  duration INTEGER DEFAULT 0,
  duration_formatted TEXT,
  language TEXT,
  is_auto_generated BOOLEAN DEFAULT true,
  transcript JSONB NOT NULL DEFAULT '[]',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Failed videos table (for retry functionality)
CREATE TABLE IF NOT EXISTS failed_videos (
  id TEXT PRIMARY KEY,
  title TEXT,
  channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
  channel_name TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_videos_channel_id ON failed_videos(channel_id);

-- Full-text search on video titles
CREATE INDEX IF NOT EXISTS idx_videos_title_search ON videos USING gin(to_tsvector('english', title));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable for production
-- For now, allow all operations (you can add auth later)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_videos ENABLE ROW LEVEL SECURITY;

-- Public access policies (update these when adding authentication)
CREATE POLICY "Allow all access to channels" ON channels FOR ALL USING (true);
CREATE POLICY "Allow all access to videos" ON videos FOR ALL USING (true);
CREATE POLICY "Allow all access to failed_videos" ON failed_videos FOR ALL USING (true);

-- Optional: Create a view for video search with transcript text
CREATE OR REPLACE VIEW video_search AS
SELECT 
  v.id,
  v.title,
  v.channel_id,
  v.channel_name,
  v.thumbnail,
  v.duration,
  v.duration_formatted,
  v.created_at,
  -- Concatenate all transcript text for full-text search
  string_agg(t.value->>'text', ' ') as transcript_text
FROM videos v
CROSS JOIN LATERAL jsonb_array_elements(v.transcript) AS t(value)
GROUP BY v.id, v.title, v.channel_id, v.channel_name, v.thumbnail, v.duration, v.duration_formatted, v.created_at;

-- Stats function
CREATE OR REPLACE FUNCTION get_library_stats()
RETURNS TABLE (
  total_videos BIGINT,
  total_channels BIGINT,
  total_failed BIGINT,
  total_duration_seconds BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM videos)::BIGINT as total_videos,
    (SELECT COUNT(*) FROM channels)::BIGINT as total_channels,
    (SELECT COUNT(*) FROM failed_videos)::BIGINT as total_failed,
    (SELECT COALESCE(SUM(duration), 0) FROM videos)::BIGINT as total_duration_seconds;
END;
$$ LANGUAGE plpgsql;

