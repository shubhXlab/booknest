export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return null; // Router will redirect
  }

  return children;
}

import { useAuth } from '../context/AuthContext';
