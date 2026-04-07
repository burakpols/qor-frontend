import axios from "axios";

// Base API URL
// Dynamic API URL for production (Railway) or local development
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Local development fallback
  return "http://localhost:3800/api/v1";
};

const getLegacyApiUrl = () => {
  if (process.env.REACT_APP_API_LEGACY_URL) {
    return process.env.REACT_APP_API_LEGACY_URL;
  }
  // Local development fallback
  return "http://localhost:3800";
};

const API_URL = getApiUrl();
const LEGACY_API_URL = getLegacyApiUrl();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear it
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("user");
      window.location.href = "/admin";
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================

export const authService = {
  login: (username, password) =>
    apiClient.post("/auth/login", { username, password }),

  getQRToken: () =>
    apiClient.get("/auth/qr-token"),

  register: (username, password, email, role) =>
    apiClient.post("/auth/register", { username, password, email, role }),
};

// ==================== MENU ENDPOINTS ====================

export const menuService = {
  getAllItems: () =>
    apiClient.get("/items"),

  getItemsByCategory: (category) =>
    apiClient.get(`/items/category/${category}`),

  getItem: (id) =>
    apiClient.get(`/items/${id}`),

  addItem: (itemData) =>
    apiClient.post("/items", itemData),

  updateItem: (id, itemData) =>
    apiClient.put(`/items/${id}`, itemData),

  deleteItem: (id) =>
    apiClient.delete(`/items/${id}`),

  uploadImage: (formData) =>
    apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ==================== ORDER ENDPOINTS ====================

export const orderService = {
  createOrder: (orderData) =>
    apiClient.post("/orders", orderData),

  getAllOrders: () =>
    apiClient.get("/orders"),

  getMyOrders: () =>
    apiClient.get("/my-orders"),

  getOrder: (id) =>
    apiClient.get(`/orders/${id}`),

  updateOrderStatus: (id, status) =>
    apiClient.put(`/orders/${id}`, { status }),
};

// ==================== LEGACY ENDPOINTS (Backward compatibility) ====================

export const legacyService = {
  getItems: () =>
    axios.get(`${LEGACY_API_URL}/items`),

  addItem: (itemData) =>
    axios.post(`${LEGACY_API_URL}/additem`, itemData),

  updateItem: (itemData) =>
    axios.post(`${LEGACY_API_URL}/updateitem`, itemData),

  deleteItem: (id) =>
    axios.delete(`${LEGACY_API_URL}/deleteitem/${id}`),
};

export default apiClient;
