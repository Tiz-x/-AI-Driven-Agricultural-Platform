import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding           from './pages/Onboarding/Onboarding'
import Register             from './pages/Register/Register'
import Login                from './pages/Login/Login'
import FarmerDashboard      from './pages/FarmerDashboard/Farmerdashboard'
import BuyerSellerDashboard from './pages/BuyerSellerDashboard/BuyerSellerDashboard'
// import { authService }      from './services/authService'

export default function App() {
  return (
    <BrowserRouter>
      {/* {authService.isMockMode() && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
          background:'#1a2e1c', borderTop:'1px solid rgba(168,216,50,0.3)',
          padding:'7px 20px', display:'flex', alignItems:'center',
          justifyContent:'space-between', fontFamily:'monospace', fontSize:'11px',
        }}>
          <span style={{ color:'#a8d832', fontWeight:700 }}>🟡 MOCK MODE — no backend</span>
          <span style={{ color:'rgba(255,255,255,0.35)' }}>
            farmer@test.com · buyer@test.com · seller@test.com (any 6+ char password)
          </span>
        </div>
      )} */}
      <Routes>
        <Route path="/"              element={<Onboarding />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/farmer/*"      element={<FarmerDashboard />} />
        <Route path="/buyer/*"       element={<BuyerSellerDashboard />} />
        <Route path="/seller/*"      element={<BuyerSellerDashboard />} />
        <Route path="/admin/*"       element={<div style={{padding:40}}>Admin — coming next</div>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}