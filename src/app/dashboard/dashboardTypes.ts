// Dashboard shared types

export type SevKey = 'Critical'|'High'|'Medium'|'Low';
export type VerdictKey = 'TP'|'FP'|'SUS'|'Pending';
export type AutomationLevel = 0|1|2;
export interface Tool { id:string; name:string; configured:boolean; active:boolean; alertCount?:number; }
export interface Alert { id:string; title:string; severity:SevKey; source:string; device:string; time:string; verdict:VerdictKey; confidence:number; aiReasoning:string; aiActions:string[]; evidenceChain:string[]; runbookSteps:string[]; mitre?:string; incidentId?:string; }
export interface GapDevice { hostname:string; ip:string; os:string; missing:string[]; reason:string; lastSeen:string; }
export interface Vuln { id:string; cve:string; title:string; severity:SevKey; cvss:number; prevalence:number; affected:number; affectedDevices:string[]; description:string; remediation:string[]; kev:boolean; patch?:string; }
export interface IntelItem { id:string; title:string; summary:string; severity:SevKey; source:string; time:string; iocs?:string[]; mitre?:string; industrySpecific:boolean; }
export interface Incident { id:string; title:string; severity:SevKey; status:'Active'|'Contained'|'Closed'; created:string; updated:string; alertCount:number; devices:string[]; mitreTactics:string[]; timeline:{t:string;actor:'AI'|'Analyst';action:string;detail:string}[]; aiSummary:string; }


export type Theme = 'dark' | 'light';
export type Tier = 'community' | 'team' | 'business' | 'mssp';
