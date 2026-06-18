import { User } from '@/lib/types';

// In-memory user store (in production, use a database)
interface StoredUser extends User {
  passwordHash: string;
}

const users: StoredUser[] = [
  {
    id: 'user-demo',
    name: 'Demo User',
    email: 'demo@luxestore.com',
    passwordHash: '$2a$10$demo_hash', // demo123
    createdAt: new Date().toISOString(),
  },
];

export function findUserByEmail(email: string): StoredUser | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(name: string, email: string, passwordHash: string): User {
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
}

export function verifyPassword(stored: string, input: string): boolean {
  // Simplified check for demo - in production use bcrypt.compare
  // For demo account, accept 'demo123'
  if (stored === '$2a$10$demo_hash' && input === 'demo123') return true;
  return stored === input;
}

export function getUserSafe(user: StoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
