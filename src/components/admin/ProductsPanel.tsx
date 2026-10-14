'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Category, Product } from '@/lib/types';
import { formatPKR, discountPercent } from '@/lib/format';
import { apiGet, apiSend } from './api';
import ImageManager, { DraftImage } from './ImageManager';
import { IconClose, IconPlus, IconTrash, IconChevron } from '../icons';

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

interface FormState {
  name: string;
  category_id: string;
  description: string;
  actual_price: string;
  discounted_price: string;
  stock: string;
  sizes: string[];
  is_featured: boolean;
  is_active: boolean;
  images: DraftImage[];
}

const EMPTY_FORM: FormState = {
  name: '',
  category_id: '',
  description: '',
  actual_price: '',
  discounted_price: '',
  stock: '0',
  sizes: [],
  is_featured: false,
  is_active: true,
  images: [],
};

interface Props {
  categories: Category[];
  onToast: (msg: string) => void;
}

export default function ProductsPanel({ categories, onToast }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [customSize, setCustomSize] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await apiGet<Product[]>('/api/products?sort=newest');
    if (res.ok && res.data) setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category_id: p.category_id ? String(p.category_id) : '',
      description: p.description ?? '',
      actual_price: String(p.actual_price ?? ''),
      discounted_price: String(p.discounted_price ?? ''),
      stock: String(p.stock ?? 0),
      sizes: p.sizes_available ?? [],
      is_featured: Boolean(p.is_featured),
      is_active: Boolean(p.is_active),
      images: (p.images ?? []).map((i) => ({
        id: i.id,
        image_url: i.image_url,
        is_primary: Boolean(i.is_primary),
      })),
    });
    setEditorOpen(true);
  };

  const pct = useMemo(
    () =>
      discountPercent(
        Number(form.actual_price) || 0,
        Number(form.discounted_price) || 0,
      ),
    [form.actual_price, form.discounted_price],
  );

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s)
        ? f.sizes.filter((x) => x !== s)
        : [...f.sizes, s],
    }));
  };

  const addCustomSize = () => {
    const s = customSize.trim();
    if (s && !form.sizes.includes(s)) {
      setForm((f) => ({ ...f, sizes: [...f.sizes, s] }));
    }
    setCustomSize('');
  };

  const save = async () => {
    if (!form.name.trim()) {
      onToast('Product name is required');
      return;
    }
    if (!(Number(form.discounted_price) > 0)) {
      onToast('Selling price must be greater than 0');
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      description: form.description,
      actual_price: Number(form.actual_price) || 0,
      discounted_price: Number(form.discounted_price) || 0,
      stock: Number(form.stock) || 0,
      sizes_available: form.sizes,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };

    if (editingId == null) {
      // Create with images in one shot.
      const res = await apiSend<{ id: number }>('/api/products', 'POST', {
        ...payload,
        images: form.images.map((i) => ({
          image_url: i.image_url,
          is_primary: i.is_primary,
        })),
      });
      setSaving(false);
      if (!res.ok) {
        onToast(res.error || 'Could not create product');
        return;
      }
      onToast('Product created');
    } else {
      // Update core fields; images are managed live via ImageManager callbacks,
      // but newly added (unpersisted) images still need to be attached.
      const res = await apiSend('/api/products/' + editingId, 'PUT', payload);
      if (res.ok) {
        const newImages = form.images.filter((i) => !i.id);
        for (const img of newImages) {
          await apiSend(`/api/products/${editingId}/images`, 'POST', {
            image_url: img.image_url,
            is_primary: img.is_primary,
          });
        }
      }
      setSaving(false);
      if (!res.ok) {
        onToast(res.error || 'Could not update product');
        return;
      }
      onToast('Product updated');
    }

    setEditorOpen(false);
    await load();
  };

  // Move a product up/down and persist the whole list's new order.
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= products.length || reordering) return;
    const next = products.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setProducts(next);
    setReordering(true);
    const res = await apiSend('/api/products/reorder', 'POST', {
      ids: next.map((p) => p.id),
    });
    setReordering(false);
    if (!res.ok) {
      onToast(res.error || 'Could not save order');
      await load(); // revert to server truth
    }
  };

  const archive = async (p: Product) => {
    if (!confirm(`Archive "${p.name}"? It will be hidden from the store.`)) return;
    const res = await apiSend('/api/products/' + p.id, 'DELETE');
    if (res.ok) {
      onToast('Product archived');
      await load();
    }
  };

  const restore = async (p: Product) => {
    const res = await apiSend('/api/products/' + p.id, 'PUT', {
      ...p,
      sizes_available: p.sizes_available,
      is_active: true,
    });
    if (res.ok) {
      onToast('Product restored');
      await load();
    }
  };

  // Live image ops for persisted products.
  const deletePersisted = async (imageId: number) => {
    await apiSend('/api/images/' + imageId, 'DELETE');
  };
  const setPrimaryPersisted = async (imageId: number) => {
    await apiSend('/api/images/' + imageId, 'PATCH', { is_primary: true });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="heading text-xl">Catalog</h2>
          <p className="text-sm text-muted">{products.length} products</p>
        </div>
        <button onClick={openNew} className="btn-dark">
          <IconPlus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No products yet. Click “Add Product” to create your first drop.
        </p>
      ) : (
        <div className="overflow-x-auto border border-hairline bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-2 py-3 text-center">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const cover =
                  p.images?.find((i) => i.is_primary)?.image_url ??
                  p.images?.[0]?.image_url;
                const d = discountPercent(p.actual_price, p.discounted_price);
                return (
                  <tr key={p.id} className="border-b border-hairline last:border-0">
                    <td className="px-2 py-3">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0 || reordering}
                          title="Move up"
                          className="grid h-6 w-6 place-items-center text-muted hover:text-ink disabled:opacity-25"
                        >
                          <IconChevron className="h-4 w-4 -rotate-90" />
                        </button>
                        <button
                          onClick={() => move(idx, 1)}
                          disabled={idx === products.length - 1 || reordering}
                          title="Move down"
                          className="grid h-6 w-6 place-items-center text-muted hover:text-ink disabled:opacity-25"
                        >
                          <IconChevron className="h-4 w-4 rotate-90" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 flex-shrink-0 overflow-hidden bg-[#F1F0EC]">
                          {cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{formatPKR(p.discounted_price)}</span>
                      {d > 0 && (
                        <span className="ml-1 text-xs text-brand">-{d}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.stock <= 0
                            ? 'font-semibold text-brand'
                            : p.stock <= 5
                              ? 'font-semibold text-brand/80'
                              : ''
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <span className="text-xs font-semibold text-ink">Active</span>
                      ) : (
                        <span className="text-xs font-semibold text-muted">Archived</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="btn-outline px-3 py-1.5 text-xs">
                          Edit
                        </button>
                        {p.is_active ? (
                          <button onClick={() => archive(p)} className="px-2 py-1.5 text-brand hover:opacity-70" title="Archive">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => restore(p)} className="btn px-3 py-1.5 text-xs text-ink underline">
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor drawer */}
      {editorOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button aria-label="Close" onClick={() => setEditorOpen(false)} className="absolute inset-0 bg-ink/50 animate-fade-in" />
          <div className="relative z-10 flex h-full w-full max-w-xl animate-slide-in-right flex-col bg-canvas shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline bg-surface px-6 py-4">
              <h3 className="heading text-lg">
                {editingId == null ? 'New Product' : 'Edit Product'}
              </h3>
              <button onClick={() => setEditorOpen(false)} aria-label="Close"><IconClose /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">Product Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Oversized Boxy Tee" />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">— Uncategorized —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea className="input min-h-[90px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Fabric, fit, styling notes…" />
                </div>

                {/* Pricing with live discount calc */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Compare-at Price (PKR)</label>
                    <input className="input" type="number" min="0" step="1" value={form.actual_price} onChange={(e) => setForm({ ...form, actual_price: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Selling Price (PKR)</label>
                    <input className="input" type="number" min="0" step="1" value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-surface px-4 py-3 text-sm">
                  <span className="text-muted">Auto-calculated discount:</span>
                  <span className={`font-bold ${pct > 0 ? 'text-brand' : 'text-muted'}`}>
                    {pct > 0 ? `-${pct}% OFF` : 'No discount'}
                  </span>
                </div>

                {/* Stock */}
                <div>
                  <label className="label">Stock (units)</label>
                  <input className="input" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  <p className="mt-1 text-[11px] text-muted">Auto-decrements when COD orders are placed. ≤5 shows the low-stock sonar badge; 0 marks it sold out.</p>
                </div>

                {/* Sizes */}
                <div>
                  <label className="label">Variant Sizes</label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="text-[11px] font-semibold uppercase text-muted">Apparel:</span>
                    {APPAREL_SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSize(s)} className={`border px-2.5 py-1 text-xs font-semibold ${form.sizes.includes(s) ? 'border-ink bg-ink text-white' : 'border-hairline text-muted hover:border-ink'}`}>{s}</button>
                    ))}
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="text-[11px] font-semibold uppercase text-muted">Shoes:</span>
                    {SHOE_SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSize(s)} className={`border px-2.5 py-1 text-xs font-semibold ${form.sizes.includes(s) ? 'border-ink bg-ink text-white' : 'border-hairline text-muted hover:border-ink'}`}>{s}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="input" placeholder="Custom size (e.g. 46 / 3XL)" value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }} />
                    <button type="button" onClick={addCustomSize} className="btn-outline px-4 py-2 text-xs whitespace-nowrap">Add</button>
                  </div>
                  {form.sizes.length > 0 && (
                    <p className="mt-2 text-xs text-muted">Selected: {form.sizes.join(', ')}</p>
                  )}
                </div>

                {/* Images */}
                <ImageManager
                  images={form.images}
                  onChange={(imgs) => setForm({ ...form, images: imgs })}
                  onDeletePersisted={editingId != null ? deletePersisted : undefined}
                  onSetPrimaryPersisted={editingId != null ? setPrimaryPersisted : undefined}
                />

                {/* Flags */}
                <div className="flex flex-wrap gap-5 border-t border-hairline pt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                    Featured (show in Featured Drops)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    Active (visible in store)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-hairline bg-surface px-6 py-4">
              <button onClick={() => setEditorOpen(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-brand flex-1">
                {saving ? 'Saving…' : editingId == null ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
