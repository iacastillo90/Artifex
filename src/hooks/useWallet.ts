import { useState, useEffect } from 'react';

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        detectWalletType();
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const detectWalletType = () => {
    if (!window.ethereum) return;

    if (window.ethereum.isRabby) {
      setWalletType('Rabby');
    } else if (window.ethereum.isMetaMask) {
      setWalletType('MetaMask');
    } else if (window.ethereum.isCoinbaseWallet) {
      setWalletType('Coinbase Wallet');
    } else {
      setWalletType('Web3 Wallet');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('No se detectó ninguna wallet. Por favor instala MetaMask, Rabby u otra wallet compatible.');
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const selectedAccount = accounts[0];
        setAccount(selectedAccount);
        detectWalletType();
        setIsConnecting(false);
        return selectedAccount;
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);

      if (err.code === 4001) {
        setError('Conexión rechazada. Por favor acepta la solicitud en tu wallet.');
      } else {
        setError('Error al conectar la wallet. Por favor intenta nuevamente.');
      }

      setIsConnecting(false);
      return null;
    }

    setIsConnecting(false);
    return null;
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWalletType(null);
    setError(null);
  };

  const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return true;
    } catch (err: any) {
      if (err.code === 4902) {
        setError('Esta red no está configurada en tu wallet.');
      } else {
        setError('Error al cambiar de red.');
      }
      return false;
    }
  };

  return {
    account,
    isConnecting,
    error,
    walletType,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isWalletInstalled: !!window.ethereum,
  };
}
