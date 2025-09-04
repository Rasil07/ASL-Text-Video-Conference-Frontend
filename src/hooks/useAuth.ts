import { login } from "@/api/auth";
import { UserResponse } from "@/types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export const useAuth = (
  options?: UseMutationOptions<LoginResponse, Error, LoginParams>
) => {
  return useMutation<LoginResponse, Error, LoginParams>({
    mutationFn: (params: LoginParams) => login(params.email, params.password),
    ...options,
  });
};
