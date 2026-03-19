// Watchtower Plan Definitions — single source of truth for feature gating

export type PlanId = 'community' | 'team' | 'business' | 'mssp' | 'enterprise';

export interface PlanFeature {
  id: string;
  label: string;
  plans: PlanId[];  // which plans include this feature
  upgradeText?: string;
}

export const FEATURES: PlanFeature[] = [
  // Core (all plans)
  { id: 'dashboard', label: 'Dashboard', plans: ['community', 'team', 'business', 'mssp', 'enterprise'] },
  { id: 'alerts', label: 'Unified Alerts', plans: ['community', 'team', 'business', 'mssp', 'enterprise'] },
  { id: 'coverage', label: 'Coverage View', plans: ['community', 'team', 'business', 'mssp', 'enterprise'] },

  // Team+ features
  { id: 'ai_triage', label: 'AI Auto-Triage', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'AI triage classifies every alert automatically — TP, FP, or Suspicious with evidence.' },
  { id: 'ai_copilot', label: 'AI Co-Pilot', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Click any alert for instant AI analysis, runbook generation, and related alerts.' },
  { id: 'runbooks', label: 'Custom Runbooks', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Build custom response playbooks for your specific environment.' },
  { id: 'incidents', label: 'Incident Timeline', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Track incidents from detection to resolution with full audit trail.' },
  { id: 'vulns', label: 'Vulnerability Management', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Deep Tenable integration with VPR scoring and patch prioritisation.' },
  { id: 'intel', label: 'Threat Intelligence', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Live feeds from CISA KEV, ThreatFox, URLhaus + MITRE ATT&CK heatmap.' },
  { id: 'sla', label: 'SLA Tracking', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Set response time targets and track compliance in real-time.' },
  { id: 'tv_wall', label: 'TV Wall Mode', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Fullscreen auto-rotating display for your SOC monitors.' },
  { id: 'shift_handover', label: 'Shift Handover', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'AI-generated shift handover reports from real alert data.' },
  { id: 'noise_reduction', label: 'Noise Reduction', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Auto-close false positives above 95% AI confidence. Saves 30+ hours/week.' },
  { id: 'unlimited_tools', label: 'Unlimited Integrations', plans: ['team', 'business', 'mssp', 'enterprise'], upgradeText: 'Connect all 20+ supported security tools.' },

  // Business+ features
  { id: 'compliance', label: 'Compliance Mapping', plans: ['business', 'mssp', 'enterprise'], upgradeText: 'SOC 2 and ISO 27001 control mapping with automated coverage scoring.' },
  { id: 'pdf_reports', label: 'PDF Reports', plans: ['business', 'mssp', 'enterprise'], upgradeText: 'One-click CISO-ready security reports with posture trends.' },
  { id: 'api_access', label: 'API Access', plans: ['business', 'mssp', 'enterprise'], upgradeText: 'REST API keys and outbound webhooks for automation.' },
  { id: 'rbac', label: 'RBAC + Audit Logs', plans: ['business', 'mssp', 'enterprise'], upgradeText: 'Role-based access control with full audit trail.' },
  { id: 'exec_summary', label: 'Executive Summary', plans: ['business', 'mssp', 'enterprise'], upgradeText: 'AI-generated board-ready security summaries.' },

  // MSSP+ features
  { id: 'portfolio', label: 'MSSP Portfolio', plans: ['mssp', 'enterprise'], upgradeText: 'Multi-tenant dashboard — see all clients at a glance.' },
  { id: 'client_reports', label: 'Client Reports', plans: ['mssp', 'enterprise'], upgradeText: 'Automated weekly PDF reports emailed to each client.' },
  { id: 'cross_correlation', label: 'Cross-Client Correlation', plans: ['mssp', 'enterprise'], upgradeText: 'Detect IOCs affecting multiple clients simultaneously.' },
  { id: 'white_label', label: 'White Label', plans: ['mssp', 'enterprise'], upgradeText: 'Your brand, your domain, zero Watchtower branding.' },
];

export function canAccess(userPlan: PlanId, featureId: string): boolean {
  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature) return true; // unknown feature = allow
  return feature.plans.includes(userPlan);
}

export function getUpgradeText(featureId: string): string {
  const feature = FEATURES.find(f => f.id === featureId);
  return feature?.upgradeText || 'Upgrade your plan to access this feature.';
}

export function getMinPlan(featureId: string): PlanId {
  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature) return 'community';
  if (feature.plans.includes('community')) return 'community';
  if (feature.plans.includes('team')) return 'team';
  if (feature.plans.includes('business')) return 'business';
  if (feature.plans.includes('mssp')) return 'mssp';
  return 'enterprise';
}

export const PLAN_NAMES: Record<PlanId, string> = {
  community: 'Community',
  team: 'Team',
  business: 'Business',
  mssp: 'MSSP',
  enterprise: 'Enterprise',
};

export const TOOL_LIMITS: Record<PlanId, number> = {
  community: 2,
  team: 99,
  business: 99,
  mssp: 99,
  enterprise: 99,
};
