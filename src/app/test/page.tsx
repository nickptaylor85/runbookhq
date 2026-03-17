'use client';
import { useState, useEffect } from 'react';

export default function Test() {
  const [results, setResults] = useState<any>({});
  
  useEffect(() => {
    const tests: Record<string, any> = {};
    
    Promise.all([
      fetch('/api/unified-alerts').then(r => r.json()).then(d => { tests.alerts = { ok: true, count: d.alerts?.length, demo: d.demo, errors: d.errors }; }).catch(e => { tests.alerts = { ok: false, error: String(e) }; }),
      fetch('/api/coverage').then(r => r.json()).then(d => { tests.coverage = { ok: true, hasMetrics: !!d.metrics, hasCoverage: !!d.coverage }; }).catch(e => { tests.coverage = { ok: false, error: String(e) }; }),
      fetch('/api/tools').then(r => r.json()).then(d => { tests.tools = { ok: true, toolCount: Object.keys(d.tools || {}).length }; }).catch(e => { tests.tools = { ok: false, error: String(e) }; }),
      fetch('/api/auth/me').then(r => r.json()).then(d => { tests.auth = { ok: true, user: d.user?.email, tenant: d.user?.tenantId, role: d.user?.role }; }).catch(e => { tests.auth = { ok: false, error: String(e) }; }),
    ]).then(() => setResults(tests));
  }, []);

  return (
    <div style={{padding: 40, background: '#0a0d15', color: '#eaf0ff', minHeight: '100vh', fontFamily: 'monospace'}}>
      <h1>Dashboard Diagnostic</h1>
      <pre style={{fontSize: 14, lineHeight: 1.8}}>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}
