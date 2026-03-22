/**
 * Claude 채팅용 배치 프롬프트 생성 스크립트
 *
 * 실행:
 *   node server/scripts/generatePrompts.js
 *
 * 결과:
 *   prompts/batch_1.txt, batch_2.txt, ... (50개씩 분할)
 *   → 각 파일을 Claude 채팅에 붙여넣기
 *   → Claude 응답을 prompts/result_1.json 등으로 저장
 *   → node server/scripts/importDescriptions.js 로 DB 반영
 */

import '../load-env.js'
import pool from '../db/connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, 'prompts')
const BATCH_SIZE = 50

const COUNTRY_NAMES = {
  th: '태국', vn: '베트남', pt: '포르투갈', es: '스페인', ma: '모로코',
  cu: '쿠바', mx: '멕시코', us: '미국', jp: '일본', mv: '몰디브',
  ae: '아랍에미리트', id: '인도네시아', it: '이탈리아', ie: '아일랜드',
  nl: '네덜란드', br: '브라질', ar: '아르헨티나', cz: '체코',
  fr: '프랑스', gr: '그리스', tr: '터키', pe: '페루', ca: '캐나다',
  au: '호주', sg: '싱가포르', gb: '영국', de: '독일', ch: '스위스',
  at: '오스트리아', pl: '폴란드', hu: '헝가리', hr: '크로아티아',
  me: '몬테네그로', ec: '에콰도르', is: '아이슬란드', no: '노르웨이',
  dk: '덴마크', fi: '핀란드', se: '스웨덴', ru: '러시아', cn: '중국',
  tw: '대만', hk: '홍콩', ph: '필리핀', my: '말레이시아', in: '인도',
  kh: '캄보디아', lk: '스리랑카', mm: '미얀마', bt: '부탄',
  bo: '볼리비아', cl: '칠레', co: '콜롬비아', cr: '코스타리카',
  np: '네팔', ge: '조지아', si: '슬로베니아', lv: '라트비아',
  lt: '리투아니아', ee: '에스토니아', uz: '우즈베키스탄',
  ke: '케냐', eg: '이집트', za: '남아프리카공화국', pa: '파나마',
}

const MONTH_NAMES = {
  1:'1월', 2:'2월', 3:'3월', 4:'4월', 5:'5월', 6:'6월',
  7:'7월', 8:'8월', 9:'9월', 10:'10월', 11:'11월', 12:'12월',
}

function buildBatchPrompt(destinations, batchNum, totalBatches) {
  const destList = destinations.map(d => {
    const countryName = COUNTRY_NAMES[d.country] ?? d.country
    return `### ID: ${d.id}
도시: ${d.name} (${countryName}, ${MONTH_NAMES[d.month]} 추천)
날씨: ${d.weather ?? ''} / ${d.temperature ?? ''}
현재 소개: ${d.reason ?? '없음'}`
  }).join('\n\n')

  return `당신은 한국인 여행 전문 블로거입니다. 아래 ${destinations.length}개 여행지 각각의 여행지 소개 문구를 작성해주세요.

## 작성 규칙
각 여행지마다 다음을 반드시 포함하세요:
1. **이 월에만 경험할 수 있는 것** - 계절 특성, 현지 행사/축제, 기후 장점
2. **추천 코스 힌트** - 2박3일 핵심 일정 (첫날은 ~, 둘째날은 ~ 형태)
3. **현실적인 예산 안내** - 숙소/식비 수준 (예: 하루 숙소 5~8만원 수준)
4. **꼭 알아야 할 주의사항** - 혼잡도, 예약 필수 여부, 날씨 대비
5. **현지 감성** - 냄새, 소리, 분위기를 느낄 수 있는 생생한 표현
6. **마무리 문장** - 지금 당장 항공권을 검색하게 만드는 설레는 한 줄

## 형식 규칙
- 200~350자 한국어
- 줄바꿈 없이 한 덩어리 텍스트
- 번호, 제목, 불릿 없이 순수 본문만

## 출력 형식 (반드시 이 JSON 형식으로만 출력)
\`\`\`json
[
  {"id": 1, "reason": "여기에 소개 텍스트"},
  {"id": 2, "reason": "여기에 소개 텍스트"}
]
\`\`\`

---

## 여행지 목록 (배치 ${batchNum}/${totalBatches})

${destList}

---

위 ${destinations.length}개 여행지의 소개 문구를 JSON 형식으로 작성해주세요.`
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const { rows } = await pool.query(
    `SELECT id, month, name, country, weather, temperature, reason
     FROM destinations ORDER BY month, id`
  )

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
  console.log(`\n총 ${rows.length}개 여행지 → ${totalBatches}개 배치 파일 생성\n`)

  for (let i = 0; i < totalBatches; i++) {
    const batch = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    const batchNum = i + 1
    const prompt = buildBatchPrompt(batch, batchNum, totalBatches)
    const filename = path.join(OUTPUT_DIR, `batch_${batchNum}.txt`)
    fs.writeFileSync(filename, prompt, 'utf-8')
    console.log(`✅ batch_${batchNum}.txt 생성 (${batch.length}개, ID ${batch[0].id}~${batch[batch.length-1].id})`)
  }

  // 사용법 안내 파일 생성
  const readme = `# Claude 채팅 배치 작업 가이드

## 순서
1. batch_1.txt ~ batch_${totalBatches}.txt 파일을 순서대로 Claude 채팅에 붙여넣기
2. Claude 응답(JSON 코드블록)을 복사해서 result_1.json, result_2.json 등으로 저장
   - 파일명은 배치 번호와 맞춰야 합니다 (batch_1 → result_1.json)
   - JSON 코드블록만 저장 ([ 로 시작해서 ] 로 끝나는 부분만)
3. 모든 result 파일 저장 후 import 실행:
   cd /Users/woojung/Projects/trip-map-global/.claude/worktrees/epic-almeida
   node server/scripts/importDescriptions.js

## 파일 위치
- 프롬프트: server/scripts/prompts/batch_*.txt
- 결과 저장: server/scripts/prompts/result_*.json
`
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme, 'utf-8')
  console.log(`\n📁 파일 위치: server/scripts/prompts/`)
  console.log(`📖 사용법: server/scripts/prompts/README.md`)

  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
