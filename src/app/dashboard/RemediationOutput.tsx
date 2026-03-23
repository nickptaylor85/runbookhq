'use client';
import { useState } from 'react';

type BlockType = 'heading' | 'subheading' | 'code' | 'text';
type Block = { type: BlockType; content: string; id?: string };

export function RemediationOutput({ text }: { text: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const rawLines = text.split('\n');
  const blocks: Block[] = [];
  const codeBuffer: string[] = [];
  let inCode = false;
  let codeId = 0;

  const CODE_START = /^(DeviceProcess|DeviceNetwork|Security|Identity|Cloud|Mailbox|source=|index=)/;
  const QUERY_LABEL = /^(KQL QUERY|SPLUNK QUERY|SENTINEL|DEFENDER|MICROSOFT|SOURCE=)/i;
  const MAJOR_HEADING = /^[A-Z][A-Z\s\-:/]+$/;
  const SUB_HEADING = /^(KQL QUERY \d+:|SPLUNK QUERY FOR |MICROSOFT SENTINEL|MICROSOFT DEFENDER|DETECTION |REMEDIATION |COMPENSATING |COMMON |HOW ATTACKERS)/i;
  const HAS_PIPE_OR_SEMI = /[|;]$/;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();
    if (!trimmed) { if (!inCode) continue; }

    const isCodeLine = HAS_PIPE_OR_SEMI.test(trimmed) || CODE_START.test(trimmed) || (inCode && trimmed.length > 0);
    const isQueryLabel = QUERY_LABEL.test(trimmed);
    const isMajorHeading = MAJOR_HEADING.test(trimmed) && trimmed.length > 8 && trimmed.length < 80 && !isCodeLine;
    const isSubHeading = SUB_HEADING.test(trimmed);

    if (isSubHeading || isQueryLabel) {
      if (inCode && codeBuffer.length) {
        blocks.push({ type: 'code', content: codeBuffer.join('\n'), id: `code-${++codeId}` });
        codeBuffer.length = 0;
        inCode = false;
      }
      blocks.push({ type: 'subheading', content: trimmed });
      inCode = true;
    } else if (isMajorHeading) {
      if (inCode && codeBuffer.length) {
        blocks.push({ type: 'code', content: codeBuffer.join('\n'), id: `code-${++codeId}` });
        codeBuffer.length = 0;
        inCode = false;
      }
      blocks.push({ type: 'heading', content: trimmed });
      inCode = false;
    } else if (inCode && trimmed) {
      codeBuffer.push(line);
    } else {
      if (codeBuffer.length) {
        blocks.push({ type: 'code', content: codeBuffer.join('\n'), id: `code-${++codeId}` });
        codeBuffer.length = 0;
        inCode = false;
      }
      blocks.push({ type: 'text', content: trimmed });
    }
  }
  if (codeBuffer.length) {
    blocks.push({ type: 'code', content: codeBuffer.join('\n'), id: `code-${++codeId}` });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') return (
          <div key={i} style={{ fontSize: '0.58rem', fontWeight: 800, color: '#4f8fff', textTransform: 'uppercase', letterSpacing: '1.5px', paddingTop: i > 0 ? 8 : 0, borderTop: i > 0 ? '1px solid var(--wt-border)' : 'none', marginTop: i > 0 ? 2 : 0 }}>{block.content}</div>
        );
        if (block.type === 'subheading') return (
          <div key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--wt-text)', marginTop: 4, marginBottom: -4 }}>{block.content}</div>
        );
        if (block.type === 'code') return (
          <div key={i} style={{ position: 'relative', background: '#020306', border: '1px solid #1a2235', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #1a2235', background: '#060912' }}>
              <span style={{ fontSize: '0.54rem', fontWeight: 700, color: '#4f8fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Query</span>
              <button onClick={() => copyCode(block.content, block.id || '')} style={{ fontSize: '0.56rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: '1px solid #1e2536', background: 'transparent', color: copied === block.id ? '#22d49a' : 'var(--wt-muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'color .15s' }}>
                {copied === block.id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, padding: '10px 12px', fontSize: '0.63rem', fontFamily: 'JetBrains Mono,monospace', color: '#a8c0e8', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{block.content.trim()}</pre>
          </div>
        );
        return (
          <div key={i} style={{ fontSize: '0.72rem', color: 'var(--wt-secondary)', lineHeight: 1.7 }}>{block.content}</div>
        );
      })}
    </div>
  );
}
