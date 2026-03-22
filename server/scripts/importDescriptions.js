/**
 * Claude 채팅 결과를 DB에 반영하는 스크립트
 *
 * 실행:
 *   node server/scripts/importDescriptions.js
 *   node server/scripts/importDescriptions.js --dry-run  # DB 반영 없이 검증만
 */

import '../load-env.js'
import pool from '../db/connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = path.join(__dirname, 'prompts')
const DRY_RUN = process.argv.includes('--dry-run')

function extractJson(text) {
  // JSON 코드블록 또는 순수 JSON 배열 추출
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()
  // 코드블록 없으면 [ ... ] 배열 직접 추출
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) return arrayMatch[0]
  return text.trim()
}

async function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN 모드: 검증만 수행\n')

  // result_*.json 파일 목록
  const files = fs.readdirSync(PROMPTS_DIR)
    .filter(f => f.match(/^result_\d+\.json$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0])
      const nb = parseInt(b.match(/\d+/)[0])
      return na - nb
    })

  if (files.length === 0) {
    console.error('❌ result_*.json 파일이 없습니다.')
    console.error(`   저장 위치: ${PROMPTS_DIR}/result_1.json`)
    process.exit(1)
  }

  console.log(`${files.length}개 결과 파일 발견: ${files.join(', ')}\n`)

  let totalSuccess = 0
  let totalFail = 0
  const allItems = []

  for (const file of files) {
    const filePath = path.join(PROMPTS_DIR, file)
    const raw = fs.readFileSync(filePath, 'utf-8')

    let items
    try {
      const jsonStr = extractJson(raw)
      items = JSON.parse(jsonStr)
      if (!Array.isArray(items)) throw new Error('배열이 아닙니다')
    } catch (e) {
      console.error(`❌ ${file} 파싱 실패: ${e.message}`)
      totalFail++
      continue
    }

    console.log(`📄 ${file}: ${items.length}개 항목`)
    for (const item of items) {
      if (!item.id || !item.reason) {
        console.warn(`  ⚠️  id 또는 reason 누락: ${JSON.stringify(item).slice(0, 80)}`)
        totalFail++
        continue
      }
      allItems.push(item)
    }
  }

  console.log(`\n총 ${allItems.length}개 항목 처리 예정`)
  if (DRY_RUN) {
    console.log('\n샘플 3개:')
    allItems.slice(0, 3).forEach(item => {
      console.log(`  ID ${item.id}: ${item.reason.slice(0, 80)}...`)
    })
    console.log('\n--dry-run 완료. DB 반영하려면 --dry-run 없이 실행하세요.')
    await pool.end()
    return
  }

  // DB 업데이트
  for (const item of allItems) {
    try {
      const result = await pool.query(
        'UPDATE destinations SET reason = $1, updated_at = NOW() WHERE id = $2',
        [item.reason.trim(), item.id]
      )
      if (result.rowCount === 0) {
        console.warn(`  ⚠️  ID ${item.id}: 해당 레코드 없음`)
        totalFail++
      } else {
        totalSuccess++
      }
    } catch (e) {
      console.error(`  ❌ ID ${item.id} 업데이트 실패: ${e.message}`)
      totalFail++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ 성공: ${totalSuccess}개`)
  console.log(`❌ 실패: ${totalFail}개`)

  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
