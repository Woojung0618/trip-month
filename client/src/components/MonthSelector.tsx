import { useState, useRef, useEffect } from 'react'
import { CONTINENT_OPTIONS_UI } from '../data/continents'

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

const MONTH_LABELS: Record<Month, string> = {
  1: '1월', 2: '2월', 3: '3월', 4: '4월', 5: '5월', 6: '6월',
  7: '7월', 8: '8월', 9: '9월', 10: '10월', 11: '11월', 12: '12월',
}

/** 가격대 프리셋 (만원). 프리뷰와 동일 */
const PRICE_OPTIONS = [
  { value: 50, label: '50만원 이하' },
  { value: 100, label: '100만원 이하' },
  { value: 150, label: '150만원 이하' },
  { value: 200, label: '200만원 이하' },
  { value: null, label: '전체' },
] as const

interface MonthSelectorProps {
  selectedMonth: Month
  onSelect: (month: Month) => void
  selectedContinents: string[]
  onContinentsChange: (continents: string[]) => void
  /** N만원 이하. null = 전체 */
  priceMaxWon: number | null
  onPriceMaxWonChange: (value: number | null) => void
  filteredCount: number
  totalCount: number
  onClearFilters: () => void
}

const filterBtnBase = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: 5,
  padding: '7px 14px',
  borderRadius: 20,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text-secondary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer' as const,
  whiteSpace: 'nowrap' as const,
  transition: 'all 0.15s',
  boxShadow: 'var(--shadow-sm)',
}

export default function MonthSelector({
  selectedMonth,
  onSelect,
  selectedContinents,
  onContinentsChange,
  priceMaxWon,
  onPriceMaxWonChange,
  filteredCount,
  totalCount,
  onClearFilters,
}: MonthSelectorProps) {
  const months = (Object.keys(MONTH_LABELS) as unknown as Month[])
  const [continentOpen, setContinentOpen] = useState(false)
  const [priceOpen, setPriceOpen] = useState(false)
  const continentRef = useRef<HTMLDivElement>(null)
  const priceRef = useRef<HTMLDivElement>(null)

  const hasFilter = selectedContinents.length > 0 || priceMaxWon != null

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (continentRef.current && !continentRef.current.contains(target)) setContinentOpen(false)
      if (priceRef.current && !priceRef.current.contains(target)) setPriceOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const toggleContinent = (value: string) => {
    if (selectedContinents.includes(value)) {
      onContinentsChange(selectedContinents.filter((x) => x !== value))
    } else {
      onContinentsChange([...selectedContinents, value].sort())
    }
  }

  const continentLabel =
    selectedContinents.length === 0
      ? '대륙 전체'
      : selectedContinents.length === 1
        ? selectedContinents[0]
        : `${selectedContinents.length}개 선택`

  const priceLabel =
    priceMaxWon == null ? '가격대' : PRICE_OPTIONS.find((o) => o.value === priceMaxWon)?.label ?? '가격대'

  return (
    <div
      className="month-selector-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border-light)',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      <div
        className="month-selector-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '10px 20px 10px',
          gap: 8,
        }}
      >
        {/* 월 탭 + 카운트 영역 (좁은 화면에서 한 줄) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: '1 1 0%',
            minWidth: 0,
          }}
          className="month-selector-row1"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              flex: '1 1 0%',
              minWidth: 0,
            }}
            className="tab-scroll"
          >
          {months.map((m) => {
            const monthNum = Number(m) as Month
            const isSelected = selectedMonth === monthNum
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelect(monthNum)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  border: 'none',
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? 'var(--color-text-on-primary)' : 'var(--color-text-muted-2)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  fontFamily: "'Pretendard', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--color-bg-map)'
                    e.currentTarget.style.color = 'var(--color-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-muted-2)'
                  }
                }}
              >
                {MONTH_LABELS[monthNum]}
              </button>
            )
          })}
        </div>

          {/* 결과 카운트 + 초기화 */}
          {hasFilter && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 10,
              }}
            >
              <span>
                <strong style={{ color: 'var(--color-primary)', fontSize: 14, fontWeight: 700 }}>{filteredCount}</strong>
                <span style={{ color: 'var(--color-text-muted-5)', fontSize: 12 }}>/{totalCount}</span>
              </span>
              <button
                type="button"
                onClick={onClearFilters}
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted-5)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-destructive)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted-5)' }}
              >
                초기화
              </button>
            </div>
          )}
        </div>

        {/* 필터 영역 — 좁은 화면에서 월 버튼 아래로 내려감 */}
        <div
          className="month-selector-filters"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            paddingLeft: 12,
            borderLeft: '1px solid var(--color-border-light)',
          }}
        >
          {/* 대륙 드롭다운 */}
          <div ref={continentRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setContinentOpen((v) => !v); setPriceOpen(false) }}
              style={{
                ...filterBtnBase,
                borderColor: selectedContinents.length > 0 ? 'var(--color-primary)' : 'var(--color-bg-map)',
                background: selectedContinents.length > 0 ? 'var(--color-bg)' : 'var(--color-bg)',
                color: selectedContinents.length > 0 ? 'var(--color-primary)' : 'var(--color-text)',
              }}
            >
              🌏 <span>{continentLabel}</span>
              {selectedContinents.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {selectedContinents.length}
                </span>
              )}
              <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>{continentOpen ? '▲' : '▼'}</span>
            </button>
            {continentOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 14,
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 190,
                  zIndex: 2000,
                  overflow: 'hidden',
                  animation: 'mapFilterPanelIn 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  대륙 선택 <span style={{ fontWeight: 400, color: 'var(--color-text-muted-5)', fontSize: 11 }}>(복수 선택 가능)</span>
                </div>
                {CONTINENT_OPTIONS_UI.map(({ value, label, emoji }) => {
                  const checked = selectedContinents.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleContinent(value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '10px 16px',
                        background: checked ? 'var(--color-bg-map)' : 'transparent',
                        color: checked ? 'var(--color-primary)' : 'var(--color-text)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        textAlign: 'left',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) e.currentTarget.style.background = 'var(--color-bg-subtle)'
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{emoji}</span>
                      <span style={{ flex: 1 }}>{label}</span>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: '1.5px solid var(--color-border)',
                          background: checked ? 'var(--color-primary)' : 'transparent',
                          borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                        {checked ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
                {selectedContinents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onContinentsChange([])}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'none',
                      border: 'none',
                      borderTop: '1px solid var(--color-border-light)',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--color-text-muted-5)',
                      textDecoration: 'underline',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-destructive)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted-5)' }}
                  >
                    선택 해제
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 가격 드롭다운 */}
          <div ref={priceRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setPriceOpen((v) => !v); setContinentOpen(false) }}
              style={{
                ...filterBtnBase,
                borderColor: priceMaxWon != null ? 'var(--color-primary)' : 'var(--color-bg-map)',
                background: priceMaxWon != null ? 'var(--color-bg-map)' : 'var(--color-bg)',
                color: priceMaxWon != null ? 'var(--color-primary)' : 'var(--color-text)',
              }}
            >
              ✈️ <span>{priceLabel}</span>
              <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>{priceOpen ? '▲' : '▼'}</span>
            </button>
            {priceOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 14,
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 190,
                  zIndex: 2000,
                  overflow: 'hidden',
                  animation: 'mapFilterPanelIn 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  항공권 최저가 기준
                </div>
                {PRICE_OPTIONS.map((opt) => {
                  const selected = priceMaxWon === opt.value
                  return (
                    <button
                      key={opt.value ?? 'all'}
                      type="button"
                      onClick={() => {
                        onPriceMaxWonChange(opt.value)
                        setPriceOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '10px 16px',
                        background: selected ? 'var(--color-bg-map)' : 'transparent',
                        color: selected ? 'var(--color-primary)' : 'var(--color-text)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = 'var(--color-bg-subtle)'
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{ flex: 1 }}>{opt.label}</span>
                      {selected && (
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 13 }}>✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  )
}
