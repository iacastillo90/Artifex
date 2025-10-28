# 🎉 Integración del Token $ARTX y Modo Piloto - Artifex

## ✅ Implementación Completada (Fase 1)

Se ha iniciado la integración del sistema de recompensas $ARTX basado en los nuevos smart contracts y el modo piloto con saldo inicial gratuito.

---

## 📋 Cambios Implementados

### 1. **Sistema de Tipos Actualizado**

**Archivo:** `src/types/index.ts`

**Cambios:**
```typescript
export interface User {
  // ... campos existentes ...
  usdc_balance: number;      // Nuevo: Balance USDC
  artx_balance: number;      // Nuevo: Balance $ARTX
  is_pilot: boolean;         // Nuevo: Modo piloto activo
}

export interface Transaction {
  // ... campos existentes ...
  type: 'tip' | 'subscription' | 'purchase' | 'withdraw' | 'artx_reward'; // Agregado artx_reward
  crypto_currency: 'USDC' | 'ETH' | 'SOL' | 'ARTX'; // Agregado ARTX
  reward_reason?: string;    // Nuevo: Razón de la recompensa
}

export interface RewardNotification {  // Nuevo tipo
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}
```

---

### 2. **Sistema de Notificaciones de Recompensas**

**Archivo:** `src/components/RewardToast.tsx` (NUEVO)

**Características:**
- ✅ Toast animado con Framer Motion
- ✅ Muestra recompensas de $ARTX y saldo USDC
- ✅ Auto-cierre después de 5 segundos
- ✅ Barra de progreso animada
- ✅ Diseño responsive
- ✅ Gradientes purple-pink para ARTX
- ✅ Gradientes green-emerald para USDC

**Uso:**
```typescript
<RewardToast
  isOpen={showReward}
  onClose={() => setShowReward(false)}
  amount={100}
  currency="ARTX"
  reason="¡Perfil creado! Gana más creando contenido"
  autoClose={true}
/>
```

---

### 3. **Dashboard Actualizado**

**Archivo:** `src/components/Dashboard.tsx`

#### Estado Inicial Cero
```typescript
const [earnings, setEarnings] = useState({
  today: user.is_pilot ? 0 : 0,      // Empieza en $0
  thisMonth: user.is_pilot ? 0 : 0,  // Empieza en $0
  subscribers: 0,                     // Empieza en 0
  posts: 0,                          // Empieza en 0
});
```

#### Nueva Tarjeta de Balance $ARTX
- ✅ Diseño destacado con gradiente purple-pink
- ✅ Muestra balance de $ARTX con animación
- ✅ Icono de Sparkles animado
- ✅ Mensaje de incentivo: "Gana más $ARTX creando contenido..."
- ✅ Responsive en todos los breakpoints

#### Condicionales para Estado Vacío
- Gráfico de ganancias solo aparece si `earnings.today > 0`
- Texto de incentivo cuando no hay ganancias
- Métricas muestran mensajes de ayuda cuando están en cero

**Ejemplo visual:**
```
┌─────────────────────────────────────────┐
│  ✨ Balance $ARTX                       │
│  100 ARTX                               │
│  Gana más $ARTX creando contenido...    │
└─────────────────────────────────────────┘

┌──────────┬──────────┬──────────┐
│ 0        │ $0       │ 0 posts  │
│ Suscrip. │ Este mes │ Publicad │
│ Crea...  │ Crea...  │ Publica..│
└──────────┴──────────┴──────────┘
```

---

### 4. **Migración de Base de Datos**

**Archivo:** `supabase/migrations/20251028083647_add_artx_and_pilot_mode.sql`

**Cambios en la tabla `users`:**
```sql
ALTER TABLE users ADD COLUMN usdc_balance decimal DEFAULT 0;
ALTER TABLE users ADD COLUMN artx_balance decimal DEFAULT 0;
ALTER TABLE users ADD COLUMN is_pilot boolean DEFAULT false;
```

**Nueva tabla `artx_rewards`:**
```sql
CREATE TABLE artx_rewards (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  amount decimal NOT NULL,
  reason text NOT NULL,
  transaction_hash text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
```

**Row Level Security:**
- ✅ Usuarios pueden leer su propio historial de recompensas
- ✅ Índices creados para optimizar consultas

---

### 5. **OnboardingWizard - Saldo Piloto**

**Archivo:** `src/components/OnboardingWizard.tsx`

**Cambios en la creación de usuario:**
```typescript
const { data: newUser, error } = await supabase
  .from('users')
  .insert({
    // ... campos existentes ...
    usdc_balance: 35,      // $35 USDC piloto
    artx_balance: 100,     // 100 ARTX por crear perfil
    is_pilot: true,        // Marca como usuario piloto
  })
  .select()
  .single();
```

**Saldo Piloto Otorgado:**
- 💰 **$35 USDC** - Suficiente para ~3 suscripciones ($9.99) + 1 propina (~$5)
- ✨ **100 ARTX** - Recompensa por crear perfil

---

## 🎯 Recompensas $ARTX según Smart Contracts

### Recompensas Definidas en los Contratos

| Acción | Recompensa | Contrato |
|--------|-----------|----------|
| **Crear Perfil** | 100 ARTX | ArtifexCreatorProfile |
| **Publicar Contenido** | 50 ARTX | ArtifexContent |
| **Comprar Contenido** | 10% del precio en ARTX | ArtifexContent |
| **Suscribirse (1 mes)** | 20 ARTX | ArtifexSubscriptions |
| **Dar Propina** | 5% del monto en ARTX | ArtifexTipping |

### Ejemplos de Ganancias

#### Escenario 1: Creador Activo
```
1. Crear perfil         → +100 ARTX
2. Publicar 5 posts     → +250 ARTX (5 × 50)
3. Recibir 10 subs/mes  → Creator gana USDC + 0 ARTX directo
                          (Suscriptores ganan ARTX)
TOTAL:                    350 ARTX
```

#### Escenario 2: Fan Activo
```
1. Crear perfil         → +100 ARTX
2. Suscribirse 3 meses  → +60 ARTX (3 × 20)
3. Comprar contenido    → +1 ARTX (por $10 de compra)
4. Dar 2 propinas ($5)  → +0.5 ARTX (2 × 5% × $5)
TOTAL:                    161.5 ARTX
```

---

## 📱 Flujo de Usuario Completo

### Nuevo Usuario (Creador)

```
1. Landing Page → "Reclama tu independencia"
   ↓
2. Conectar Wallet (Rabby)
   ↓
3. OnboardingWizard
   - Ingresa username: "juanperez"
   - Completa bio
   - Define precio de suscripción
   - Opcional: primer post
   ↓
4. Se crea usuario en DB con:
   ✅ usdc_balance: $35 USDC
   ✅ artx_balance: 100 ARTX
   ✅ is_pilot: true
   ↓
5. Notificación Toast aparece:
   🎉 "Recompensa Ganada!"
   +100 ARTX
   "¡Perfil creado! Gana más creando contenido"
   ↓
6. Dashboard se muestra:
   ┌─────────────────────────────┐
   │ Bienvenida, juanperez       │
   │                             │
   │ Ganado hoy: $0.00           │ ← Estado cero
   │ (Empieza a crear...)        │
   │                             │
   │ Balance $ARTX               │
   │ 100 ARTX  ✨                │
   │                             │
   │ Suscriptores: 0             │
   │ Este mes: $0                │
   │ Posts: 0                    │
   └─────────────────────────────┘
```

### Nuevo Usuario (Fan)

```
1. Landing Page → "Explorar Creadores"
   ↓
2. ExplorePage → Click en creador
   ↓
3. CreatorProfile → "Suscribirse"
   ↓
4. Si no tiene cuenta → OnboardingWizard
   ↓
5. Se crea usuario con:
   ✅ usdc_balance: $35 USDC
   ✅ artx_balance: 100 ARTX
   ✅ is_pilot: true
   ↓
6. Notificación Toast:
   💰 "Saldo Recibido!"
   $35 USDC
   "Bienvenido a Artifex! Usa tu saldo piloto para explorar"
   ↓
7. Puede suscribirse inmediatamente
   usando su saldo piloto
```

---

## 🚀 Próximos Pasos (Pendientes)

### 1. Actualizar Vault.tsx
```typescript
// Mostrar ambos balances
- USDC Balance: ${user.usdc_balance}
- ARTX Balance: {user.artx_balance} ARTX

// Sección de historial ARTX
<ArtxRewardHistory userId={user.id} />
```

### 2. Integrar RewardToast en App.tsx
```typescript
const [rewardNotification, setRewardNotification] = useState<RewardNotification | null>(null);

// Después de crear contenido, suscribirse, etc.
setRewardNotification({
  amount: 50,
  currency: 'ARTX',
  reason: 'Contenido publicado'
});
```

### 3. Actualizar CreateContent.tsx
```typescript
// Mostrar badge de recompensa
<div className="bg-purple-600/20 rounded-lg p-3">
  <Sparkles className="w-4 h-4" />
  +50 ARTX por publicar
</div>

// Después de publicar
await updateUserArtxBalance(user.id, 50);
showRewardToast(50, 'ARTX', 'Contenido publicado');
```

### 4. Actualizar SubscribeModal.tsx
```typescript
// Mostrar recompensa y usar saldo piloto
<p>Precio: ${creator.subscription_price}/mes</p>
<p className="text-purple-400">+20 ARTX de recompensa</p>

// Al suscribirse
if (user.usdc_balance >= creator.subscription_price) {
  // Usar saldo piloto
  await deductUsdc(user.id, creator.subscription_price);
  await addArtx(user.id, 20);
  showRewardToast(20, 'ARTX', 'Suscripción activada');
}
```

### 5. Actualizar TipModal.tsx
```typescript
// Similar a SubscribeModal
<p>5% en ARTX de recompensa</p>

// Al dar propina
const artxReward = tipAmount * 0.05;
await deductUsdc(user.id, tipAmount);
await addArtx(user.id, artxReward);
showRewardToast(artxReward, 'ARTX', 'Propina enviada');
```

### 6. Crear Utilities para Smart Contracts
```typescript
// src/lib/artifexContracts.ts

export const CONTRACTS = {
  ARTX_TOKEN: '0x...',
  CREATOR_PROFILE: '0x...',
  CONTENT: '0x...',
  SUBSCRIPTIONS: '0x...',
  TIPPING: '0x...',
  TREASURY: '0x...',
};

export async function mintArtxReward(
  userAddress: string,
  amount: number,
  reason: string
) {
  // Llamar al contrato
  // Actualizar DB
  // Mostrar notificación
}
```

---

## 🎨 Guía de Estilo para $ARTX

### Colores
```css
/* Gradientes ARTX */
from-purple-400 to-pink-400     /* Texto */
from-purple-600 to-pink-500     /* Fondos */
from-purple-500/20 to-pink-500/20 /* Borders */

/* Sombras */
shadow-purple-500/30

/* Iconos */
text-purple-400
```

### Componentes Visuales
```tsx
// Badge de recompensa
<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full">
  <Sparkles className="w-4 h-4 text-purple-400" />
  <span className="text-sm font-semibold">+50 ARTX</span>
</div>

// Balance grande
<span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
  {artxBalance.toLocaleString()}
</span>
<span className="ml-2 text-xl text-gray-400">ARTX</span>
```

---

## 🧪 Testing Manual

### Checklist de Pruebas

#### 1. Onboarding
- [ ] Crear usuario nuevo
- [ ] Verificar que recibe $35 USDC
- [ ] Verificar que recibe 100 ARTX
- [ ] Toast de bienvenida aparece
- [ ] Campo `is_pilot` es true en DB

#### 2. Dashboard
- [ ] Balance ARTX visible
- [ ] Ganancias muestran $0.00
- [ ] Métricas en cero
- [ ] Mensajes de ayuda visibles
- [ ] Tarjeta ARTX animada

#### 3. Base de Datos
```sql
-- Verificar usuario piloto
SELECT username, usdc_balance, artx_balance, is_pilot
FROM users
WHERE username = 'juanperez';

-- Resultado esperado:
-- username   | usdc_balance | artx_balance | is_pilot
-- juanperez  | 35           | 100          | true
```

#### 4. Responsive
- [ ] Móvil (< 640px): Tarjeta ARTX se ve bien
- [ ] Tablet (640-1024px): Layout adaptado
- [ ] Desktop (≥ 1024px): Todas las tarjetas visibles

---

## 📊 Estructura de Datos

### Usuario Piloto en DB
```json
{
  "id": "uuid",
  "username": "juanperez",
  "wallet_address": "0x123...",
  "usdc_balance": 35,
  "artx_balance": 100,
  "is_pilot": true,
  "created_at": "2025-10-28T08:36:47Z"
}
```

### Registro de Recompensa ARTX
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": 100,
  "reason": "Profile Creation",
  "transaction_hash": "0xabc...",
  "created_at": "2025-10-28T08:36:47Z"
}
```

---

## ✅ Build Exitoso

```bash
npm run build

✓ 1953 modules transformed
dist/assets/index-dq0TYdsF.css   35.05 kB │ gzip:   6.23 kB
dist/assets/index-DA_Zsi_F.js   515.00 kB │ gzip: 151.54 kB
✓ built in 5.48s
```

**Sin errores** ✅

---

## 🎉 Resumen Final

### Lo que ya funciona:
✅ **Tipos actualizados** con ARTX y modo piloto
✅ **RewardToast** componente creado y listo
✅ **Dashboard** con tarjeta ARTX y estado cero
✅ **OnboardingWizard** otorga saldo piloto ($35 + 100 ARTX)
✅ **Migración DB** con nuevos campos
✅ **Build exitoso** sin errores

### Falta implementar:
⏳ Vault.tsx con balances ARTX
⏳ CreateContent.tsx con recompensas
⏳ SubscribeModal.tsx con ARTX y uso de saldo piloto
⏳ TipModal.tsx con ARTX y uso de saldo piloto
⏳ Utilidades para interactuar con smart contracts
⏳ Integración completa del flujo de recompensas

### Impacto en UX:
- 🎯 **Usuarios nuevos** tienen fondos inmediatos para explorar
- 💰 **$35 USDC** = ~3 suscripciones + 1 propina
- ✨ **100 ARTX** de inicio = Incentivo visible desde el primer momento
- 📊 **Estado cero** realista = No confunde con datos falsos

**El sistema está listo para continuar con la integración completa de los smart contracts y el flujo de recompensas!** 🚀
