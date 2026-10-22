import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Table, TableHeader, TableRow, TableCell, TableColumn, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input } from '../components';
import { X, Check, Trash, Clock } from 'lucide-react';
import api from '../lib/api';
import { useHistory } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ status: 'pending' });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const history = useHistory();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, [search]);

  const loadOrders = () => {
    api.get('/admin/orders?search=' + search).then((res) => setOrders(res.data));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setMsg(`Order status updated to ${newStatus}`);
      setTimeout(() => {
        loadOrders();
        setMsg('');
      }, 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this order?')) {
      api.delete(`/admin/orders/${id}`).then(() => loadOrders());
    }
  };

  if (loading) return <div className="py-20 text-center">Loading...</div>;

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Manage Orders</h1>
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 mb-4"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>{order.user_name || 'Guest'}</TableCell>
                <TableCell>₹{Number(order.total_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <select
                    className="rounded-border border-gray-300 py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </TableCell>
                <TableCell>{order.items.length}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Details</Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(order.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Status Change Modal */}
        {editing && (
          <Modal>
            <ModalHeader>Update Order Status</ModalHeader>
            <ModalBody>
              <p>Order #{editing.id}</p>
              <p>Current status: <span className="font-medium">{editing.status}</span></p>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleStatusChange(editing.id, form.status);
                setEditing(null);
                setMsg('');}} className="space-y-4">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button type="submit" onClick={() => setMsg('')}>Update</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        )}

        {/* Add Order Comment Modal */}
        {msg && (
          <Modal>
            <ModalHeader>Order Updated</ModalHeader>
            <ModalBody>{msg}</ModalBody>
            <ModalFooter>
              <Button variant="secondary">OK</Button>
            </ModalFooter>
          </Modal>
        )}
      </div>
    </div>
  );
}