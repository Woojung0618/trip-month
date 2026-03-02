/**
 * destinations 테이블에서 emoji 컬럼만 제거. 기존 행·다른 컬럼은 그대로 유지.
 * 실행: cd server && node db/migrate-drop-emoji.js
 */
import db from './connection.js'

const countBefore = db.prepare('SELECT COUNT(*) as c FROM destinations').get().c

db.exec(`
  CREATE TABLE IF NOT EXISTS destinations_new (
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
  INSERT INTO destinations_new (id, "month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude, created_at, updated_at)
  SELECT id, "month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude, created_at, updated_at
  FROM destinations;
  DROP TABLE destinations;
  ALTER TABLE destinations_new RENAME TO destinations;
`)

const countAfter = db.prepare('SELECT COUNT(*) as c FROM destinations').get().c
if (countBefore !== countAfter) throw new Error(`행 수 불일치: ${countBefore} -> ${countAfter}`)

console.log(`emoji 컬럼 제거 완료. 기존 ${countBefore}건 데이터 유지.`)
