import { NextResponse } from 'next/server';
import { tenableHeaders } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'No plugin id' }, { status: 400 });

  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });

  try {
    const res = await fetch(`https://cloud.tenable.com/plugins/plugin/${id}`, { headers, cache: 'no-store' });
    const data = await res.json();
    
    if (!data || data.error) {
      return NextResponse.json({ error: data?.error || 'Plugin not found' });
    }

    // Extract the useful fields
    const attrs = data.attributes || [];
    const getAttr = (name: string) => {
      const a = attrs.find((a: any) => a.attribute_name === name);
      return a?.attribute_value || null;
    };

    return NextResponse.json({
      id: data.id,
      name: data.name || '',
      family: data.family_name || '',
      solution: getAttr('solution'),
      synopsis: getAttr('synopsis'),
      description: getAttr('description'),
      cves: (getAttr('cve') || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      cvss3: getAttr('cvss3_base_score'),
      cvss: getAttr('cvss_base_score'),
      vpr: getAttr('vpr_score'),
      exploitAvailable: getAttr('exploit_available') === 'true',
      exploitFrameworks: [getAttr('exploit_framework_metasploit') === 'true' && 'Metasploit', getAttr('exploit_framework_canvas') === 'true' && 'Canvas'].filter(Boolean),
      patchPublished: getAttr('patch_publication_date'),
      pluginPublished: getAttr('plugin_publication_date'),
      seeAlso: (getAttr('see_also') || '').split('\n').filter((s: string) => s.startsWith('http')),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
