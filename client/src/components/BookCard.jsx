import { Star } from 'lucide-react';

export default function BookCard({ book }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
      {book.image_url && (
        <img
          src={book.image_url}
          alt={book.title}
          className="w-full h-48 object-cover bg-gray-100"
        />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">₹{Number(book.price).toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{book.author}</p>
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{book.category_name || 'General'}</span>
          <span>{book.stock} in stock</span>
        </div>
      </div>
    </div>
  );
}
