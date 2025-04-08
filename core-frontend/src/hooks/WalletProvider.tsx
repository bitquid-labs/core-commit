import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletContextType {
  walletAddress: string;
  isWalletConnected: boolean;
  signer: JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: '',
  isWalletConnected: false,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: () => {}
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          const currentSigner = await provider.getSigner();
          const address = await currentSigner.getAddress();
          
          setWalletAddress(address);
          setIsWalletConnected(true);
          setSigner(currentSigner);
        } else {
          resetWalletState();
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        resetWalletState();
      }
    } else {
      resetWalletState();
    }
  };

  const resetWalletState = () => {
    setWalletAddress('');
    setIsWalletConnected(false);
    setSigner(null);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const currentSigner = await provider.getSigner();
        const address = await currentSigner.getAddress();
        
        setWalletAddress(address);
        setIsWalletConnected(true);
        setSigner(currentSigner);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        resetWalletState();
      }
    }
  };

  const disconnectWallet = () => {
    resetWalletState();
  };

  useEffect(() => {
    checkWalletConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        checkWalletConnection();
      } else {
        resetWalletState();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <WalletContext.Provider value={{ 
      walletAddress, 
      isWalletConnected, 
      signer,
      connectWallet, 
      disconnectWallet 
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);