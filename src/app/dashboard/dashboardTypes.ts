export type SevKey = 'Critical' | 'High' | 'Medium' | 'Low';
export type VerdictKey = 'TP' | 'FP' | 'SUS' | 'Pending';
export type AutomationLevel = 0 | 1 | 2;
export type Theme = 'dark' | 'light';
export type Tier = 'community' | 'team' | 'business' | 'mssp';

export interface Alert {
  id: string; title: string; severity: SevKey; source: string;
  device: string; time: string; verdict: VerdictKey; confidence: number;
  aiReasoning: string; evidence?: string[]; tags?: string[];
}
export interface Vuln {
  id: string; cve: string; title: string; severity: SevKey; cvss: number;
  prevalence: number; affected: number; affectedDevices: string[];
  description: string; remediation: string; kev: boolean;
}
export interface Incident {
  id: string; title: string; severity: SevKey; status: string;
  created: string; updated: string; alertCount: number; devices: string[];
  mitreTactics: string[]; aiSummary: string;
  timeline: Array<{ t: string; actor: string; action: string; detail: string }>;
}
export interface IntelItem {
  id: string; title: string; summary: string; severity: SevKey;
  source: string; time: string; iocs?: string[]; mitre?: string;
  industrySpecific: boolean;
}
export interface Tool {
  id: string; name: string; category: string; desc: string;
}
