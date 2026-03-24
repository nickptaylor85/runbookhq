// Demo mode detection helper
export function isDemoMode(settings: Record<string, string>): boolean {
  return settings?.demoMode === 'true' || settings?.demoMode === undefined;
}
