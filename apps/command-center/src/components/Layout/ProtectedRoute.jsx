import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

export default function ProtectedRoute({ children, requireAdmin = false, requireVolunteer = false }) {
  const { currentUser, isAdmin, isVolunteer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Authenticating..." />
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireVolunteer && !isVolunteer) {
    // If an admin tries to access volunteer specific pages, redirect to dashboard
    if (isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
