import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center text-emerald-600 font-bold">
                Car Parts Vision
              </Link>
              <Link to="/products" className="flex items-center text-slate-700 dark:text-slate-300 hover:text-emerald-600">
                Products
              </Link>
              <Link to="/test" className="flex items-center text-slate-700 dark:text-slate-300 hover:text-emerald-600">
                Test Match
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};