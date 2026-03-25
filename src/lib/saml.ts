import { redisGet, redisSet } from './redis';
import { encrypt, decrypt } from './encrypt';

export interface SamlConfig {
  enabled: boolean;
  idpEntityId: string;      // Identity Provider Entity ID
  idpSsoUrl: string;        // IdP SSO URL (POST or Redirect binding)
  idpCert: string;          // IdP X.509 certificate (PEM)
  spEntityId: string;       // Our Entity ID (Service Provider)
  attributeMapping: {
    email: string;          // Attribute name for email
    name: string;           // Attribute name for display name
    role?: string;          // Attribute name for role (optional)
  };
  defaultRole: string;      // Default role for SAML users
  domains: string[];        // Allowed email domains (empty = all)
}

const SAML_CONFIG_KEY = (tenantId: string) => `wt:tenant:${tenantId}:saml_config`;

export async function getSamlConfig(tenantId: string): Promise<SamlConfig | null> {
  try {
    const raw = await redisGet(SAML_CONFIG_KEY(tenantId));
    if (!raw) return null;
    return JSON.parse(decrypt(raw)) as SamlConfig;
  } catch { return null; }
}

export async function saveSamlConfig(tenantId: string, config: SamlConfig): Promise<void> {
  await redisSet(SAML_CONFIG_KEY(tenantId), encrypt(JSON.stringify(config)));
}

/** Build the SAML AuthnRequest redirect URL */
export function buildSamlAuthnRequest(config: SamlConfig, relayState: string): string {
  const reqId = '_wt' + Date.now().toString(36);
  const now = new Date().toISOString();
  const spEntityId = config.spEntityId || 'https://getwatchtower.io';
  const acsUrl = `${spEntityId}/api/auth/saml/callback`;

  const authnRequest = `<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${reqId}"
    Version="2.0"
    IssueInstant="${now}"
    Destination="${config.idpSsoUrl}"
    AssertionConsumerServiceURL="${acsUrl}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>${spEntityId}</saml:Issuer>
    <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
  </samlp:AuthnRequest>`;

  const encoded = Buffer.from(authnRequest).toString('base64');
  const url = new URL(config.idpSsoUrl);
  url.searchParams.set('SAMLRequest', encoded);
  url.searchParams.set('RelayState', relayState);
  return url.toString();
}

/** Parse a SAML Response (basic attribute extraction — production would verify signature) */
export function parseSamlResponse(samlResponse: string, config: SamlConfig): {
  email: string; name: string; role: string;
} | null {
  try {
    const xml = Buffer.from(samlResponse, 'base64').toString('utf8');
    const getAttr = (attrName: string): string => {
      const re = new RegExp(`Name="${attrName}"[^>]*>[^<]*<[^>]+>([^<]+)<`, 'i');
      return xml.match(re)?.[1]?.trim() || '';
    };
    const emailAttr = config.attributeMapping.email || 'email';
    const nameAttr = config.attributeMapping.name || 'displayName';
    const roleAttr = config.attributeMapping.role || 'role';
    const email = getAttr(emailAttr) || xml.match(/<saml:NameID[^>]*>([^<]+)</)?.[1]?.trim() || '';
    const name = getAttr(nameAttr) || email.split('@')[0];
    const samlRole = getAttr(roleAttr);
    const role = (['tech_admin','sales','viewer'].includes(samlRole) ? samlRole : config.defaultRole) || 'viewer';
    if (!email) return null;
    if (config.domains?.length) {
      const domain = email.split('@')[1];
      if (!config.domains.includes(domain)) return null;
    }
    return { email, name, role };
  } catch { return null; }
}
