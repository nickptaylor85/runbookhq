import { loadToolConfigs } from '@/lib/config-store';

export async function isDemoMode(tenantId?: string | null): Promise<boolean> {
  try {
    const configs = await loadToolConfigs(tenantId || undefined);
    const tools = configs?.tools || {};
    // Demo if _demo tool is enabled OR if no real tools connected
    if (tools['_demo']?.enabled) return true;
    const realTools = Object.values(tools).filter((t: any) => t.id !== '_demo' && t.enabled);
    return realTools.length === 0;
  } catch(e) { return true; }
}
