import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/authContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { POSPage } from './pages/POSPage';
import { CreditsPage } from './pages/CreditsPage';
import { RolesPage } from './pages/RolesPage';
import { StaffPage } from './pages/StaffPage';
import { useAuth } from '@/contexts/authContext';
import { usePOSAutoSave } from '@/hooks/usePOSAutoSave';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

// Dashboard Page - Simple dashboard showing user info
function DashboardPage() {
  const { authState } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {authState.user?.first_name} {authState.user?.last_name || 'User'}!</h1>
        <p className="text-gray-500 mt-2">Hardware Store POS System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Sales</h3>
          <p className="text-3xl font-bold mt-2">0</p>
          <p className="text-sm text-gray-500">Today</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Products</h3>
          <p className="text-3xl font-bold mt-2">27</p>
          <p className="text-sm text-gray-500">In Stock</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Customers</h3>
          <p className="text-3xl font-bold mt-2">12</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Role</h3>
          <p className="text-xl font-bold mt-2">{authState.user?.role_id ? 'Active' : 'User'}</p>
          <p className="text-sm text-gray-500">{authState.permissions.length} permissions</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900">System Status</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>✓ Authentication system ready</li>
          <li>✓ Role-based access control active</li>
          <li>✓ {authState.permissions.length} permissions loaded</li>
          <li>✓ Database connected</li>
        </ul>
      </div>
    </div>
  );
}

// POS App Component with hooks
function POSAppWithHooks() {
  // Initialize auto-save and timeout hooks
  usePOSAutoSave(30000); // Auto-save every 30 seconds
  useSessionTimeout(5 * 60 * 60 * 1000); // 5 hour timeout

  return <POSPage />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - outside Layout */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes - inside Layout */}
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="pos" element={
              <ProtectedRoute requiredPermission="create_sale">
                <POSAppWithHooks />
              </ProtectedRoute>
            } />

            <Route path="credits" element={
              <ProtectedRoute requiredPermission="manage_credit">
                <CreditsPage />
              </ProtectedRoute>
            } />

            <Route path="roles" element={
              <ProtectedRoute requiredPermission="create_role">
                <RolesPage />
              </ProtectedRoute>
            } />

            <Route path="staff" element={
              <ProtectedRoute requiredPermission="create_staff">
                <StaffPage />
              </ProtectedRoute>
            } />

            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
