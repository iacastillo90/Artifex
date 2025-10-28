import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Heart, Users, FileText, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Post } from '../types';

interface CreatorProfileProps {
  username: string;
  onSubscribe: (creator: User) => void;
  onTip: (creator: User) => void;
}

export default function CreatorProfile({ username, onSubscribe, onTip }: CreatorProfileProps) {
  const [creator, setCreator] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    loadCreator();
  }, [username]);

  const loadCreator = async () => {
    try {
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (creatorError) throw creatorError;
      if (!creatorData) {
        setCreator(null);
        setIsLoading(false);
        return;
      }

      setCreator(creatorData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', creatorData.id)
        .order('published_at', { ascending: false });

      setPosts(postsData || []);
    } catch (error) {
      console.error('Error loading creator:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Creator no encontrado</h1>
          <p className="text-gray-400">El perfil @{username} no existe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Cover Image - Responsive height */}
      <div
        className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-br from-purple-600/20 to-cyan-500/20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 md:-mt-32 relative z-10">
        {/* Profile Header - Responsive layout */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="mx-auto sm:mx-0"
          >
            <img
              src={creator.avatar_url}
              alt={creator.username}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-purple-500 shadow-2xl shadow-purple-500/50"
            />
          </motion.div>

          <div className="flex-1 w-full">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">@{creator.username}</h1>
                <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">{creator.bio}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>234 Suscriptores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{posts.length} Posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Desde </span>
                    {new Date(creator.created_at).toLocaleDateString('es', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSubscribe(creator)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-shadow text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Suscribirse por </span>
                  <span className="sm:hidden">Suscribirse </span>
                  ${creator.subscription_price}/mes
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTip(creator)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Dar Tip
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="mt-8 sm:mt-12 border-b border-gray-800 overflow-x-auto">
          <div className="flex gap-6 sm:gap-8 min-w-max sm:min-w-0">
            {['Contenido', 'About'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.toLowerCase()
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Responsive grid */}
        <div className="mt-6 sm:mt-8 pb-12 sm:pb-16">
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                  </div>

                  {post.access_type !== 'public' && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center px-4">
                        <Lock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-purple-400" />
                        <p className="text-xs sm:text-sm font-semibold">Solo para suscriptores</p>
                      </div>
                    </div>
                  )}

                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{post.description}</p>
                    <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs text-gray-500">
                      <span>{new Date(post.published_at).toLocaleDateString('es')}</span>
                      <span>{post.views_count} views</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {posts.length === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-sm sm:text-base text-gray-400">Este creador aún no ha publicado contenido</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Sobre {creator.username}</h2>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">{creator.bio}</p>

                {Object.keys(creator.social_links).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base">Redes sociales</h3>
                    <div className="space-y-2">
                      {Object.entries(creator.social_links).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                        >
                          {platform}: {url as string}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
