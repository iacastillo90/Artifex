import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Link2,
  Instagram,
  Twitter,
  Globe,
  Save,
  Camera,
  DollarSign,
  Bell,
  Shield,
  Wallet,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface SettingsPageProps {
  user: User;
  onUpdate: () => void;
  onLogout: () => void;
}

export default function SettingsPage({ user, onUpdate, onLogout }: SettingsPageProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio,
    subscription_price: user.subscription_price,
    avatar_url: user.avatar_url,
    social_links: user.social_links || {},
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'pricing' | 'wallet' | 'notifications'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          bio: formData.bio,
          subscription_price: formData.subscription_price,
          avatar_url: formData.avatar_url,
          social_links: formData.social_links,
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaveSuccess(true);
      onUpdate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, avatar_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ajustes</h1>
        <p className="text-sm sm:text-base text-gray-400">Configura tu perfil y preferencias</p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {[
          { id: 'profile', label: 'Perfil', icon: UserIcon },
          { id: 'pricing', label: 'Precios', icon: DollarSign },
          { id: 'wallet', label: 'Wallet', icon: Wallet },
          { id: 'notifications', label: 'Notificaciones', icon: Bell },
        ].map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                  : 'bg-[#1A1A1A] hover:bg-[#2A2A2A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          );
        })}
      </motion.div>

      {activeSection === 'profile' && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <img
                src={formData.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-purple-500 object-cover"
              />
              <button
                onClick={handleAvatarClick}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold mb-1">{user.username}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
              {user.is_pilot && (
                <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400">Modo Piloto</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <UserIcon className="w-4 h-4 text-purple-400" />
                Nombre de usuario
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="tu_usuario"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail className="w-4 h-4 text-purple-400" />
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors resize-none"
                placeholder="Cuéntanos sobre ti..."
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="w-4 h-4 text-purple-400" />
                Enlaces sociales
              </label>

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.social_links.instagram || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: { ...formData.social_links, instagram: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="https://instagram.com/tu_usuario"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.social_links.twitter || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: { ...formData.social_links, twitter: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="https://twitter.com/tu_usuario"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.social_links.website || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: { ...formData.social_links, website: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="https://tusitioweb.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'pricing' && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <h3 className="text-xl font-bold mb-2">Precio de Suscripción</h3>
            <p className="text-sm text-gray-400">Define cuánto cobrarás por tu suscripción mensual</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Precio mensual (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.subscription_price}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-3 bg-[#0A0A0A] border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="9.99"
                />
              </div>
            </div>

            <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Vista previa
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Los fans verán:</span>
                <span className="text-2xl font-bold">${formData.subscription_price.toFixed(2)}/mes</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Artifex cobra una comisión del 10% por transacción</p>
              <p>• Recibirás ${((formData.subscription_price * 0.9).toFixed(2))} por suscripción</p>
              <p>• Los pagos se procesan en USDC (stablecoin)</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'wallet' && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <h3 className="text-xl font-bold mb-2">Información de Wallet</h3>
            <p className="text-sm text-gray-400">Tu wallet conectada y balances</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0A0A0A] border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Dirección de Wallet</span>
                {user.wallet_address ? (
                  <Shield className="w-5 h-5 text-green-400" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-600" />
                )}
              </div>
              {user.wallet_address ? (
                <div className="font-mono text-sm bg-purple-600/10 border border-purple-500/30 rounded-lg p-3 break-all">
                  {user.wallet_address}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">No hay wallet conectada</p>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-semibold hover:scale-105 transition-transform">
                    Conectar Wallet
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Balance ARTX</span>
                </div>
                <p className="text-2xl font-bold">{(user.artx_balance || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Token de recompensas</p>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-cyan-600/20 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Balance USDC</span>
                </div>
                <p className="text-2xl font-bold">${(user.usdc_balance || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Disponible para retirar</p>
              </div>
            </div>

            {user.is_pilot && (
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-purple-400">Modo Piloto Activo</span>
                </div>
                <p className="text-sm text-gray-400">
                  Tienes acceso a créditos de prueba para explorar la plataforma sin usar fondos reales.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeSection === 'notifications' && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <h3 className="text-xl font-bold mb-2">Preferencias de Notificaciones</h3>
            <p className="text-sm text-gray-400">Controla qué notificaciones quieres recibir</p>
          </div>

          <div className="space-y-4">
            {[
              { id: 'tips', label: 'Nuevas propinas', description: 'Cuando alguien te da un tip' },
              { id: 'subs', label: 'Nuevas suscripciones', description: 'Cuando alguien se suscribe' },
              { id: 'comments', label: 'Comentarios', description: 'En tu contenido' },
              { id: 'artx', label: 'Recompensas ARTX', description: 'Cuando ganas tokens ARTX' },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-gray-700 rounded-lg hover:border-purple-500/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
            saveSuccess
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105'
          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar Cambios'}
        </button>

        <button
          onClick={onLogout}
          className="sm:w-auto px-6 py-4 bg-red-600/20 border border-red-500/50 rounded-xl font-semibold hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </motion.div>
    </motion.div>
  );
}
