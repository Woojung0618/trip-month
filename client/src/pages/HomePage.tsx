import { useState, useEffect } from 'react'
import MonthSelector from '../components/MonthSelector'
import WorldMap from '../components/WorldMap'
import DestinationDetail from '../components/DestinationDetail'
import { getDestinations, type Destination } from '../api/client'

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

function getCurrentMonth(): Month {
  return (new Date().getMonth() + 1) as Month
}

export default function HomePage() {
  const [selectedMonth, setSelectedMonth] = useState<Month>(getCurrentMonth)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Destination | null>(null)

  useEffect(() => {
    setLoading(true)
    getDestinations(selectedMonth)
      .then(setDestinations)
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false))
  }, [selectedMonth])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <MonthSelector selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', flex: 1 }}>불러오는 중...</p>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <WorldMap
            destinations={destinations}
            onDestinationClick={setSelected}
          />
        </div>
      )}
      {selected && (
        <DestinationDetail destination={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
