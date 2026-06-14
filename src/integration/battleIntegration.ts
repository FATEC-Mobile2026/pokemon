import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/api-pokemon`,
});

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export type InviteResponse = {
  battleId: string;
};

export const invitePlayer = async (token: string, targetUsername: string): Promise<InviteResponse> => {
  const response = await api.post<InviteResponse>(`/battle/invite/${targetUsername}`, null, {
    headers: authHeader(token),
  });
  return response.data;
};

export const acceptBattle = async (token: string, battleId: string): Promise<void> => {
  await api.post(`/battle/accept/${battleId}`, null, {
    headers: authHeader(token),
  });
};

export const declineBattle = async (token: string, battleId: string): Promise<void> => {
  await api.post(`/battle/decline/${battleId}`, null, {
    headers: authHeader(token),
  });
};

export const nextRound = async (token: string, battleId: string): Promise<void> => {
  await api.post(`/battle/${battleId}/round`, null, {
    headers: authHeader(token),
  });
};
