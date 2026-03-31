import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Started Free — Watchtower',
  description: 'Create your free Watchtower account. Community plan free forever — no credit card required.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
