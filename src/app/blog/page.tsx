'use client';
import React, { useState } from 'react';

const POSTS = [
  {
    slug: 'soc-alert-triage-ai',
    title: 'How AI Reduces SOC Alert Triage from 3.5 Hours to 3.2 Seconds',
    date: '2026-03-15',
    tag: 'AI and Automation',
    tagColor: '#4f8fff',
    excerpt: `Traditional alert triage burns analyst hours on false positives. Here's how AI evidence chains, blast radius analysis, and institutional knowledge change the economics of a SOC.`,
    readTime: '7 min',
    body: `The average SOC analyst spends 3.5 hours triaging a single critical alert. That includes context-switching between 4-6 tool consoles, correlating indicators manually, checking MITRE mappings, and writing up findings. Multiply by 15-30 critical alerts per day and you have a team that never gets ahead.

AI-powered triage changes the unit economics. Instead of an analyst pulling data from each tool, the AI ingests normalised alerts from every connected source simultaneously. It cross-references the affected device's vulnerability state from Tenable, checks the user's authentication history from Entra ID, looks at network anomalies from Darktrace, and correlates with threat intel — all in a single pass.

The key differentiator isn't speed alone. It's the evidence chain. Every AI verdict includes the specific data points that drove the decision: "CrowdStrike detected LSASS access on DC01. Tenable shows this host has CVE-2024-XXXX (CVSS 9.8, KEV listed). Entra ID shows the admin_svc account authenticated from an unusual IP 12 minutes before the detection. Cross-source correlation: HIGH confidence True Positive."

This evidence chain is what makes AI triage defensible to auditors and actionable for junior analysts. The AI isn't just flagging — it's explaining its reasoning with citations.

For MSSPs, the economics are even more compelling. A single APEX triage across 50 client tenants runs each analysis with per-client context isolation. The AI learns each client's environment patterns — which sources are noisy, which devices are high-value, what the normal authentication baseline looks like. False positive rates drop as the system accumulates institutional knowledge.

The result: analysts spend their time on confirmed true positives and strategic security work, not copy-pasting between tool consoles.`,
  },
  {
    slug: 'mssp-dashboard-automation',
    title: 'The MSSP Dashboard Problem: Why Single-Pane-of-Glass Actually Works Now',
    date: '2026-03-08',
    tag: 'MSSP',
    tagColor: '#8b6fff',
    excerpt: `MSSPs have been promised single-pane-of-glass for 15 years. AI cross-tenant correlation is what finally makes it real — not just a marketing slide.`,
    readTime: '5 min',
    body: `Every SIEM vendor since 2010 has promised "single pane of glass." The pitch is always the same: connect your tools, see everything in one place, reduce alert fatigue. The reality is always the same too: you get a dashboard that shows aggregated numbers but still requires analysts to jump into native tool consoles for actual investigation.

The fundamental problem was never aggregation — it was intelligence. Aggregating 10,000 alerts into one screen doesn't help if you still need a human to triage each one. You've moved the problem from "too many consoles" to "too many alerts in one console."

What changes with AI is the triage layer between ingestion and human attention. When an alert arrives from CrowdStrike, the system doesn't just display it — it immediately cross-references the affected device against Tenable vulnerability data, checks the user's Okta authentication patterns, looks for correlated alerts from Splunk and Sentinel, and delivers a verdict with confidence score.

For MSSPs managing 10-50 clients, this transforms the operational model. Instead of dedicated analysts per client (expensive, doesn't scale), you have a shared analyst pool where each analyst can effectively manage 3-4x more clients because the AI handles first-pass triage.

The portfolio view — seeing posture scores, alert volumes, SLA compliance, and critical issues across all clients on one screen — becomes genuinely useful when the data feeding it has already been AI-processed. You're not looking at raw alert counts; you're looking at confirmed threat counts, coverage gaps, and risk trends.

Per-client data isolation (BYOK model) makes this viable for compliance-sensitive clients. Each client's alerts are processed under their own Anthropic API key. No data commingling between tenants. The MSSP sees the results; the AI processing happens in the client's own context.`,
  },
  {
    slug: 'nis2-dora-compliance-tool',
    title: 'NIS2 and DORA: What Your SOC Actually Needs to Change',
    date: '2026-02-28',
    tag: 'Compliance',
    tagColor: '#22d49a',
    excerpt: `NIS2 Art.21 requires documented risk management. DORA Art.10 mandates ICT incident classification. Here's what both mean for your SOC workflow and how to satisfy them without a 6-month project.`,
    readTime: '9 min',
    body: `NIS2 (Network and Information Security Directive 2) and DORA (Digital Operational Resilience Act) both came into force in 2025, and most SOC teams are still figuring out what they actually need to change day-to-day. The legislation is written in regulatory language; here's the practical translation for security operations.

NIS2 Article 21 requires "appropriate and proportionate technical, operational and organisational measures to manage risks." For a SOC, this means documented evidence that you're actually detecting and responding to threats — not just that you have tools deployed. You need to show: what alerts fired, how they were triaged, what the response was, and how long it took.

DORA Article 10 is more specific: ICT-related incidents must be classified by severity, and "major ICT-related incidents" must be reported to regulators within specific timeframes. This means your SOC needs consistent severity classification (not ad-hoc analyst judgment) and reliable MTTA/MTTR metrics.

What this means practically:

Every alert triage decision needs an audit trail. When an analyst (or AI) classifies an alert as True Positive or False Positive, the reasoning must be recorded. "Closed as FP" is no longer sufficient — you need "Closed as FP: alert triggered by scheduled Windows Update process on SRV-APP02, cross-referenced with SCCM deployment schedule, no malicious indicators present."

Incident response times must be tracked against SLA. NIS2 doesn't specify exact timeframes, but "without undue delay" for significant incidents is the standard. DORA is stricter: initial notification within 4 hours for major incidents. Your SOC platform needs to surface SLA breaches proactively, not retroactively.

Compliance mapping should be continuous, not quarterly. If your ISO 27001 controls are being evaluated once per audit cycle, you're reactive. Mapping active alerts to control frameworks in real-time shows auditors that your risk management is operational, not theoretical.

The good news: if you're already running a mature SOC with proper triage documentation, severity classification, and response tracking, you're 80% compliant already. The gap is usually in the reporting format and the audit trail completeness — which is exactly what AI-assisted triage with evidence chains provides automatically.`,
  },
  {
    slug: 'byok-security-ai',
    title: 'Why BYOK Matters for AI in Security Operations',
    date: '2026-02-14',
    tag: 'Security',
    tagColor: '#f0405e',
    excerpt: `When your AI key is shared, your alert data is commingled with other organisations. BYOK — Bring Your Own Key — is not just an enterprise feature. It's the minimum bar for security data.`,
    readTime: '4 min',
    body: `Most AI-powered security tools use a shared API key. Your alert data — device names, IP addresses, user accounts, vulnerability details — is sent to the AI provider under the platform vendor's account. This means your security data is processed in the same context as every other customer's data.

For most SaaS products, shared infrastructure is fine. For security operations data, it's a compliance problem.

BYOK (Bring Your Own Key) means each organisation provides their own AI API key. Alert data is processed under your Anthropic account, subject to your data processing agreement with Anthropic, and never commingled with other organisations' data.

For MSSPs, this goes further: each client tenant uses its own key. MSSP client A's alert data is never processed in the same API context as client B's data. The MSSP can manage all clients from one dashboard, but the AI processing is isolated per-client.

This matters for three reasons. First, data residency: your DPA with Anthropic controls where your data is processed, not the platform vendor's DPA. Second, audit trail: API usage is logged under your account, giving you direct visibility into what data was sent and when. Third, context isolation: the AI has no carry-over knowledge between tenants — it can't accidentally reference one client's environment when analysing another's alerts.

The practical trade-off is onboarding friction. Each user needs an Anthropic API key, which requires creating an account at console.anthropic.com and adding billing. For enterprise and MSSP clients, this is a non-issue — they already manage API keys for dozens of services. For smaller teams, it's an extra step that's worth the isolation guarantee.`,
  },
];

export default function BlogPage() {
  const [expanded, setExpanded] = useState<string|null>(null);

  return (
    <div style={{background:'#060c18',color:'#e8ecf4',fontFamily:'Inter,sans-serif',minHeight:'100vh',position:'relative'}}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#060c18}a{text-decoration:none;color:inherit}
.blog-page::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 90% 70% at 8% 12%,rgba(0,80,255,0.12) 0%,transparent 55%),radial-gradient(ellipse 70% 60% at 94% 88%,rgba(130,0,255,0.10) 0%,transparent 55%),radial-gradient(rgba(0,180,240,0.045) 1px,transparent 1px),#060c18;background-size:auto,auto,40px 40px,auto}`}</style>
      <div className="blog-page" style={{position:'fixed',inset:0}} />
      <nav style={{display:'flex',alignItems:'center',padding:'14px 28px',borderBottom:'1px solid rgba(0,180,240,0.13)',background:'rgba(4,8,20,0.80)',backdropFilter:'blur(30px) saturate(1.8)',WebkitBackdropFilter:'blur(30px) saturate(1.8)',position:'sticky',top:0,zIndex:50}}>
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

      <div style={{maxWidth:760,margin:'0 auto',padding:'64px 24px 80px',position:'relative',zIndex:1}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'2px',marginBottom:12}}>Security Operations</div>
          <h1 style={{fontSize:'2.5rem',fontWeight:900,letterSpacing:'-1.5px',marginBottom:12,lineHeight:1.1}}>Blog</h1>
          <p style={{fontSize:'0.9rem',color:'#6b7a94',lineHeight:1.7}}>SOC automation, AI triage, MSSP operations, and compliance — practical writing for security teams.</p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {POSTS.map(post=>(
            <div key={post.slug}
              onClick={()=>setExpanded(expanded===post.slug?null:post.slug)}
              style={{padding:'24px 28px',background:'rgba(14,24,46,0.55)',border:`1px solid ${expanded===post.slug?'rgba(0,180,240,0.30)':'rgba(0,180,240,0.13)'}`,borderRadius:14,cursor:'pointer',transition:'border-color .15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{fontSize:'0.58rem',fontWeight:800,padding:'2px 8px',borderRadius:4,background:`${post.tagColor}15`,color:post.tagColor,border:`1px solid ${post.tagColor}25`}}>{post.tag}</span>
                <span style={{fontSize:'0.64rem',color:'#3a4050'}}>{new Date(post.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
                <span style={{fontSize:'0.64rem',color:'#3a4050',marginLeft:'auto'}}>{post.readTime} read</span>
              </div>
              <h2 style={{fontSize:'1.05rem',fontWeight:800,marginBottom:8,lineHeight:1.3,letterSpacing:'-0.3px'}}>{post.title}</h2>
              <p style={{fontSize:'0.78rem',color:'#6b7a94',lineHeight:1.7}}>{post.excerpt}</p>
              {expanded===post.slug && (
                <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(0,180,240,0.13)'}}>
                  {post.body.split('\n\n').map((para,i)=>(
                    <p key={i} style={{fontSize:'0.84rem',color:'#8a9ab0',lineHeight:1.85,marginBottom:14}}>{para}</p>
                  ))}
                </div>
              )}
              <div style={{marginTop:10,fontSize:'0.72rem',color:'#4f8fff',fontWeight:600}}>
                {expanded===post.slug?'▲ Collapse':'▼ Read full article'}
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:48,padding:'28px',background:'rgba(14,24,46,0.55)',border:'1px solid rgba(79,143,255,0.20)',borderRadius:14,textAlign:'center'}}>
          <div style={{fontSize:'0.96rem',fontWeight:800,marginBottom:8}}>See it in action</div>
          <p style={{fontSize:'0.78rem',color:'#6b7a94',marginBottom:16,lineHeight:1.6}}>The concepts in these articles are built into Watchtower. Try it free.</p>
          <a href='/signup' style={{display:'inline-block',padding:'10px 24px',borderRadius:9,background:'#4f8fff',color:'#fff',fontWeight:700,fontSize:'0.84rem'}}>Start free →</a>
        </div>
      </div>
    </div>
  );
}
