import { useState } from 'react';
import api from '../lib/api';

export default function Checkout() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const placeOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/orders', { shipping_address: address });
      setMsg('Order placed successfully!');
      setTimeout(() => { window.location.href = '/profile'; }, 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Checkout</h1>
        <form onSubmit={placeOrder} className="rounded-xl border border-gray-200 bg-white p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Shipping Address</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              placeholder="Enter your full shipping address"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Placing order...' : 'Place Order'}
          </Button>
          {msg && <p className="mt-3 text-sm {msg.includes('failed') ? 'text-semantic-error' : 'text-semantic-success'}">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
