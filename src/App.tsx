import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { ChartOfAccounts } from './modules/chart-of-accounts/ChartOfAccounts';
import { TransactionList } from './modules/transactions/TransactionList';
import { IncomeForm } from './modules/transactions/IncomeForm';
import { ExpenseForm } from './modules/transactions/ExpenseForm';
import { TransferForm } from './modules/transactions/TransferForm';
import { TransactionDetail } from './modules/transactions/TransactionDetail';
import { Contacts } from './modules/contacts/Contacts';
import { Reports } from './modules/reports/Reports';
import { Reconciliation } from './modules/reconciliation/Reconciliation';
import { Banks } from './modules/banks/Banks';
import { ToastProvider } from './contexts/ToastContext';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/chart-of-accounts" replace />} />
                    <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
                    <Route path="/transactions" element={<TransactionList />} />
                    <Route path="/transactions/income/new" element={<IncomeForm />} />
                    <Route path="/transactions/income/edit/:id" element={<IncomeForm />} />
                    <Route path="/transactions/expense/new" element={<ExpenseForm />} />
                    <Route path="/transactions/expense/edit/:id" element={<ExpenseForm />} />
                    <Route path="/transactions/transfer/new" element={<TransferForm />} />
                    <Route path="/transactions/transfer/edit/:id" element={<TransferForm />} />
                    <Route path="/transactions/:id" element={<TransactionDetail />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/reports/*" element={<Reports />} />
                    <Route path="/reconciliation" element={<Reconciliation />} />
                    <Route path="/banks" element={<Banks />} />
                    <Route path="*" element={<Navigate to="/chart-of-accounts" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
