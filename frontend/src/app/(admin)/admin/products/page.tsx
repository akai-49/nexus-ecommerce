'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Plus, Upload, Download, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4000';

export default function AdminProductsPage() {
  const token = useAuthStore((state) => state.token);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // New Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const fetchProductsAndMetadata = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [prodRes, catRes, brandRes] = await Promise.allSettled([
        axios.get(`${ADMIN_API_URL}/products?page=1&limit=50`, { headers }),
        axios.get(`${ADMIN_API_URL}/products/categories`, { headers }),
        axios.get(`${ADMIN_API_URL}/products/brands`, { headers }),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.data) {
        setProducts(prodRes.value.data.items || []);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data) {
        setCategories(catRes.value.data || []);
      }
      if (brandRes.status === 'fulfilled' && brandRes.value.data) {
        setBrands(brandRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndMetadata();
  }, [token]);

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      await axios.post(`${ADMIN_API_URL}/products/bulk/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('CSV Catalog imported successfully!');
      setCsvFile(null);
      fetchProductsAndMetadata();
    } catch (err: any) {
      alert(err.response?.data?.message || 'CSV Import failed. Check formatting.');
    } finally {
      setImporting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !brandId || !basePrice || !sku) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      // 1. Upload Image file if provided
      if (imageFile) {
        setUploadingImage(true);
        const mediaFormData = new FormData();
        mediaFormData.append('file', imageFile);
        try {
          const mediaRes = await axios.post(`${ADMIN_API_URL}/media/upload`, mediaFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          finalImageUrl = mediaRes.data?.url || finalImageUrl;
        } catch (uploadErr) {
          console.warn('Image upload failed, proceeding without media:', uploadErr);
        } finally {
          setUploadingImage(false);
        }
      }

      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;

      // 2. Create Base Product
      const prodRes = await axios.post(
        `${ADMIN_API_URL}/products`,
        {
          name,
          slug,
          description: description || name,
          categoryId,
          brandId,
          basePrice: Number(basePrice),
          status: 'PUBLISHED',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdProduct = prodRes.data;

      // 3. Create default Variant with SKU and Image
      if (createdProduct?.id) {
        await axios.post(
          `${ADMIN_API_URL}/products/${createdProduct.id}/variants`,
          {
            sku,
            price: Number(basePrice),
            images: finalImageUrl ? [finalImageUrl] : [],
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch((err) => console.warn('Variant creation warning:', err));
      }

      alert('Product and Variant created successfully!');
      setShowAddModal(false);
      setName('');
      setDescription('');
      setCategoryId('');
      setBrandId('');
      setBasePrice('');
      setSku('');
      setImageUrl('');
      setImageFile(null);
      fetchProductsAndMetadata();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products Management</h1>
          <p className="text-sm text-muted-foreground">Manage your store catalog, add products and upload CSV files.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600 shadow flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* CSV Import / Export Panel */}
      <div className="rounded-xl border p-6 bg-card shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CSV Import */}
        <form onSubmit={handleCsvImportSubmit} className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5"><Upload className="h-4 w-4 text-primary" /> Bulk CSV Import</h2>
            <p className="text-xs text-muted-foreground mt-1">Upload products, categories, brands and variant inventory in bulk.</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".csv"
              required
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="flex-grow rounded border p-2 bg-background text-sm cursor-pointer"
            />
            <button 
              type="submit"
              disabled={importing}
              className="rounded bg-primary text-white px-4 py-2 text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Upload'}
            </button>
          </div>
        </form>

        {/* CSV Export templates */}
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5"><Download className="h-4 w-4 text-primary" /> Download Import Template</h2>
            <p className="text-xs text-muted-foreground mt-1">Verify spreadsheet format structure before importing files.</p>
          </div>
          <a 
            href={`${ADMIN_API_URL}/products/bulk/template`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border px-4 py-2.5 text-xs font-bold hover:bg-secondary flex items-center justify-center gap-2 w-fit mt-4"
          >
            <Download className="h-4 w-4" /> Download Template CSV
          </a>
        </div>

      </div>

      {/* Products Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-24 animate-pulse">Loading products table...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-2">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-sm">No products found</p>
            <p className="text-xs text-muted-foreground">Add a product or import a CSV file to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                  <th className="p-4">SKU / Code</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Variants Count</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-mono text-xs">{prod.variants?.[0]?.sku || 'N/A'}</td>
                    <td className="p-4 font-bold">{prod.name}</td>
                    <td className="p-4">{prod.category?.name || 'N/A'}</td>
                    <td className="p-4">{prod.brand?.name || 'N/A'}</td>
                    <td className="p-4 font-semibold text-primary">${Number(prod.basePrice).toFixed(2)}</td>
                    <td className="p-4 text-center">{prod.variants?.length || 0}</td>
                    <td className="p-4 flex gap-2 justify-center">
                      <Link 
                        href={`/products/slug/${prod.slug}`}
                        target="_blank"
                        className="rounded-full bg-secondary p-2 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl p-8 shadow-lg max-w-lg w-full flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold">Add Product</h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-semibold">Product Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Nike Air Max"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-semibold">Description</label>
                <textarea 
                  placeholder="Product description details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded border p-2 bg-background text-sm min-h-[80px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold">Category *</label>
                <select 
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold">Brand *</label>
                <select 
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold">Base Price ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="99.99"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold">Base SKU / Code *</label>
                <input 
                  type="text" 
                  required
                  placeholder="NIKE-AM-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="rounded border p-2 bg-background text-sm"
                />
              </div>

              {/* Media Upload & URL Section */}
              <div className="flex flex-col gap-2 sm:col-span-2 border-t pt-4 mt-2">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" /> Product Image (Media Upload or URL)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-1">Upload File</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="rounded border p-1.5 bg-background text-xs cursor-pointer w-full"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-1">Or Image URL</span>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/photo..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="rounded border p-2 bg-background text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end sm:col-span-2 text-xs mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded border px-4 py-2 hover:bg-secondary font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="rounded bg-primary text-white px-4 py-2 hover:bg-blue-600 font-bold disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading image...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
