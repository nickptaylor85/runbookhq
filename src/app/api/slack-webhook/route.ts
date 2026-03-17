import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const {action,alert}=await req.json();
  const url=process.env.SLACK_WEBHOOK_URL||process.env.TEAMS_WEBHOOK_URL;
  if(action==='test'){
    if(!url)return NextResponse.json({error:'No SLACK_WEBHOOK_URL or TEAMS_WEBHOOK_URL set',demo:true});
    try{await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'🔔 Watchtower connected!'})});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'Webhook failed'},{status:500})}
  }
  if(action==='send'&&alert){
    const sev:Record<string,string>={critical:'🔴',high:'🟠',medium:'🟡',low:'🔵'};
    if(!url)return NextResponse.json({demo:true,message:`Would send: ${sev[alert.severity]||'⚪'} ${alert.title}`});
    await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:`${sev[alert.severity]||'⚪'} *${alert.severity.toUpperCase()}* — ${alert.title}\nSource: ${alert.source} | Device: ${alert.device||'N/A'}`})});
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Unknown'},{status:400});
}
