import axios from 'axios';
import type { LoginResponse, Product, Category, Submission, ProductImage } from '../types';

const API_BASE = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/api/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          api.defaults.headers.common.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (e) {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/api/auth/login/', { username, password });

// Products (handles pagination)
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/api/products/');
  if (response.data && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

export const getProduct = (id: number) => api.get<Product>(`/api/products/${id}/`);
export const createProduct = (data: Partial<Product>) => api.post<Product>('/api/products/', data);
export const updateProduct = (id: number, data: Partial<Product>) =>
  api.put<Product>(`/api/products/${id}/`, data);
export const deleteProduct = (id: number) => api.delete(`/api/products/${id}/`);

// Image upload (file upload - multipart/form-data)
export const uploadProductImage = (productId: number, file: File, isPrimary: boolean, angle?: string) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('is_primary', String(isPrimary));
  if (angle) formData.append('angle', angle);
  
  return api.post<ProductImage>(`/api/products/${productId}/upload-image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteProductImage = (productId: number, imageId: number) =>
  api.delete(`/api/products/${productId}/delete-image/${imageId}/`);

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/api/products/categories/');
  if (response.data && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

// Vision / Submissions
export const getSubmissions = async (): Promise<Submission[]> => {
  const response = await api.get('/api/vision/submissions/');
  if (response.data && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

export const matchImage = (imageUrl: string, customerPhone?: string) =>
  api.post<{ submission_id: number; message: string }>('/api/vision/submissions/match/', {
    image_url: imageUrl,
    customer_phone: customerPhone || 'test_user',
  });

export const getSubmissionDetail = (id: number) => api.get<Submission>(`/api/vision/submissions/${id}/`);