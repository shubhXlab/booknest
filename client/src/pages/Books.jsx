import { useState, useEffect } from 'react';
import api from '../lib/api';
import BookCard from '../components/BookCard';
import { Input } from '../components/Input';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/books').then((res) => setBooks(res.data));
  }, []);

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">All Books</h1>
          <Input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.length === 0 ? (
            <p className="text-neutral-500">No books found.</p>
          ) : (
            filtered.map((book) => (
              <div key={book.id}>
                <a href={`/books/${book.id}`}>
                  <BookCard book={book} />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
