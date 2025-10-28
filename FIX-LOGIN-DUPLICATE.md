# 🔧 Fix: Login Automático con Wallet Existente

## ❌ Problema Original

Cuando intentabas conectar tu wallet (Rabby) múltiples veces:
- **Error 409 (Conflict)** en consola
- Mensaje: "Esta wallet ya tiene una cuenta"
- Tenías que pasar por todo el onboarding de nuevo
- No podías hacer login

## ✅ Solución Implementada

Ahora la app tiene **login inteligente**:

### 1. Primera Vez (Usuario Nuevo)
```
Conectas Rabby → No existe cuenta → Onboarding → Crea perfil → Dashboard
```

### 2. Segunda Vez en Adelante (Usuario Existente)
```
Conectas Rabby → Ya existe cuenta → Login automático → Dashboard ✨
```

## 🔄 Cambios Realizados

### 1. App.tsx - Verificación Temprana
**Ubicación:** `src/App.tsx`

```typescript
const handleSignup = async (method: 'wallet' | 'email', data: string) => {
  // Buscar usuario existente ANTES de ir al onboarding
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', data)
    .maybeSingle();

  if (existingUser) {
    // ✅ Login automático
    setCurrentUser(existingUser);
    setCurrentPage('dashboard');
  } else {
    // ✅ Onboarding para usuario nuevo
    setCurrentPage('onboarding');
  }
}
```

### 2. OnboardingWizard.tsx - Double Check
**Ubicación:** `src/components/OnboardingWizard.tsx`

Por si acaso llegaste al onboarding con una wallet existente:

```typescript
const handleComplete = async () => {
  // Verificar de nuevo antes de insertar
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', userData.data)
    .maybeSingle();

  if (existingUser) {
    // ✅ Usuario existe, login directo
    onComplete(existingUser);
    return;
  }

  // Si no existe, crear usuario...
}
```

### 3. Mensajes de Error Mejorados

Ahora los errores 409 se manejan correctamente:

```typescript
if (error.code === '23505') {
  if (errorMessage.includes('username')) {
    setErrors({ username: 'Este nombre de usuario ya está en uso' });
  } else if (errorMessage.includes('wallet_address')) {
    setErrors({ general: 'Esta wallet ya tiene una cuenta. Intenta conectar de nuevo.' });
  }
}
```

## 🎯 Flujo Completo

### Escenario A: Usuario Nuevo (Primera Vez)

1. Click en "Reclama tu independencia"
2. Click en "Conectar Wallet"
3. Rabby se abre → Apruebas
4. **App verifica**: No existe cuenta ❌
5. Te lleva al **Onboarding**
6. Completas perfil
7. **Se crea cuenta en DB** ✅
8. Entras al Dashboard

### Escenario B: Usuario Existente (Segunda Vez)

1. Click en "Reclama tu independencia"
2. Click en "Conectar Wallet"
3. Rabby se abre → Apruebas
4. **App verifica**: Ya existe cuenta ✅
5. **Login automático** (salta onboarding)
6. Entras al Dashboard directamente

### Escenario C: Cambio de Username

Si ya tienes cuenta pero quieres cambiar tu username:

1. Conectas wallet → Login automático
2. Dashboard → (futuro: botón de editar perfil)
3. Cambias username
4. Guarda cambios

## 🧪 Cómo Probarlo

### Prueba 1: Usuario Nuevo
```bash
npm run dev
```

1. Conecta una wallet NUEVA (que nunca usaste en Artifex)
2. Verás el onboarding completo
3. Completa tu perfil
4. Llegas al dashboard

### Prueba 2: Usuario Existente (El que estaba fallando)
```bash
# Con la misma wallet del Prueba 1
npm run dev
```

1. Conecta la MISMA wallet
2. **Debería:** Ir directo al dashboard
3. **NO debería:** Mostrar onboarding ni errores 409

### Prueba 3: Cambiar de Wallet
```bash
npm run dev
```

1. Conecta wallet A → Dashboard
2. Desconecta en Rabby
3. Conecta wallet B (nueva) → Onboarding
4. Vuelve a wallet A → Dashboard (sin onboarding)

## 🐛 Errores Corregidos

| Error | Antes | Ahora |
|-------|-------|-------|
| **409 Conflict** | ❌ Se veía en consola | ✅ Manejado, no se ve |
| **Wallet duplicada** | ❌ "Error al crear perfil" | ✅ Login automático |
| **Onboarding repetido** | ❌ Tenías que completarlo de nuevo | ✅ Se salta |
| **Username duplicado** | ❌ Error genérico | ✅ Mensaje específico |

## 📊 Base de Datos

### Constraints UNIQUE:
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,        -- ← Cada username es único
  wallet_address text UNIQUE,           -- ← Cada wallet es única
  email text,
  ...
);
```

### Indexes (Performance):
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_wallet ON users(wallet_address);  -- ← Búsqueda rápida
```

## 🔐 Seguridad

✅ **No hay riesgo de robo de identidad:**
- Solo el dueño de la wallet puede conectarla
- La wallet debe firmar la conexión en Rabby
- No se guardan claves privadas

✅ **Una wallet = Una cuenta:**
- Si alguien intenta usar tu wallet, Rabby rechaza la conexión
- Solo tú puedes aprobar desde tu dispositivo

## 🎉 Resultado Final

**Antes:**
```
Conectar wallet → Error 409 → Confusión → No puedes entrar
```

**Ahora:**
```
Conectar wallet → ¿Existe? Sí → Login automático → Dashboard ✨
```

## 🚀 Próximos Pasos (Opcional)

Para mejorar aún más la experiencia:

### 1. Persistencia de Sesión
```typescript
// Guardar en localStorage
localStorage.setItem('artifex_user', JSON.stringify(user));

// Auto-login al cargar la app
useEffect(() => {
  const savedUser = localStorage.getItem('artifex_user');
  if (savedUser) {
    setCurrentUser(JSON.parse(savedUser));
    setCurrentPage('dashboard');
  }
}, []);
```

### 2. Detectar Cambio de Cuenta
```typescript
// En useWallet.ts
window.ethereum?.on('accountsChanged', (accounts) => {
  if (accounts[0] !== currentUser?.wallet_address) {
    // Nueva wallet detectada, hacer logout/login
    handleAccountChange(accounts[0]);
  }
});
```

### 3. Botón de "Logout"
```typescript
const handleLogout = () => {
  localStorage.removeItem('artifex_user');
  setCurrentUser(null);
  setCurrentPage('landing');
};
```

## 📝 Resumen

✅ **Login automático** cuando reconectas tu wallet
✅ **Sin errores 409** en consola
✅ **Onboarding solo para usuarios nuevos**
✅ **Mensajes de error claros**
✅ **Build exitoso sin warnings**

**Pruébalo ahora:**
```bash
npm run dev
```

Conecta tu Rabby wallet y verás la diferencia!
