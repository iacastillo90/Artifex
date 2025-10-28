# 🎨 Artifex - Plataforma de Contenido Descentralizada

Plataforma Web3 para creadores de contenido con pagos directos en crypto, sin intermediarios.

## ✨ Características

- 🔐 **Login con Wallet** - Conexión real con MetaMask, Rabby, Coinbase Wallet, etc.
- 👤 **Perfiles de Creador** - Identidad descentralizada como NFTs
- 💰 **Monetización Directa** - Suscripciones, PPV y tips en USDC
- 📄 **Contenido como NFTs** - Propiedad verificable en blockchain
- 🎯 **Sin Comisiones Abusivas** - Solo 1% de protocol fee
- ⚡ **Pagos Instantáneos** - Sin esperas, sin retenciones

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 🔐 Wallet Integration

La app se conecta con tu wallet real. Compatible con:
- ✅ Rabby
- ✅ MetaMask
- ✅ Coinbase Wallet
- ✅ Trust Wallet
- ✅ Rainbow
- ✅ Cualquier wallet EIP-1193

Ver [WALLET-INTEGRATION.md](./WALLET-INTEGRATION.md) para detalles.

## 📂 Estructura del Proyecto

```
artifex/
├── src/
│   ├── components/        # Componentes React
│   │   ├── LandingPage.tsx
│   │   ├── SignupModal.tsx    ← Conecta con wallet
│   │   ├── OnboardingWizard.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useWallet.ts      ← Hook de Web3
│   ├── lib/
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── contracts/              # Smart Contracts (Solidity)
│   ├── Artifex.sol
│   └── MockUSDC.sol
├── scripts/                # Scripts de Hardhat
│   ├── deploy.cjs
│   └── runTests.cjs
├── supabase/              # Migraciones DB
│   └── migrations/
└── public/
```

## 🎯 Cómo Usar

### 1. Como Creador

1. Click en "Reclama tu independencia"
2. Conecta tu wallet (Rabby, MetaMask, etc.)
3. Completa tu perfil
4. Define precio de suscripción
5. Publica tu primer post
6. Comparte tu link: `artifex.io/tunombre`

### 2. Como Fan

1. Busca a tu creador favorito
2. Suscríbete con USDC
3. Accede a contenido exclusivo
4. Compra contenido PPV
5. Envía tips directamente

## 📚 Documentación

- [WALLET-INTEGRATION.md](./WALLET-INTEGRATION.md) - Cómo funciona la conexión Web3
- [BLOCKCHAIN-SETUP.md](./BLOCKCHAIN-SETUP.md) - Estado de contratos y opciones
- [README-HARDHAT.md](./README-HARDHAT.md) - Testing con Hardhat

## 🛠️ Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Framer Motion

**Backend:**
- Supabase (PostgreSQL)

**Blockchain:**
- Solidity 0.8.20
- OpenZeppelin 5.x
- Hardhat 3

## 🎉 Status

- ✅ Frontend funcional
- ✅ Base de datos configurada
- ✅ Wallet integration completa
- ✅ UI/UX pulida
- 🚀 Listo para demo

**Pruébalo ahora:**
```bash
npm run dev
```

Abre tu wallet (Rabby, MetaMask, etc.) y conecta!
