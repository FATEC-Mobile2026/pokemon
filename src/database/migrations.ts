import { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_VERSION = 1;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const { user_version } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  ) ?? { user_version: 0 };

  if (user_version >= CURRENT_VERSION) return;

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pokemons (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        index_num  TEXT    NOT NULL UNIQUE,
        nome       TEXT    NOT NULL,
        imagem     TEXT    NOT NULL,
        tipos      TEXT    NOT NULL,
        poderes    TEXT    NOT NULL,
        synced_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      PRAGMA user_version = ${CURRENT_VERSION};
    `);
  });
}
