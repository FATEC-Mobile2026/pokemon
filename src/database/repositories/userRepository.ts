import { SQLiteDatabase } from 'expo-sqlite';

export interface UserRepository {
  saveUserId(username: string, userId: string): Promise<void>;
  getUserId(username: string): Promise<string | null>;
}

export function createUserRepository(db: SQLiteDatabase): UserRepository {
  return {
    async saveUserId(username, userId) {
      await db.runAsync(
        `INSERT OR REPLACE INTO user_sessions (username, user_id) VALUES (?, ?)`,
        [username, userId]
      );
    },

    async getUserId(username) {
      const row = await db.getFirstAsync<{ user_id: string }>(
        'SELECT user_id FROM user_sessions WHERE username = ?',
        [username]
      );
      return row?.user_id ?? null;
    },
  };
}
