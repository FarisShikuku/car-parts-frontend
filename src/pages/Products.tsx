import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../api/client';
import type { Product } from '../types';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Delete this product?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  if (loading) return <div className="p-8">Loading products...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Products</h1>
        <Link
          to="/products/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          + Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm font-mono">{p.sku}</td>
                  <td className="px-6 py-4 text-sm">{p.name}</td>
                  <td className="px-6 py-4 text-sm">${p.price}</td>
                  <td className="px-6 py-4 text-sm">{p.stock_quantity}</td>
                  <td className="px-6 py-4 text-sm">
                    {p.primary_image_url && (
                      <img src={p.primary_image_url} alt={p.name} className="w-10 h-10 object-cover rounded" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Link to={`/products/${p.id}/edit`} className="text-blue-500 hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};