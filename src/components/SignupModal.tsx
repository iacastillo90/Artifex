import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Mail, HelpCircle } from 'lucide-react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: (method: 'wallet' | 'email', data: string) => void;
}

export default function SignupModal({ isOpen, onClose, onSignup }: SignupModalProps) {
  const [email, setEmail] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      onSignup('wallet', '0x1234...5678');
    }, 1500);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      onSignup('email', email);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Entra a Artifex</h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-400">Conectando de forma segura...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleWalletConnect}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl p-6 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-lg">Conectar Wallet</h3>
                          <p className="text-sm text-purple-200">MetaMask, Rainbow, WalletConnect</p>
                        </div>
                      </div>
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#1A1A1A] text-gray-400">o</span>
                      </div>
                    </div>

                    <form onSubmit={handleEmailSubmit}>
                      <div className="bg-[#0A0A0A] border border-purple-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                            <Mail className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div className="text-left flex-1">
                            <h3 className="font-semibold text-lg">Continuar con Email</h3>
                            <p className="text-sm text-gray-400">Sin wallet necesaria</p>
                          </div>
                        </div>

                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full bg-[#1A1A1A] border border-gray-700 focus:border-cyan-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                          required
                        />

                        <button
                          type="submit"
                          className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg py-3 font-semibold transition-all"
                        >
                          Continuar
                        </button>

                        <p className="text-xs text-gray-500 mt-3 text-center">
                          Se creará una wallet segura para ti automáticamente
                        </p>
                      </div>
                    </form>
                  </div>
                )}

                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="w-full mt-6 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  ¿Qué es una wallet?
                </button>

                <AnimatePresence>
                  {showHelp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 bg-[#0A0A0A] border border-purple-500/20 rounded-lg p-4 overflow-hidden"
                    >
                      <p className="text-sm text-gray-300">
                        Una wallet (cartera digital) es como tu cuenta bancaria en blockchain.
                        Guarda tus criptomonedas de forma segura y te permite recibir pagos
                        instantáneamente.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
