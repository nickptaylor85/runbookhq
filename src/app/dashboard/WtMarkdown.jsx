import React from 'react';

/**
 * WtMarkdown — Watchtower AI response renderer
 * Converts markdown-style AI output into polished, readable React elements.
 * Handles: headers, bullets, numbered lists, bold, inline code, code blocks,
 * blockquotes, horizontal rules, key:value pairs, and plain paragraphs.
 */

const ACCENT = '#4f8fff';

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = React.useState(false);
  const langColors = { splunk:'#22d49a', kql:'#4f8fff', sql:'#f0a030', bash:'#f97316', python:'#22c992', default:'#a8b2c1' };
  const col = langColors[lang?.toLowerCase()] || langColors.default;
  return (
    <div style={{ position:'relative', marginBottom:10, marginTop:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 10px', background:'rgba(14,18,30,0.85)', borderRadius:'7px 7px 0 0', borderBottom:'1px solid rgba(0,180,240,0.15)' }}>
        {lang && <span style={{ fontSize:'0.66rem', fontWeight:700, color:col, fontFamily:'JetBrains Mono,monospace', letterSpacing:'0.5px' }}>{lang.toUpperCase()}</span>}
        <button onClick={()=>{ navigator.clipboard?.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1800); }}
          aria-label='Copy code' style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${col}30`, background:`${col}10`, color:col, fontSize:'0.64rem', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', marginLeft:'auto' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin:0, padding:'12px 14px', background:'#050810', borderRadius:'0 0 7px 7px', fontSize:'0.75rem', fontFamily:'JetBrains Mono,monospace', color:'#22c992', lineHeight:1.65, overflowX:'auto', whiteSpace:'pre', wordBreak:'normal' }}>{code}</pre>
    </div>
  );
}

function renderInline(text) {
  // Bold **text** and *text*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (/^\*\*.*\*\*$/.test(p)) return <strong key={i} style={{ color:'var(--wt-text)', fontWeight:700 }}>{p.slice(2,-2)}</strong>;
    if (/^\*.*\*$/.test(p)) return <em key={i} style={{ color:'var(--wt-text)', fontStyle:'italic' }}>{p.slice(1,-1)}</em>;
    if (/^`.*`$/.test(p)) return <code key={i} style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.88em', background:'rgba(79,143,255,0.1)', color:'#4f8fff', padding:'1px 5px', borderRadius:3 }}>{p.slice(1,-1)}</code>;
    return p;
  });
}

export default function WtMarkdown({ text, accent = ACCENT, compact = false }) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Empty line
    if (!line) { elements.push(<div key={i} style={{ height: compact ? 4 : 8 }} />); i++; continue; }

    // Code block ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={i} lang={lang} code={codeLines.join('\n')} />);
      i++; continue;
    }

    // H1 / H2 / H3
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const sizes = { 1:'1.05rem', 2:'0.94rem', 3:'0.86rem' };
      elements.push(
        <div key={i} style={{ fontSize:sizes[level], fontWeight:800, color:accent, marginTop: compact?6:10, marginBottom:compact?3:5, letterSpacing:level===1?'0.5px':0 }}>
          {renderInline(hMatch[2])}
        </div>
      );
      i++; continue;
    }

    // ALL-CAPS section header (e.g. "ICP:", "CHANNELS:")
    if (/^[A-Z][A-Z\s\/&-]{2,}:$/.test(line) || /^[A-Z][A-Z\s\/&-]{2,}:\s/.test(line)) {
      const colonIdx = line.indexOf(':');
      const label = line.slice(0, colonIdx);
      const rest = line.slice(colonIdx+1).trim();
      elements.push(
        <div key={i} style={{ marginTop: compact?8:12, marginBottom:compact?3:5 }}>
          <div style={{ fontSize:'0.72rem', fontWeight:800, color:accent, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:rest?3:0 }}>{label}</div>
          {rest && <div style={{ fontSize:'0.84rem', color:'var(--wt-secondary)', lineHeight:1.6 }}>{renderInline(rest)}</div>}
        </div>
      );
      i++; continue;
    }

    // Horizontal rule ---
    if (/^[-*]{3,}$/.test(line)) {
      elements.push(<div key={i} style={{ borderTop:'1px solid var(--wt-border)', margin:'8px 0' }} />);
      i++; continue;
    }

    // Blockquote >
    if (line.startsWith('>')) {
      elements.push(
        <div key={i} style={{ borderLeft:`3px solid ${accent}`, paddingLeft:10, marginBottom:4, color:'var(--wt-muted)', fontStyle:'italic', fontSize:'0.84rem', lineHeight:1.6 }}>
          {renderInline(line.slice(1).trim())}
        </div>
      );
      i++; continue;
    }

    // Numbered list 1. or 1)
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      const num = numMatch[1];
      const content = numMatch[2];
      // Check if priority tag present [CRITICAL] [HIGH] etc
      const priMatch = content.match(/^\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*/i);
      const priority = priMatch?.[1]?.toUpperCase();
      const priColors = { CRITICAL:'#f0405e', HIGH:'#f97316', MEDIUM:'#f0a030', LOW:'#22d49a' };
      const priColor = priColors[priority];
      const bodyText = priMatch ? content.slice(priMatch[0].length) : content;
      elements.push(
        <div key={i} style={{ display:'flex', gap:10, marginBottom:compact?4:6, alignItems:'flex-start' }}>
          <div style={{ width:22, height:22, borderRadius:5, background:priColor||accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.72rem', fontWeight:900, color:'#fff', marginTop:1 }}>{num}</div>
          <div style={{ flex:1 }}>
            {priority && <span style={{ fontSize:'0.62rem', fontWeight:800, color:priColor, fontFamily:'JetBrains Mono,monospace', marginRight:6, padding:'1px 5px', background:`${priColor}15`, borderRadius:3 }}>{priority}</span>}
            <span style={{ fontSize:'0.84rem', color:'var(--wt-text)', lineHeight:1.6 }}>{renderInline(bodyText)}</span>
          </div>
        </div>
      );
      i++; continue;
    }

    // Bullet list - or *
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={i} style={{ display:'flex', gap:8, marginBottom:compact?3:5, alignItems:'flex-start' }}>
          <span style={{ color:accent, flexShrink:0, fontSize:'1rem', lineHeight:1.3, marginTop:1 }}>›</span>
          <span style={{ fontSize:'0.84rem', color:'var(--wt-secondary)', lineHeight:1.6 }}>{renderInline(bulletMatch[1])}</span>
        </div>
      );
      i++; continue;
    }

    // Key: value pair (short label: rest of line)
    const kvMatch = line.match(/^([A-Za-z][A-Za-z\s]{1,25}):\s+(.+)/);
    if (kvMatch && kvMatch[1].length < 28) {
      elements.push(
        <div key={i} style={{ display:'flex', gap:8, marginBottom:compact?3:5, alignItems:'baseline', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.72rem', fontWeight:800, color:accent, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0, minWidth:80 }}>{kvMatch[1]}</span>
          <span style={{ fontSize:'0.84rem', color:'var(--wt-secondary)', lineHeight:1.6, flex:1 }}>{renderInline(kvMatch[2])}</span>
        </div>
      );
      i++; continue;
    }

    // Plain paragraph
    elements.push(
      <p key={i} style={{ fontSize:'0.86rem', color:'var(--wt-secondary)', lineHeight:1.7, margin:0, marginBottom:compact?3:6 }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}
