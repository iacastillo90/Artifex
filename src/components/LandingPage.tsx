import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [income, setIncome] = useState<string>('5000');

  const calculateSavings = () => {
    const amount = parseFloat(income) || 0;
    const patreonFee = amount * 0.20;
    const artifexFee = amount * 0.01;
    const artifexEarnings = amount - artifexFee;
    const yearlyMoneySavings = (patreonFee - artifexFee) * 12;

    return {
      patreonLoss: patreonFee,
      artifexFee,
      artifexEarnings,
      yearlySavings: yearlyMoneySavings
    };
  };

  const savings = calculateSavings();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-cyan-500/20"></div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center max-w-5xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-block mb-6"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/30 to-cyan-500/30 border border-purple-500/50 text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Web3 Creator Economy
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Recupera el{' '}
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                  20% de tus ingresos
                </span>
                .<br />Al instante.
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
                La plataforma de creadores donde eres dueño de tu contenido, tu comunidad y tu dinero. Sin censura financiera.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-lg overflow-hidden shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-shadow"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Reclama tu independencia
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>

                <button
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  Ver cómo funciona
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </section>

          <section id="calculator" className="min-h-screen flex items-center justify-center px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="w-full max-w-4xl"
            >
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-3xl p-8 md:p-12 border border-purple-500/20">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                  Calculadora de Comisiones
                </h2>

                <div className="mb-8">
                  <label className="block text-sm text-gray-400 mb-3">
                    ¿Cuánto ganas al mes en Patreon/OnlyFans/YouTube?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                    <input
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-purple-500/30 rounded-xl px-12 py-4 text-2xl font-bold focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 text-sm">Pierdes en comisiones (20%)</span>
                    </div>
                    <p className="text-3xl font-bold text-red-400">
                      ${savings.patreonLoss.toFixed(2)}/mes
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-400 text-sm">En Artifex ganarías (1% fee = ${savings.artifexFee.toFixed(2)})</span>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      ${savings.artifexEarnings.toFixed(2)}/mes
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 text-sm">Ahorrarías al año</span>
                    </div>
                    <p className="text-3xl font-bold text-green-400">
                      ${savings.yearlySavings.toFixed(0)}
                    </p>
                  </motion.div>
                </div>

                <div className="mt-8 h-32">
                  <div className="flex items-end justify-center gap-8 h-full">
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, (savings.patreonLoss / parseFloat(income || '1')) * 100 * 3)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="w-full bg-red-500 rounded-t-lg"
                      ></motion.div>
                      <span className="text-xs text-gray-400">Patreon (20%)</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, (savings.artifexFee / parseFloat(income || '1')) * 100 * 3)}%` }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="w-full bg-gradient-to-t from-purple-600 to-cyan-400 rounded-t-lg"
                      ></motion.div>
                      <span className="text-xs text-gray-400">Artifex (1%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="min-h-screen flex items-center justify-center px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="w-full max-w-6xl"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                Lo que dicen los creadores
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Luna Martínez",
                    role: "Artista Digital",
                    avatar: "LM",
                    quote: "Recibí mi primer pago en 30 segundos, no en 30 días. Cambió mi vida.",
                  },
                  {
                    name: "Carlos Vega",
                    role: "Podcaster",
                    avatar: "CV",
                    quote: "Ya no vivo con miedo a ser desmonetizado. Mi contenido, mis reglas.",
                  },
                  {
                    name: "Sofia Chen",
                    role: "Educadora",
                    avatar: "SC",
                    quote: "Ahorro $800/mes en comisiones. Eso es más de lo que ganaba antes.",
                  },
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        <p className="text-sm text-gray-400">{testimonial.role}</p>
                      </div>
                      <Shield className="w-5 h-5 text-cyan-400 ml-auto" />
                    </div>
                    <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="min-h-[50vh] flex items-center justify-center px-4 py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Únete a los creadores que recuperaron<br />su independencia
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-shadow"
              >
                Empezar gratis
              </motion.button>
              <p className="text-gray-400 text-sm mt-4">Sin tarjeta de crédito requerida</p>
            </motion.div>
          </section>
        </motion.div>
      </div>

      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Artifex
              </h3>
              <p className="text-gray-400 text-sm">
                El motor de monetización soberano para creadores.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Cómo funciona</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Casos de uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Recursos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>Artifex es un protocolo descentralizado. Los creadores son responsables de su contenido.</p>
            <p className="mt-2">No somos un exchange ni proveedor de servicios financieros regulados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
