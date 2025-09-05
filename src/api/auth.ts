import api from "./axios";
import browserCookie from "@/lib/cookie";

export const verifyToken = async () => {
  const response = await api.post("/auth/verify-token", {});
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });

  // Set cookies on the client side
  if (response.data.token) {
    browserCookie.setBrowserToken(response.data.token);
  }

  if (response.data.user) {
    browserCookie.setBrowserUser(JSON.stringify(response.data.user));
  }

  return response.data;
};

export const register = async (
  email: string,
  password: string,
  name: string
) => {
  const response = await api.post("/auth/register", { email, password, name });

  // Set cookies on the client side for successful registration
  if (response.data.token) {
    browserCookie.setBrowserToken(response.data.token);
  }

  if (response.data.user) {
    browserCookie.setBrowserUser(JSON.stringify(response.data.user));
  }

  return response.data;
};
