import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/authContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Placeholder pages - these will be created in later phases
function LoginPage() {
  return <div className="p-8">Login Page - To be implemented</div>;
}

function DashboardPage() {
  return <div className="p-8">Dashboard - To be implemented</div>;
}

function POSPage() {
  return <div className="p-8">POS System - To be implemented</div>;
}

function RolesPage() {
  return <div className="p-8">Roles Management - To be implemented</div>;
}

function StaffPage() {
  return <div className="p-8">Staff Management - To be implemented</div>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route path="login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="pos" element={
              <ProtectedRoute requiredPermission="create_sale">
                <POSPage />
              </ProtectedRoute>
            } />

            <Route path="roles" element={
              <ProtectedRoute requiredPermission="manage_roles">
                <RolesPage />
              </ProtectedRoute>
            } />

            <Route path="staff" element={
              <ProtectedRoute requiredPermission="manage_staff">
                <StaffPage />
              </ProtectedRoute>
            } />

            {/* Redirect root to dashboard */}
            <Route path="" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
