import { query } from './db';
import {
  Category,
  Order,
  Product,
  ProductImage,
  SiteSettings,
} from './types';

/**
 * Server-side data access used by both server components (storefront) and
 * API routes. All queries are parameterized.
 */

// mysql2 returns JSON columns already parsed; guard for string just in case.
function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export async function getSettings(): Promise<SiteSettings> {
  const rows = await query<SiteSettings>(
    'SELECT * FROM site_settings WHERE id = 1 LIMIT 1',
  );
  return rows[0];
}

export async function getCategories(
  onlyActive = true,
): Promise<Category[]> {
  const sql = onlyActive
    ? 'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
    : 'SELECT * FROM categories ORDER BY sort_order ASC, name ASC';
  return query<Category>(sql);
}

/** Attach image rows to a list of products in a single extra query. */
async function attachImages(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  const ids = products.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const images = await query<ProductImage>(
    `SELECT id, product_id, image_url, is_primary, sort_order
       FROM product_images
      WHERE product_id IN (${placeholders})
      ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    ids,
  );
  const byProduct = new Map<number, ProductImage[]>();
  for (const img of images) {
    const list = byProduct.get(img.product_id) ?? [];
    list.push(img);
    byProduct.set(img.product_id, list);
  }
  for (const p of products) {
    p.images = byProduct.get(p.id) ?? [];
    p.sizes_available = parseJson<string[]>(p.sizes_available, []);
  }
  return products;
}

export interface ProductFilter {
  categoryId?: number | null;
  includeInactive?: boolean;
  featuredOnly?: boolean;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
}

export async function getProducts(
  filter: ProductFilter = {},
): Promise<Product[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (!filter.includeInactive) where.push('p.is_active = 1');
  if (filter.featuredOnly) where.push('p.is_featured = 1');
  if (filter.categoryId != null) {
    where.push('p.category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter.search) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    const like = `%${filter.search}%`;
    params.push(like, like);
  }

  let orderBy = 'p.created_at DESC';
  switch (filter.sort) {
    case 'price_asc':
      orderBy = 'p.discounted_price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.discounted_price DESC';
      break;
    case 'name_asc':
      orderBy = 'p.name ASC';
      break;
    case 'newest':
    default:
      orderBy = 'p.created_at DESC';
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const products = await query<Product>(
    `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
      ORDER BY ${orderBy}`,
    params,
  );
  return attachImages(products);
}

export async function getProductById(
  id: number,
  includeInactive = false,
): Promise<Product | null> {
  const where = includeInactive ? 'p.id = ?' : 'p.id = ? AND p.is_active = 1';
  const products = await query<Product>(
    `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where} LIMIT 1`,
    [id],
  );
  if (!products[0]) return null;
  const [withImages] = await attachImages([products[0]]);
  return withImages;
}

export async function getOrders(): Promise<Order[]> {
  const rows = await query<Order>(
    'SELECT * FROM orders ORDER BY created_at DESC',
  );
  for (const o of rows) {
    o.items_json = parseJson(o.items_json, []);
  }
  return rows;
}
