# Duffel API 레퍼런스

Duffel 항공권 검색 API 공식 문서: https://duffel.com/docs/api

---

## 개요

| 항목 | 값 |
|------|-----|
| Base URL | `https://api.duffel.com` |
| 인증 헤더 | `Authorization: Bearer {DUFFEL_API_TOKEN}` |
| API 버전 헤더 | `Duffel-Version: v2` (필수) |
| Content-Type | `application/json` |
| 날짜 포맷 | `YYYY-MM-DD` |
| 토큰 종류 | `duffel_test_XXXX` (테스트) / `duffel_live_XXXX` (실서비스) |

---

## 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/air/offer_requests` | 항공편 검색 (오퍼 요청 생성) |
| `GET` | `/air/offers` | 오퍼 목록 조회 (정렬·필터) |
| `GET` | `/air/offers/{id}` | 특정 오퍼 상세 조회 (현재가 재확인) |
| `POST` | `/air/offers/{id}/actions/price` | 오퍼 가격 확정 (결제 수단 포함) |

---

## 1. POST /air/offer_requests — 항공편 검색

### 요청

```http
POST https://api.duffel.com/air/offer_requests?return_offers=true
Authorization: Bearer duffel_live_XXXX
Duffel-Version: v2
Content-Type: application/json
```

#### Query Parameters

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `return_offers` | boolean | `true` | 응답에 오퍼 즉시 포함 여부. `false`면 별도 GET /air/offers 호출 필요 |
| `supplier_timeout` | number (ms) | `20000` | 항공사 응답 대기 시간 (2,000~60,000) |

#### Body Parameters

```json
{
  "data": {
    "slices": [
      {
        "origin": "ICN",
        "destination": "BKK",
        "departure_date": "2026-06-17"
      }
    ],
    "passengers": [
      { "type": "adult" }
    ],
    "cabin_class": "economy",
    "max_connections": 1,
    "private_fares": {
      "KE": { "corporate_code": "ABC123" }
    }
  }
}
```

##### `slices[]` — 구간 정보 (필수)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `origin` | string | ✅ | 출발지 IATA 공항/도시 코드 (예: `"ICN"`, `"SEL"`) |
| `destination` | string | ✅ | 도착지 IATA 공항/도시 코드 (예: `"BKK"`, `"TYO"`) |
| `departure_date` | string | ✅ | 출발 날짜 `YYYY-MM-DD` |

- 편도: slices 1개 / 왕복: slices 2개 / 다구간: slices 3개 이상

##### `passengers[]` — 탑승객 정보 (필수)

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | `"adult"` / `"child"` / `"infant_without_seat"` |
| `age` | number | 만 나이 (18세 미만 또는 특수 운임 적용 시) |
| `loyalty_programme_accounts` | array | 마일리지 프로그램 정보 |

##### 선택 파라미터

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `cabin_class` | string | - | `"economy"` / `"premium_economy"` / `"business"` / `"first"` |
| `max_connections` | number | `1` | 최대 경유 횟수 (0 = 직항만) |
| `private_fares` | object | - | 항공사별 기업 코드 (`{ "KE": { "corporate_code": "..." } }`) |

---

## 2. 응답 구조 — Offer

`return_offers=true`일 때 `data.offers[]` 배열로 반환됨.

### 최상위 Offer 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 오퍼 고유 ID (`"off_XXX"`) |
| `created_at` | ISO8601 | 생성 시각 |
| `expires_at` | ISO8601 | 만료 시각 (보통 30분 후) — 예약은 만료 전에 해야 함 |
| `live_mode` | boolean | `true`=실서비스, `false`=테스트 |
| `owner` | object | 오퍼를 제공하는 항공사 정보 |
| `partial` | boolean | 부분 예약 가능 여부 |

### 가격 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `total_amount` | string | **세금 포함 최종 가격** (예: `"523400.00"`) |
| `total_currency` | string | 통화 코드 (예: `"GBP"`, `"USD"`, `"EUR"`) |
| `base_amount` | string | 세금 제외 기본 운임 |
| `base_currency` | string | 기본 운임 통화 |
| `tax_amount` | string \| null | 세금 합계 |
| `tax_currency` | string \| null | 세금 통화 |
| `total_emissions_kg` | string \| null | 탄소 배출량 추정치 (kg) |

> ⚠️ **KRW 직접 반환 불가**: Duffel은 계정 통화(주로 GBP/USD)로 반환. KRW 변환에는 [Frankfurter API](https://frankfurter.app) 사용.

### 항공사 정보 (`owner`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `iata_code` | string | 2자리 항공사 코드 (예: `"KE"`, `"OZ"`) |
| `name` | string | 항공사 전체 이름 (예: `"Korean Air"`) |
| `logo_symbol_url` | string | 항공사 심볼 로고 URL (SVG) |
| `logo_lockup_url` | string | 항공사 로고+이름 조합 이미지 URL (SVG) |

### 환불·변경 조건 (`conditions`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `change_before_departure.allowed` | boolean | 출발 전 일정 변경 가능 여부 |
| `change_before_departure.penalty_amount` | string \| null | 변경 수수료 |
| `refund_before_departure.allowed` | boolean | 출발 전 환불 가능 여부 |
| `refund_before_departure.penalty_amount` | string \| null | 환불 수수료 |

### 결제 정보 (`payment_requirements`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `payment_required_by` | ISO8601 \| null | 결제 마감 시각 |
| `price_guarantee_expires_at` | ISO8601 \| null | 현재 가격 보장 만료 시각 |
| `requires_instant_payment` | boolean | 즉시 결제 필요 여부 |

---

## 3. Slices & Segments — 구간·편 정보

### Slice 필드 (`slices[]`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 슬라이스 ID |
| `origin` | object | 출발 공항 정보 (아래 Airport 구조 참고) |
| `destination` | object | 도착 공항 정보 |
| `departure_date` | string | 출발 날짜 |
| `duration` | string | 총 소요 시간 (ISO 8601, 예: `"PT10H30M"`) |
| `segments` | array | 개별 항공편 목록 (경유 시 여러 개) |
| `fare_brand_name` | string \| null | 운임 브랜드 (예: `"Light"`, `"Flex"`) |
| `conditions` | object | 슬라이스별 변경/환불 조건 |

### Segment 필드 (`slices[].segments[]`) — 개별 항공편

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 세그먼트 ID |
| `flight_number` | string | 편명 (예: `"KE651"`) |
| `marketing_carrier` | object | 마케팅 항공사 (코드셰어 시 판매사) |
| `operating_carrier` | object | 실제 운항 항공사 |
| `aircraft` | object \| null | 기종 정보 |
| `origin` | object | 출발 공항 |
| `destination` | object | 도착 공항 |
| `departing_at` | ISO8601 | 출발 일시 (로컬 타임) |
| `arriving_at` | ISO8601 | 도착 일시 (로컬 타임) |
| `duration` | string | 비행 시간 (ISO 8601, 예: `"PT6H15M"`) |
| `distance` | string \| null | 비행 거리 (km) |
| `stops` | array | 경유 정보 (경유지 공항·시간) |
| `origin_terminal` | string \| null | 출발 터미널 |
| `destination_terminal` | string \| null | 도착 터미널 |
| `passengers` | array | 탑승객별 좌석등급·수하물 정보 |

### Airport 구조 (origin / destination)

| 필드 | 타입 | 설명 |
|------|------|------|
| `iata_code` | string | 공항 코드 (예: `"ICN"`) |
| `name` | string | 공항 이름 (예: `"Incheon International Airport"`) |
| `city_name` | string | 도시 이름 (예: `"Seoul"`) |
| `iata_city_code` | string | 도시 코드 (예: `"SEL"`) |
| `iata_country_code` | string | 국가 코드 (예: `"KR"`) |
| `latitude` | number | 위도 |
| `longitude` | number | 경도 |
| `time_zone` | string | 타임존 (예: `"Asia/Seoul"`) |

### Aircraft 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| `iata_code` | string | 기종 코드 (예: `"388"` = A380) |
| `name` | string | 기종 이름 (예: `"Airbus Industries A380"`) |

---

## 4. 수하물 정보

### 기본 포함 수하물 — `slices[].segments[].passengers[].baggages[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | `"checked"` (위탁) / `"carry_on"` (기내) |
| `quantity` | number | 허용 개수 |

### 추가 구매 수하물 — `available_services[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 서비스 ID |
| `type` | string | `"baggage"` / `"seat"` / `"meal"` 등 |
| `total_amount` | string | 추가 요금 |
| `total_currency` | string | 통화 |
| `maximum_quantity` | number | 최대 추가 가능 수량 |
| `passengers` | array | 적용 탑승객 ID 목록 |
| `segments` | array | 적용 구간 ID 목록 |

---

## 5. GET /air/offers — 오퍼 목록 조회

`return_offers=false`로 검색한 경우, 또는 정렬·필터링이 필요할 때 사용.

```http
GET https://api.duffel.com/air/offers?offer_request_id=orq_XXX&sort=total_amount
Authorization: Bearer duffel_live_XXXX
Duffel-Version: v2
```

#### Query Parameters

| 파라미터 | 설명 |
|----------|------|
| `offer_request_id` | (필수) 검색 요청 ID |
| `sort` | `total_amount` (저가순) / `-total_amount` (고가순) |
| `max_connections` | 경유 횟수 필터 (0 = 직항만) |

---

## 6. 활용 가능한 주요 데이터 요약

| 데이터 | 경로 | 활용 예시 |
|--------|------|-----------|
| 최저 가격 | `offers[0].total_amount` | 가격 비교·표시 |
| 통화 | `offers[0].total_currency` | KRW 환율 변환 |
| 항공사명 | `offers[0].owner.name` | "Korean Air 최저가" |
| 항공사 로고 | `offers[0].owner.logo_symbol_url` | 로고 이미지 표시 |
| 출발·도착 시각 | `segments[].departing_at`, `arriving_at` | 시간표 표시 |
| 총 비행 시간 | `slices[].duration` | `"PT10H30M"` → 10시간 30분 |
| 경유 횟수 | `slices[].segments.length - 1` | 직항 여부 판단 |
| 기종 | `segments[].aircraft.name` | "A380 운항" 표시 |
| 편명 | `segments[].flight_number` | "KE651" |
| 수하물 포함 | `segments[].passengers[].baggages[]` | 위탁 수하물 포함 여부 |
| 환불 가능 여부 | `conditions.refund_before_departure.allowed` | "환불 가능" 배지 |
| 변경 가능 여부 | `conditions.change_before_departure.allowed` | "날짜 변경 가능" 배지 |
| 탄소 배출량 | `total_emissions_kg` | 친환경 정보 표시 |
| 운임 브랜드 | `slices[].fare_brand_name` | "Light / Flex" 표시 |
| 오퍼 만료 | `expires_at` | 예약 카운트다운 |

---

## 7. Rate Limit

| 항목 | 값 |
|------|-----|
| 기본 제한 | **120 req / 60초** (라이브 환경) |
| 초과 시 응답 | HTTP `429 Too Many Requests` |
| 응답 헤더 | `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset` |
| 권장 딜레이 | 요청 간 500ms 간격 (120 req/60s = 2 req/s) |

```js
// Rate limit 안전 대응 예시
if (res.status === 429) {
  const resetAt = res.headers.get('ratelimit-reset')  // Unix timestamp
  const waitMs  = (Number(resetAt) * 1000) - Date.now()
  await sleep(waitMs + 500)
  // 재시도
}
```

---

## 8. 이 프로젝트에서의 활용

```js
// server/jobs/duffelFetcher.js
// ICN → 목적지 이코노미 최저가 조회 (현재 구현)
POST /air/offer_requests?return_offers=true
{
  slices: [{ origin: 'ICN', destination: iataCode, departure_date }],
  passengers: [{ type: 'adult' }],
  cabin_class: 'economy'
}

// 최저가 추출
offers.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
const cheapest = offers[0]
// → { amount: 523400.00, currency: 'GBP' }
// → Frankfurter API로 KRW 변환 → '₩850,000~' 형태로 DB 저장
```

### 향후 확장 가능 데이터
- 직항 여부 (`segments.length === 1`)
- 최저가 항공사명·로고 (`owner.name`, `owner.logo_symbol_url`)
- 평균 비행 시간 (`slices[0].duration`)
- 수하물 포함 여부 (`baggages[].type === 'checked'`)
