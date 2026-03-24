// Config store — thin wrapper around Redis settings
import { redisGet, redisSet } from './redis';

export async function getConfig(key: string): Promise<string | null> {
  return redisGet(`wt:config:${key}`);
}

export async function setConfig(key: string, value: string): Promise<void> {
  return redisSet(`wt:config:${key}`, value);
}
