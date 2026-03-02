import { useState, useEffect, useMemo } from 'react'
import MonthSelector from '../components/MonthSelector'
import WorldMap from '../components/WorldMap'
import DestinationDetail from '../components/DestinationDetail'
import { getDestinations, type Destination } from '../api/client'
import { destinationMatchesContinent } from '../data/continents'
import { parsePriceValue } from '../utils/priceFilter'

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

function getCurrentMonth(): Month {
  return (new Date().getMonth() + 1) as Month
}

export default function HomePage() {
  const [selectedMonth, setSelectedMonth] = useState<Month>(getCurrentMonth)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Destination | null>(null)
  const [selectedContinents, setSelectedContinents] = useState<string[]>([])
  /** 가격 필터: N만원 이하 (50|100|150|200). null = 전체 */
  const [priceMaxWon, setPriceMaxWon] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    getDestinations(selectedMonth)
      .then(setDestinations)
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false))
  }, [selectedMonth])

  const filteredDestinations = useMemo(() => {
    let list = destinations
    if (selectedContinents.length > 0) {
      list = list.filter((d) =>
        selectedContinents.some((c) => destinationMatchesContinent(c, d.country))
      )
    }
    if (priceMaxWon != null) {
      const maxWon = priceMaxWon * 10000
      list = list.filter((d) => {
        const p = parsePriceValue(d.averageFlightPrice)
        if (p == null) return true
        return p <= maxWon
      })
    }
    return list
  }, [destinations, selectedContinents, priceMaxWon])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <MonthSelector
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
        selectedContinents={selectedContinents}
        onContinentsChange={setSelectedContinents}
        priceMaxWon={priceMaxWon}
        onPriceMaxWonChange={setPriceMaxWon}
        filteredCount={filteredDestinations.length}
        totalCount={destinations.length}
        onClearFilters={() => {
          setSelectedContinents([])
          setPriceMaxWon(null)
        }}
      />
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', flex: 1 }}>불러오는 중...</p>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <WorldMap
            destinations={filteredDestinations}
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
