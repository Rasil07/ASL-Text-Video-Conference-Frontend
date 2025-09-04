import axios from "axios";

// Client-side cookie utility functions with hydration safety
export const getCookie = (name: string): string => {
  // Only run on client side after hydration
  if (typeof window === "undefined") return "";

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

export const setCookie = (
  name: string,
  value: string,
  options: { maxAge?: number; path?: string } = {}
) => {
  // Only run on client side after hydration
  if (typeof window === "undefined") return;

  let cookie = `${name}=${value}`;
  if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
  if (options.path) cookie += `; path=${options.path}`;

  document.cookie = cookie;
};

export const removeCookie = (name: string, path: string = "/") => {
  // Only run on client side after hydration
  if (typeof window === "undefined") return;

  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// Attach user token from browser cookie to each request if present
axios.interceptors.request.use(
  (config) => {
    // Only run on client side after hydration
    if (typeof window !== "undefined") {
      const token = getCookie("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

export default api;
