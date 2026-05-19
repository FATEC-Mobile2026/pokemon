import * as SQLite from 'expo-sqlite';

const DB_NAME = 'pokebattle.db';

let instance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (instance) return instance;
  instance = await SQLite.openDatabaseAsync(DB_NAME);
  return instance;
}
