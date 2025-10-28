import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, TrendingUp, ArrowUpRight, ExternalLink, Clock } from 'lucide-react';
import type { User, Transaction } from '../types';

interface VaultProps {
  user: User;
  onBack: () => void;
}

export default function Vault({ user, onBack }: VaultProps) {
  const [balance] = useState(4823.50);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const recentTransactions: Partial<Transaction>[] = [
    { type: 'tip', from_wallet: '@Fan456', amount_usd: 5.00, status: 'confirmed', created_at: new Date(Date.now() - 600000).toISOString() },
    { type: 'subscription', from_wallet: '@Fan789', amount_usd: 9.99, status: 'confirmed', created_at: new Date(Date.now() - 3600000).toISOString() },
    { type: 'tip', from_wallet: '@Fan123', amount_usd: 25.00, status: 'confirmed', created_at: new Date(Date.now() - 7200000).toISOString() },
    { type: 'subscription', from_wallet: '@Fan456', amount_usd: 9.99, status: 'confirmed', created_at: new Date(Date.now() - 86400000).toISOString() },
  ];

  const chartData = [45, 52, 48, 65, 59, 70, 68, 75, 82, 78, 88, 95, 92, 98];

  const getTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Bóveda</h1>
          <p className="text-gray-400">Gestiona tus ganancias</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded-3xl p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400">Balance Total</span>
            </div>

            <div className="flex items-end justify-between mb-6">
              <div>
                <motion.h2
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="text-6xl font-bold mb-2"
                >
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </motion.h2>
                <p className="text-gray-400">En USDC (stablecoin = USD)</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWithdrawModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-shadow flex items-center gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                Retirar Fondos
              </motion.button>
            </div>

            <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm">Recibido en las últimas 24h: $127.50</span>
              </div>

              <div className="h-20 flex items-end gap-1">
                {chartData.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${value}%` }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-2xl p-6 mb-8"
        >
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">💡 Comparado con Patreon</h3>
                <p className="text-gray-400 mb-4">
                  Este mes ahorraste <span className="text-green-400 font-bold">$1,200</span> en comisiones
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patreon (20% fee)</p>
                    <div className="h-12 bg-red-500/20 rounded flex items-center px-3">
                      <span className="font-bold">$3,858</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Artifex (1% fee)</p>
                    <div className="h-12 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded flex items-center px-3">
                      <span className="font-bold">$4,823</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold mb-6">Historial de Transacciones</h2>

          <div className="space-y-3">
            {recentTransactions.map((tx, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-[#0A0A0A] rounded-xl border border-gray-800 hover:border-purple-500/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  tx.type === 'tip' ? 'bg-green-500/20' : 'bg-purple-500/20'
                }`}>
                  {tx.type === 'tip' ? (
                    <DollarSign className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold capitalize">{tx.type}</span>
                    <span className="text-gray-500">de</span>
                    <span className="text-cyan-400">{tx.from_wallet}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(tx.created_at!)}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      tx.status === 'confirmed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tx.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">${tx.amount_usd?.toFixed(2)}</p>
                  <button className="text-xs text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                    Ver en blockchain
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl border border-purple-500/30 p-6"
          >
            <h2 className="text-2xl font-bold mb-4">Retirar Fondos</h2>
            <p className="text-gray-400 mb-6">Balance disponible: ${balance.toFixed(2)}</p>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Cantidad a retirar</label>
              <input
                type="number"
                className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                placeholder={balance.toFixed(2)}
              />
              <button className="text-sm text-cyan-400 hover:text-cyan-300 mt-2">Retirar Todo</button>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block p-4 bg-[#0A0A0A] border border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <input type="radio" name="destination" className="mr-3" defaultChecked />
                <span>A mi Wallet (0x1234...5678)</span>
              </label>
            </div>

            <p className="text-sm text-gray-400 mb-6">Fee de red: ~$2 • Recibirás: ${(balance - 2).toFixed(2)}</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-shadow">
                Confirmar Retiro
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
