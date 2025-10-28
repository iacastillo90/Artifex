import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Plus,
  Grid3x3,
  Wallet,
  Settings,
  ExternalLink,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Bell,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Post, Transaction } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [earnings, setEarnings] = useState({
    today: 127.5,
    thisMonth: 4823,
    subscribers: 12,
    posts: 34,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([
    { type: 'tip', from: '@Fan456', amount: 5, time: '10 min' },
    { type: 'subscription', from: '@Fan789', amount: 9.99, time: '1 hora' },
    { type: 'view', post: 'Nuevo Set', views: 127, time: '2 horas' },
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'explore', label: 'Explorar', icon: Compass },
    { id: 'create', label: 'Crear Contenido', icon: Plus },
    { id: 'content', label: 'Mi Contenido', icon: Grid3x3 },
    { id: 'vault', label: 'Bóveda', icon: Wallet },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-[#1A1A1A] border-r border-gray-800 p-4 sm:p-6 flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }
          `}
        >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-12 h-12 rounded-full border-2 border-purple-500"
            />
            <div className="flex-1 overflow-hidden">
              <h3 className="font-semibold truncate">{user.username}</h3>
              <p className="text-xs text-gray-400">Creator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onNavigate(item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg shadow-purple-500/30'
                    : 'hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <a
          href={`/${user.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 border border-gray-700 hover:border-purple-500 rounded-lg transition-colors text-sm"
        >
          Ver mi Perfil Público
          <ExternalLink className="w-4 h-4" />
        </a>
      </aside>
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bienvenida, {user.username}</h1>
              <p className="text-sm sm:text-base text-gray-400">Aquí está tu resumen de hoy</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-6 h-6 text-cyan-400" />
                  <span className="text-sm text-cyan-400">Ganado hoy</span>
                </div>
                <div className="flex items-end gap-4">
                  <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold"
                  >
                    ${earnings.today.toFixed(2)}
                  </motion.h2>
                  <div className="flex items-center gap-1 text-green-400 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+15% vs. ayer</span>
                  </div>
                </div>
                <div className="mt-4 h-16 flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400">Nuevos Suscriptores</span>
                </div>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.7 }}
                  className="text-4xl font-bold mb-2"
                >
                  {earnings.subscribers}
                </motion.p>
                <p className="text-sm text-green-400">+3 vs. semana pasada</p>
              </div>

              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total este Mes</span>
                </div>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.8 }}
                  className="text-4xl font-bold mb-2"
                >
                  ${earnings.thisMonth.toLocaleString()}
                </motion.p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '96%' }}
                    transition={{ delay: 0.9, duration: 1 }}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">96% de tu meta ($5K)</p>
              </div>

              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-pink-400" />
                  </div>
                  <span className="text-sm text-gray-400">Contenido Publicado</span>
                </div>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.9 }}
                  className="text-4xl font-bold mb-2"
                >
                  {earnings.posts}
                </motion.p>
                <p className="text-sm text-gray-400">posts totales</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <button
                onClick={() => {
                  setActiveTab('create');
                  onNavigate('create');
                }}
                className="group relative px-8 py-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-semibold text-lg overflow-hidden shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Plus className="w-6 h-6" />
                  Publicar Nuevo Contenido
                </span>
              </button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Actividad Reciente
              </h3>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="flex items-center gap-3 p-4 bg-[#0A0A0A] rounded-lg border border-gray-800 hover:border-purple-500/50 transition-colors"
                  >
                    {activity.type === 'tip' && (
                      <>
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-cyan-400">{activity.from}</span> te dio un tip de{' '}
                            <span className="font-bold">${activity.amount}</span>
                          </p>
                          <p className="text-xs text-gray-500">Hace {activity.time}</p>
                        </div>
                      </>
                    )}
                    {activity.type === 'subscription' && (
                      <>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-cyan-400">{activity.from}</span> se suscribió por{' '}
                            <span className="font-bold">${activity.amount}</span>
                          </p>
                          <p className="text-xs text-gray-500">Hace {activity.time}</p>
                        </div>
                      </>
                    )}
                    {activity.type === 'view' && (
                      <>
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            Tu post <span className="font-semibold">"{activity.post}"</span> tiene{' '}
                            <span className="font-bold">{activity.views} views</span>
                          </p>
                          <p className="text-xs text-gray-500">Hace {activity.time}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
