import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  User,
  LogOut,
  BookOpen,
  Shield,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-indigo-600" />
            <span className="font-bold text-xl text-indigo-600 tracking-tight">
              BookNest
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
              Home
            </Link>
            <Link to="/books" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
              Books
            </Link>
            {user && (
              <>
                <Link to="/cart" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 relative">
                  Cart
                  <span className="absolute top-0 right-0 bg-indigo-600 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">0</span>
                </Link>
                <Link to="/profile" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
                  My Orders
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Sign up</Link>
              </>
            ) : (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

import { useState } from 'react';
