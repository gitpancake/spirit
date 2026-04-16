// Network configuration
// Production: Ethereum Mainnet
// Development/Preview: Ethereum Sepolia

export interface NetworkConfig {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
}

export interface AppNetworkConfig {
  ethereumNetwork: NetworkConfig;
  defaultNetwork: NetworkConfig;
  supportedNetworks: NetworkConfig[];
}



const ethereumSepolia: NetworkConfig = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
};

const getEnvironment = () => {
  // Check client-side first
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
    if (hostname.includes('test.')) return 'development';
    if (hostname === 'registry.eden-academy.xyz') return 'production';
  }
  
  // Then check env vars
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv) return vercelEnv === 'production' ? 'production' : 'development';
  
  // Fallback
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

const ethereumMainnet: NetworkConfig = {
  id: 1,
  name: 'Ethereum',
  network: 'mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC || 'https://ethereum.publicnode.com'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC || 'https://ethereum.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
    },
  },
};

const getNetworkConfig = (): AppNetworkConfig => {
  const environment = getEnvironment();
  
  if (environment === 'production') {
    return {
      ethereumNetwork: ethereumMainnet,
      defaultNetwork: ethereumMainnet,
      supportedNetworks: [ethereumMainnet],
    };
  } else {
    return {
      ethereumNetwork: ethereumSepolia,
      defaultNetwork: ethereumSepolia,
      supportedNetworks: [ethereumSepolia],
    };
  }
};

export const networkConfig = getNetworkConfig();

// Utility functions
export const getEthereumRPC = () => {
  const environment = getEnvironment();
  return environment === 'production'
    ? process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC || 'https://ethereum.publicnode.com'
    : process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com';
};

// getSpiritRegistryAddress removed - contract address is now dynamic from event listener

export const getEthereumChainId = () => {
  const environment = getEnvironment();
  return environment === 'production' ? 1 : 11155111;
};

export const isProduction = () => getEnvironment() === 'production';

