import { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_VERSION = 2;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= CURRENT_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
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
      `);
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        username   TEXT    NOT NULL UNIQUE,
        user_id    TEXT    NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      PRAGMA user_version = ${CURRENT_VERSION};
    `);
  });
}
