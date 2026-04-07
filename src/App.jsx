// Root application component
// Sets up React Router with all 5 routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Survey from './pages/Survey'
import Complete from './pages/Complete'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Landing />} />

        {/* 5-pillar survey */}
        <Route path="/survey" element={<Survey />} />

        {/* Individual results after submission */}
        <Route path="/complete" element={<Complete />} />

        {/* Public organisation dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* PIN-protected admin dashboard */}
        <Route path="/admin" element={<Admin />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
