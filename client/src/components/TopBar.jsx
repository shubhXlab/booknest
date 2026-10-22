import React from 'react';
import { X, Menu, User, LogOut } from 'lucide-react';

export default function TopBar({ isSidebarOpen, onSidebarToggle, user, onLogout }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-background-primary shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
          aria-label="Open sidebar"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-primary">BookNest</h2>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-neutral-600 font-medium">Welcome, {user.name}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-neutral-100 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm text-indigo-600 hover:underline font-medium">Login</Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-md hover:bg-neutral-100 transition-colors hidden md:block"
          aria-label="Open sidebar"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}