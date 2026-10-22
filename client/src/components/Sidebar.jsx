import React, { useState } from 'react';
import { Menu, X, Link } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'Home' },
  { label: 'Books', href: '/admin/books', icon: 'Book' },
  { label: 'Orders', href: '/admin/orders', icon: 'ShoppingCart' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <aside
      className="w-64 h-screen bg-background-primary border-r border-neutral-200 flex flex-col pt-6 transition-all duration-300 ease-in-out transform overflow-y-auto"
      style={{
        width: isOpen ? '240px' : '0',
        marginLeft: isOpen ? '0' : '-240px',
      }}
    >
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="text-xl font-bold text-primary">BookNest</h2>
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex flex-col gap-2 px-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-600 font-medium ${isOpen ? '' : 'hidden'} cursor-pointer`}
          >
            <icon === 'Home' ? <Home className="h-5 w-5" /> : icon === 'Book' ? <Book className="h-5 w-5" /> : icon === 'ShoppingCart' ? <ShoppingCart className="h-5 w-5" /> : icon === 'Users' ? <Users className="h-5 w-5" /> : <Settings className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}