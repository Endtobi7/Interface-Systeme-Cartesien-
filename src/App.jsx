import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ModeManuel from './pages/ModeManuel'
import ModeImport from './pages/ModeImport'
import FormesPredefinies from './pages/FormesPredefinies'
import Aide from './pages/Aide'
import APropos from './pages/APropos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manuel" element={<ModeManuel />} />
        <Route path="/import" element={<ModeImport />} />
        <Route path="/formes" element={<FormesPredefinies />} />
        <Route path="/aide" element={<Aide />} />
        <Route path="/apropos" element={<APropos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
