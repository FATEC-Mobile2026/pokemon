import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { getDatabase } from '@/database/client';
import { runMigrations } from '@/database/migrations';
import {
  createPokemonRepository,
  PokemonRepository,
} from '@/database/repositories/pokemonRepository';
import {
  createUserRepository,
  UserRepository,
} from '@/database/repositories/userRepository';
import { PokeballLoading } from '@/components/pokeball-loading';

interface DatabaseContextData {
  pokemonRepository: PokemonRepository;
  userRepository: UserRepository;
}

const DatabaseContext = createContext<DatabaseContextData>(null!);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const value = useRef<DatabaseContextData>(null!);

  useEffect(() => {
    async function init() {
      const db = await getDatabase();
      await runMigrations(db);
      value.current = {
        pokemonRepository: createPokemonRepository(db),
        userRepository: createUserRepository(db),
      };
      setStatus('ready');
    }

    init().catch((err) => {
      console.error('[DatabaseProvider] init failed:', err);
      setStatus('error');
    });
  }, []);

  if (status === 'loading' || status === 'error') {
    return (
      <View style={{ flex: 1 }}>
        <PokeballLoading />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={value.current}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextData {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}
