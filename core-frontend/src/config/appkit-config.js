import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { mainnet } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { useEffect, useState } from 'react'
const queryClient = new QueryClient()

const projectId = process.env.REACT_APP_APPKIT_PROJECT_ID || "your-project-id-here" 

const bnbTestnet = {
  id: 97,
  name: 'BNB Smart Chain Testnet',
  network: 'bnb-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB',
  },
  rpcUrls: {
    public: { http: ['https://bsc-testnet-rpc.publicnode.com'] },
    default: { http: ['https://bsc-testnet-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
}

const networks = [bnbTestnet, mainnet]

// Create metadata object
const metadata = {
  name: 'bqlabs',
  description: 'testnet',
  url: 'https://bqlabs-new-testnet.vercel.app/',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

let isAppKitInitialized = false;

function initializeAppKit() {
  if (isAppKitInitialized) return;
  
  console.log("Initializing AppKit...");
  
  try {
    const wagmiAdapter = new WagmiAdapter({
      networks,
      projectId,
      ssr: false, 
    });

    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      metadata,
      themeVariables: {
        '--w3m-accent': '#1F7D53',
        '--w3m-border-radius-master':'12px',
        '--w3m-font-size-master':'11px',
      },
      features: {
        analytics: true,
        walletConnect: true
      },
    });
    
    const style = document.createElement('style');
    style.textContent = `
      appkit-button .wallet-balance {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    isAppKitInitialized = true;
    console.log("AppKit successfully initialized");
  } catch (error) {
    console.error("Error initializing AppKit:", error);
  }
}

export default function ConnectButton() {
  useEffect(() => {
    if (!isAppKitInitialized) {
      setTimeout(() => {
        initializeAppKit();
      }, 500);
    }
  }, []);

  return (
    <div>
      <appkit-button />
    </div>
  );
}

export function AppKitProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [wagmiAdapter, setWagmiAdapter] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupProvider = async () => {
      try {
        const adapter = new WagmiAdapter({
          networks,
          projectId,
          ssr: false,
        });
        
        setWagmiAdapter(adapter);
        setIsReady(true);
      } catch (error) {
        console.error("Error setting up provider:", error);
        setIsReady(true); 
      }
    };

    setupProvider();
  }, []);

  if (!isReady) {
    return <div>Setting up wallet connections...</div>;
  }

  if (!wagmiAdapter) {
    return (
      <div>
        {children}
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
