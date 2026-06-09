import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};