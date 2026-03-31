import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — Watchtower',
  description: 'Sign in to your Watchtower SOC dashboard.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
