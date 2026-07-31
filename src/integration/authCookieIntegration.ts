import { createApiCookie } from './httpClientCookie';

const authApi = createApiCookie(`${process.env.EXPO_PUBLIC_LOCAL_API_URL}/fatec/login/v1`);

export type RegisterRequest = {
  username: string;
  password: string;
  email: string;
  cep: string;
  roles: string[];
};

export type AuthRequest = {
  username: string;
  password: string;
};

export type AuthCookieResponse = {
  userId: string;
  username: string;
  roles: string[];
};

export const register = async (data: RegisterRequest): Promise<void> => {
  await authApi.post('/user/save', data);
};

export const login = async (data: AuthRequest): Promise<AuthCookieResponse> => {
  const response = await authApi.post<AuthCookieResponse>('/auth/cookie', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await authApi.post('/auth/logout');
};
