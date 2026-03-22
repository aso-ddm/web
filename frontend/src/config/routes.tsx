import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { ClubPage } from '@/pages/ClubPage'
import { SocioPage } from '@/pages/SocioPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/socio" element={<SocioPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
