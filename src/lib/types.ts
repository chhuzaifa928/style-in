// Shared domain types used across API routes, server components, and client UI.

export interface HeroSlide {
  media_url: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  category_id: number | null;
}

export interface SiteSettings {
  id: number;
  marquee_text: string;
  phone_primary: string;
  whatsapp_number: string;
  concierge_email: string;
  address: string;
  store_hours: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  shipping_fee: number;
  free_delivery_threshold: number;
  hero_left_media_url: string;
  hero_left_eyebrow: string;
  hero_left_title: string;
  hero_left_cta_label: string;
  hero_left_category_id: number | null;
  hero_right_media_url: string;
  hero_right_eyebrow: string;
  hero_right_title: string;
  hero_right_cta_label: string;
  hero_right_category_id: number | null;
  hero_slides: HeroSlide[];
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  image_url: string | null;
  is_active: number | boolean;
  sort_order: number;
  created_at?: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number | boolean;
  sort_order: number;
  created_at?: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  category_name?: string | null;
  name: string;
  slug: string;
  description: string | null;
  actual_price: number;
  discounted_price: number;
  sizes_available: string[] | null;
  stock: number;
  is_featured: number | boolean;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
  images: ProductImage[];
}

export interface OrderItem {
  product_id: number;
  name: string;
  size: string | null;
  qty: number;
  unit_price: number;
  line_total: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  items_json: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: string;
  order_status: OrderStatus;
  created_at?: string;
  updated_at?: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Dispatched',
  'Delivered',
  'Cancelled',
];
