import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const ReportsPage = lazy(() => import('../pages/reports'))

function PrivateRoutes() {
  return (
    <>
      <Routes>
        <Route path='reports/*' element={<ReportsPage />} />
        <Route index element={<Navigate to='/reports' />} />
      </Routes>
    </>
  )
}

export default PrivateRoutes
