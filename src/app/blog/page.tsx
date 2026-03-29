'use client';
import React from 'react';

const POSTS = [
  {
    slug: 'soc-alert-triage-ai',
    title: 'How AI Reduces SOC Alert Triage from 3.5 Hours to 3.2 Seconds',
    date: '2026-03-15',
    tag: 'AI and Automation',
    tagColor: '#4f8fff',
    excerpt: `Traditional alert triage burns analyst hours on false positives. Here's how AI evidence chains, blast radius analysis, and institutional knowledge change the economics of a SOC.`,
    readTime: '7 min',
  },
  {
    slug: 'mssp-dashboard-automation',
    title: 'The MSSP Dashboard Problem: Why Single-Pane-of-Glass Actually Works Now',
    date: '2026-03-08',
    tag: 'MSSP',
    tagColor: '#8b6fff',
    excerpt: `MSSPs have been promised single-pane-of-glass for 15 years. AI cross-tenant correlation is what finally makes it real — not just a marketing slide.`,
    readTime: '5 min',
  },
  {
    slug: 'nis2-dora-compliance-tool',
    title: 'NIS2 and DORA: What Your SOC Actually Needs to Change',
    date: '2026-02-28',
    tag: 'Compliance',
    tagColor: '#22d49a',
    excerpt: `NIS2 Art.21 requires documented risk management. DORA Art.10 mandates ICT incident classification. Here's what both mean for your SOC workflow and how to satisfy them without a 6-month project.`,
    readTime: '9 min',
  },
  {
    slug: 'byok-security-ai',
    title: 'Why BYOK Matters for AI in Security Operations',
    date: '2026-02-14',
    tag: 'Security',
    tagColor: '#f0405e',
    excerpt: `When your AI key is shared, your alert data is commingled with other organisations. BYOK — Bring Your Own Key — is not just an enterprise feature. It's the minimum bar for security data.`,
    readTime: '4 min',
  },
];

export default function BlogPage() {
  return (
    <div style={{background:'#050508',color:'#e8ecf4',fontFamily:'Inter,sans-serif',minHeight:'100vh'}}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#050508}a{text-decoration:none;color:inherit}`}</style>
      <nav style={{display:'flex',alignItems:'center',padding:'14px 28px',borderBottom:'1px solid #ffffff06',background:'rgba(5,5,8,0.9)',backdropFilter:'blur(18px)',position:'sticky',top:0,zIndex:50}}>
        <a href='/' style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,fontSize:'0.95rem'}}>
          <div style={{width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',color:'#fff',fontWeight:900}}>W</div>
          Watchtower
        </a>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <a href='/pricing' style={{color:'#6b7a94',fontSize:'0.8rem',fontWeight:500,padding:'7px 14px'}}>Pricing</a>
          <a href='/demo' style={{color:'#6b7a94',fontSize:'0.8rem',fontWeight:500,padding:'7px 14px'}}>Demo</a>
          <a href='/signup' style={{padding:'8px 18px',borderRadius:8,background:'#4f8fff',color:'#fff',fontSize:'0.8rem',fontWeight:700}}>Start Free</a>
        </div>
      </nav>

      <div style={{maxWidth:760,margin:'0 auto',padding:'64px 24px 80px'}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'2px',marginBottom:12}}>Security Operations</div>
          <h1 style={{fontSize:'2.5rem',fontWeight:900,letterSpacing:'-1.5px',marginBottom:12,lineHeight:1.1}}>Blog</h1>
          <p style={{fontSize:'0.9rem',color:'#6b7a94',lineHeight:1.7}}>SOC automation, AI triage, MSSP operations, and compliance — practical writing for security teams.</p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {POSTS.map(post=>(
            <a key={post.slug} href={`/blog/${post.slug}`}
              style={{display:'block',padding:'24px 28px',background:'#0a0d14',border:'1px solid #141820',borderRadius:14,transition:'border-color .15s,transform .1s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#4f8fff40';(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#141820';(e.currentTarget as HTMLElement).style.transform='none';}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{fontSize:'0.58rem',fontWeight:800,padding:'2px 8px',borderRadius:4,background:`${post.tagColor}15`,color:post.tagColor,border:`1px solid ${post.tagColor}25`}}>{post.tag}</span>
                <span style={{fontSize:'0.64rem',color:'#3a4050'}}>{new Date(post.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
                <span style={{fontSize:'0.64rem',color:'#3a4050',marginLeft:'auto'}}>{post.readTime} read</span>
              </div>
              <h2 style={{fontSize:'1.05rem',fontWeight:800,marginBottom:8,lineHeight:1.3,letterSpacing:'-0.3px'}}>{post.title}</h2>
              <p style={{fontSize:'0.78rem',color:'#6b7a94',lineHeight:1.7}}>{post.excerpt}</p>
            </a>
          ))}
        </div>

        <div style={{marginTop:48,padding:'28px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:14,textAlign:'center'}}>
          <div style={{fontSize:'0.96rem',fontWeight:800,marginBottom:8}}>See it in action</div>
          <p style={{fontSize:'0.78rem',color:'#6b7a94',marginBottom:16,lineHeight:1.6}}>The concepts in these articles are built into Watchtower. Try it free.</p>
          <a href='/signup' style={{display:'inline-block',padding:'10px 24px',borderRadius:9,background:'#4f8fff',color:'#fff',fontWeight:700,fontSize:'0.84rem'}}>Start free →</a>
        </div>
      </div>
    </div>
  );
}
