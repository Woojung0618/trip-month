/**
 * 기존 DB에 tagline(한줄 소개) 컬럼 추가.
 * 사용: node server/db/migrate-add-tagline.js
 */
import db from './connection.js'

try {
  db.exec('ALTER TABLE destinations ADD COLUMN tagline TEXT')
  console.log('Migration done: tagline')
} catch (e) {
  if (!e.message?.includes('duplicate column name')) throw e
  console.log('Column tagline already exists')
}
