import axios from 'axios';
import { Pokemon } from '../@types/pokemon';

const api = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
});

export const getPokemons = async (limit = 151): Promise<Pokemon[]> => {
  const response = await api.get(`/pokemon?limit=${limit}`);
  const list = response.data.results;

  const detailedList = await Promise.all(
    list.map(async (pokemon: { url: string }) => {
      const detailRes = await axios.get(pokemon.url);
      const data = detailRes.data;

      return {
        nome: data.name,
        index: data.id.toString().padStart(3, '0'),
        tipos: data.types.map((t: any) => t.type.name),
        imagem: data.sprites.front_default,
        poderes: data.stats.map((s: any) => ({
          nome: s.stat.name,
          forca: s.base_stat,
        })),
      };
    })
  );

  return detailedList;
};