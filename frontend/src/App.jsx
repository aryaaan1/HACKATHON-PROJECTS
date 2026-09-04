import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TraceOrder from './pages/TraceOrder';
import Inventory from './pages/Inventory';
import Warehouse from './pages/Warehouse';
import StockMovements from './pages/StockMovements';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trace-order" element={<TraceOrder />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/movements" element={<StockMovements />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
