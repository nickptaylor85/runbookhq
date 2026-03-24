import { useState } from 'react';

export function useDashboardState() {
  const [activeTab, setActiveTab] = useState('overview');
  const [demoMode, setDemoMode] = useState(true);
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const [userTier, setUserTier] = useState('community');
  const [automation, setAutomation] = useState(1);
  const [currentTenant, setCurrentTenant] = useState('global');
  const [connectedTools, setConnectedTools] = useState<Record<string, Record<string, string>>>({});

  return {
    activeTab, setActiveTab,
    demoMode, setDemoMode,
    theme, setTheme,
    userTier, setUserTier,
    automation, setAutomation,
    currentTenant, setCurrentTenant,
    connectedTools, setConnectedTools,
  };
}
