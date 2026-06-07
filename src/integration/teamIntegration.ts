import axios from 'axios';
import { Pokemon } from '../@types/pokemon';

const api = axios.create({
  baseURL: 'https://lnh1dhp1mj.execute-api.us-east-1.amazonaws.com/api-pokemon/pokemon/v1',
});

const localApi = axios.create({
  baseURL: 'http://localhost:8080/api-pokemon/pokemon/v1',
});

type ApiPokemon = {
  index: string;
  name: string;
  image: string;
  types: string[];
  abilities: { name: string; strength: number }[];
};

type TeamResponse = {
  id: string;
  userId: string;
  team: ApiPokemon[];
  capture: ApiPokemon[];
};

const mapApiPokemon = (p: ApiPokemon): Pokemon => ({
  index: p.index,
  nome: p.name,
  imagem: p.image,
  tipos: p.types,
  poderes: p.abilities.map(a => ({ nome: a.name, forca: a.strength })),
});

export type TeamData = { team: Pokemon[]; capture: Pokemon[] };

export const getTeam = async (userId: string): Promise<TeamData> => {
  const response = await api.get<TeamResponse>('/team', {
    params: { 'user-id': userId },
  });
  const data = response.data;
  return {
    team: data.team.map(mapApiPokemon),
    capture: data.capture.map(mapApiPokemon),
  };
};

export const updateTeam = async (
  userId: string,
  removedPokemon: string,
  newPokemon: string
): Promise<void> => {
  await localApi.put('/team', null, {
    params: {
      'user-id': userId,
      'removed-pokemon': removedPokemon,
      'new-pokemon': newPokemon,
    },
  });
};

export const getCaptured = async (userId: string, pokemonId: string): Promise<boolean> => {
  const response = await api.get('/captured', {
    params: {
      'user-id': userId,
      'pokemon-id': pokemonId,
    },
  });
  return response.data;
};
