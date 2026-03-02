type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

const MONTH_LABELS: Record<Month, string> = {
  1: '1월', 2: '2월', 3: '3월', 4: '4월', 5: '5월', 6: '6월',
  7: '7월', 8: '8월', 9: '9월', 10: '10월', 11: '11월', 12: '12월',
}

interface MonthSelectorProps {
  selectedMonth: Month
  onSelect: (month: Month) => void
}

/** ref-figma-make 스타일: sticky 헤더, pill 버튼(선택 시 blue-600) */
export default function MonthSelector({ selectedMonth, onSelect }: MonthSelectorProps) {
  const months = (Object.keys(MONTH_LABELS) as unknown as Month[])

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        background: 'var(--color-bg-header)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem 1rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
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
                  padding: '0.5rem 1rem',
                  borderRadius: 9999,
                  border: 'none',
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                  color: isSelected ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--color-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--color-bg-muted)'
                  }
                }}
              >
                {MONTH_LABELS[monthNum]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
