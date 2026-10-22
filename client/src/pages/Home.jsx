import { useState, useEffect } from 'react';
import api from '../lib/api';
import BookCard from '../components/BookCard';
import { Input } from '../components/Input';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/books'),
      api.get('/books/categories'),
    ]).then(([bRes, cRes]) => {
      setBooks(bRes.data);
      setCategories(cRes.data);
      setLoading(false);
    });
  }, []);

  const filtered = books.filter((b) => {
    const matchCat = !selectedCategory || b.category_name === selectedCategory;
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Welcome to BookNest</h1>
            <p className="text-neutral-600 mt-1">Discover your next great read.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              id="search-input"
              type="text"
              placeholder="Search books, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="relative rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading books...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">No books found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
