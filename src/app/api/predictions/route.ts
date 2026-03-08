import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ predictions: [
    {id:'p1',type:'volume',confidence:82,title:'Alert spike expected Monday 08:00-10:00',detail:'12-week pattern: brute force 3x on Monday mornings. Extra analyst coverage recommended.',timeframe:'Monday',severity:'medium',icon:'📈'},
    {id:'p2',type:'exploit',confidence:91,title:'CVE-2024-3400 exploitation likely within 48h',detail:'EPSS 0.97, your VPN gateways unpatched. Active scanning detected.',timeframe:'48h',severity:'critical',icon:'🔴'},
    {id:'p3',type:'phishing',confidence:74,title:'Finance team phishing campaign predicted',detail:'Q1 tax-themed phishing peaks in March. Finance 2.3x more targeted historically.',timeframe:'This week',severity:'high',icon:'🎣'},
    {id:'p4',type:'coverage',confidence:88,title:'Tenable coverage will drop below 90%',detail:'6 new devices, agent rollout takes 4-5 days. Schedule expedited deployment.',timeframe:'Friday',severity:'medium',icon:'📉'},
    {id:'p5',type:'sla',confidence:78,title:'Night shift MTTR SLA breach risk',detail:'Exceeded target 3 of 5 nights. Analyst fatigue trending up.',timeframe:'Tonight',severity:'high',icon:'⏱'},
  ], demo: true });
}
