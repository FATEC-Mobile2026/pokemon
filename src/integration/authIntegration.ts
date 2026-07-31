import axios from 'axios';
import { createApi } from './httpClient';

const authApi = createApi(`${process.env.EXPO_PUBLIC_LOCAL_API_URL}/fatec/login/v1`);

const statsApi = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/api-pokemon/auth/v1`,
});

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

export type AuthResponse = {
  token: string;
};

export type StatsResponse = {
  userId: string;
  username: string;
  level: number;
  vitorias: number;
  derrotas: number;
};

export const register = async (data: RegisterRequest): Promise<void> => {
  await authApi.post('/user/save', data);
};

export const login = async (data: AuthRequest): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/auth', data);
  return response.data;
};

export const getStats = async (userId: string): Promise<StatsResponse> => {
  const response = await statsApi.get<StatsResponse>(`/stats/${userId}`);
  return response.data;
};
