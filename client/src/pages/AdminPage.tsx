import { useState, useEffect, useRef, useMemo } from 'react'
import { getDestinations, updateDestination, createDestination, deleteDestination, adminLogin, updateFlightPrices, type Destination } from '../api/client'
import { getCountriesForSelect, codeToNameKo } from '../data/countries'
import { parseExcelToDestinations } from '../utils/excelUpload'
/** 새 행(빈 draft) 또는 복사용 draft의 id는 음수 */
function isDraft(d: Destination): boolean {
  return d.id < 0
}

function createEmptyDraft(id: number): Destination {
  return {
    id,
    month: 1,
    name: '',
    tagline: '',
    country: '',
    weather: '',
    temperature: '',
    reason: '',
    imageUrl: '',
    averageFlightPrice: '',
    affiliateUrl: '',
    flightTime: '',
    affiliateNote: '',
    ctaButtonText: '트립닷컴에서 항공권 확인하기',
    latitude: null,
    longitude: null,
  }
}

/** CSV 한 셀 이스케이프 (쉼표·줄바꿈·따옴표 포함 시) */
function escapeCsvCell(value: string): string {
  const s = String(value ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** 목적지 목록을 CSV 문자열로 변환 (UTF-8 BOM 포함, Excel에서 한글 깨짐 방지). latLngRaw 있으면 입력 중인 값 반영 */
function destinationsToCsv(
  list: Destination[],
  latLngRaw?: Record<number, { lat: string; lng: string }>,
  parseLatLng?: (v: string | number | null | undefined) => number | null
): string {
  const headers = ['월', '이름', '한줄 소개', '국가', '날씨', '온도', '추천 이유', '이미지 URL', '항공권 가격', '비행시간', '제휴 링크', '제휴 안내', 'CTA 문구', '위도', '경도']
  const parse = parseLatLng ?? ((v: string | number | null | undefined) => (v === '' || v == null ? null : (typeof v === 'number' ? v : Number(v))))
  const rows = list.map((d) => [
    d.month,
    d.name,
    d.tagline ?? '',
    d.country,
    d.weather,
    d.temperature,
    d.reason,
    d.imageUrl,
    d.averageFlightPrice,
    d.flightTime,
    d.affiliateUrl,
    d.affiliateNote,
    d.ctaButtonText,
    parse(latLngRaw?.[d.id]?.lat ?? d.latitude) ?? '',
    parse(latLngRaw?.[d.id]?.lng ?? d.longitude) ?? '',
  ].map((v) => escapeCsvCell(String(v ?? ''))))
  const lines = [headers.join(','), ...rows.map((r) => r.join(','))]
  const csv = lines.join('\r\n')
  const BOM = '\uFEFF'
  return BOM + csv
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(false)
  const [savingDrafts, setSavingDrafts] = useState(false)
  const [savingSelected, setSavingSelected] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  /** 수정된 기존 행(id > 0) id 집합. 상단 저장 시 이 중 선택된 행만 저장 */
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set())
  /** 위·경도 입력 중 문자열 유지 (소수점 입력 가능). 키: destination id */
  const [latLngRaw, setLatLngRaw] = useState<Record<number, { lat: string; lng: string }>>({})
  const nextDraftIdRef = useRef(-1)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [excelUploadMessage, setExcelUploadMessage] = useState<string | null>(null)
  const [updatingPrices, setUpdatingPrices] = useState(false)
  const [priceUpdateMessage, setPriceUpdateMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const countryOptions = getCountriesForSelect()

  /** 퀵 검색: 도시명, 국가코드, 국가 한글명으로 필터 */
  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return destinations
    return destinations.filter((d) => {
      const nameMatch = d.name.toLowerCase().includes(q)
      const countryCodeMatch = d.country.toLowerCase().includes(q)
      const countryNameMatch = codeToNameKo(d.country).toLowerCase().includes(q)
      return nameMatch || countryCodeMatch || countryNameMatch
    })
  }, [destinations, searchQuery])

  /** 저장/CSV용: 문자열 또는 숫자 → number | null */
  const parseLatLng = (v: string | number | null | undefined): number | null => {
    if (v === '' || v == null || v === undefined) return null
    if (typeof v === 'number') return Number.isNaN(v) ? null : v
    const n = Number(String(v).trim())
    return Number.isNaN(n) ? null : n
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const { ok } = await adminLogin(password)
    if (ok) {
      setAuthenticated(true)
    } else {
      setLoginError('비밀번호가 올바르지 않습니다.')
    }
  }

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true)
    setPriceUpdateMessage(null)
    try {
      const result = await updateFlightPrices(password)
      setPriceUpdateMessage(result.message ?? (result.ok ? '업데이트 시작됨' : '실패'))
    } catch {
      setPriceUpdateMessage('오류가 발생했습니다.')
    } finally {
      setUpdatingPrices(false)
    }
  }

  const DEFAULT_CTA = '트립닷컴에서 항공권 확인하기'

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    getDestinations()
      .then((list) => {
        const normalized = list.map((d) => ({
          ...d,
          ctaButtonText: (d.ctaButtonText && d.ctaButtonText.trim()) ? d.ctaButtonText.trim() : DEFAULT_CTA,
        }))
        const idsWithEmptyCta = list.filter((d) => !d.ctaButtonText?.trim()).map((d) => d.id)
        const idsToSave = new Set(idsWithEmptyCta)
        setDestinations(normalized)
        setDirtyIds(idsToSave.size > 0 ? idsToSave : new Set())
        if (idsToSave.size > 0) {
          setSelectedIds((prev) => new Set([...prev, ...idsToSave]))
        }
      })
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false))
  }, [authenticated])

  /** 단일 행 저장 (상단 저장 시 내부에서 사용). 저장 후 dirty/선택 해제 */
  const saveOne = async (d: Destination) => {
    const lat = parseLatLng(latLngRaw[d.id]?.lat ?? d.latitude)
    const lng = parseLatLng(latLngRaw[d.id]?.lng ?? d.longitude)
    const updated = await updateDestination(d.id, {
      month: d.month,
      name: d.name,
      tagline: d.tagline ?? '',
      country: d.country,
      weather: d.weather,
      temperature: d.temperature,
      reason: d.reason,
      imageUrl: d.imageUrl,
      averageFlightPrice: d.averageFlightPrice,
      affiliateUrl: d.affiliateUrl,
      flightTime: d.flightTime,
      affiliateNote: d.affiliateNote,
      ctaButtonText: d.ctaButtonText?.trim() || DEFAULT_CTA,
      latitude: lat,
      longitude: lng,
    })
    setDestinations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    setLatLngRaw((prev) => {
      const next = { ...prev }
      delete next[d.id]
      return next
    })
    setDirtyIds((prev) => {
      const next = new Set(prev)
      next.delete(d.id)
      return next
    })
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(d.id)
      return next
    })
  }

  /** 상단 저장: 신규 행(draft) 저장 후, 선택된 수정 행 저장 */
  const handleSaveAll = async () => {
    const toSaveExisting = destinations.filter(
      (d) => d.id > 0 && selectedIds.has(d.id) && dirtyIds.has(d.id)
    )
    if (destinations.some(isDraft)) await saveDrafts()
    if (toSaveExisting.length > 0) {
      setSavingSelected(true)
      try {
        for (const d of toSaveExisting) await saveOne(d)
      } finally {
        setSavingSelected(false)
      }
    }
  }

  type EditableField = keyof Omit<Destination, 'id'>
  const updateLocal = (
    id: number,
    field: EditableField,
    value: string | number | null,
    currentRow?: Destination
  ) => {
    if (field === 'latitude' || field === 'longitude') {
      const str = value === null ? '' : String(value)
      const rawKey = field === 'latitude' ? 'lat' : 'lng' // latLngRaw는 .lat / .lng 키 사용
      setLatLngRaw((prev) => {
        const fallback =
          currentRow != null
            ? {
                lat: currentRow.latitude != null ? String(currentRow.latitude) : '',
                lng: currentRow.longitude != null ? String(currentRow.longitude) : '',
              }
            : { lat: '', lng: '' }
        return {
          ...prev,
          [id]: {
            ...(prev[id] ?? fallback),
            [rawKey]: str,
          },
        }
      })
      // 소수 입력 중(예: "35.")에는 destinations 반영하지 않음. 완성된 숫자나 빈 값만 반영.
      const isIncomplete = str !== '' && (str.endsWith('.') || str.endsWith('-'))
      const parsed = isIncomplete ? null : parseLatLng(value === null ? '' : value)
      setDestinations((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, [field]: parsed ?? (null as number | null) } : x
        )
      )
      if (id > 0) {
        setDirtyIds((prev) => new Set(prev).add(id))
        setSelectedIds((prev) => new Set(prev).add(id))
      }
      return
    }
    setDestinations((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: value } : x))
    )
    if (id > 0) {
      setDirtyIds((prev) => new Set(prev).add(id))
      setSelectedIds((prev) => new Set(prev).add(id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    const filtered = filteredDestinations
    const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id))
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((d) => next.delete(d.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((d) => next.add(d.id))
        return next
      })
    }
  }

  const addRow = () => {
    const id = nextDraftIdRef.current--
    setDestinations((prev) => [...prev, createEmptyDraft(id)])
  }

  const copyRows = () => {
    const toCopy = destinations.filter((d) => selectedIds.has(d.id))
    if (toCopy.length === 0) return
    const newRows: Destination[] = toCopy.map((d) => ({
      ...d,
      id: nextDraftIdRef.current--,
    }))
    setDestinations((prev) => [...prev, ...newRows])
    setSelectedIds(new Set())
  }

  const deleteRows = () => {
    if (selectedIds.size === 0) return
    if (!window.confirm('삭제하시겠습니까?')) return
    const toDelete = Array.from(selectedIds)
    setSelectedIds(new Set())
    setDirtyIds((prev) => {
      const next = new Set(prev)
      toDelete.forEach((id) => next.delete(id))
      return next
    })
    setDestinations((prev) => prev.filter((d) => !toDelete.includes(d.id)))
    ;(async () => {
      for (const id of toDelete) {
        if (id > 0) {
          try {
            await deleteDestination(id)
          } catch {
            // 이미 목록에서 제거됨
          }
        }
      }
    })()
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setExcelUploadMessage(null)
    setUploadingExcel(true)
    try {
      const rows = await parseExcelToDestinations(file)
      if (rows.length === 0) {
        setExcelUploadMessage('유효한 데이터 행이 없습니다. 헤더(월, 도시명, 한줄 소개, 국가명, 대표이모지, 날씨, 온도, 추천이유, 대표 이미지 URL, 항공권 가격, 비행시간)를 확인해 주세요.')
        return
      }
      let ok = 0
      const errors: string[] = []
      for (let i = 0; i < rows.length; i++) {
        try {
          await createDestination(rows[i])
          ok++
        } catch (err) {
          errors.push(`행 ${i + 2}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      if (ok > 0) {
        const list = await getDestinations()
        setDestinations(list.sort((a, b) => a.month - b.month || a.id - b.id))
      }
      if (errors.length === 0) setExcelUploadMessage(`${ok}건 추가되었습니다.`)
      else setExcelUploadMessage(`${ok}건 추가, 실패 ${errors.length}건: ${errors.slice(0, 3).join(' / ')}${errors.length > 3 ? '…' : ''}`)
    } catch (err) {
      setExcelUploadMessage(err instanceof Error ? err.message : '엑셀 파싱에 실패했습니다.')
    } finally {
      setUploadingExcel(false)
    }
  }

  const saveDrafts = async () => {
    const drafts = destinations.filter(isDraft)
    if (drafts.length === 0) return
    setSavingDrafts(true)
    try {
      const createdList: Destination[] = []
      for (const d of drafts) {
        if (!d.name.trim() || !d.country.trim()) continue
        const lat = parseLatLng(latLngRaw[d.id]?.lat ?? d.latitude)
        const lng = parseLatLng(latLngRaw[d.id]?.lng ?? d.longitude)
        const created = await createDestination({
          month: d.month,
          name: d.name.trim(),
          tagline: d.tagline ?? '',
          country: d.country.trim(),
          weather: d.weather ?? '',
          temperature: d.temperature ?? '',
          reason: d.reason ?? '',
          imageUrl: d.imageUrl ?? '',
          averageFlightPrice: d.averageFlightPrice ?? '',
          affiliateUrl: d.affiliateUrl ?? '',
          flightTime: d.flightTime ?? '',
          affiliateNote: d.affiliateNote ?? '',
          ctaButtonText: d.ctaButtonText ?? '',
          latitude: lat,
          longitude: lng,
        })
        createdList.push(created)
      }
      setDestinations((prev) =>
        prev
          .filter((x) => !isDraft(x))
          .concat(createdList)
          .sort((a, b) => a.month - b.month || a.id - b.id)
      )
    } finally {
      setSavingDrafts(false)
    }
  }

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 320, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.25rem' }}>관리자 로그인</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="admin-pw" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
              비밀번호
            </label>
            <input
              id="admin-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          {loginError && <p style={{ color: 'var(--color-destructive)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{loginError}</p>}
          <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            로그인
          </button>
        </form>
      </div>
    )
  }

  const hasDrafts = destinations.some(isDraft)
  const hasDirtySelected = destinations.some(
    (d) => d.id > 0 && selectedIds.has(d.id) && dirtyIds.has(d.id)
  )
  const hasSomethingToSave = hasDrafts || hasDirtySelected
  const isSaving = savingDrafts || savingSelected

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>제휴 링크 · 평균 항공권 가격 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={addRow} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            행 추가
          </button>
          <button
            type="button"
            onClick={copyRows}
            disabled={selectedIds.size === 0}
            style={{ padding: '0.5rem 1rem', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedIds.size === 0 ? 0.6 : 1 }}
          >
            행 복사
          </button>
          <button
            type="button"
            onClick={deleteRows}
            disabled={selectedIds.size === 0}
            style={{ padding: '0.5rem 1rem', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedIds.size === 0 ? 0.6 : 1 }}
          >
            행 삭제
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!hasSomethingToSave || isSaving}
            style={{
              padding: '0.5rem 1rem',
              cursor: !hasSomethingToSave || isSaving ? 'not-allowed' : 'pointer',
              opacity: !hasSomethingToSave ? 0.6 : 1,
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={() => {
              const list = destinations.filter((d) => !isDraft(d))
              const csv = destinationsToCsv(list, latLngRaw, parseLatLng)
              const date = new Date().toISOString().slice(0, 10)
              downloadCsv(csv, `월별여행지_전체_${date}.csv`)
            }}
            disabled={destinations.filter((d) => !isDraft(d)).length === 0}
            style={{
              padding: '0.5rem 1rem',
              cursor: destinations.filter((d) => !isDraft(d)).length === 0 ? 'not-allowed' : 'pointer',
              opacity: destinations.filter((d) => !isDraft(d)).length === 0 ? 0.6 : 1,
            }}
          >
            📥 엑셀(CSV) 다운로드
          </button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            disabled={uploadingExcel}
            style={{
              padding: '0.5rem 1rem',
              cursor: uploadingExcel ? 'not-allowed' : 'pointer',
              opacity: uploadingExcel ? 0.6 : 1,
            }}
          >
            {uploadingExcel ? '업로드 중...' : '📤 엑셀 업로드'}
          </button>
          <button
            type="button"
            onClick={handleUpdatePrices}
            disabled={updatingPrices}
            style={{
              padding: '0.5rem 1rem',
              cursor: updatingPrices ? 'not-allowed' : 'pointer',
              opacity: updatingPrices ? 0.6 : 1,
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {updatingPrices ? '업데이트 중...' : '✈️ 항공권 가격 업데이트'}
          </button>
        </div>
      </div>
      {priceUpdateMessage && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary, #666)' }}>
          ✈️ {priceUpdateMessage}
        </p>
      )}
      {excelUploadMessage && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary, #666)' }}>
          {excelUploadMessage}
        </p>
      )}

      {!loading && (
        <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="도시명, 국가로 검색..."
            aria-label="도시명·국가 검색"
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '0.5rem 0.75rem',
              fontSize: '0.9375rem',
              border: '1px solid var(--color-border-light)',
              borderRadius: 8,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          {searchQuery.trim() && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted-2)' }}>
              {filteredDestinations.length}건
            </span>
          )}
        </div>
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ minWidth: 1400, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-light)' }}>
                <th style={{ padding: '0.25rem 0.35rem', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={filteredDestinations.length > 0 && filteredDestinations.every((d) => selectedIds.has(d.id))}
                    onChange={toggleSelectAll}
                    aria-label="전체 선택"
                  />
                </th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '4%', minWidth: 60 }}>월</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '8%', minWidth: 100 }}>도시명</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '12%', minWidth: 140 }}>한줄 소개</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '6%', minWidth: 88 }}>국가코드</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '8%', minWidth: 100 }}>날씨</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '7%', minWidth: 88 }}>온도</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '14%', minWidth: 160 }}>추천 이유</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '14%', minWidth: 160 }}>이미지 URL</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '8%', minWidth: 100 }}>항공권 가격</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '7%', minWidth: 88 }}>비행시간</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '12%', minWidth: 140 }}>제휴 링크</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '10%', minWidth: 120 }}>제휴 안내</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '10%', minWidth: 120 }}>버튼 문구</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '5%', minWidth: 72 }}>위도</th>
                <th style={{ textAlign: 'left', padding: '0.25rem 0.35rem', width: '5%', minWidth: 72 }}>경도</th>
                <th style={{ padding: '0.25rem 0.35rem', width: '5%', minWidth: 64 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredDestinations.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border-light)', background: isDraft(d) ? 'var(--color-bg-subtle)' : undefined }}>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                      aria-label="행 선택"
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <select
                      value={Number(d.month) || 1}
                      onChange={(e) => updateLocal(d.id, 'month', Number(e.target.value))}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>{m}월</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => updateLocal(d.id, 'name', e.target.value)}
                      placeholder="도시명"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      value={d.tagline ?? ''}
                      onChange={(e) => updateLocal(d.id, 'tagline', e.target.value)}
                      placeholder="도시 한줄 소개"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <select
                      value={d.country}
                      onChange={(e) => updateLocal(d.id, 'country', e.target.value)}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    >
                      {!countryOptions.some((c) => c.code === d.country) && (
                        <option value={d.country}>{codeToNameKo(d.country) || d.country}</option>
                      )}
                      {countryOptions.map((c) => (
                        <option key={c.code} value={c.code}>{c.nameKo} ({c.code})</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      value={d.weather}
                      onChange={(e) => updateLocal(d.id, 'weather', e.target.value)}
                      placeholder="예: 쾌적함"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      value={d.temperature ?? ''}
                      onChange={(e) => updateLocal(d.id, 'temperature', e.target.value)}
                      placeholder="예: 20-30°C"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem', verticalAlign: 'top' }}>
                    <textarea
                      value={d.reason}
                      onChange={(e) => updateLocal(d.id, 'reason', e.target.value)}
                      placeholder="추천 이유"
                      rows={2}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 40 }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem', verticalAlign: 'top' }}>
                    <textarea
                      value={d.imageUrl}
                      onChange={(e) => updateLocal(d.id, 'imageUrl', e.target.value)}
                      placeholder="https://..."
                      rows={2}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 40 }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      value={d.averageFlightPrice}
                      onChange={(e) => updateLocal(d.id, 'averageFlightPrice', e.target.value)}
                      placeholder="약 85만원~"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      value={d.flightTime}
                      onChange={(e) => updateLocal(d.id, 'flightTime', e.target.value)}
                      placeholder="직항 4시간"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem', verticalAlign: 'top' }}>
                    <textarea
                      value={d.affiliateUrl}
                      onChange={(e) => updateLocal(d.id, 'affiliateUrl', e.target.value)}
                      placeholder="https://..."
                      rows={2}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 40 }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem', verticalAlign: 'top' }}>
                    <textarea
                      value={d.affiliateNote}
                      onChange={(e) => updateLocal(d.id, 'affiliateNote', e.target.value)}
                      placeholder="제휴 할인 코드 적용 가능"
                      rows={2}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 40 }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem', verticalAlign: 'top' }}>
                    <textarea
                      value={d.ctaButtonText ?? ''}
                      onChange={(e) => updateLocal(d.id, 'ctaButtonText', e.target.value)}
                      placeholder="트립닷컴에서 항공권 확인하기"
                      rows={2}
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 40 }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={latLngRaw[d.id]?.lat ?? (d.latitude != null ? String(d.latitude) : '')}
                      onChange={(e) =>
                        updateLocal(d.id, 'latitude', e.target.value === '' ? null : e.target.value, d)
                      }
                      placeholder="35.69"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={latLngRaw[d.id]?.lng ?? (d.longitude != null ? String(d.longitude) : '')}
                      onChange={(e) =>
                        updateLocal(d.id, 'longitude', e.target.value === '' ? null : e.target.value, d)
                      }
                      placeholder="139.69"
                      style={{ width: '100%', padding: '0.2rem 0.3rem', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.35rem' }}>
                    {isDraft(d) ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-2)' }}>상단 저장</span>
                    ) : dirtyIds.has(d.id) ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>수정됨</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && destinations.length === 0 && (
        <p style={{ color: 'var(--color-text-muted-3)' }}>등록된 목적지가 없습니다. DB 시드를 실행하세요.</p>
      )}
    </div>
  )
}
