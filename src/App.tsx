import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding           from './pages/Onboarding/Onboarding'
import Register             from './pages/Register/Register'
import Login                from './pages/Login/Login'
import FarmerDashboard      from './pages/FarmerDashboard/Farmerdashboard'
import BuyerSellerDashboard from './pages/BuyerSellerDashboard/BuyerSellerDashboard'
import PageLoader           from './components/PageLoader/PageLoader'  

export default function App() {
  return (
    <BrowserRouter>
      <PageLoader />  
      <Routes>
        <Route path="/"         element={<Onboarding />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/farmer/*" element={<FarmerDashboard />} />
        <Route path="/buyer/*"  element={<BuyerSellerDashboard />} />
        <Route path="/seller/*" element={<BuyerSellerDashboard />} />
        <Route path="/admin/*"  element={<div style={{padding:40}}>Admin — coming next</div>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}