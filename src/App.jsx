import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Persons } from './pages/Persons'
import { PersonForm } from './pages/PersonForm'
import { Agendas } from './pages/Agendas'
import { AgendaForm } from './pages/AgendaForm'
import { Presentation } from './pages/Presentation'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            <Route path="persons" element={<Persons />} />
            <Route path="person/new" element={<PersonForm />} />
            <Route path="person/:id/edit" element={<PersonForm />} />

            <Route path="agendas" element={<Agendas />} />
            <Route path="agenda/new" element={<AgendaForm />} />
            <Route path="agenda/:id/edit" element={<AgendaForm />} />
            <Route path="agenda/:id/presentation" element={<Presentation />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
