/**
 * 기존 DB에 latitude, longitude 컬럼 추가.
 * 새로 schema.sql로 DB를 만든 경우에는 실행할 필요 없음.
 * 사용: node server/db/migrate-add-lat-lng.js
 */
import db from './connection.js'

try {
  db.exec('ALTER TABLE destinations ADD COLUMN latitude REAL')
} catch (e) {
  if (!e.message?.includes('duplicate column name')) throw e
}
try {
  db.exec('ALTER TABLE destinations ADD COLUMN longitude REAL')
} catch (e) {
  if (!e.message?.includes('duplicate column name')) throw e
}
console.log('Migration done: latitude, longitude')
