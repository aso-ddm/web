import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { ClubPage } from '@/pages/ClubPage'
import { SocioPage } from '@/pages/SocioPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/socio" element={<SocioPage />} />
    </Routes>
  )
}
