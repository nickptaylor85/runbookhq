import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Guide — Watchtower',
  description: 'Complete guide to Watchtower: alerts, coverage, AI triage, automation, integrations, and MSSP features.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
