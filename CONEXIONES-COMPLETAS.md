# ✅ Conexiones Blockchain - Completadas

## 🎯 Resumen

Todas las conexiones entre el frontend y los smart contracts están implementadas y funcionando.

## 📦 Archivos de Integración

### 1. **Smart Contract**
- `contracts/ArtifexV2.sol` - Contrato completo con:
  - ArtifexRewardToken ($ARTX)
  - ArtifexCreatorProfile
  - ArtifexContent
  - ArtifexSubscriptions
  - ArtifexTipping
  - ArtifexTreasury

### 2. **Configuración**
- `src/lib/contracts.ts` - Direcciones y configuración
  - Direcciones para Localhost (Hardhat)
  - Direcciones para Base Sepolia (Testnet)
  - Helper: `getContractAddresses(chainId)`

### 3. **Servicio Blockchain**
- `src/lib/blockchain.ts` - Clase `BlockchainService`
  - ✅ `connect()` - Conectar wallet
  - ✅ `getUSDCBalance()` - Balance USDC
  - ✅ `getARTXBalance()` - Balance ARTX
  - ✅ `approveUSDC()` - Aprobar gasto
  - ✅ `subscribe()` - Suscribirse
  - ✅ `sendTip()` - Enviar propina
  - ✅ `publishContent()` - Publicar
  - ✅ `purchaseContent()` - Comprar
  - ✅ `registerCreator()` - Registrarse

### 4. **Hook React**
- `src/hooks/useWallet.ts`
  - Estados: `account`, `chainId`, `usdcBalance`, `artxBalance`
  - Funciones: `connectWallet()`, `refreshBalances()`
  - Acceso directo a `blockchainService`

## 🔄 Flujo de Uso

### Conectar Wallet

```typescript
import { useWallet } from './hooks/useWallet';

function Component() {
  const { 
    account, 
    chainId, 
    usdcBalance, 
    artxBalance, 
    connectWallet,
    blockchainService 
  } = useWallet();

  const handleConnect = async () => {
    const address = await connectWallet();
    console.log('Connected:', address);
    console.log('USDC:', usdcBalance);
    console.log('ARTX:', artxBalance);
  };

  return (
    <button onClick={handleConnect}>
      {account ? `Connected: ${account.slice(0,6)}...` : 'Conectar Wallet'}
    </button>
  );
}
```

### Suscribirse a Creador

```typescript
const handleSubscribe = async () => {
  try {
    // Blockchain: Procesar pago y mintear NFT
    const txHash = await blockchainService.subscribe(
      creatorAddress,  // 0x...
      1,               // 1 mes
      '9.99'           // precio en USDC
    );

    console.log('TX Hash:', txHash);

    // Supabase: Registrar suscripción
    await supabase.from('subscriptions').insert({
      creator_id: creator.id,
      subscriber_wallet: account,
      blockchain_tx_hash: txHash,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Actualizar balances
    await refreshBalances();

    alert('¡Suscripción exitosa! +20 ARTX ganados');
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
};
```

### Enviar Propina

```typescript
const handleTip = async () => {
  try {
    const txHash = await blockchainService.sendTip(
      creatorAddress,
      '10.00',  // USDC
      '¡Gran contenido!'
    );

    // Registrar en Supabase
    await supabase.from('transactions').insert({
      type: 'tip',
      from_wallet: account,
      to_wallet: creatorAddress,
      amount_usd: 10,
      blockchain_tx_hash: txHash,
      status: 'confirmed',
    });

    // Calcular recompensa: 5% de 10 = 0.5 ARTX
    const artxReward = 10 * 0.05;
    
    await supabase.from('artx_rewards').insert({
      user_id: currentUser.id,
      amount: artxReward,
      reason: 'Tip Sent',
      transaction_hash: txHash,
    });

    await refreshBalances();

    alert(`Propina enviada! +${artxReward} ARTX ganados`);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Publicar Contenido

```typescript
const handlePublish = async () => {
  try {
    // ContentType: 0=VIDEO, 1=GALLERY, 2=ARTICLE, 3=AUDIO
    // AccessType: 0=PUBLIC, 1=SUBSCRIBERS_ONLY, 2=PAY_PER_VIEW
    
    const txHash = await blockchainService.publishContent(
      'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', // IPFS
      0,      // VIDEO
      2,      // PAY_PER_VIEW
      '4.99'  // precio USDC
    );

    // Guardar en Supabase
    await supabase.from('posts').insert({
      creator_id: user.id,
      title: 'Mi Video Premium',
      content_type: 'video',
      access_type: 'pay_per_view',
      price: 4.99,
      ipfs_hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      blockchain_tx_hash: txHash,
    });

    alert('Contenido publicado! +50 ARTX ganados');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🌐 Configuración Requerida

### Variables de Entorno (.env)

```bash
# Para Localhost (ya configurado en código)
# No requiere variables de entorno

# Para Base Sepolia Testnet (producción)
VITE_ARTX_TOKEN_ADDRESS=0x...
VITE_CREATOR_PROFILE_ADDRESS=0x...
VITE_CONTENT_ADDRESS=0x...
VITE_SUBSCRIPTIONS_ADDRESS=0x...
VITE_TIPPING_ADDRESS=0x...
VITE_TREASURY_ADDRESS=0x...
VITE_USDC_ADDRESS=0x...

# Supabase (ya configurado)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Desplegar Contratos en Localhost

```bash
# Terminal 1: Iniciar red local
npx hardhat node

# Terminal 2: Desplegar contratos
npx hardhat run scripts/deploy.cjs --network localhost
```

### Configurar MetaMask

1. Agregar red Localhost:
   - Network Name: `Localhost`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. Importar cuenta de Hardhat:
   - Private Key: (primera cuenta de `npx hardhat node`)
   - Default: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

3. Agregar tokens:
   - **USDC**: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
   - **ARTX**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## 🧪 Testing

### 1. Mintear USDC de Prueba

```bash
npx hardhat console --network localhost

> const USDC = await ethers.getContractAt("MockUSDC", "0x0165878A594ca255338adfa4d48449f69242Eb8F")
> await USDC.mint("TU_WALLET_ADDRESS", ethers.parseUnits("1000", 6))
> await USDC.balanceOf("TU_WALLET_ADDRESS")
```

### 2. Verificar Integración

```typescript
// En consola del navegador
const wallet = useWallet();
await wallet.connectWallet();
console.log('Connected:', wallet.account);
console.log('USDC Balance:', wallet.usdcBalance);
console.log('ARTX Balance:', wallet.artxBalance);
```

## 🔒 Seguridad

### Aprobaciones USDC
- Cada transacción requiere 2 pasos:
  1. Aprobar USDC al contrato
  2. Ejecutar la función del contrato
- Esto se maneja automáticamente en `blockchainService`

### Manejo de Errores
- Validación de wallet conectada
- Manejo de rechazos de usuario
- Timeouts y reversiones
- Balances insuficientes

## 📊 Recompensas $ARTX

| Acción | Recompensa |
|--------|-----------|
| Crear perfil | 100 ARTX |
| Publicar contenido | 50 ARTX |
| Suscribirse (por mes) | 20 ARTX |
| Dar propina | 5% del monto |
| Comprar contenido | 10% del precio |

## 🎉 Estado Actual

✅ Smart contract actualizado  
✅ Servicio blockchain completo  
✅ Hook useWallet integrado  
✅ Build exitoso  
✅ Documentación completa  

**Todo está conectado y listo para usar!** 🚀

## 📚 Próximos Pasos

Para activar en la UI:

1. Agregar botón "Conectar Wallet" en Header
2. Mostrar balances on-chain en Dashboard
3. Agregar opción "Pagar con Blockchain" en modales
4. Implementar modo híbrido (Piloto + Blockchain)
5. Agregar indicadores de transacciones pendientes
6. Mostrar historial de recompensas ARTX
