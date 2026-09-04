import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireAdmin } from './components/auth/RouteGuards';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TraceOrder from './pages/TraceOrder';
import Inventory from './pages/Inventory';
import Warehouse from './pages/Warehouse';
import StockMovements from './pages/StockMovements';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trace-order" element={<TraceOrder />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/warehouse" element={<Warehouse />} />
              <Route path="/movements" element={<StockMovements />} />

              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
