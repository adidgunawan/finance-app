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
import './styles/globals.css';

function Home() {
  return (
    <div className="container">
      <h1 className="page-title">Home</h1>
      <p>Welcome to your financial management application.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
                    <Route path="/transactions" element={<TransactionList />} />
                    <Route path="/transactions/income/new" element={<IncomeForm />} />
                    <Route path="/transactions/expense/new" element={<ExpenseForm />} />
                    <Route path="/transactions/transfer/new" element={<TransferForm />} />
                    <Route path="/transactions/:id" element={<TransactionDetail />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
