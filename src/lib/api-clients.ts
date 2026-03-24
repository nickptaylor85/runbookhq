// API client helpers
export async function apiGet(path: string, headers?: Record<string, string>) {
  const res = await fetch(path, { headers });
  return res.json();
}

export async function apiPost(path: string, body: unknown, headers?: Record<string, string>) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return res.json();
}
