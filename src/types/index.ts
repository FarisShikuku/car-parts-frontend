export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  primary_image_url?: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  image_path: string | null;
  is_primary: boolean;
  angle: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

export interface Submission {
  id: number;
  wa_message_id: string;
  customer_phone: string;
  image_url: string;
  ocr_text: string | null;
  submitted_at: string;
  status: string;
  matches?: Match[];
}

export interface Match {
  id: number;
  product: Product;
  similarity_score: number;
  rank: number;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}