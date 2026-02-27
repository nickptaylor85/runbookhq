import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
export const metadata: Metadata = { title: "SecOpsHQ", description: "AI-powered incident response playbook generator" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="bg-[#060a14] text-white antialiased"><Providers>{children}</Providers></body></html>
  );
}
