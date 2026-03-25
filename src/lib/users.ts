import { redisGet, redisSet } from './redis';
import { encrypt, decrypt } from './encrypt';
import { createHash, randomBytes } from 'crypto';

export interface WTUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'tech_admin' | 'sales' | 'viewer';
  tenantId: string;
  status: 'active' | 'pending' | 'disabled';
  passwordHash?: string;
  inviteToken?: string;
  inviteExpiry?: number;
  createdAt: string;
  lastSeen?: string;
}

const USERS_KEY = (tenantId: string) => `wt:tenant:${tenantId}:users`;

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + (process.env.WATCHTOWER_SESSION_SECRET || 'dev')).digest('hex');
}

export async function getUsers(tenantId: string): Promise<WTUser[]> {
  try {
    const raw = await redisGet(USERS_KEY(tenantId));
    if (!raw) return [];
    return JSON.parse(decrypt(raw)) as WTUser[];
  } catch { return []; }
}

export async function saveUsers(tenantId: string, users: WTUser[]): Promise<void> {
  await redisSet(USERS_KEY(tenantId), encrypt(JSON.stringify(users)));
}

export async function getUserByEmail(tenantId: string, email: string): Promise<WTUser | null> {
  const users = await getUsers(tenantId);
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(tenantId: string, user: Omit<WTUser, 'id' | 'createdAt'>): Promise<WTUser> {
  const users = await getUsers(tenantId);
  const newUser: WTUser = {
    ...user,
    id: 'u_' + randomBytes(8).toString('hex'),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(tenantId, users);
  return newUser;
}

export async function updateUser(tenantId: string, userId: string, updates: Partial<WTUser>): Promise<boolean> {
  const users = await getUsers(tenantId);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...updates };
  await saveUsers(tenantId, users);
  return true;
}

export async function deleteUser(tenantId: string, userId: string): Promise<boolean> {
  const users = await getUsers(tenantId);
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  await saveUsers(tenantId, filtered);
  return true;
}
