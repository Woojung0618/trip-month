/**
 * seed 등에서 사용. 프로젝트 루트의 .env를 import 전에 로드해야 하므로
 * 이 파일을 seed.js에서 맨 먼저 import하세요.
 */
import dotenv from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '..', '.env') })
