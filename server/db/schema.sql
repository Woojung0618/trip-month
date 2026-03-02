-- 월별 여행지: country는 국가 코드(ISO 2자리, 예: jp).
-- latitude/longitude가 있으면 해당 도시 위치에 핀, 없으면 지도 레이아웃의 국가 중심에 핀 표시.
DROP TABLE IF EXISTS destinations;
CREATE TABLE destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
