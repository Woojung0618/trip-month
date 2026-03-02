/**
 * 국가 코드(ISO 2자리) → 대륙 매핑.
 * 필터에서 사용.
 */
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  jp: '아시아', kr: '아시아', th: '아시아', sg: '아시아', id: '아시아', cn: '아시아',
  tw: '아시아', vn: '아시아', ph: '아시아', my: '아시아', in: '아시아', hk: '아시아',
  mo: '아시아', kh: '아시아', lk: '아시아', mm: '아시아', bt: '아시아',
  sa: '아시아', ae: '아시아', il: '아시아', qa: '아시아', om: '아시아', bh: '아시아', kw: '아시아',
  ru: '유럽', // 러시아는 일부만 유럽이지만 필터용으로 유럽
  fr: '유럽', gb: '유럽', it: '유럽', de: '유럽', es: '유럽', pt: '유럽', nl: '유럽',
  gr: '유럽', tr: '유럽', ch: '유럽', at: '유럽', be: '유럽', pl: '유럽', cz: '유럽',
  hu: '유럽', ro: '유럽', hr: '유럽', me: '유럽', ie: '유럽', se: '유럽', no: '유럽',
  dk: '유럽', fi: '유럽', is: '유럽',
  us: '북아메리카', ca: '북아메리카', mx: '북아메리카', cu: '북아메리카', cr: '북아메리카',
  br: '남아메리카', ar: '남아메리카', cl: '남아메리카', co: '남아메리카', pe: '남아메리카',
  bo: '남아메리카', ec: '남아메리카',
  eg: '아프리카', za: '아프리카', ke: '아프리카', ma: '아프리카', mv: '아프리카', tn: '아프리카',
  au: '오세아니아', nz: '오세아니아',
}

export const CONTINENT_OPTIONS = ['아시아', '유럽', '북아메리카', '남아메리카', '아프리카', '오세아니아'] as const
export type Continent = (typeof CONTINENT_OPTIONS)[number]

/** UI용 대륙 옵션 (아메리카 통합). 프리뷰와 동일 */
export const CONTINENT_OPTIONS_UI: { value: string; label: string; emoji: string }[] = [
  { value: '아시아', label: '아시아', emoji: '🌏' },
  { value: '유럽', label: '유럽', emoji: '🌍' },
  { value: '아메리카', label: '아메리카', emoji: '🌎' },
  { value: '오세아니아', label: '오세아니아', emoji: '🏝️' },
  { value: '아프리카', label: '아프리카', emoji: '🌍' },
]

/** 국가 코드 → 대륙. 없으면 '기타' */
export function getContinentByCountry(code: string): string {
  const c = code?.trim().toLowerCase()
  return (c && COUNTRY_TO_CONTINENT[c]) || '기타'
}

/** UI에서 선택한 대륙 값(아메리카 등)이 해당 국가와 일치하는지 */
export function destinationMatchesContinent(continentUiValue: string, countryCode: string): boolean {
  const raw = getContinentByCountry(countryCode)
  if (continentUiValue === '아메리카') return raw === '북아메리카' || raw === '남아메리카'
  return raw === continentUiValue
}
