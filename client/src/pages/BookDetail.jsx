import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

export default function BookDetail() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api
      .get(`/books/${id}`)
      .then((res) => {
        setBook(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const addToCart = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('Please login to add to cart');
      return;
    }
    try {
      await api.post('/cart', { book_id: Number(id), quantity });
      setMsg('Added to cart!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!book) return <div className="text-center py-20 text-red-600">Book not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-100 rounded-xl h-[400px] flex items-center justify-center text-gray-400">
          {book.image_url ? (
            <img src={book.image_url} alt={book.title} className="max-h-full max-w-full object-contain" />
          ) : (
            'No image'
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-gray-500 mb-4">by {book.author}</p>
          <p className="text-xl font-semibold mb-2">₹{Number(book.price).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mb-4">{book.category_name || 'General'} • {book.stock} in stock</p>
          <p className="mb-6">{book.description}</p>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium">Qty</label>
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity === 1}
                className="px-3 py-1 hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-1 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            onClick={addToCart}
            disabled={book.stock < quantity}
            className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Add to Cart
          </button>
          {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
