import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/auth/Login';
import SetupWizard from './pages/auth/SetupWizard';
import Dashboard from './pages/Dashboard';
import Categories from './pages/inventory/Categories';
import Products from './pages/inventory/Products';
import ProductForm from './pages/inventory/ProductForm';
import StockManagement from './pages/inventory/StockManagement';
import Customers from './pages/customers/Customers';
import CustomerDetail from './pages/customers/CustomerDetail';
import OCRPurchase from './pages/vendor/OCRPurchase';
import Vendors from './pages/vendors/Vendors';
import VendorDetail from './pages/vendors/VendorDetail';
import Purchases from './pages/purchases/Purchases';
import PurchaseEntry from './pages/purchases/PurchaseEntry';
import Branches from './pages/branches/Branches';
import Transfers from './pages/branches/Transfers';
import BranchReports from './pages/branches/BranchReports';
import { SyncProvider } from './context/SyncContext';
import POS from './pages/pos/POS';

import ChartOfAccounts from './pages/accounting/ChartOfAccounts';
import Journals from './pages/accounting/Journals';
import ProfitAndLoss from './pages/accounting/ProfitAndLoss';
import BalanceSheet from './pages/accounting/BalanceSheet';

import GSTReports from './pages/reports/GSTReports';
import HardwareSettings from './pages/settings/HardwareSettings';
import AISettings from './pages/settings/AISettings';
import AIAssistant from './pages/assistant/AIAssistant';
import ForecastingDashboard from './pages/forecasting/ForecastingDashboard';

const Unauthorized = () => <div><h2>Unauthorized Access</h2></div>;

function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SetupWizard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/pos" element={<POS />} />
              <Route path="/app/categories" element={<Categories />} />
              <Route path="/app/products" element={<Products />} />
              <Route path="/app/products/new" element={<ProductForm />} />
              <Route path="/app/inventory" element={<StockManagement />} />
              <Route path="/app/customers" element={<Customers />} />
              <Route path="/app/customers/:id" element={<CustomerDetail />} />
              <Route path="/app/vendors" element={<Vendors />} />
              <Route path="/app/vendors/:id" element={<VendorDetail />} />
              <Route path="/app/vendors/ocr" element={<OCRPurchase />} />
              <Route path="/app/purchases" element={<Purchases />} />
              <Route path="/app/purchases/new" element={<PurchaseEntry />} />
              <Route path="/app/branches" element={<Branches />} />
              <Route path="/app/transfers" element={<Transfers />} />
              <Route path="/app/reports/branches" element={<BranchReports />} />
              <Route path="/app/reports/gst" element={<GSTReports />} />
              
              <Route path="/app/accounting/accounts" element={<ChartOfAccounts />} />
              <Route path="/app/accounting/journals" element={<Journals />} />
              <Route path="/app/accounting/reports/pnl" element={<ProfitAndLoss />} />
              <Route path="/app/accounting/reports/balance-sheet" element={<BalanceSheet />} />
              
              <Route path="/app/settings/hardware" element={<HardwareSettings />} />
              <Route path="/app/settings/ai" element={<AISettings />} />
              <Route path="/app/assistant" element={<AIAssistant />} />
              <Route path="/app/forecasting" element={<ForecastingDashboard />} />
            </Route>
          </Route>
        </Routes>
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
