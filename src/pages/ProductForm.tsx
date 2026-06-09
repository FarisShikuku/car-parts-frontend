import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct, getProduct, uploadProductImage, getCategories } from '../api/client';
import type { Category } from '../types';

export const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: 1,
    price: '',
    stock_quantity: 0,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        // getCategories returns Category[] directly (no pagination)
        let categoriesData: Category[] = [];
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          categoriesData = response.data.results;
        } else {
          categoriesData = [];
        }
        setCategories(categoriesData);
        
        // If categories exist and form category_id is still default 1, set to first category
        if (categoriesData.length > 0 && form.category_id === 1) {
          setForm(prev => ({ ...prev, category_id: categoriesData[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch product if editing
  useEffect(() => {
    if (id) {
      getProduct(Number(id)).then((res) => {
        const p = res.data;
        setForm({
          sku: p.sku,
          name: p.name,
          description: p.description || '',
          category_id: p.category_id,
          price: p.price,
          stock_quantity: p.stock_quantity,
        });
        if (p.primary_image_url) {
          setImagePreview(p.primary_image_url);
        }
      });
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);
    
    try {
      let productId: number;
      
      // Prepare data for API - keep price as string (Django expects string or number)
      const productData = {
        sku: form.sku,
        name: form.name,
        description: form.description,
        category_id: form.category_id,
        price: form.price, // keep as string
        stock_quantity: Number(form.stock_quantity),
      };
      
      if (id) {
        await updateProduct(Number(id), productData);
        productId = Number(id);
      } else {
        const res = await createProduct(productData);
        productId = res.data.id;
      }
      
      // Upload image if selected
      if (imageFile) {
        await uploadProductImage(productId, imageFile, isPrimary);
      }
      
      navigate('/products');
    } catch (err: any) {
      console.error('Save error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to save product';
      alert(errorMsg);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (categoriesLoading) {
    return <div className="p-8">Loading categories...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Product' : 'Add Product'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium">SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: parseInt(e.target.value) })}
            className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-red-500 text-sm mt-1">
              No categories found. Please add categories to your database.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Stock Quantity</label>
          <input
            type="number"
            value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-lg dark:bg-slate-700"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
            </div>
          )}
          <label className="inline-flex items-center mt-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="mr-2"
            />
            Set as primary image
          </label>
          <p className="text-xs text-slate-400 mt-1">
            Image will be uploaded to Supabase Storage. URLs are alternative only.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading || categories.length === 0}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading image...' : (loading ? 'Saving...' : 'Save Product')}
        </button>
      </form>
    </div>
  );
};