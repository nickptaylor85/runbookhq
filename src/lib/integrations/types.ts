export interface Credentials {
  [key: string]: string;
}

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type Verdict = 'TP' | 'FP' | 'SUS' | 'Pending';

export interface NormalisedAlert {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  severity: Severity;
  device: string;
  user?: string;
  ip?: string;
  time: string;
  rawTime: number;
  mitre?: string;
  description: string;
  url?: string;
  verdict: Verdict;
  confidence: number;
  tags: string[];
  raw?: unknown;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
  details?: string;
}

export interface SyncResult {
  toolId: string;
  alerts: NormalisedAlert[];
  error?: string;
  count: number;
}

export interface IntegrationAdapter {
  id: string;
  name: string;
  credentialFields: { key: string; label: string; secret?: boolean; placeholder?: string }[];
  testConnection(creds: Credentials): Promise<ConnectionResult>;
  fetchAlerts(creds: Credentials, since?: number): Promise<NormalisedAlert[]>;
}
