import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Table, TableHeader, TableRow, TableCell, Input, Button } from '../components';
import { RefreshCw, X } from 'lucide-react';
import api from '../lib/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      setSettings(res.data);
      setLoading(false);
    });
  }, [msg]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', settings);
      setMsg('Settings updated successfully!');
      setTimeout(() => setMsg(''), 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return <div className="py-20 text-center">Loading...</div>;

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Site Settings</h1>

        <Card>
          <CardHeader>
            <h2 className="text-base font-medium text-neutral-600">General Configuration</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Site Name</label>
                <Input
                  value={settings.site_name || ''}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full"
                  placeholder="BookNest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Currency</label>
                <Input
                  value={settings.currency || '₹'}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full"
                  placeholder="₹"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email (Admin)</label>
                <Input
                  type="email"
                  value={settings.admin_email || ''}
                  onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                  className="w-full"
                  placeholder="admin@booknest.example"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Gateway</label>
                <Input
                  value={settings.payment_gateway || 'Stripe'}
                  onChange={(e) => setSettings({ ...settings, payment_gateway: e.target.value })}
                  className="w-full"
                  placeholder="Stripe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Secret Key</label>
                <Input
                  type="password"
                  value={settings.secret_key || ''}
                  onChange={(e) => setSettings({ ...settings, secret_key: e.target.value })}
                  className="w-full"
                  placeholder="Enter secret key"
                />
              </div>
              <Button type="submit" className="w-full mt-6">
                Update Settings
              </Button>
              {msg && <p className="mt-3 text-sm {msg.includes('failed') ? 'text-red-600' : 'text-green-600'}">{msg}</p>}
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}