'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { networkConfig } from '@/lib/networks';

export default function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  // If Privy app ID is not available (e.g., during static build), render children without Privy
  if (!privyAppId) {
    console.warn('⚠️ NEXT_PUBLIC_PRIVY_APP_ID not found, wallet functionality will be disabled');
    return <>{children}</>;
  }

  // Validate Privy app ID format (should start with 'cm' and be 25-30 characters)
  if (!privyAppId.match(/^cm[a-z0-9]{23,28}$/)) {
    console.error('❌ Invalid NEXT_PUBLIC_PRIVY_APP_ID format:', privyAppId);
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Customize Privy appearance 
        appearance: {
          theme: 'light',
          accentColor: '#059669',
          logo: 'https://your-logo-url.com/logo.png', // optional
        },
        // Configure supported wallets
        loginMethods: ['wallet', 'email'],
        // Configure supported wallet types - environment based
        supportedChains: networkConfig.supportedNetworks,
        // Set default chain based on environment
        defaultChain: networkConfig.defaultNetwork,
      }}
    >
      {children}
    </PrivyProvider>
  );
}