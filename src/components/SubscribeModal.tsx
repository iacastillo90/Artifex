import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
  currentUser: User | null;
  onBalanceUpdate: () => void;
}

export default function SubscribeModal({ isOpen, onClose, creator, currentUser, onBalanceUpdate }: SubscribeModalProps) {
  const [activeTab, setActiveTab] = useState<'crypto' | 'card'>('crypto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const handleCryptoSubscribe = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión para suscribirte');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const subscriptionPrice = creator.subscription_price;
      const userBalance = currentUser.usdc_balance || 0;

      if (userBalance < subscriptionPrice) {
        setError(`Saldo insuficiente. Tienes ${userBalance.toFixed(2)} USDC, necesitas ${subscriptionPrice.toFixed(2)} USDC`);
        setIsProcessing(false);
        return;
      }

      const protocolFee = subscriptionPrice * 0.01;
      const creatorAmount = subscriptionPrice - protocolFee;

      const newUserBalance = userBalance - subscriptionPrice;
      const newCreatorBalance = (creator.usdc_balance || 0) + creatorAmount;
      const artxReward = 20;
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

      await supabase.from('subscriptions').insert({
        creator_id: creator.id,
        subscriber_wallet: currentUser.wallet_address || currentUser.email || 'unknown',
        subscriber_email: currentUser.email,
        status: 'active',
      });

      await supabase.from('transactions').insert({
        type: 'subscription',
        from_wallet: currentUser.wallet_address || currentUser.email || 'unknown',
        to_wallet: creator.wallet_address || creator.email || 'unknown',
        amount_usd: subscriptionPrice,
        amount_crypto: subscriptionPrice,
        crypto_currency: 'USDC',
        status: 'confirmed',
      });

      await supabase.from('artx_rewards').insert({
        user_id: currentUser.id,
        amount: artxReward,
        reason: `Suscripción a @${creator.username}`,
        transaction_hash: '',
      });

      onBalanceUpdate();
      setIsProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error processing subscription:', err);
      setError('Error al procesar la suscripción. Intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  const handleCardSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    await supabase.from('subscriptions').insert({
      creator_id: creator.id,
      subscriber_wallet: 'custodial_wallet_' + Date.now(),
      subscriber_email: 'user@example.com',
      status: 'active',
    });

    setIsProcessing(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      onClose();
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
            <div className="w-full max-w-lg bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-xl overflow-hidden">
              {showSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Check className="w-12 h-12" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3">¡Suscrito!</h2>
                  <p className="text-gray-400">Ahora tienes acceso a todo el contenido de @{creator.username}</p>
                </motion.div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Suscribirse a @{creator.username}</h2>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
                    <p className="text-4xl font-bold mb-2">{creator.subscription_price.toFixed(2)} USDC/mes</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Acceso a todo el contenido exclusivo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Cancela cuando quieras</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Tu pago va 99% al creador</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-purple-400" />
                        <span>Ganas +20 $ARTX de recompensa</span>
                      </div>
                    </div>
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

                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setActiveTab('crypto')}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        activeTab === 'crypto'
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <WalletIcon className="w-5 h-5 inline-block mr-2" />
                      Cripto
                    </button>
                    <button
                      onClick={() => setActiveTab('card')}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        activeTab === 'card'
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 inline-block mr-2" />
                      Tarjeta
                    </button>
                  </div>

                  {activeTab === 'crypto' && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-400 mb-4">
                        <p>Selecciona un token para pagar:</p>
                      </div>

                      <div className="flex gap-3">
                        {['USDC', 'ETH', 'SOL'].map((token) => (
                          <button
                            key={token}
                            className="flex-1 p-4 bg-[#0A0A0A] border border-gray-700 hover:border-purple-500 rounded-xl transition-all"
                          >
                            <p className="font-semibold">{token}</p>
                            <p className="text-xs text-gray-500">
                              {token === 'USDC' ? 'Recomendado' : 'Disponible'}
                            </p>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleCryptoSubscribe}
                        disabled={isProcessing || !currentUser}
                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto"
                          />
                        ) : !currentUser ? (
                          'Inicia sesión para suscribirte'
                        ) : (
                          `Pagar ${creator.subscription_price.toFixed(2)} USDC`
                        )}
                      </button>
                    </div>
                  )}

                  {activeTab === 'card' && (
                    <form onSubmit={handleCardSubscribe} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Número de tarjeta</label>
                        <input
                          type="text"
                          value={cardData.number}
                          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                          className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                          placeholder="4242 4242 4242 4242"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Expiración</label>
                          <input
                            type="text"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                            placeholder="MM/YY"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">CVV</label>
                          <input
                            type="text"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Nombre en la tarjeta</label>
                        <input
                          type="text"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                          placeholder="Tu Nombre"
                          required
                        />
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        Se comprará USDC automáticamente con tu tarjeta
                      </p>

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto"
                          />
                        ) : (
                          `Pagar $${creator.subscription_price}`
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
