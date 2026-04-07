'use client';
import React from 'react';

export default function PressPage() {
  const facts = [
    ['Founded', '2025 · Glasgow, UK'],
    ['Product', 'AI-powered SOC dashboard + MSSP client portal platform'],
    ['Category', 'AI-powered Security Operations (SOC)'],
    ['Target market', 'MSSPs, enterprise SOC teams, security analysts'],
    ['Key differentiator', 'BYOK model — per-client Anthropic key isolation, zero data commingling'],
    ['Alert triage speed', '3.2 seconds average (vs 3.5 hours manual)'],
    ['Tool integrations', '80+ across EDR, SIEM, XDR, Cloud, Identity, OT/ICS, SOAR, ITSM'],
    ['AI model', 'Claude (Anthropic) via customer BYOK key'],
    ['Pricing', 'Community free · Essentials £149/seat · Professional £1,199/mo · Enterprise £3,499/mo'],
    ['14-day free trial', 'No credit card required'],
    ['Press contact', 'hello@getwatchtower.io'],
  ];
  const brandColors = [
    {name:'Primary Blue',hex:'#4f8fff'},
    {name:'Accent Green',hex:'#22d49a'},
    {name:'Alert Red',hex:'#f0405e'},
    {name:'Purple',hex:'#8b6fff'},
    {name:'Background',hex:'#060c18'},
    {name:'Card',hex:'rgba(14,24,46,0.55)'},
  ];
  const downloads = [
    {label:'Logo — SVG', href:'/favicon.svg', note:'Primary wordmark, works on dark backgrounds'},
    {label:'Product screenshots', href:'mailto:hello@getwatchtower.io?subject=Press+Kit+Screenshots', note:'High-resolution dashboard screenshots — email us'},
    {label:'Founder headshot', href:'mailto:hello@getwatchtower.io?subject=Press+Kit+Headshot', note:'Available on request'},
    {label:'Company overview PDF', href:'mailto:hello@getwatchtower.io?subject=Company+Overview', note:'1-page fact sheet — email us'},
  ];
  return (
    <div style={{background:'#060c18',color:'#e8ecf4',fontFamily:'Inter,sans-serif',minHeight:'100vh'}}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#060c18}`}</style>
      <nav style={{display:'flex',alignItems:'center',padding:'14px 28px',borderBottom:'1px solid rgba(0,180,240,0.13)',background:'rgba(4,8,20,0.80)',backdropFilter:'blur(18px)',position:'sticky',top:0,zIndex:50}}>
        <a href='/' style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,fontSize:'0.95rem',textDecoration:'none',color:'inherit'}}>
          <div style={{width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',color:'#fff',fontWeight:900}}>W</div>
          Watchtower
        </a>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <a href='/pricing' style={{color:'#6b7a94',fontSize:'0.8rem',fontWeight:500,padding:'7px 14px',textDecoration:'none'}}>Pricing</a>
          <a href='/demo' style={{color:'#6b7a94',fontSize:'0.8rem',fontWeight:500,padding:'7px 14px',textDecoration:'none'}}>Demo</a>
          <a href='/login' style={{padding:'8px 18px',borderRadius:8,background:'#4f8fff',color:'#fff',fontSize:'0.8rem',fontWeight:700,textDecoration:'none'}}>Sign In</a>
        </div>
      </nav>

      <div style={{maxWidth:800,margin:'0 auto',padding:'64px 24px 80px'}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'2px',marginBottom:12}}>Press {'&'} Media</div>
          <h1 style={{fontSize:'2.5rem',fontWeight:900,letterSpacing:'-1.5px',marginBottom:16,lineHeight:1.1}}>Watchtower Press Kit</h1>
          <p style={{fontSize:'1rem',color:'#6b7a94',lineHeight:1.7,maxWidth:560}}>
            Watchtower is an AI-powered SOC dashboard that triages security alerts in 3.2 seconds — built for MSSPs and enterprise security teams. Every customer brings their own Anthropic API key, so security data never touches a shared AI account.
          </p>
        </div>

        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:'1rem',fontWeight:800,marginBottom:16}}>Company Facts</h2>
          <div style={{background:'rgba(14,24,46,0.55)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:12,overflow:'hidden'}}>
            {facts.map(([label,val],i)=>(
              <div key={String(label)} style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:16,padding:'12px 20px',borderBottom:i<facts.length-1?'1px solid #141820':'none',background:i%2===0?'transparent':'#09091a'}}>
                <div style={{fontSize:'0.76rem',fontWeight:700,color:'#6b7a94'}}>{label}</div>
                <div style={{fontSize:'0.76rem',color:'#e8ecf4'}}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:'1rem',fontWeight:800,marginBottom:16}}>Brand Colours</h2>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {brandColors.map(c=>(
              <div key={c.hex} style={{display:'flex',flexDirection:'column',gap:6}}>
                <div style={{width:64,height:64,borderRadius:10,background:c.hex,border:'1px solid #1d2535'}} />
                <div style={{fontSize:'0.64rem',fontWeight:700,color:'#e8ecf4'}}>{c.name}</div>
                <div style={{fontSize:'0.58rem',color:'#6b7a94',fontFamily:'JetBrains Mono,monospace'}}>{c.hex}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:'1rem',fontWeight:800,marginBottom:16}}>Assets {'&'} Downloads</h2>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {downloads.map(d=>(
              <a key={d.label} href={d.href} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'rgba(14,24,46,0.55)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:10,textDecoration:'none',color:'inherit'}}>
                <span style={{fontSize:'1rem'}}>⬇</span>
                <div>
                  <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:2}}>{d.label}</div>
                  <div style={{fontSize:'0.64rem',color:'#6b7a94'}}>{d.note}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div style={{padding:'28px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:14,textAlign:'center'}}>
          <div style={{fontSize:'1.1rem',fontWeight:800,marginBottom:8}}>Press enquiries</div>
          <p style={{fontSize:'0.82rem',color:'#6b7a94',marginBottom:20,lineHeight:1.7,maxWidth:440,margin:'0 auto 20px'}}>For interviews, product demonstrations, data requests, or analyst review access — we respond within 24 hours.</p>
          <a href='mailto:hello@getwatchtower.io?subject=Press+Enquiry' style={{display:'inline-block',padding:'11px 28px',borderRadius:9,background:'#4f8fff',color:'#fff',fontWeight:700,fontSize:'0.84rem',textDecoration:'none'}}>hello@getwatchtower.io</a>
        </div>
      </div>
    </div>
  );
}
