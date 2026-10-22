import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, StatCard } from '../components';
import { BarChart, LineChart, PieChart, Bar, PieData, PieLabel, Color, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { Button } from '../components';
import { Plus } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [salesData, setSalesData] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/analytics/sales', { period: salesPeriod }),
      api.get('/admin/analytics/top-books'),
      api.get('/admin/analytics/top-categories'),
    ]).then(([statsRes, salesRes, booksRes, catsRes]) => {
      setStats(statsRes.data);
      setSalesData(salesRes.data);
      setTopBooks(booksRes.data);
      setTopCategories(catsRes.data);
      setLoading(false);
    });
  }, [salesPeriod]);

  const handlePeriodChange = (period) => {
    setSalesPeriod(period);
    setSalesData([]);
    api.get('/admin/analytics/sales', { period }).then((res) => setSalesData(res.data));
  };

  if (loading) return <div className="py-20 text-center">Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats Cards Column */}
      <div class="lg:col-span-1">
        <h1 className="text-2xl font-bold text-primary mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            title="Total Books"
            value={stats.totalBooks || 0}
            trend={stats.growthPct > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.growthPct || 0)}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers || 0}
            trend="neutral"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            trend="neutral"
          />
          <StatCard
            title="Total Sales"
            value={`$${(stats.totalSales || 0).toFixed(2)}`}
            trend="up"
            trendValue={15}
          />
        </div>
      </div>

      {/* Charts Column (lg) */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-base font-medium text-neutral-600 mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uv" name="Sales" fill="#2E7D32" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h2 className="text-base font-medium text-neutral-600 mb-4">Top Categories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart data={topCategories} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                <PieData key={datum => datum.name} />
                <PieLabel connector={true} endMargin={8} />
                <Color scheme="category20" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Period selector */}
        <div className="mt-8 p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-medium text-neutral-600 mb-3">Sales Period</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                salesPeriod === 'daily' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => handlePeriodChange('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                salesPeriod === 'weekly' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => handlePeriodChange('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                salesPeriod === 'monthly' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}