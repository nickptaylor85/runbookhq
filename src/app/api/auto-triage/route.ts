import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
async function getAnthropicKeyFromRedis(): Promise<string|null> {
  try { const c = await loadToolConfigs(); return c.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || null; } catch { return null; }
}
export async function POST(req: Request) {
  const { alerts } = await req.json();
  const triaged = (alerts||[]).map((a: any) => ({ ...a, triage: calcTriage(a) }));
  const apiKey = process.env.ANTHROPIC_API_KEY || await getAnthropicKeyFromRedis();
  if (apiKey && alerts?.length <= 5) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, system: 'Triage alerts. Return JSON array: [{ "id", "confidence": 0-100, "verdict": "true_positive|false_positive|suspicious", "reasoning": "one line", "priority": 1-5, "recommended_action": "one line" }]',
          messages: [{ role: 'user', content: JSON.stringify(alerts.slice(0,5)) }] }) });
      const data = await res.json(); const text = data.content?.[0]?.text || '[]';
      try { JSON.parse(text.replace(/```json|```/g,'').trim()).forEach((t:any)=>{ const m=triaged.find((a:any)=>a.id===t.id); if(m)m.triage={...m.triage,...t,ai:true} }); } catch{}
    } catch {}
  }
  return NextResponse.json({ alerts: triaged });
}
function calcTriage(a: any) {
  let conf=50,verdict='suspicious',pri=3,action='Review';
  if(a.severity==='critical'){conf=85;pri=1;verdict='true_positive';action='Isolate, begin IR'}
  else if(a.severity==='high'){conf=70;pri=2;action='Investigate <30min'}
  if(a.mitre?.includes('T1003')||a.mitre?.includes('T1059')){conf+=15;pri=1;verdict='true_positive'}
  if(a.title?.toLowerCase().includes('c2')){conf+=20;pri=1;verdict='true_positive';action='Isolate immediately'}
  return{confidence:Math.min(conf,99),verdict,priority:pri,recommended_action:action,reasoning:`${a.severity} ${a.category||'alert'} from ${a.source}`,ai:false};
}
