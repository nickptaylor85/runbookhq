import { loadToolConfigs } from '@/lib/config-store';

export async function isDemoMode(tenantId?: string | null): Promise<boolean> {
  try {
    const configs = await loadToolConfigs(tenantId || undefined);
    const tools = configs?.tools || {};
    if (tools['_demo']?.enabled) return true;
    const realTools = Object.values(tools).filter((t: any) => t.id !== '_demo' && !t.id?.startsWith('_demo_') && t.enabled);
    if (realTools.length > 0) return false;
    // Even with no security tools, if Anthropic key exists use real AI (not demo triage)
    if (tools['anthropic']?.credentials?.ANTHROPIC_API_KEY) return false;
    if (process.env.ANTHROPIC_API_KEY) return false;
    return true;
  } catch(e) { return true; }
}

export async function isToolDemo(tenantId: string | null | undefined, toolName: string): Promise<boolean> {
  try {
    const configs = await loadToolConfigs(tenantId || undefined);
    const tools = configs?.tools || {};
    if (tools['_demo']?.enabled) return true;
    if (tools[`_demo_${toolName}`]?.enabled) return true;
    if (!tools[toolName]?.enabled) return true;
    return false;
  } catch(e) { return true; }
}
