# 🔧 Fix para Usuarios Existentes - Campos ARTX Faltantes

## ❌ Problema

Los usuarios creados antes de la migración ARTX no tienen los campos:
- `usdc_balance`
- `artx_balance`
- `is_pilot`

Esto causa el error:
```
TypeError: Cannot read properties of undefined (reading 'toLocaleString')
```

## ✅ Solución Rápida

### Opción 1: Ejecutar Migración en Supabase

1. **Ve a tu proyecto de Supabase**
2. **Abre el SQL Editor**
3. **Ejecuta esta query:**

```sql
-- Verificar si las columnas ya existen
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('usdc_balance', 'artx_balance', 'is_pilot');

-- Si no existen, agregarlas
ALTER TABLE users
ADD COLUMN IF NOT EXISTS usdc_balance decimal DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS artx_balance decimal DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_pilot boolean DEFAULT false NOT NULL;

-- Actualizar usuarios existentes (por seguridad)
UPDATE users
SET
  usdc_balance = COALESCE(usdc_balance, 0),
  artx_balance = COALESCE(artx_balance, 0),
  is_pilot = COALESCE(is_pilot, false)
WHERE usdc_balance IS NULL OR artx_balance IS NULL OR is_pilot IS NULL;

-- Verificar que todos los usuarios tienen los campos
SELECT
  username,
  usdc_balance,
  artx_balance,
  is_pilot
FROM users
LIMIT 10;
```

### Opción 2: Otorgar Saldo Piloto a Usuarios Existentes

Si quieres que los usuarios existentes también reciban el saldo piloto:

```sql
-- Actualizar usuarios existentes para darles el saldo piloto
UPDATE users
SET
  usdc_balance = 35,    -- $35 USDC
  artx_balance = 100,   -- 100 ARTX
  is_pilot = true
WHERE created_at < NOW() - INTERVAL '1 hour'  -- Usuarios creados hace más de 1 hora
  AND (usdc_balance = 0 OR usdc_balance IS NULL);

-- Verificar cambios
SELECT username, usdc_balance, artx_balance, is_pilot
FROM users
WHERE is_pilot = true;
```

### Opción 3: Solo Usuarios Específicos

Para actualizar un usuario específico:

```sql
UPDATE users
SET
  usdc_balance = 35,
  artx_balance = 100,
  is_pilot = true
WHERE username = 'tu_username';  -- Reemplaza con el username real
```

## 🔍 Verificación

Después de ejecutar la migración, verifica que todo funcione:

```sql
-- 1. Verificar estructura de la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('usdc_balance', 'artx_balance', 'is_pilot')
ORDER BY column_name;

-- Resultado esperado:
-- column_name   | data_type | is_nullable | column_default
-- artx_balance  | numeric   | NO          | 0
-- is_pilot      | boolean   | NO          | false
-- usdc_balance  | numeric   | NO          | 0

-- 2. Verificar datos de usuarios
SELECT
  username,
  usdc_balance,
  artx_balance,
  is_pilot,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Contar usuarios con saldo piloto
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_pilot = true THEN 1 END) as pilot_users,
  SUM(usdc_balance) as total_usdc,
  SUM(artx_balance) as total_artx
FROM users;
```

## 🐛 Troubleshooting

### Error: "column already exists"
```sql
-- Verifica si ya existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'artx_balance';

-- Si existe pero es NULL, actualiza
UPDATE users SET artx_balance = 0 WHERE artx_balance IS NULL;
```

### Error: "cannot add NOT NULL column"
```sql
-- Agrega primero sin NOT NULL
ALTER TABLE users ADD COLUMN IF NOT EXISTS artx_balance decimal DEFAULT 0;

-- Actualiza valores NULL
UPDATE users SET artx_balance = 0 WHERE artx_balance IS NULL;

-- Ahora agrega NOT NULL constraint
ALTER TABLE users ALTER COLUMN artx_balance SET NOT NULL;
```

### Dashboard aún muestra error
1. **Cierra y abre el navegador** (para limpiar caché)
2. **Verifica en Supabase** que los campos existen:
   ```sql
   SELECT * FROM users WHERE username = 'tu_username';
   ```
3. **Verifica en la consola del navegador** el objeto `user`:
   ```javascript
   console.log('User object:', user);
   // Debe mostrar: { ..., usdc_balance: 0, artx_balance: 0, is_pilot: false }
   ```

## 📊 Estadísticas Después de la Migración

```sql
-- Dashboard de la migración
SELECT
  'Total Users' as metric,
  COUNT(*) as value
FROM users

UNION ALL

SELECT
  'Pilot Users',
  COUNT(*)
FROM users WHERE is_pilot = true

UNION ALL

SELECT
  'Total USDC Distributed',
  SUM(usdc_balance)::text
FROM users

UNION ALL

SELECT
  'Total ARTX Distributed',
  SUM(artx_balance)::text
FROM users;
```

## ✅ Resultado Esperado

Después de aplicar la migración:

### En Supabase:
```
username    | usdc_balance | artx_balance | is_pilot
------------|--------------|--------------|----------
juanperez   | 35           | 100          | true
maria       | 0            | 0            | false
pedro       | 35           | 100          | true
```

### En el Dashboard:
```
┌────────────────────────────────────────┐
│ ✨ Balance $ARTX                       │
│ 100 ARTX         [✨]                 │
│ Gana más $ARTX creando contenido...   │
└────────────────────────────────────────┘
```

Sin errores en la consola ✅

## 🚀 Aplicar Migración Automáticamente

La migración `20251028083647_add_artx_and_pilot_mode.sql` ya incluye todo lo necesario.

Si usas Supabase CLI localmente:
```bash
# Aplicar todas las migraciones pendientes
supabase db push

# O aplicar manualmente
supabase db execute < supabase/migrations/20251028083647_add_artx_and_pilot_mode.sql
```

Si usas el Dashboard de Supabase:
1. Ve a **SQL Editor**
2. Copia el contenido de `20251028083647_add_artx_and_pilot_mode.sql`
3. Ejecuta la migración
4. Verifica con las queries de verificación arriba

## 📝 Notas Importantes

- ✅ La migración es **idempotente** (puede ejecutarse múltiples veces sin problemas)
- ✅ Usa `IF NOT EXISTS` para evitar errores si ya se ejecutó
- ✅ `UPDATE` con `COALESCE` asegura que no se sobrescriban valores existentes
- ✅ Valores por defecto (0, false) se aplican automáticamente
- ✅ El código del Dashboard ahora usa `|| 0` como fallback de seguridad

## 🎉 Confirmación Final

Una vez aplicado, deberías poder:
1. ✅ Hacer login sin errores
2. ✅ Ver el Dashboard con balance ARTX = 0
3. ✅ Crear nuevos usuarios que reciben $35 + 100 ARTX automáticamente
4. ✅ Navegar sin `TypeError` en ningún componente

**¡Listo!** Tu base de datos ahora está completamente actualizada con el sistema ARTX. 🚀
