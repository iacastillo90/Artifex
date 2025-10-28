# 🚀 Guía: Desplegar Contratos Blockchain

## ⚠️ Importante

Para usar las funcionalidades blockchain, **DEBES desplegar los contratos primero**.

Actualmente, si conectas tu wallet sin contratos desplegados:
- ✅ La wallet se conectará correctamente
- ✅ Verás tu dirección
- ⚠️ Los balances mostrarán "0.00"
- ⚠️ Las transacciones blockchain no funcionarán

**Modo Piloto sigue funcionando sin contratos desplegados.**

---

## 📋 Opción 1: Desarrollo Local (Hardhat)

### Paso 1: Iniciar Red Local

```bash
# Terminal 1 - Mantener abierto
npx hardhat node
```

Verás algo como:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Paso 2: Desplegar Contratos

```bash
# Terminal 2
npx hardhat run scripts/deploy.cjs --network localhost
```

**Importante**: Guarda las direcciones que se imprimen. Ejemplo:
```
ARTX Token deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Creator Profile deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Content deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Subscriptions deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Tipping deployed to: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
Treasury deployed to: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
MockUSDC deployed to: 0x0165878A594ca255338adfa4d48449f69242Eb8F
```

### Paso 3: Configurar MetaMask

#### A. Agregar Red Localhost

1. Abrir MetaMask
2. Click en el selector de red
3. "Agregar red" → "Agregar red manualmente"
4. Configurar:
   - **Nombre de red**: `Localhost`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **ID de cadena**: `31337`
   - **Símbolo de moneda**: `ETH`
5. Guardar

#### B. Importar Cuenta de Test

1. MetaMask → Click en el icono de cuenta
2. "Importar cuenta"
3. Pegar la private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
4. Esta cuenta tiene 10,000 ETH de prueba

### Paso 4: Agregar Tokens a MetaMask

#### USDC (Mock)
1. MetaMask → "Importar tokens"
2. Dirección del contrato: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
3. Símbolo: `USDC`
4. Decimales: `6`

#### ARTX
1. MetaMask → "Importar tokens"
2. Dirección del contrato: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
3. Símbolo: `ARTX`
4. Decimales: `18`

### Paso 5: Mintear USDC de Prueba

```bash
npx hardhat console --network localhost
```

En la consola de Hardhat:
```javascript
const USDC = await ethers.getContractAt("MockUSDC", "0x0165878A594ca255338adfa4d48449f69242Eb8F")

// Reemplaza con TU dirección de wallet
await USDC.mint("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", ethers.parseUnits("10000", 6))

// Verificar balance
await USDC.balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
// Debería mostrar: 10000000000n (10,000 USDC)
```

### Paso 6: ¡Listo! Ahora puedes:

1. Refrescar la app
2. Conectar tu wallet (debe estar en red Localhost)
3. Ver tus balances:
   - 10,000 USDC
   - 10,000,000 ARTX (el owner recibe supply inicial)
4. Probar transacciones blockchain

---

## 📋 Opción 2: Base Sepolia Testnet (Producción)

### Requisitos Previos
- Cuenta con ETH de prueba en Base Sepolia
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Paso 1: Configurar Variables de Entorno

Crea/edita `.env`:
```bash
DEPLOYER_PRIVATE_KEY=tu_private_key_aqui
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Paso 2: Desplegar en Base Sepolia

```bash
npx hardhat run scripts/deploy.cjs --network baseSepolia
```

### Paso 3: Actualizar Frontend

Edita `src/lib/contracts.ts`:
```typescript
BASE_SEPOLIA: {
  ARTX_TOKEN: '0x...', // direcciones del deploy
  CREATOR_PROFILE: '0x...',
  CONTENT: '0x...',
  SUBSCRIPTIONS: '0x...',
  TIPPING: '0x...',
  TREASURY: '0x...',
  USDC: '0x...', // o usar USDC real de Base Sepolia
}
```

### Paso 4: Configurar MetaMask

1. Agregar red Base Sepolia automáticamente desde https://chainlist.org/
2. O manualmente:
   - **Nombre**: `Base Sepolia`
   - **RPC**: `https://sepolia.base.org`
   - **Chain ID**: `84532`
   - **Símbolo**: `ETH`
   - **Explorador**: `https://sepolia.basescan.org`

---

## 🧪 Probar la Integración

### 1. Conectar Wallet
- Click en "Conectar Wallet"
- Aprobar en MetaMask
- Deberías ver tus balances

### 2. Suscribirse a un Creador
- Ir al perfil de un creador
- Click "Suscribirse"
- Tab "Blockchain"
- Aprobar USDC (1ra TX)
- Confirmar suscripción (2da TX)
- ✅ Recibes NFT + 20 ARTX

### 3. Dar Propina
- En cualquier contenido
- Click "Dar Propina"
- Ingresar monto
- Aprobar y confirmar
- ✅ Recibes 5% en ARTX

### 4. Publicar Contenido
- Dashboard → "Crear Contenido"
- Llenar formulario
- Submit → Transacción blockchain
- ✅ Recibes 50 ARTX

---

## ❌ Troubleshooting

### "Error loading balances"
- **Causa**: Contratos no desplegados
- **Solución**: Seguir pasos de arriba para desplegar

### "User rejected transaction"
- **Causa**: Cancelaste en MetaMask
- **Solución**: Reintentar

### "Insufficient funds"
- **Causa**: No tienes USDC
- **Solución**: Mintear USDC de prueba (ver Paso 5)

### "Network mismatch"
- **Causa**: MetaMask en red diferente
- **Solución**: Cambiar a Localhost (31337)

### "Nonce too high"
- **Causa**: MetaMask desincronizado
- **Solución**: Settings → Advanced → Reset Account

---

## 📝 Notas Importantes

1. **Contratos Locales NO son Persistentes**
   - Si detienes `npx hardhat node`, TODO se pierde
   - Necesitas redesplegar cada vez que reinicies

2. **Modo Piloto Siempre Funciona**
   - No necesita contratos
   - Usa balances virtuales en Supabase
   - Ideal para demos sin blockchain

3. **Modo Híbrido**
   - Puedes usar piloto Y blockchain simultáneamente
   - Usuarios piloto: balances virtuales
   - Usuarios con wallet: balances reales

4. **Costos de Gas**
   - Localhost: Gas gratis (ETH de prueba ilimitado)
   - Base Sepolia: Gas gratis con ETH de faucet
   - Base Mainnet: Gas real ($0.01-0.50 por TX)

---

## ✅ Verificar que Todo Funciona

### Checklist
- [ ] Red Hardhat corriendo
- [ ] Contratos desplegados
- [ ] MetaMask configurado en Localhost
- [ ] Cuenta importada con ETH
- [ ] Tokens USDC y ARTX agregados
- [ ] USDC minteado (10,000+)
- [ ] Wallet conectada en la app
- [ ] Balances visibles en Dashboard
- [ ] Card "Balances On-Chain" aparece

**Si todos los checks están ✅, estás listo para usar blockchain!** 🚀
