'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function SetupPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  return (
    <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#e8ecf4' }}>
      <div style={{ maxWidth:480, width:'100%', padding:'0 24px', textAlign:'center' }}>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:8 }}>Setup Watchtower</h1>
        <p style={{ color:'#6b7a94', marginBottom:32 }}>Step {step} of 3</p>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding:'12px 32px', background:'#4f8fff', border:'none', borderRadius:9,
            color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
            fontFamily:'Inter,sans-serif' }}>
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}
