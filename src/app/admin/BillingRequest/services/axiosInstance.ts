// src/app/admin/Billing/services/axiosInstance.ts
import axios from "axios";

/**
 * Usa NEXT_PUBLIC_API_URL para tu backend Nest (ej: http://localhost:3000)
 * Asegúrate de definirlo en tu .env.local:
 * NEXT_PUBLIC_API_URL=http://localhost:3000
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL: API_URL, // Usando API_URL en lugar de baseURL
  withCredentials: false, // Cambia a true si usas cookies/JWT por cookie
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Interceptor de errores (opcional)
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    // Puedes mapear mensajes del back aquí si quieres
    return Promise.reject(err);
  }
);

export default axiosInstance;
