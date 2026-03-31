import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — Watchtower',
  description: 'Release history for Watchtower — every build, fix, and feature update.',
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
