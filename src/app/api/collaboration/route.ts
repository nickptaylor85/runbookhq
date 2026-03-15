import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ analysts: [
    {id:'a1',name:'Sarah Chen',status:'active',viewing:'da-002',avatar:'SC',color:'#60a5fa'},
    {id:'a2',name:'Mike Torres',status:'active',viewing:'ta-001',avatar:'MT',color:'#22c55e'},
    {id:'a3',name:'Alice Wong',status:'away',viewing:null,avatar:'AW',color:'#f59e0b'},
    {id:'a4',name:'James Park',status:'active',viewing:'da-005',avatar:'JP',color:'#a855f7'},
  ], claimed: {'da-002':'Sarah Chen','ta-001':'Mike Torres','da-005':'James Park'}, demo: true });
}
export async function POST(req: Request) {
  const {action,alertId,analyst}=await req.json();
  return NextResponse.json({ok:true,message:`${action}: ${alertId} by ${analyst||'you'}`});
}
