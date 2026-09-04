import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccessDenied from './AccessDenied';

// Backend-enforced: every API call still requires a valid bearer token and,
// for admin-only endpoints, an admin role — these guards only control what
// renders in the browser, they are not the security boundary.

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <AccessDenied />;
  }
  return <Outlet />;
}
