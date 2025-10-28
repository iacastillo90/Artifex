import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, DollarSign } from 'lucide-react';
import { useEffect } from 'react';

interface RewardToastProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: 'ARTX' | 'USDC';
  reason: string;
  autoClose?: boolean;
}

export default function RewardToast({
  isOpen,
  onClose,
  amount,
  currency,
  reason,
  autoClose = true,
}: RewardToastProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-6 left-1/2 z-[9999] w-full max-w-md px-4"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/30">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-500/10 animate-pulse" />

            <div className="relative p-4 sm:p-6">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>

              <div className="flex items-start gap-4">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                    currency === 'ARTX'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-green-500 to-emerald-500'
                  } shadow-lg`}
                >
                  {currency === 'ARTX' ? (
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  ) : (
                    <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  )}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-base sm:text-lg font-bold text-white mb-1"
                  >
                    {currency === 'ARTX' ? '🎉 Recompensa Ganada!' : '💰 Saldo Recibido!'}
                  </motion.h3>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-2"
                  >
                    <span className={`text-2xl sm:text-3xl font-bold ${
                      currency === 'ARTX'
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'
                        : 'text-green-400'
                    }`}>
                      {currency === 'ARTX' ? '+' : '$'}{amount.toLocaleString()}
                    </span>
                    <span className="ml-2 text-sm sm:text-base text-gray-300 font-semibold">
                      {currency}
                    </span>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs sm:text-sm text-gray-300"
                  >
                    {reason}
                  </motion.p>
                </div>
              </div>

              {/* Progress bar */}
              {autoClose && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 origin-left"
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
