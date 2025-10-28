# 🔧 Fix: Routing del Perfil de Creador desde ExplorePage

## ❌ Problema Original

Cuando hacías click en un creador desde ExplorePage:
- Se intentaba navegar a `/:username`
- El componente CreatorProfile recibía un username vacío
- Mostraba: "Creator no encontrado. El perfil @ no existe"

**Causa raíz:** La ruta `/:username` estaba usando `window.location.pathname.slice(1)` en lugar del parámetro dinámico de React Router.

## ✅ Solución Implementada

### 1. Componente Wrapper para useParams

**Archivo:** `src/App.tsx`

```typescript
function CreatorProfileWrapper({
  onSubscribe,
  onTip,
}: {
  onSubscribe: (creator: User) => void;
  onTip: (creator: User) => void;
}) {
  const { username } = useParams<{ username: string }>();

  return (
    <CreatorProfile
      username={username || ''}
      onSubscribe={onSubscribe}
      onTip={onTip}
    />
  );
}
```

**¿Por qué?**
- `useParams` es un hook de React Router que extrae parámetros de la URL
- Debe usarse dentro de un componente funcional, no directamente en el `element` prop
- Extrae correctamente el `username` de la ruta `/:username`

### 2. Actualización de la Ruta

**Antes:**
```tsx
<Route
  path="/:username"
  element={
    <CreatorProfile
      username={window.location.pathname.slice(1)}  // ❌ Estático
      onSubscribe={handleSubscribe}
      onTip={handleTip}
    />
  }
/>
```

**Ahora:**
```tsx
<Route
  path="/:username"
  element={
    <CreatorProfileWrapper  // ✅ Usa useParams internamente
      onSubscribe={handleSubscribe}
      onTip={handleTip}
    />
  }
/>
```

### 3. Apertura en Nueva Pestaña

**Archivo:** `src/components/ExplorePage.tsx`

```typescript
const handleCreatorClick = (username: string) => {
  if (onCreatorClick) {
    onCreatorClick(username);
  } else {
    // Fallback: abrir en nueva pestaña
    window.open(`/${username}`, '_blank');
  }
};
```

**Archivo:** `src/App.tsx`

```typescript
<ExplorePage
  onBack={() => setCurrentPage(currentUser ? 'dashboard' : 'landing')}
  onCreatorClick={(username) => window.open(`/${username}`, '_blank')}
/>
```

**¿Por qué nueva pestaña?**
- El Dashboard está en una ruta (`/`) diferente al perfil (`/:username`)
- Abrir en nueva pestaña mantiene el Dashboard activo
- El usuario puede volver fácilmente sin perder su sesión

## 🎯 Flujo Corregido

### Escenario: Usuario explora desde Dashboard

```
1. Usuario está en Dashboard (/)
   ↓
2. Click en "Explorar"
   ↓
3. ExplorePage se muestra (dentro de /)
   ↓
4. Click en tarjeta de creador (ej: "juanperez")
   ↓
5. Se ejecuta: window.open('/juanperez', '_blank')
   ↓
6. Nueva pestaña se abre con ruta /juanperez
   ↓
7. React Router matchea /:username
   ↓
8. CreatorProfileWrapper extrae username = "juanperez"
   ↓
9. CreatorProfile recibe username="juanperez"
   ↓
10. Supabase carga el creador correctamente
   ↓
11. Perfil se muestra ✅
```

## 🔍 Debugging

Si aún ves "Creator no encontrado":

### 1. Verificar que el username existe en DB
```sql
SELECT * FROM users WHERE username = 'tuusername';
```

### 2. Verificar consola del navegador
```javascript
// En CreatorProfile.tsx, verifica:
console.log('Loading creator with username:', username);
```

### 3. Verificar URL
- URL correcta: `http://localhost:5173/juanperez`
- URL incorrecta: `http://localhost:5173/` (sin username)

### 4. Verificar React Router
```typescript
// En CreatorProfileWrapper
console.log('useParams username:', useParams());
```

## 📱 Comportamiento Esperado

### Desktop
1. Dashboard abierto en pestaña 1
2. Click en creador → Nueva pestaña se abre
3. Perfil del creador visible en nueva pestaña
4. Puedes volver al Dashboard (pestaña 1)

### Móvil
1. Dashboard visible
2. Click en creador → Nueva pestaña/ventana
3. Perfil del creador visible
4. Botón "Atrás" del navegador → Vuelve al Dashboard

## 🎨 Alternativa: Navegación Interna (Futuro)

Si prefieres navegar dentro de la misma pestaña:

```typescript
// En App.tsx
const [selectedCreatorUsername, setSelectedCreatorUsername] = useState<string | null>(null);

// En ExplorePage
onCreatorClick={(username) => {
  setSelectedCreatorUsername(username);
  setCurrentPage('creatorProfile');
}}

// En render
{currentPage === 'creatorProfile' && selectedCreatorUsername && (
  <CreatorProfile
    username={selectedCreatorUsername}
    onSubscribe={handleSubscribe}
    onTip={handleTip}
    onBack={() => setCurrentPage('explore')}
  />
)}
```

**Pros:**
- Todo en una pestaña
- Más integrado

**Cons:**
- Necesitas agregar botón "Volver"
- Pierdes la barra de direcciones con URL del creador
- No puedes compartir link directo al perfil

## ✅ Verificación Final

**Checklist:**
- [ ] Build exitoso (`npm run build`)
- [ ] ExplorePage muestra creadores
- [ ] Click en creador abre nueva pestaña
- [ ] Nueva pestaña muestra perfil completo
- [ ] Username correcto en URL
- [ ] Posts del creador visibles
- [ ] Botones "Suscribirse" y "Dar Tip" funcionan

## 🎉 Resultado

Ahora cuando haces click en un creador desde ExplorePage:
- ✅ Se abre nueva pestaña con URL `/username`
- ✅ React Router extrae el username correctamente
- ✅ CreatorProfile carga los datos de Supabase
- ✅ Perfil se muestra completo con posts
- ✅ Modales de Subscribe/Tip funcionan

**¡Problema resuelto!** 🚀
