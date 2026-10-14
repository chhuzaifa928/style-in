'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';
import { apiSend } from './api';
import { IconPlus, IconTrash } from '../icons';

interface Props {
  categories: Category[];
  onChanged: () => Promise<void> | void;
  onToast: (msg: string) => void;
}

export default function CategoriesPanel({ categories, onChanged, onToast }: Props) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  const topLevel = categories.filter((c) => c.parent_id === null);

  const add = async () => {
    if (!name.trim()) {
      onToast('Category name is required');
      return;
    }
    setSaving(true);
    const res = await apiSend('/api/categories', 'POST', {
      name,
      parent_id: parentId || null,
    });
    setSaving(false);
    if (!res.ok) {
      onToast(res.error || 'Could not create category');
      return;
    }
    setName('');
    setParentId('');
    onToast('Category added');
    await onChanged();
  };

  const toggleActive = async (c: Category) => {
    const res = await apiSend('/api/categories/' + c.id, 'PATCH', {
      is_active: !c.is_active,
    });
    if (res.ok) await onChanged();
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"? Products keep existing but become uncategorized.`)) return;
    const res = await apiSend('/api/categories/' + c.id, 'DELETE');
    if (res.ok) {
      onToast('Category deleted');
      await onChanged();
    }
  };

  const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id);

  return (
    <div>
      <div className="mb-5">
        <h2 className="heading text-xl">Category Tree</h2>
        <p className="text-sm text-muted">
          Add departments dynamically — Clothes, Shoes, and future lines like Bags or Perfumes. No schema change needed.
        </p>
      </div>

      {/* Add form */}
      <div className="mb-6 flex flex-col gap-3 border border-hairline bg-surface p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label">New Category Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fragrances" onKeyDown={(e) => e.key === 'Enter' && add()} />
        </div>
        <div className="sm:w-56">
          <label className="label">Parent (optional)</label>
          <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— Top level —</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button onClick={add} disabled={saving} className="btn-dark">
          <IconPlus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Tree */}
      <div className="border border-hairline bg-surface">
        {topLevel.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No categories yet.</p>
        ) : (
          <ul>
            {topLevel.map((parent) => (
              <li key={parent.id} className="border-b border-hairline last:border-0">
                <Row c={parent} onToggle={toggleActive} onDelete={remove} />
                {childrenOf(parent.id).map((child) => (
                  <div key={child.id} className="border-t border-hairline bg-canvas pl-8">
                    <Row c={child} onToggle={toggleActive} onDelete={remove} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({
  c,
  onToggle,
  onDelete,
}: {
  c: Category;
  onToggle: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-semibold">{c.name}</span>
        <span className="text-xs text-muted">/{c.slug}</span>
        {!c.is_active && (
          <span className="text-[10px] font-semibold uppercase text-muted">Hidden</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onToggle(c)} className="btn-outline px-3 py-1.5 text-xs">
          {c.is_active ? 'Hide' : 'Show'}
        </button>
        <button onClick={() => onDelete(c)} className="px-2 py-1.5 text-brand hover:opacity-70" title="Delete">
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
