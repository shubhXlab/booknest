import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Profile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading orders...</div>;

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Link to="/" className="text-indigo-600 hover:underline">← Back to shop</Link>
          <h1 className="ml-4 text-2xl font-bold text-gray-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No orders yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">Order #</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Total</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">#{o.id}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-medium">₹{Number(o.total_amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : o.status === 'shipped'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
