import api, { setCookie } from "./axios";

export const verifyToken = async () => {
  const response = await api.post("/auth/verify-token", {});
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });

  // Set cookies on the client side
  if (response.data.token) {
    setCookie("token", response.data.token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  if (response.data.user) {
    setCookie("user", JSON.stringify(response.data.user), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
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
    setCookie("token", response.data.token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  if (response.data.user) {
    setCookie("user", JSON.stringify(response.data.user), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  return response.data;
};
