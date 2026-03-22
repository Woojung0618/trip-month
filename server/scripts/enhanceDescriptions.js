/**
 * Claude API로 여행지 소개 문구 보강 스크립트
 *
 * 실행 전 준비:
 *   cd server && npm install @anthropic-ai/sdk
 *
 * 실행:
 *   node server/scripts/enhanceDescriptions.js
 *   node server/scripts/enhanceDescriptions.js --dry-run    # 샘플 3개만 미리보기
 *   node server/scripts/enhanceDescriptions.js --from=50    # 50번째부터 재개
 *
 * 동작:
 *  1. DB에서 220개 여행지 전체 조회
 *  2. 각 여행지마다 Claude API 호출 → 생생한 여행 블로그 스타일 소개 생성
 *  3. DB reason 필드 업데이트
 */

import '../load-env.js'
import pool from '../db/connection.js'
import Anthropic from '@anthropic-ai/sdk'

const DRY_RUN = process.argv.includes('--dry-run')
const FROM_INDEX = (() => {
  const arg = process.argv.find((a) => a.startsWith('--from='))
  return arg ? parseInt(arg.split('=')[1], 10) : 0
})()

const MONTH_NAMES = {
  1: '1월', 2: '2월', 3: '3월', 4: '4월', 5: '5월', 6: '6월',
  7: '7월', 8: '8월', 9: '9월', 10: '10월', 11: '11월', 12: '12월',
}

const client = new Anthropic()

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function buildPrompt(dest) {
  const monthName = MONTH_NAMES[dest.month] ?? `${dest.month}월`
  return `당신은 한국인 여행 전문 블로거입니다. 아래 여행지의 소개 문구를 실제 다녀온 사람처럼 생생하게 작성해주세요.

여행지 정보:
- 도시: ${dest.name}
- 국가 코드: ${dest.country}
- 추천 월: ${monthName}
- 날씨: ${dest.weather ?? ''}, 기온: ${dest.temperature ?? ''}
- 기존 소개: ${dest.reason ?? ''}

작성 요건:
1. **이 달에만 경험할 수 있는 것** - ${monthName}의 계절 특성, 현지 행사/축제, 기후 장점을 구체적으로 언급
2. **추천 코스 힌트** - 2박3일 또는 3박4일 핵심 일정 (예: "첫날은 ~, 둘째 날은 ~")
3. **현실적인 예산 안내** - 숙소/식비/주요 입장료 수준 (예: 하루 숙소 약 5-8만 원)
4. **꼭 알아야 할 주의사항** - 관광 혼잡도, 예약 필수 여부, 날씨 대비 팁 등
5. **현지 감성** - 냄새, 소리, 분위기를 느낄 수 있는 생생한 표현 포함
6. **마지막 문장** - "지금 당장 항공권을 검색하게" 만드는 설레는 마무리

형식:
- 200~350자 한국어 (공백 포함)
- 자연스러운 문단 없이 하나의 텍스트 덩어리
- 제목, 번호, 불릿 포인트 없이 순수 본문만
- 오직 소개 텍스트만 반환 (다른 말 없이)

지금 바로 작성해주세요:`
}

async function generateDescription(dest, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: buildPrompt(dest) }],
      })
      const text = response.content[0]?.text?.trim()
      if (!text) throw new Error('빈 응답')
      return text
    } catch (err) {
      if (attempt < retries) {
        console.log(`  재시도 ${attempt + 1}/${retries}...`)
        await sleep(3000)
      } else {
        throw err
      }
    }
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY가 없습니다. .env 또는 환경변수로 설정하세요.')
    process.exit(1)
  }

  const { rows: destinations } = await pool.query(
    `SELECT id, month, name, country, weather, temperature, reason, tagline
     FROM destinations
     ORDER BY month, id`
  )

  const targets = destinations.slice(FROM_INDEX)
  const total = targets.length

  console.log(`\n여행지 소개 보강 시작`)
  console.log(`전체 ${destinations.length}개 중 ${FROM_INDEX}번째부터 ${total}개 처리`)
  if (DRY_RUN) console.log('🔍 DRY RUN: 샘플 3개만 출력, DB 업데이트 없음\n')

  const stats = { success: 0, failed: 0, skipped: 0 }
  const limit = DRY_RUN ? 3 : total

  for (let i = 0; i < limit; i++) {
    const dest = targets[i]
    const globalIndex = FROM_INDEX + i + 1
    const prefix = `[${globalIndex}/${destinations.length}] ${dest.name}(${dest.country}, ${dest.month}월)`

    process.stdout.write(`${prefix} 생성 중...`)

    try {
      const newReason = await generateDescription(dest)

      if (DRY_RUN) {
        console.log('\n\n기존:', dest.reason)
        console.log('신규:', newReason)
        console.log('-'.repeat(60))
        stats.success++
      } else {
        await pool.query(
          'UPDATE destinations SET reason = $1, updated_at = NOW() WHERE id = $2',
          [newReason, dest.id]
        )
        console.log(` ✅ (${newReason.length}자)`)
        stats.success++
      }
    } catch (err) {
      console.log(` ❌ 실패: ${err.message}`)
      stats.failed++
    }

    // Rate limit 대비: 요청 간 1.2초 딜레이
    if (i < limit - 1) await sleep(1200)
  }

  console.log('\n' + '='.repeat(60))
  console.log('처리 완료')
  console.log(`✅ 성공: ${stats.success}개`)
  console.log(`❌ 실패: ${stats.failed}개`)
  if (stats.failed > 0) {
    console.log(`\n💡 실패한 항목은 --from=${FROM_INDEX + stats.success} 으로 재실행하세요.`)
  }

  await pool.end()
}

main().catch((err) => {
  console.error('스크립트 오류:', err)
  process.exit(1)
})
