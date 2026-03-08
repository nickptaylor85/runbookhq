import{NextResponse}from'next/server';
import{loadToolConfigs,saveToolConfigs,hasKVStore}from'@/lib/config-store';
import{TOOLS}from'@/lib/tool-registry-client';
export async function GET(){
  const c=await loadToolConfigs();const kv=await hasKVStore();
  const ts=TOOLS.map(t=>({id:t.id,name:t.name,shortName:t.shortName,category:t.categoryLabel,color:t.color,icon:t.icon,configured:!!c.tools[t.id],enabled:c.tools[t.id]?.enabled??false,status:c.tools[t.id]?.status??'untested',fieldsSet:t.fields.map(f=>({key:f.key,label:f.label,hasValue:!!c.tools[t.id]?.credentials?.[f.key]}))}));
  return NextResponse.json({tools:ts,kvAvailable:kv,enabledCount:ts.filter(t=>t.enabled).length,configuredCount:ts.filter(t=>t.configured).length});
}
export async function POST(req:Request){
  const b=await req.json();const kv=await hasKVStore();
  if(!kv)return NextResponse.json({error:'Redis not configured. Sign up at upstash.com (free), create a database, then add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your Vercel env vars.',hint:'Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel env vars'},{status:400});
  const c=await loadToolConfigs();
  if(b.action==='save_credentials'){c.tools[b.toolId]={id:b.toolId,enabled:true,credentials:b.credentials,status:'untested'};c.updatedAt=new Date().toISOString();const ok=await saveToolConfigs(c);return NextResponse.json({ok})}
  if(b.action==='toggle'){if(c.tools[b.toolId]){c.tools[b.toolId].enabled=b.enabled;c.updatedAt=new Date().toISOString();await saveToolConfigs(c)}return NextResponse.json({ok:true})}
  if(b.action==='remove'){delete c.tools[b.toolId];c.updatedAt=new Date().toISOString();await saveToolConfigs(c);return NextResponse.json({ok:true})}
  return NextResponse.json({error:'Unknown action'},{status:400});
}
