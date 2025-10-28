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
      <div
        className="relative h-80 bg-gradient-to-br from-purple-600/20 to-cyan-500/20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
          >
            <img
              src={creator.avatar_url}
              alt={creator.username}
              className="w-40 h-40 rounded-full border-4 border-purple-500 shadow-2xl shadow-purple-500/50"
            />
          </motion.div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">@{creator.username}</h1>
                <p className="text-gray-300 mb-4">{creator.bio}</p>

                <div className="flex items-center gap-6 text-sm text-gray-400">
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
                    <span>Desde {new Date(creator.created_at).toLocaleDateString('es', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSubscribe(creator)}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-shadow"
                >
                  Suscribirse por ${creator.subscription_price}/mes
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTip(creator)}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-semibold flex items-center gap-2 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  Dar Tip
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-b border-gray-800">
          <div className="flex gap-8">
            {['Contenido', 'About'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-4 border-b-2 transition-colors ${
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

        <div className="mt-8 pb-12">
          {activeTab === 'content' && (
            <div className="grid md:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center">
                    {post.content_type === 'video' && <FileText className="w-12 h-12 text-gray-400" />}
                    {post.content_type === 'gallery' && <FileText className="w-12 h-12 text-gray-400" />}
                    {post.content_type === 'article' && <FileText className="w-12 h-12 text-gray-400" />}
                    {post.content_type === 'audio' && <FileText className="w-12 h-12 text-gray-400" />}
                  </div>

                  {post.access_type !== 'public' && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-12 h-12 mx-auto mb-2 text-purple-400" />
                        <p className="text-sm font-semibold">Solo para suscriptores</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{post.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{new Date(post.published_at).toLocaleDateString('es')}</span>
                      <span>{post.views_count} views</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {posts.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Este creador aún no ha publicado contenido</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-4">Sobre {creator.username}</h2>
                <p className="text-gray-300 mb-6">{creator.bio}</p>

                {Object.keys(creator.social_links).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Redes sociales</h3>
                    <div className="space-y-2">
                      {Object.entries(creator.social_links).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-cyan-400 hover:text-cyan-300 transition-colors"
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
