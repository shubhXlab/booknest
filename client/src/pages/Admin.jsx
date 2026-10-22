import React from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminBooks from '../pages/AdminBooks';
import AdminOrders from '../pages/AdminOrders';
import AdminUsers from '../pages/AdminUsers';
import AdminSettings from '../pages/AdminSettings';
import { Switch, Route, useLocation } from 'react-router-dom';

export default function Admin() {
  const location = useLocation();

  return (
    <AdminLayout>
      <Switch>
        <Route exact path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/books" component={AdminBooks} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route
          component={() =>
            <div className="py-8">
              <h1 className="text-center text-neutral-600">Admin Panel</h1>
              <p className="text-center text-neutral-500 mt-4">Select a page from the sidebar</p>
            </div>
          }
        />
      </Switch>
    </AdminLayout>
  );
}