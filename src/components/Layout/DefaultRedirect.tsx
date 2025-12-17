import { Navigate } from 'react-router-dom';

export function DefaultRedirect() {
    return <Navigate to="/chart-of-accounts" replace />;
}
