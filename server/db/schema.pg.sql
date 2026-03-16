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

-- 항공권 가격 자동 업데이트용 컬럼 추가
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_source TEXT DEFAULT 'manual';
-- price_source: 'manual' (기본, 수동 입력) | 'duffel' (API 자동 업데이트)

-- 목적지-IATA 공항 코드 매핑 테이블
-- destinations.name + country → IATA 코드 변환에 사용
-- Duffel API 호출 시 destinationLocationCode 파라미터로 사용됨
CREATE TABLE IF NOT EXISTS iata_mappings (
  id               SERIAL PRIMARY KEY,
  destination_name TEXT NOT NULL,   -- destinations.name 과 매칭 (한국어)
  country_code     TEXT NOT NULL,   -- destinations.country 와 매칭 (ISO 2자리)
  iata_code        TEXT NOT NULL,   -- IATA 공항 코드 (예: 'BKK')
  notes            TEXT,            -- 비고 (노선 없음 가능 등)
  created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(destination_name, country_code)
);
