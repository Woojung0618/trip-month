import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <>
      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo/TripMonth_Logo1.png" alt="TripMonth" style={{ height: 28, width: 'auto' }} />
        </Link>
        {/*<Link to="/admin" style={{ color: 'var(--color-link-admin)', textDecoration: 'none', fontSize: '0.9rem' }}>관리자</Link>*/}
      </header>
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </main>
    </>
  )
}

export default App
