import Storefront from '@/components/Storefront';
import { getCategories, getProducts, getSettings } from '@/lib/data';

// Always render fresh so admin changes appear immediately.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Load everything the storefront needs directly from MySQL on the server.
  const [settings, categories, products] = await Promise.all([
    getSettings(),
    getCategories(true),
    getProducts({ sort: 'newest' }),
  ]);

  return (
    <Storefront
      settings={settings}
      categories={categories}
      products={products}
    />
  );
}
