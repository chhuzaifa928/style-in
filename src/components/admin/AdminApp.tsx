'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Category } from '@/lib/types';
import { apiGet, apiSend } from './api';
import ProductsPanel from './ProductsPanel';
import CategoriesPanel from './CategoriesPanel';
import OrdersPanel from './OrdersPanel';
import SettingsPanel from './SettingsPanel';

type Tab = 'products' | 'categories' | 'orders' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'orders', label: 'Orders' },
  { key: 'settings', label: 'Settings' },
];

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [toast, setToast] = useState('');

  const loadCategories = useCallback(async () => {
    const res = await apiGet<Category[]>('/api/categories?all=1');
    if (res.ok && res.data) setCategories(res.data);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  }, []);

  const logout = async () => {
    await apiSend('/api/admin/logout', 'POST');
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
        <div className="container-page flex items-center justify-between py-3.5">
          <div className="flex items-center gap-3">
            <span className="heading text-xl">
              StyleIn<span className="text-brand">.</span>
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-muted sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="text-sm font-semibold text-muted hover:text-brand">
              View Store ↗
            </a>
            <button onClick={logout} className="btn-outline px-4 py-2 text-xs">
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="container-page flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
                tab === t.key
                  ? 'border-brand text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-page py-8">
        {tab === 'products' && (
          <ProductsPanel categories={categories} onToast={showToast} />
        )}
        {tab === 'categories' && (
          <CategoriesPanel
            categories={categories}
            onChanged={loadCategories}
            onToast={showToast}
          />
        )}
        {tab === 'orders' && <OrdersPanel onToast={showToast} />}
        {tab === 'settings' && <SettingsPanel onToast={showToast} />}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-fade-in bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
