// Tool registry client — wraps integrations credentials API
export async function getConnectedTools(tenantId?: string): Promise<Record<string, Record<string, string>>> {
  try {
    const res = await fetch('/api/integrations/credentials');
    if (!res.ok) return {};
    const data = await res.json() as { connected?: Record<string, Record<string, string>> };
    return data.connected || {};
  } catch {
    return {};
  }
}

export async function saveToolCredentials(toolId: string, credentials: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch('/api/integrations/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, credentials }),
    });
    const data = await res.json() as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function removeToolCredentials(toolId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/integrations/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, credentials: null }),
    });
    const data = await res.json() as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
