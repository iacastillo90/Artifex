import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
  currentUser: User | null;
  onBalanceUpdate: () => void;
}

export default function TipModal({ isOpen, onClose, creator, currentUser, onBalanceUpdate }: TipModalProps) {
  const [amount, setAmount] = useState('10');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickAmounts = [5, 10, 25, 100];

  const handleSendTip = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión para enviar propinas');
      return;
    }

    const tipAmount = parseFloat(amount);
    if (!tipAmount || tipAmount <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const userBalance = currentUser.usdc_balance || 0;

      if (userBalance < tipAmount) {
        setError(`Saldo insuficiente. Tienes ${userBalance.toFixed(2)} USDC, necesitas ${tipAmount.toFixed(2)} USDC`);
        setIsProcessing(false);
        return;
      }

      const protocolFee = tipAmount * 0.01;
      const creatorAmount = tipAmount - protocolFee;

      const newUserBalance = userBalance - tipAmount;
      const newCreatorBalance = (creator.usdc_balance || 0) + creatorAmount;
      const artxReward = Math.floor(tipAmount * 0.05);
      const newUserArtxBalance = (currentUser.artx_balance || 0) + artxReward;

      const { error: userError } = await supabase
        .from('users')
        .update({ usdc_balance: newUserBalance, artx_balance: newUserArtxBalance })
        .eq('id', currentUser.id);

      if (userError) throw userError;

      const { error: creatorError } = await supabase
        .from('users')
        .update({ usdc_balance: newCreatorBalance })
        .eq('id', creator.id);

      if (creatorError) throw creatorError;

      await supabase.from('transactions').insert({
        type: 'tip',
        from_wallet: currentUser.wallet_address || currentUser.email || 'unknown',
        to_wallet: creator.wallet_address || creator.email || 'unknown',
        amount_usd: tipAmount,
        amount_crypto: tipAmount,
        crypto_currency: 'USDC',
        status: 'confirmed',
      });

      if (artxReward > 0) {
        await supabase.from('artx_rewards').insert({
          user_id: currentUser.id,
          amount: artxReward,
          reason: `Propina a @${creator.username}`,
          transaction_hash: '',
        });
      }

      onBalanceUpdate();
      setIsProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setAmount('10');
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error sending tip:', err);
      setError('Error al enviar la propina. Intenta de nuevo.');
      setIsProcessing(false);
    }
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

                  {currentUser && (
                    <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-400">Tu balance USDC</p>
                      <p className="text-2xl font-bold text-green-400">{(currentUser.usdc_balance || 0).toFixed(2)} USDC</p>
                    </div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-600/20 border border-red-500/50 rounded-xl p-4 mb-4 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-3">Cantidad (USDC)</label>

                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-green-400">USDC</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-green-500/30 focus:border-green-500 rounded-xl pl-24 pr-4 py-4 text-3xl font-bold focus:outline-none transition-colors"
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

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400">
                        {creator.username} recibirá {(parseFloat(amount || '0') * 0.99).toFixed(2)} USDC (99%)
                      </span>
                    </div>
                  </div>

                  {parseFloat(amount || '0') > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400">
                          Ganarás +{Math.floor(parseFloat(amount || '0') * 0.05)} $ARTX de recompensa
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSendTip}
                    disabled={isProcessing || !currentUser || !amount || parseFloat(amount) <= 0}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : !currentUser ? (
                      'Inicia sesión para enviar tips'
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        Enviar {parseFloat(amount || '0').toFixed(2)} USDC
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
