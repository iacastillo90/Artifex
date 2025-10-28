import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface ExplorePageProps {
  onBack: () => void;
  onCreatorClick?: (username: string) => void;
}

export default function ExplorePage({ onBack, onCreatorClick }: ExplorePageProps) {
  const [creators, setCreators] = useState<User[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = creators.filter(
        (creator) =>
          creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          creator.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCreators(filtered);
    } else {
      setFilteredCreators(creators);
    }
  }, [searchQuery, creators]);

  const loadCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCreators(data || []);
      setFilteredCreators(data || []);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatorClick = (username: string) => {
    if (onCreatorClick) {
      onCreatorClick(username);
    } else {
      // Fallback: abrir en nueva pestaña
      window.open(`/${username}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Explorar Creadores
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">
                Descubre y apoya a tus creadores favoritos
              </p>
            </div>
            <button
              onClick={onBack}
              className="hidden sm:block px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 sm:mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o bio..."
              className="w-full bg-[#1A1A1A] border border-gray-800 focus:border-purple-500 rounded-xl pl-12 pr-4 py-3 sm:py-4 focus:outline-none transition-colors text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Creadores</p>
                <p className="text-xl sm:text-2xl font-bold">{creators.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Activos</p>
                <p className="text-xl sm:text-2xl font-bold">{creators.length}</p>
              </div>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-500/30 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Nuevos hoy</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {creators.filter((c) => {
                    const createdAt = new Date(c.created_at);
                    const today = new Date();
                    return createdAt.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
            />
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No se encontraron creadores</h3>
            <p className="text-sm sm:text-base text-gray-400">
              {searchQuery ? 'Intenta con otra búsqueda' : 'Sé el primero en unirte'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCreatorClick(creator.username)}
                className="group bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-gray-800 hover:border-purple-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:transform hover:scale-105"
              >
                {/* Cover Image */}
                <div className="h-24 sm:h-32 bg-gradient-to-r from-purple-600 to-cyan-500 relative">
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Avatar */}
                <div className="px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#1A1A1A] overflow-hidden">
                    <img
                      src={creator.avatar_url}
                      alt={creator.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 mt-3">
                  <h3 className="font-bold text-base sm:text-lg mb-1 group-hover:text-purple-400 transition-colors truncate">
                    @{creator.username}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem] sm:min-h-[3rem]">
                    {creator.bio || 'Sin bio disponible'}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Suscripción</p>
                      <p className="text-base sm:text-lg font-bold text-green-400">
                        ${creator.subscription_price}/mes
                      </p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Back Button */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={onBack}
          className="w-14 h-14 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
