import { login, register } from "@/api/auth";
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

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

export const useLoginMutation = (
  options?: UseMutationOptions<LoginResponse, Error, LoginParams>
) => {
  return useMutation<LoginResponse, Error, LoginParams>({
    mutationFn: (params: LoginParams) => login(params.email, params.password),
    ...options,
  });
};

export const useRegisterMutation = (
  options?: UseMutationOptions<LoginResponse, Error, RegisterParams>
) => {
  return useMutation<LoginResponse, Error, RegisterParams>({
    mutationFn: (params: RegisterParams) =>
      register(params.email, params.password, params.name),
    ...options,
  });
};
