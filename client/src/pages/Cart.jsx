import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, RotateCw } from 'lucide-react';

export default function Cart() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    api
      .get('/cart')
      .then((res) => setItems(res.data))
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  };

  const updateQty = (id, qty) => {
    api
      .put(`/cart/${id}`, { quantity: qty })
      .then(() => loadCart());
  };

  const remove = (id) => {
    api.delete(`/cart/${id}`).then(() => loadCart());
  };

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  if (loading) return <div className="text-center py-20">Loading cart...</div>;

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            <Link to="/books" className="text-indigo-600 hover:underline">Start shopping</Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-medium text-gray-500">Book</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 text-right">Price</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 text-center">Qty</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 text-right">Total</th>
                    <th className="pb-3 text-sm font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.title} className="w-12 h-16 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">₹{Number(item.price).toFixed(2)}</td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            disabled={item.quantity === 1}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 text-right">₹{Number(item.price * item.quantity).toFixed(2)}</td>
                      <td className="py-4">
                        <button onClick={() => remove(item.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div>
                <p className="text-gray-500">Total</p>
                <p className="text-xl font-bold">₹{total.toFixed(2)}</p>
              </div>
              <Link
                to="/checkout"
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { Minus } from 'lucide-react';
