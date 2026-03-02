/**
 * 국가 코드(ISO 3166-1 alpha-2) + 한글 이름.
 * 지도 핀 위치는 figmaCountryLayout의 해당 코드 좌표로 표시.
 */
export const COUNTRY_LIST: { code: string; nameKo: string }[] = [
  { code: 'jp', nameKo: '일본' },
  { code: 'th', nameKo: '태국' },
  { code: 'fr', nameKo: '프랑스' },
  { code: 'kr', nameKo: '한국' },
  { code: 'sg', nameKo: '싱가포르' },
  { code: 'id', nameKo: '인도네시아' },
  { code: 'gb', nameKo: '영국' },
  { code: 'pt', nameKo: '포르투갈' },
  { code: 'it', nameKo: '이탈리아' },
  { code: 'us', nameKo: '미국' },
  { code: 'au', nameKo: '호주' },
  { code: 'hk', nameKo: '홍콩' },
  { code: 'cn', nameKo: '중국' },
  { code: 'tw', nameKo: '대만' },
  { code: 'vn', nameKo: '베트남' },
  { code: 'ph', nameKo: '필리핀' },
  { code: 'my', nameKo: '말레이시아' },
  { code: 'in', nameKo: '인도' },
  { code: 'de', nameKo: '독일' },
  { code: 'es', nameKo: '스페인' },
  { code: 'nl', nameKo: '네덜란드' },
  { code: 'gr', nameKo: '그리스' },
  { code: 'tr', nameKo: '터키' },
  { code: 'eg', nameKo: '이집트' },
  { code: 'ae', nameKo: '아랍에미리트' },
  { code: 'ru', nameKo: '러시아' },
  { code: 'br', nameKo: '브라질' },
  { code: 'mx', nameKo: '멕시코' },
  { code: 'ca', nameKo: '캐나다' },
  { code: 'nz', nameKo: '뉴질랜드' },
  { code: 'mo', nameKo: '마카오' },
  { code: 'ch', nameKo: '스위스' },
  { code: 'at', nameKo: '오스트리아' },
  { code: 'be', nameKo: '벨기에' },
  { code: 'pl', nameKo: '폴란드' },
  { code: 'cz', nameKo: '체코' },
  { code: 'hu', nameKo: '헝가리' },
  { code: 'ro', nameKo: '루마니아' },
  { code: 'sa', nameKo: '사우디아라비아' },
  { code: 'il', nameKo: '이스라엘' },
  { code: 'qa', nameKo: '카타르' },
  { code: 'om', nameKo: '오만' },
  { code: 'bh', nameKo: '바레인' },
  { code: 'kw', nameKo: '쿠웨이트' },
  { code: 'za', nameKo: '남아프리카공화국' },
  { code: 'ke', nameKo: '케냐' },
  { code: 'ma', nameKo: '모로코' },
  { code: 'mv', nameKo: '몰디브' },
  { code: 'tn', nameKo: '튀니지' },
  { code: 'ar', nameKo: '아르헨티나' },
  { code: 'cl', nameKo: '칠레' },
  { code: 'co', nameKo: '콜롬비아' },
  { code: 'pe', nameKo: '페루' },
  { code: 'bo', nameKo: '볼리비아' },
  { code: 'cu', nameKo: '쿠바' },
  { code: 'cr', nameKo: '코스타리카' },
  { code: 'kh', nameKo: '캄보디아' },
  { code: 'lk', nameKo: '스리랑카' },
  { code: 'mm', nameKo: '미얀마' },
  { code: 'hr', nameKo: '크로아티아' },
  { code: 'me', nameKo: '몬테네그로' },
  { code: 'ec', nameKo: '에콰도르' },
  { code: 'ie', nameKo: '아일랜드' },
  { code: 'se', nameKo: '스웨덴' },
  { code: 'no', nameKo: '노르웨이' },
  { code: 'dk', nameKo: '덴마크' },
  { code: 'fi', nameKo: '핀란드' },
  { code: 'is', nameKo: '아이슬란드' },
  { code: 'bt', nameKo: '부탄' },
]

const CODE_TO_NAME_KO = Object.fromEntries(COUNTRY_LIST.map((c) => [c.code, c.nameKo]))
const NAME_KO_TO_CODE = Object.fromEntries(COUNTRY_LIST.map((c) => [c.nameKo.trim(), c.code]))

/** 엑셀 등에서 쓰이는 한글 별칭 → 국가 코드 */
const NAME_KO_ALIASES: Record<string, string> = {
  타이완: 'tw',
  튀르키예: 'tr',
}

/** 국가 코드 → 한글 이름. 없으면 코드 그대로 반환 */
export function codeToNameKo(code: string): string {
  if (!code || typeof code !== 'string') return ''
  const lower = code.trim().toLowerCase()
  return CODE_TO_NAME_KO[lower] ?? lower
}

/** 한글 국가명 또는 2자리 코드 → 국가 코드. 엑셀 업로드 등에서 사용 */
export function nameKoToCode(nameOrCode: string): string {
  if (!nameOrCode || typeof nameOrCode !== 'string') return ''
  const s = nameOrCode.trim()
  if (s.length === 2) return s.toLowerCase()
  return NAME_KO_ALIASES[s] ?? NAME_KO_TO_CODE[s] ?? s.toLowerCase()
}

/** 관리자 국가 선택용 (code + nameKo) */
export function getCountriesForSelect(): { code: string; nameKo: string }[] {
  return [...COUNTRY_LIST]
}
