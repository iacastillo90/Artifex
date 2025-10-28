import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Image, FileText, Mic, Upload, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface CreateContentProps {
  user: User;
  onBack: () => void;
  onComplete: () => void;
}

export default function CreateContent({ user, onBack, onComplete }: CreateContentProps) {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<'video' | 'gallery' | 'article' | 'audio' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accessType: 'subscribers' as 'public' | 'subscribers' | 'pay_per_view',
    price: '',
    file: null as File | null,
  });

  const contentTypes = [
    { id: 'video', label: 'Video', icon: Video, color: 'from-purple-600 to-purple-700' },
    { id: 'gallery', label: 'Galería de Fotos', icon: Image, color: 'from-pink-600 to-pink-700' },
    { id: 'article', label: 'Artículo/Texto', icon: FileText, color: 'from-cyan-600 to-cyan-700' },
    { id: 'audio', label: 'Audio', icon: Mic, color: 'from-green-600 to-green-700' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setTimeout(() => setStep(3), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const { error } = await supabase.from('posts').insert({
        creator_id: user.id,
        title: formData.title,
        description: formData.description,
        content_type: contentType,
        access_type: formData.accessType,
        price: formData.accessType === 'pay_per_view' ? parseFloat(formData.price) : null,
        ipfs_hash: 'QmExample' + Date.now(),
      });

      if (error) throw error;

      setTimeout(() => {
        setIsPublishing(false);
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Error publishing:', error);
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Publica Nuevo Contenido</h1>
          <div className="flex items-center gap-4 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  step >= s ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold mb-6">Selecciona el tipo de contenido</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setContentType(type.id as any);
                      setStep(2);
                    }}
                    className={`p-8 bg-gradient-to-br ${type.color} rounded-xl border border-white/10 hover:border-white/30 transition-all text-left`}
                  >
                    <Icon className="w-12 h-12 mb-4" />
                    <h3 className="text-xl font-bold">{type.label}</h3>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && contentType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold mb-6">Sube tu {contentTypes.find(t => t.id === contentType)?.label}</h2>

            <label className="block">
              <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-500 rounded-xl p-12 text-center cursor-pointer transition-all bg-gradient-to-br from-purple-500/5 to-cyan-500/5">
                <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-lg mb-2">Arrastra tus archivos aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-400">Máximo 500MB</p>
                <input
                  type="file"
                  className="hidden"
                  accept={contentType === 'video' ? 'video/*' : contentType === 'gallery' ? 'image/*' : contentType === 'audio' ? 'audio/*' : '*'}
                  onChange={handleFileSelect}
                />
              </div>
            </label>

            {isUploading && (
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  <span className="text-lg font-semibold">Subiendo a IPFS...</span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-gradient-to-r from-purple-600 to-cyan-500"
                  />
                </div>

                <p className="text-sm text-gray-400 mt-2">{uploadProgress}%</p>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cambiar tipo
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-400" />
              <p className="text-green-400 font-semibold">¡Subido! Tu contenido es permanente</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors"
                placeholder="Ej: Nuevo Set Exclusivo"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors resize-none"
                rows={4}
                placeholder="Cuéntale a tus fans sobre este contenido..."
              />
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!formData.title}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Siguiente
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold mb-6">¿Quién puede ver este contenido?</h2>

            <div className="space-y-4">
              {[
                {
                  id: 'public',
                  label: 'Público',
                  description: 'Todos pueden verlo gratis',
                  icon: '🌍',
                },
                {
                  id: 'subscribers',
                  label: 'Solo Suscriptores',
                  description: `Solo tus fans que pagan $${user.subscription_price}/mes`,
                  icon: '🔒',
                  recommended: true,
                },
                {
                  id: 'pay_per_view',
                  label: 'Pago Único',
                  description: 'Cualquiera puede comprarlo por un precio',
                  icon: '🎟️',
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`block p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.accessType === option.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-[#1A1A1A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessType"
                    value={option.id}
                    checked={formData.accessType === option.id}
                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value as any })}
                    className="hidden"
                  />
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{option.label}</h3>
                        {option.recommended && (
                          <span className="text-xs bg-gradient-to-r from-purple-600 to-cyan-500 px-2 py-1 rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{option.description}</p>

                      {option.id === 'pay_per_view' && formData.accessType === 'pay_per_view' && (
                        <div className="mt-4">
                          <label className="block text-sm text-gray-400 mb-2">Precio (USD)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg pl-8 pr-4 py-2 focus:outline-none transition-colors"
                              placeholder="4.99"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || (formData.accessType === 'pay_per_view' && !formData.price)}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Mint & Publish
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
