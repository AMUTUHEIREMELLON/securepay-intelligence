import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import SecurityAlerts from './pages/SecurityAlerts';
import NLPAssistant from './pages/NLPAssistant';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute roles={['admin', 'business_manager', 'security_admin']}>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security"
              element={
                <ProtectedRoute roles={['security_admin', 'admin']}>
                  <SecurityAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nlp"
              element={
                <ProtectedRoute roles={['admin', 'business_manager', 'security_admin']}>
                  <NLPAssistant />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
