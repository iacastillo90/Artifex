import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const {
    account,
    chainId,
    usdcBalance,
    artxBalance,
    walletType,
    isConnecting,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getChainName = (id: number | null) => {
    if (!id) return '';
    if (id === 31337) return 'Localhost';
    if (id === 84532) return 'Base Sepolia';
    return `Chain ${id}`;
  };

  const getExplorerUrl = (address: string, chainId: number | null) => {
    if (!chainId) return '';
    if (chainId === 84532) return `https://sepolia.basescan.org/address/${address}`;
    return '';
  };

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg font-semibold transition-all flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="hidden sm:inline">{account.slice(0, 6)}...{account.slice(-4)}</span>
        <span className="sm:hidden">{account.slice(0, 4)}...</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 bg-[#1A1A1A] border border-purple-500/30 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Conectado con {walletType}</span>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                    {getChainName(chainId)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 text-sm bg-black/30 px-3 py-2 rounded-lg">
                    {account.slice(0, 16)}...{account.slice(-4)}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title="Copiar dirección"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {getExplorerUrl(account, chainId) && (
                    <a
                      href={getExplorerUrl(account, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Ver en explorador"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm text-gray-400">Balance USDC</span>
                    <span className="text-lg font-bold text-green-400">
                      {parseFloat(usdcBalance).toFixed(2)} USDC
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                    <span className="text-sm text-gray-400">Balance ARTX</span>
                    <span className="text-lg font-bold text-purple-400">
                      {parseFloat(artxBalance).toFixed(2)} ARTX
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  disconnectWallet();
                  setShowMenu(false);
                }}
                className="w-full p-4 flex items-center gap-2 hover:bg-red-500/10 text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Desconectar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
