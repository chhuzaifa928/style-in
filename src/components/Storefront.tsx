'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Category, Product, SiteSettings } from '@/lib/types';
import { discountPercent } from '@/lib/format';
import { useCart } from './useCart';
import ProductCard from './ProductCard';
import QuickView from './QuickView';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import {
  IconBag,
  IconClose,
  IconHeart,
  IconHome,
  IconGrid,
  IconMenu,
  IconSearch,
  IconChevron,
  IconCheck,
} from './icons';

interface Props {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
}

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export default function Storefront({ settings, categories, products }: Props) {
  const cart = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('newest');
  const [search, setSearch] = useState('');
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Wishlist persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem('stylein_wishlist');
      if (raw) setWishlist(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);
  const toggleWish = (id: number) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('stylein_wishlist', JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const topCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories],
  );

  const filtered = useMemo(() => {
    let list = products.slice();
    if (activeCat != null) list = list.filter((p) => p.category_id === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.category_name ?? '').toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => a.discounted_price - b.discounted_price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.discounted_price - a.discounted_price);
        break;
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [products, activeCat, search, sort]);

  const featured = useMemo(
    () => products.filter((p) => p.is_featured).slice(0, 8),
    [products],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  const quickAdd = (p: Product, size: string | null) => {
    cart.add(p, size, 1);
    showToast(`Added ${p.name}${size ? ` · ${size}` : ''} to bag`);
  };

  const marqueeItems = (settings.marquee_text || '')
    .split('•')
    .map((s) => s.trim())
    .filter(Boolean);
  const marqueeLoop = marqueeItems.length ? marqueeItems : ['Welcome to StyleIn'];

  const goShop = (catId: number | null) => {
    setActiveCat(catId);
    setMenuOpen(false);
    setSearchOpen(false);
    document
      .getElementById('shop')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-canvas pb-16 md:pb-0">
      {/* ── Marquee ── */}
      <div className="marquee-wrap overflow-hidden border-b border-hairline bg-brand text-white">
        <div className="marquee-track animate-marquee py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {[0, 1].map((dup) => (
            <span key={dup} className="flex items-center" aria-hidden={dup === 1}>
              {marqueeLoop.map((item, i) => (
                <span key={`${dup}-${i}`} className="flex items-center">
                  <span className="px-6">{item}</span>
                  <span className="opacity-50">/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-3.5">
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>

          <a
            href="#top"
            className="heading select-none text-2xl tracking-tight"
            onClick={() => goShop(null)}
          >
            StyleIn<span className="text-brand">.</span>
          </a>

          {/* Desktop nav tabs */}
          <nav className="hidden items-center gap-7 md:flex">
            <button
              onClick={() => goShop(null)}
              className={`text-sm font-semibold uppercase tracking-wide transition hover:text-brand ${
                activeCat === null ? 'text-ink' : 'text-muted'
              }`}
            >
              All
            </button>
            {topCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => goShop(c.id)}
                className={`text-sm font-semibold uppercase tracking-wide transition hover:text-brand ${
                  activeCat === c.id ? 'text-ink' : 'text-muted'
                }`}
              >
                {c.name}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="text-ink hover:text-brand"
            >
              <IconSearch />
            </button>
            <button
              onClick={() => showToast(`${wishlist.size} saved item(s)`)}
              aria-label="Wishlist"
              className="relative hidden text-ink hover:text-brand sm:block"
            >
              <IconHeart />
              {wishlist.size > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {wishlist.size}
                </span>
              )}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative text-ink hover:text-brand"
            >
              <IconBag />
              {cart.count > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {cart.count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ── Hero split: Apparel vs Footwear ── */}
        <section className="container-page grid grid-cols-1 gap-3 py-6 md:grid-cols-2 md:py-8">
          {[
            {
              eyebrow: 'Streetwear Apparel',
              title: 'The Off-Duty Edit',
              cta: 'Shop Clothes',
              cat: topCategories.find((c) => /cloth/i.test(c.name))?.id ?? null,
              bg: 'linear-gradient(135deg,#1b1b1b,#3a3a3a)',
            },
            {
              eyebrow: 'Kinetic Footwear',
              title: 'Sole Movement',
              cta: 'Shop Shoes',
              cat: topCategories.find((c) => /shoe/i.test(c.name))?.id ?? null,
              bg: 'linear-gradient(135deg,#C91A25,#7d0f16)',
            },
          ].map((h) => (
            <button
              key={h.title}
              onClick={() => goShop(h.cat)}
              className="group relative flex aspect-[4/5] items-end overflow-hidden text-left sm:aspect-[16/10] md:aspect-[4/5]"
              style={{ background: h.bg }}
            >
              <div className="absolute inset-0 bg-black/10 transition-transform duration-700 group-hover:scale-105" />
              <div className="relative z-10 p-6 md:p-8">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  {h.eyebrow}
                </span>
                <h2 className="heading mt-1 text-3xl text-white md:text-4xl">
                  {h.title}
                </h2>
                <span className="mt-3 inline-flex items-center gap-1.5 border-b border-white pb-0.5 text-sm font-semibold text-white">
                  {h.cta}
                  <IconChevron className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          ))}
        </section>

        {/* ── Featured rail ── */}
        {featured.length > 0 && (
          <section className="container-page py-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="heading text-xl">Featured Drops</h2>
              <button
                onClick={() => goShop(null)}
                className="text-sm font-semibold text-muted hover:text-brand"
              >
                View all
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {featured.map((p) => (
                <div key={p.id} className="w-[240px] flex-shrink-0">
                  <ProductCard
                    product={p}
                    wished={wishlist.has(p.id)}
                    onToggleWish={toggleWish}
                    onQuickView={setQuickView}
                    onQuickAdd={quickAdd}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── PLP ── */}
        <section id="shop" className="container-page scroll-mt-24 py-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCat(null)}
                className={`border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  activeCat === null
                    ? 'border-ink bg-ink text-white'
                    : 'border-hairline text-muted hover:border-ink hover:text-ink'
                }`}
              >
                All
              </button>
              {topCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    activeCat === c.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-hairline text-muted hover:border-ink hover:text-ink'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{filtered.length} items</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="input w-auto py-2 text-xs"
                aria-label="Sort products"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A–Z</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="heading text-2xl">Nothing here yet</p>
              <p className="mt-2 text-sm text-muted">
                New pieces are dropping soon. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wished={wishlist.has(p.id)}
                  onToggleWish={toggleWish}
                  onQuickView={setQuickView}
                  onQuickAdd={quickAdd}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-10 border-t border-hairline bg-surface">
        <div className="container-page grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="heading text-2xl">
              StyleIn<span className="text-brand">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Editorial streetwear & kinetic footwear. Cash on delivery nationwide.
            </p>
          </div>
          <div>
            <h3 className="eyebrow mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-muted">
              {settings.phone_primary && <li>Phone: {settings.phone_primary}</li>}
              {settings.whatsapp_number && (
                <li>WhatsApp: {settings.whatsapp_number}</li>
              )}
              {settings.concierge_email && <li>{settings.concierge_email}</li>}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-3">Visit</h3>
            <ul className="space-y-2 text-sm text-muted">
              {settings.address && <li>{settings.address}</li>}
              {settings.store_hours && <li>{settings.store_hours}</li>}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-3">Follow</h3>
            <ul className="space-y-2 text-sm">
              {settings.instagram_url && (
                <li>
                  <a href={settings.instagram_url} className="text-muted hover:text-brand" target="_blank" rel="noreferrer">Instagram</a>
                </li>
              )}
              {settings.facebook_url && (
                <li>
                  <a href={settings.facebook_url} className="text-muted hover:text-brand" target="_blank" rel="noreferrer">Facebook</a>
                </li>
              )}
              {settings.tiktok_url && (
                <li>
                  <a href={settings.tiktok_url} className="text-muted hover:text-brand" target="_blank" rel="noreferrer">TikTok</a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-hairline">
          <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted sm:flex-row">
            <span>© {new Date().getFullYear()} StyleIn. All rights reserved.</span>
            <span>Cash on Delivery · Free delivery over PKR {Math.round(Number(settings.free_delivery_threshold)).toLocaleString('en-PK')}</span>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-hairline bg-canvas/95 py-2 backdrop-blur md:hidden">
        <button onClick={() => { goShop(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-ink">
          <IconHome className="h-5 w-5" /> Home
        </button>
        <button onClick={() => goShop(null)} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-muted">
          <IconGrid className="h-5 w-5" /> Shop
        </button>
        <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-muted">
          <IconSearch className="h-5 w-5" /> Search
        </button>
        <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center gap-0.5 text-[10px] font-semibold text-muted">
          <IconBag className="h-5 w-5" />
          {cart.count > 0 && (
            <span className="absolute right-2 top-0 grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">
              {cart.count}
            </span>
          )}
          Bag
        </button>
      </nav>

      {/* ── Mobile slide-over menu ── */}
      <div className={`fixed inset-0 z-[85] md:hidden ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-ink/50 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside className={`absolute left-0 top-0 h-full w-[80%] max-w-xs bg-canvas shadow-2xl transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <span className="heading text-xl">Menu</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu"><IconClose /></button>
          </div>
          <nav className="flex flex-col p-2">
            <button onClick={() => goShop(null)} className="flex items-center justify-between px-3 py-3.5 text-sm font-semibold hover:bg-surface">
              All Products <IconChevron className="h-4 w-4 text-muted" />
            </button>
            {topCategories.map((c) => (
              <button key={c.id} onClick={() => goShop(c.id)} className="flex items-center justify-between px-3 py-3.5 text-sm font-semibold hover:bg-surface">
                {c.name} <IconChevron className="h-4 w-4 text-muted" />
              </button>
            ))}
          </nav>
          <div className="border-t border-hairline px-5 py-4 text-sm text-muted">
            {settings.whatsapp_number && <p>WhatsApp orders: {settings.whatsapp_number}</p>}
            {settings.store_hours && <p className="mt-1">{settings.store_hours}</p>}
          </div>
        </aside>
      </div>

      {/* ── Search modal ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[85] flex items-start justify-center pt-20">
          <button aria-label="Close search" onClick={() => setSearchOpen(false)} className="absolute inset-0 bg-ink/50 animate-fade-in" />
          <div className="relative z-10 w-full max-w-xl animate-fade-in bg-surface p-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-hairline pb-3">
              <IconSearch className="h-5 w-5 text-muted" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for jackets, sneakers…"
                className="w-full bg-transparent text-base outline-none"
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close"><IconClose /></button>
            </div>
            <div className="mt-4 max-h-[50vh] overflow-y-auto">
              {search.trim() === '' ? (
                <p className="py-6 text-center text-sm text-muted">Start typing to search the catalog.</p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No matches for “{search}”.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {filtered.slice(0, 8).map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => { setSearchOpen(false); setQuickView(p); }}
                        className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-canvas"
                      >
                        <div className="h-14 w-12 flex-shrink-0 overflow-hidden bg-[#F1F0EC]">
                          {p.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images.find((i) => i.is_primary)?.image_url ?? p.images[0].image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-xs text-muted">{p.category_name}</p>
                        </div>
                        {discountPercent(p.actual_price, p.discounted_price) > 0 && (
                          <span className="text-xs font-bold text-brand">
                            -{discountPercent(p.actual_price, p.discounted_price)}%
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {search.trim() && filtered.length > 0 && (
              <button onClick={() => { setSearchOpen(false); goShop(activeCat); }} className="btn-dark mt-3 w-full">
                View all {filtered.length} results
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Quick view ── */}
      <QuickView
        product={quickView}
        onClose={() => setQuickView(null)}
        onAdd={(p, size, qty) => {
          cart.add(p, size, qty);
          showToast(`Added ${p.name} to bag`);
        }}
      />

      {/* ── Cart drawer ── */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        subtotal={cart.subtotal}
        settings={settings}
        onSetQty={cart.setQty}
        onRemove={cart.remove}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* ── Checkout ── */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        subtotal={cart.subtotal}
        settings={settings}
        onPlaced={(num) => {
          cart.clear();
          setCheckoutOpen(false);
          setOrderNumber(num);
        }}
      />

      {/* ── Order success ── */}
      {orderNumber && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button aria-label="Close" onClick={() => setOrderNumber(null)} className="absolute inset-0 bg-ink/60 animate-fade-in" />
          <div className="relative z-10 w-full max-w-sm animate-fade-in bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
              <IconCheck className="h-7 w-7" />
            </div>
            <h2 className="heading mt-4 text-2xl">Order Confirmed!</h2>
            <p className="mt-2 text-sm text-muted">
              Thank you. Your order <span className="font-bold text-ink">{orderNumber}</span> has been placed and will be delivered with Cash on Delivery.
            </p>
            <button onClick={() => setOrderNumber(null)} className="btn-dark mt-6 w-full">
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 animate-fade-in bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl md:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}
