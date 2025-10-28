import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Upload, DollarSign, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface OnboardingWizardProps {
  userData: { method: 'wallet' | 'email'; data: string };
  onComplete: (user: User) => void;
}

export default function OnboardingWizard({ userData, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar: '',
    subscriptionPrice: '9.99',
    firstPost: '¡Hola! 👋 Me mudé a Artifex para tener control total de mi contenido y mis ingresos.\n\nAquí recibiré pagos instantáneos, sin comisiones abusivas de plataformas.\n\nÚnete a mi comunidad: [artifex.io/username]',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.username.trim()) {
        newErrors.username = 'El nombre de usuario es requerido';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        newErrors.username = 'Solo letras, números, guiones y guiones bajos';
      }
      if (!formData.bio.trim()) {
        newErrors.bio = 'La bio es requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Primero verificar si ya existe un usuario con esta wallet/email
      const lookupField = userData.method === 'wallet' ? 'wallet_address' : 'email';
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq(lookupField, userData.data)
        .maybeSingle();

      if (existingUser) {
        // Usuario ya existe, hacer login automático
        console.log('User already exists, logging in:', existingUser);
        onComplete(existingUser);
        return;
      }

      // Si no existe, crear nuevo usuario
      console.log('Creating new user with data:', {
        username: formData.username.toLowerCase(),
        email: userData.method === 'email' ? userData.data : null,
        wallet_address: userData.method === 'wallet' ? userData.data : null,
      });

      const { data: newUser, error} = await supabase
        .from('users')
        .insert({
          username: formData.username.toLowerCase(),
          email: userData.method === 'email' ? userData.data : null,
          wallet_address: userData.method === 'wallet' ? userData.data : null,
          bio: formData.bio,
          subscription_price: parseFloat(formData.subscriptionPrice),
          avatar_url: formData.avatar || `https://ui-avatars.com/api/?name=${formData.username}&background=8B5CF6&color=fff`,
          usdc_balance: 35, // Saldo piloto de $35 USDC
          artx_balance: 100, // 100 ARTX por crear perfil
          is_pilot: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }

      if (!newUser) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('User created successfully:', newUser);

      if (formData.firstPost.trim()) {
        const { error: postError } = await supabase.from('posts').insert({
          creator_id: newUser.id,
          title: 'Bienvenida a Artifex',
          description: formData.firstPost,
          content_type: 'article',
          access_type: 'public',
        });

        if (postError) {
          console.error('Error creating post:', postError);
        }
      }

      console.log('Calling onComplete...');
      onComplete(newUser);
    } catch (error: any) {
      console.error('Error in handleComplete:', error);

      if (error.code === '23505') {
        // Código de PostgreSQL para violación de constraint UNIQUE
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('username')) {
          setErrors({ username: 'Este nombre de usuario ya está en uso' });
          setStep(1);
        } else if (errorMessage.includes('wallet_address')) {
          setErrors({ general: 'Esta wallet ya tiene una cuenta. Intenta conectar de nuevo.' });
        } else {
          setErrors({ general: 'Este email ya está registrado' });
        }
      } else {
        setErrors({ general: error.message || 'Error al crear el perfil. Por favor intenta nuevamente.' });
      }

      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Perfil' },
    { number: 2, title: 'Monetización' },
    { number: 3, title: 'Primer Post' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step > s.number
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500'
                        : step === s.number
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse'
                        : 'bg-gray-700'
                    }`}
                  >
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className="text-xs mt-2 text-gray-400">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step > s.number ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl border border-purple-500/20 p-8"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-2">Configura tu Perfil</h2>
              <p className="text-gray-400">Así te verán tus fans</p>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Avatar (Opcional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      formData.username.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors">
                      <Upload className="w-4 h-4" />
                      Subir imagen
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre de usuario *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">artifex.io/</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full bg-[#0A0A0A] border ${
                      errors.username ? 'border-red-500' : 'border-gray-700'
                    } focus:border-purple-500 rounded-lg pl-28 pr-4 py-3 focus:outline-none transition-colors`}
                    placeholder="tunombre"
                  />
                </div>
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                {!errors.username && formData.username && (
                  <p className="text-green-400 text-sm mt-1">✓ artifex.io/{formData.username} disponible</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio (150 caracteres) *</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 150) })}
                  className={`w-full bg-[#0A0A0A] border ${
                    errors.bio ? 'border-red-500' : 'border-gray-700'
                  } focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors resize-none`}
                  rows={3}
                  placeholder="Cuéntale al mundo sobre ti..."
                />
                {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio}</p>}
                <p className="text-gray-500 text-sm mt-1">{formData.bio.length}/150</p>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow flex items-center justify-center gap-2"
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-2">Configura tu Monetización</h2>
              <p className="text-gray-400">¿Cómo quieres que te paguen tus fans?</p>

              <div className="bg-[#0A0A0A] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Suscripción Mensual</h3>
                    <p className="text-sm text-gray-400">Los fans pagan cada mes para acceder a tu contenido</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Precio en USD</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.subscriptionPrice}
                      onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-gray-700 focus:border-purple-500 rounded-lg pl-12 pr-4 py-3 text-xl font-bold focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Recibirás pagos en USDC (stablecoin = 1 USD)</p>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold">Tips/Propinas activados</h3>
                </div>
                <p className="text-sm text-gray-400">Los fans podrán darte tips de cualquier monto además de suscribirse</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-shadow flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-2">Publica tu Primer Post</h2>
              <p className="text-gray-400">Anuncia tu llegada a Artifex (Opcional)</p>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Mensaje de bienvenida</label>
                <textarea
                  value={formData.firstPost}
                  onChange={(e) => setFormData({ ...formData, firstPost: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 focus:outline-none transition-colors resize-none"
                  rows={6}
                />
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  ✓ Tu post será público y visible para todos
                  <br />
                  ✓ Puedes editarlo o eliminarlo después
                  <br />
                  ✓ También puedes saltar este paso
                </p>
              </div>

              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                    disabled={isLoading}
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Creando perfil...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {formData.firstPost.trim() ? 'Publicar y Finalizar' : 'Finalizar'}
                      </>
                    )}
                  </button>
                </div>
                {formData.firstPost.trim() && (
                  <button
                    onClick={() => {
                      setFormData({ ...formData, firstPost: '' });
                      handleComplete();
                    }}
                    disabled={isLoading}
                    className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Saltar y finalizar sin publicar
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
