import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
}

export default function TipModal({ isOpen, onClose, creator }: TipModalProps) {
  const [amount, setAmount] = useState('10');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const quickAmounts = [5, 10, 25, 100];

  const handleSendTip = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    await supabase.from('transactions').insert({
      type: 'tip',
      from_wallet: '0x1234...5678',
      to_wallet: creator.wallet_address || 'creator_wallet',
      amount_usd: parseFloat(amount),
      amount_crypto: parseFloat(amount),
      crypto_currency: 'USDC',
      status: 'confirmed',
    });

    setIsProcessing(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      onClose();
      setAmount('10');
      setMessage('');
    }, 3000);
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
              {showSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="p-12 text-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-6xl mb-4"
                  >
                    ❤️
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3">¡Tip enviado!</h2>
                  <p className="text-gray-400">@{creator.username} recibirá tu apoyo</p>
                </motion.div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Dale un tip a @{creator.username}</h2>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-3">Cantidad</label>

                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-400">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-purple-500/30 focus:border-purple-500 rounded-xl pl-14 pr-4 py-4 text-3xl font-bold focus:outline-none transition-colors"
                        placeholder="10"
                        min="1"
                        step="1"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => setAmount(quickAmount.toString())}
                          className={`py-2 rounded-lg font-semibold transition-all ${
                            amount === quickAmount.toString()
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          ${quickAmount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">
                      Mensaje (Opcional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors resize-none"
                      rows={3}
                      placeholder="¡Sigue creando contenido increíble!"
                    />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400">
                        {creator.username} recibirá ${(parseFloat(amount || '0') * 0.99).toFixed(2)} (99%)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSendTip}
                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        Enviar Tip
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
