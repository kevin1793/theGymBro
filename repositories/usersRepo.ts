import { getOne, run } from '@/database/db';

export type User = {
  uid: string;
  firstName: string;
  lastName?: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  isDirty?: number;
};

export async function saveUser(user: User) {
  await run(
    `
    INSERT OR REPLACE INTO users (uid, firstName, lastName, email, createdAt, updatedAt, isDirty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user.uid,
      user.firstName,
      user.lastName || '',
      user.email,
      user.createdAt,
      user.updatedAt,
      1, // mark dirty for syncing
    ]
  );
}

export async function getUser(uid: string): Promise<User | null> {
  return getOne<User>(
    `SELECT * FROM users WHERE uid = ?`,
    [uid]
  );
}