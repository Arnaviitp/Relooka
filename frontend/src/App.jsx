import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RenterFeed from './pages/RenterFeed';
import ListingDetail from './pages/ListingDetail';
import Checkout from './pages/Checkout';
import LenderDashboard from './pages/LenderDashboard';
import LenderUpload from './pages/LenderUpload';
import HubDashboard from './pages/HubDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';

function ProtectedRoute({ children, allowedRoles, requiredCapability }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400">Loading LoopWear session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredCapability && !user.capabilities?.includes(requiredCapability) && user.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/feed" element={<RenterFeed />} />
              <Route path="/listings/:id" element={<ListingDetail />} />

              {/* Renter Actions */}
              <Route
                path="/checkout/:listingId"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />

              {/* Orders & Live State Machine Tracker */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />

              {/* Profile & ID Verification */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Lender Portal */}
              <Route
                path="/lender/dashboard"
                element={
                  <ProtectedRoute requiredCapability="lender">
                    <LenderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/upload"
                element={
                  <ProtectedRoute requiredCapability="lender">
                    <LenderUpload />
                  </ProtectedRoute>
                }
              />

              {/* Restricted Role Portals */}
              <Route
                path="/hub"
                element={
                  <ProtectedRoute allowedRoles={['hub_staff']}>
                    <HubDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/delivery"
                element={
                  <ProtectedRoute allowedRoles={['delivery_agent']}>
                    <DeliveryDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

