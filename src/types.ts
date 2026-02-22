export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  category_id: number;
  category?: string;
  image: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  active: number;
}

export interface AppSettings {
  primaryColor: string;
  accentColor: string;
  layoutMode: 'grid' | 'list';
  storeName: string;
  fontFamily?: string;
}

export interface AuthResponse {
  token: string;
}
