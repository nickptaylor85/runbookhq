'use client';
import React from 'react';

interface RemediationOutputProps { text: string }
export default function RemediationOutput({ text }: RemediationOutputProps) {
  if (!text) return null;
  return (
    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.72rem',
      background:'var(--wt-card)', border:'1px solid var(--wt-border)',
      borderRadius:8, padding:'10px 14px', lineHeight:1.7,
      color:'var(--wt-secondary)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
      {text}
    </div>
  );
}
