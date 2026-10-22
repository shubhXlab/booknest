import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Table, TableHeader, TableRow, TableCell, TableColumn, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Icon } from '../components';
import { X, Check, Trash, Edit, Upload, Search, SortUp, SortDown } from 'lucide-react';
import api from '../lib/api';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', author: '', price: '', description: '', category_id: '', stock: '' });
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('title-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadBooks();
  }, [search, selectedCategory, selectedSort, page, pageSize]);

  const loadBooks = () => {
    api.get('/admin/books?search=' + search + '&category=' + selectedCategory + '&sort=' + selectedSort + '&page=' + page + '&pageSize=' + pageSize).then((res) => setBooks(res.data));
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this book?')) {
      api.delete(`/admin/books/${id}`).then(() => loadBooks());
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('author', form.author);
    fd.append('price', form.price);
    fd.append('description', form.description);
    fd.append('category_id', form.category_id);
    fd.append('stock', form.stock);
    if (image) fd.append('image', image);

    try {
      if (editing) {
        await api.put(`/admin/books/${editing.id}`, fd);
        setMsg('Book updated!');
      } else {
        await api.post('/admin/books', fd);
        setMsg('Book added!');
      }
      setTimeout(() => {
        setForm({ title: '', author: '', price: '', description: '', category_id: '', stock: '' });
        setImage(null);
        setMsg('');
        loadBooks();
      }, 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Manage Books</h1>
          <Button onClick={() => setForm({ title: '', author: '', price: '', description: '', category_id: '', stock: '' })} className="mb-3">
            <Plus className="mr-2" /> Add Book
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search books, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {[1, 2, 3].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="ml-2 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-48"
            >
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
            </select>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-neutral-500">Show <strong>{pageSize}</strong> per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>{book.category_name || 'General'}</TableCell>
                <TableCell>₹{Number(book.price).toFixed(2)}</TableCell>
                <TableCell>{book.stock}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(book.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Image Modal */}
        {image && (
          <Modal>
            <ModalHeader>Book Image</ModalHeader>
            <ModalBody>
              <img src={URL.createObjectURL(image)} alt={form.title} className="w-full h-48 object-cover" />
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setImage(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        )}

        {/* Book Form Modal */}
        {msg && (
          <Modal>
            <ModalHeader>{editing ? 'Edit Book' : 'Add Book'}</ModalHeader>
            <ModalBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full"
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Author</label>
                  <Input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full"
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="Book description"
                  /></div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category ID</label>
                  <Input
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full"
                    placeholder="Category ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Stock</label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Image</label>
                  <Input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full rounded-border border-gray-300 py-2 px-3"
                  />
                  {image && (
                    <div className="mt-2 text-sm text-neutral-500">
                      <img src={URL.createObjectURL(image)} alt={form.title} className="w-24 h-20 object-cover" />
                    </div>
                  )}
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button type="submit" form="bookForm" disabled={loading}>
                {editing ? 'Update' : 'Add Book'}
              </Button>
              <Button variant="ghost" onClick={() => setMsg('')}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </div>
    </div>
  );
}