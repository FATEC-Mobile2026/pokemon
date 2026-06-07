import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lnh1dhp1mj.execute-api.us-east-1.amazonaws.com/api-pokemon/auth/v1',
});

export type AuthRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  userId: string;
};

export type StatsResponse = {
  userId: string;
  username: string;
  level: number;
  vitorias: number;
  derrotas: number;
};

export const register = async (data: AuthRequest): Promise<AuthResponse> => {
  const response = await api.post('/register', data);
  return response.data;
};

export const login = async (data: AuthRequest): Promise<AuthResponse> => {
  const response = await api.post('/login', data);
  return response.data;
};

export const getStats = async (userId: string): Promise<StatsResponse> => {
  const response = await api.get<StatsResponse>(`/stats/${userId}`);
  return response.data;
};
