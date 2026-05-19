import { SQLiteDatabase } from 'expo-sqlite';
import type { Pokemon, Poder } from '@types/pokemon';

type PokemonRow = {
  id: number;
  index_num: string;
  nome: string;
  imagem: string;
  tipos: string;
  poderes: string;
  synced_at: number;
};

function toModel(row: PokemonRow): Pokemon {
  return {
    index: row.index_num,
    nome: row.nome,
    imagem: row.imagem,
    tipos: JSON.parse(row.tipos) as string[],
    poderes: JSON.parse(row.poderes) as Poder[],
  };
}

export interface PokemonRepository {
  count(): Promise<number>;
  getAll(): Promise<Pokemon[]>;
  getRandom(): Promise<Pokemon | null>;
  saveMany(pokemons: Pokemon[]): Promise<void>;
}

export function createPokemonRepository(db: SQLiteDatabase): PokemonRepository {
  return {
    async count() {
      const row = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM pokemons'
      );
      return row?.total ?? 0;
    },

    async getAll() {
      const rows = await db.getAllAsync<PokemonRow>(
        'SELECT * FROM pokemons ORDER BY index_num ASC'
      );
      return rows.map(toModel);
    },

    async getRandom() {
      const row = await db.getFirstAsync<PokemonRow>(
        'SELECT * FROM pokemons ORDER BY RANDOM() LIMIT 1'
      );
      return row ? toModel(row) : null;
    },

    async saveMany(pokemons) {
      await db.withTransactionAsync(async () => {
        for (const p of pokemons) {
          await db.runAsync(
            `INSERT OR REPLACE INTO pokemons
               (index_num, nome, imagem, tipos, poderes)
             VALUES (?, ?, ?, ?, ?)`,
            [
              p.index,
              p.nome,
              p.imagem,
              JSON.stringify(p.tipos),
              JSON.stringify(p.poderes),
            ]
          );
        }
      });
    },
  };
}
