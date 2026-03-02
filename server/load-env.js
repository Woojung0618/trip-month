/**
 * 앱 진입 전에 .env 로드 (admin 등에서 process.env를 참조하기 전에 실행되어야 함)
 */
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })
