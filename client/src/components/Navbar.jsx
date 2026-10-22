import { useState } from 'react';
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
          <a href="/" className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-indigo-600" />
            <span className="font-bold text-xl text-indigo-600 tracking-tight">
              BookNest
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            <a href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
              Home
            </a>
            <a href="/books" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
              Books
            </a>
            {user && (
              <>
                <a href="/cart" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 relative">
                  Cart
                  <span className="absolute top-0 right-0 bg-indigo-600 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">0</span>
                </a>
                <a href="/profile" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
                  My Orders
                </a>
              </>
            )}
            {user?.role === 'admin' && (
              <a href="/admin" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">
                Admin
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <a href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Login</a>
                <a href="/register" className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Sign up</a>
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <a href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Home</a>
              <a href="/books" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Books</a>
              {user && (
                <>
                  <a href="/cart" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Cart</a>
                  <a href="/profile" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">My Orders</a>
                </>
              )}
              {user?.role === 'admin' && (
                <a href="/admin" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Admin</a>
              )}
              <a href="/privacy" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Privacy Policy</a>
              <a href="/terms" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Terms & Conditions</a>
              {!user ? (
                <>
                  <a href="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">Login</a>
                  <a href="/register" className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center">Sign up</a>
                </>
              ) : (
                <button onClick={logout} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 text-left flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
