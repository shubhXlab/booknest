import React from 'react';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-2 px-6 py-3 text-sm text-neutral-500">
      {items.map((item, index) => (
        <span key={item.to || item.label}>
          {index > 0 ? '/' : ''}
          {item.to ? (
            <a href={item.to} className="hover:text-primary transition-colors">
              {item.label}
            </a>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}