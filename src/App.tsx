import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding/Onboarding";

// Future pages — uncomment as we build them:
// import Login    from './pages/Login'
// import Register from './pages/Register'
// import FarmerDashboard   from './pages/FarmerDashboard'
// import BuyerSellerDashboard from './pages/BuyerSellerDashboard'
// import AdminDashboard    from './pages/AdminDashboard'
// import AI from './pages/AI'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding — first screen */}
        <Route path="/" element={<Onboarding />} />

        {/* Auth */}
        <Route path="/login" element={<div>Login page — coming next</div>} />
        <Route
          path="/register"
          element={<div>Register page — coming next</div>}
        />

        {/* Dashboards */}
        <Route path="/farmer/*" element={<div>Farmer Dashboard</div>} />
        <Route
          path="/buyer-seller/*"
          element={<div>Buyer/Seller Dashboard</div>}
        />

        {/* Hidden admin — not linked anywhere public */}
        <Route path="/admin" element={<div>Admin Login</div>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
