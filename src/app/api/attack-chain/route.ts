import { NextResponse } from 'next/server';
export async function GET() {
  const nodes = [
    {id:'C2',type:'ip',label:'185.220.101.42',sev:'critical'},{id:'WS042',type:'device',label:'WS042.corp.local',sev:'critical'},
    {id:'jsmith',type:'user',label:'jsmith',sev:'high'},{id:'DC01',type:'device',label:'SRV-DC01',sev:'critical'},
    {id:'admin_svc',type:'user',label:'admin_svc',sev:'critical'},{id:'FS01',type:'device',label:'FS01.corp.local',sev:'high'},
    {id:'DNS',type:'ip',label:'DNS Tunnel',sev:'high'},{id:'MAIL',type:'device',label:'MAIL-GW',sev:'medium'},
  ];
  const edges = [
    {from:'C2',to:'WS042',label:'C2 Beacon',sev:'critical',mitre:'T1071.001'},{from:'WS042',to:'jsmith',label:'Compromised',sev:'high',mitre:'T1078'},
    {from:'jsmith',to:'DC01',label:'Cred Dump',sev:'critical',mitre:'T1003.001'},{from:'DC01',to:'admin_svc',label:'Priv Esc',sev:'critical',mitre:'T1078'},
    {from:'admin_svc',to:'FS01',label:'Lateral SMB',sev:'high',mitre:'T1021.002'},{from:'WS042',to:'DNS',label:'DNS Tunnel',sev:'high',mitre:'T1572'},
    {from:'MAIL',to:'jsmith',label:'Phish Email',sev:'medium',mitre:'T1566.001'},
  ];
  return NextResponse.json({nodes,edges,demo:true});
}
