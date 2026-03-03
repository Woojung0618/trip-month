-- PostgreSQL (Supabase) 스키마
-- DROP 없이 없을 때만 생성 → 재배포해도 데이터 보존
CREATE TABLE IF NOT EXISTS destinations (
  id SERIAL PRIMARY KEY,
  "month" INTEGER NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  country TEXT NOT NULL,
  weather TEXT,
  temperature TEXT,
  reason TEXT,
  imageUrl TEXT,
  averageFlightPrice TEXT,
  affiliateUrl TEXT,
  flightTime TEXT,
  affiliateNote TEXT,
  ctaButtonText TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
