import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', author: '', price: '', description: '', category_id: '', stock: '' });
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
    api.get('/admin/books').then((res) => setBooks(res.data)).finally(() => setLoading(false));
  }, []);

  const addBook = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('author', form.author);
    fd.append('price', form.price);
    fd.append('description', form.description);
    fd.append('category_id', form.category_id);
    fd.append('stock', form.stock);
    if (image) fd.append('image', image);
    try {
      await api.post('/books', fd);
      setMsg('Book added!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add book');
    }
  };

  const deleteBook = (id) => {
    if (window.confirm('Delete this book?')) {
      api.delete(`/books/${id}`).then(() => window.location.reload());
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your bookstore</p>
          </div>
          <Link to="/" className="text-indigo-600 hover:underline">View store</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-gray-500 text-sm">Total Books</p>
            <p className="text-2xl font-bold">{stats.totalBooks || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-gray-500 text-sm">Total Customers</p>
            <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-gray-500 text-sm">Total Sales</p>
            <p className="text-2xl font-bold">₹{Number(stats.totalSales || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Add New Book</h2>
            <form onSubmit={addBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <input
                  required
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Add Book
              </button>
            </form>
            {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">All Books</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Title</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Price</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Stock</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id} className="border-b border-gray-100">
                      <td className="px-3 py-2">{b.title}</td>
                      <td className="px-3 py-2">₹{Number(b.price).toFixed(2)}</td>
                      <td className="px-3 py-2">{b.stock}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => deleteBook(b.id)} className="text-red-600 hover:text-red-800 text-sm">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
