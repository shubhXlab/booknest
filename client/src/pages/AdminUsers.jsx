import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Table, TableHeader, TableRow, TableCell, TableColumn, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input } from '../components';
import { X, Check, Trash, UserPlus, Ban, Shield } from 'lucide-react';
import api from '../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', status: 'active' });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, [msg]);

  const loadUsers = () => {
    api.get('/admin/users').then((res) => setUsers(res.data));
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setMsg(`Role updated to ${newRole}`);
      setTimeout(() => {
        loadUsers();
        setMsg('');
      }, 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      setMsg(`Status updated to ${newStatus}`);
      setTimeout(() => {
        loadUsers();
        setMsg('');
      }, 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this user?')) {
      api.delete(`/admin/users/${id}`).then(() => loadUsers());
    }
  };

  if (loading) return <div className="py-20 text-center">Loading...</div>;

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">User Management</h1>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order History</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  <a href={`/users/${user.id}/orders`} className="text-indigo-600 hover:underline text-sm">
                    View history
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={user.role === 'admin' ? 'outline' : 'danger'}
                      onClick={() => handleToggleRole(user.id, user.role)}
                    >
                      {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </Button>
                    <Button
                      size="sm"
                      variant={user.status === 'active' ? 'danger' : 'primary'}
                      onClick={() => handleToggleStatus(user.id, user.status)}
                    >
                      {user.status === 'active' ? 'Ban' : 'Unban'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Role/Status Change Modal */}
        {editing && (
          <Modal>
            <ModalHeader>Update User</ModalHeader>
            <ModalBody>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editing) {
                  // Handle the role/status toggle that was already done
                  setMsg('');} }> className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                  <select
                    className="rounded-border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select
                    className="rounded-border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                  >
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button type="submit">Update</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        )}

        {/* Add User Modal */}
        {msg && (
          <Modal>
            <ModalHeader>User Updated</ModalHeader>
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