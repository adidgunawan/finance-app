import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { ToastProvider } from './contexts/ToastContext';
import { SearchProvider } from './contexts/SearchContext';
import { DefaultRedirect } from './components/Layout/DefaultRedirect';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

import { PageLoader } from './components/Layout/PageLoader';

// Lazy load modules (same as before)
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Home = lazy(() => import('./modules/home/Home').then(module => ({ default: module.Home })));
const ChartOfAccounts = lazy(() => import('./modules/chart-of-accounts/ChartOfAccounts').then(module => ({ default: module.ChartOfAccounts })));
const TransactionList = lazy(() => import('./modules/transactions/TransactionList').then(module => ({ default: module.TransactionList })));
const IncomeForm = lazy(() => import('./modules/transactions/IncomeForm').then(module => ({ default: module.IncomeForm })));
const ExpenseForm = lazy(() => import('./modules/transactions/ExpenseForm').then(module => ({ default: module.ExpenseForm })));
const TransferForm = lazy(() => import('./modules/transactions/TransferForm').then(module => ({ default: module.TransferForm })));
const TransactionDetail = lazy(() => import('./modules/transactions/TransactionDetail').then(module => ({ default: module.TransactionDetail })));
const Contacts = lazy(() => import('./modules/contacts/Contacts').then(module => ({ default: module.Contacts })));
const Reports = lazy(() => import('./modules/reports/Reports').then(module => ({ default: module.Reports })));
const Reconciliation = lazy(() => import('./modules/reconciliation/Reconciliation').then(module => ({ default: module.Reconciliation })));
const Banks = lazy(() => import('./modules/banks/Banks').then(module => ({ default: module.Banks })));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={
                <Suspense fallback={<PageLoader fullScreen />}>
                  <Login />
                </Suspense>
              } />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<DefaultRedirect />} />
                          <Route path="/home" element={<Home />} />
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
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
          <Toaster />
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
