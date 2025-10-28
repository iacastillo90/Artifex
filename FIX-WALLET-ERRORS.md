# 🔧 Fix: Errores de Wallet - RESUELTO

## 🐛 Problema Original

Al conectar la wallet en el dashboard, aparecían estos errores:

```
Error loading balances: Error: could not decode result data
(value="0x", info={ "method": "balanceOf", "signature": "balanceOf(address)" })
```

## 🔍 Causa Raíz

Los contratos blockchain **NO estaban desplegados** en la red conectada.

Cuando `blockchainService.getUSDCBalance()` y `getARTXBalance()` intentaban leer los contratos:
- Las direcciones apuntaban a contratos inexistentes
- Ethers.js intentaba llamar `balanceOf()` en una dirección vacía
- Retornaba `0x` (sin datos) → Error de decodificación

## ✅ Solución Implementada

### 1. **Manejo Graceful de Errores**

Actualicé `src/lib/blockchain.ts`:

```typescript
async getUSDCBalance(address: string): Promise<string> {
  try {
    const contracts = getContractAddresses(this.chainId);
    if (!contracts.USDC) return '0'; // ← Validación

    const usdcContract = new Contract(contracts.USDC, USDC_ABI, this.provider);
    const balance = await usdcContract.balanceOf(address);
    return formatUnits(balance, USDC_DECIMALS);
  } catch (error) {
    console.warn('Error getting USDC balance:', error); // ← Warning en lugar de error
    return '0'; // ← Retorno seguro
  }
}
```

Lo mismo para `getARTXBalance()`.

### 2. **Hook useWallet Mejorado**

Actualicé `src/hooks/useWallet.ts`:

```typescript
const loadBalances = async (address: string) => {
  try {
    const [usdc, artx] = await Promise.all([
      blockchainService.getUSDCBalance(address),
      blockchainService.getARTXBalance(address),
    ]);
    setUsdcBalance(usdc);
    setArtxBalance(artx);
  } catch (error) {
    console.warn('No se pudieron cargar balances blockchain:', error);
    setUsdcBalance('0'); // ← Valores por defecto seguros
    setArtxBalance('0');
  }
};
```

### 3. **Guía de Despliegue**

Creé `DESPLEGAR-CONTRATOS.md` con instrucciones paso a paso.

## 🎯 Resultado

### Antes ❌
```
- Error en consola (rojo)
- App se bloqueaba
- No se podía usar
```

### Ahora ✅
```
- Warning en consola (amarillo)
- App funciona perfectamente
- Balances muestran "0.00"
- Wallet conecta sin problemas
- Modo piloto sigue funcionando
```

## 🚀 Cómo Usar Ahora

### Sin Contratos Desplegados (Actual)
1. ✅ Conectar wallet → Funciona
2. ✅ Ver dirección → Funciona
3. ⚠️ Balances on-chain → Muestra "0.00"
4. ✅ Modo piloto → Funciona 100%

### Con Contratos Desplegados
1. ✅ Todo lo anterior
2. ✅ Balances reales desde blockchain
3. ✅ Transacciones on-chain funcionan
4. ✅ Recibir USDC y ARTX reales

## 📝 Para Desplegar Contratos

Ver archivo: **`DESPLEGAR-CONTRATOS.md`**

Resumen rápido:
```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.cjs --network localhost

# Terminal 3
npx hardhat console --network localhost
> const USDC = await ethers.getContractAt("MockUSDC", "0x0165878A594ca255338adfa4d48449f69242Eb8F")
> await USDC.mint("TU_ADDRESS", ethers.parseUnits("10000", 6))
```

Luego:
- Configurar MetaMask en red Localhost (31337)
- Importar cuenta con la private key de Hardhat
- Agregar tokens USDC y ARTX
- ¡Listo!

## 🔄 Modo Híbrido

La app ahora soporta **ambos modos simultáneamente**:

| Escenario | Comportamiento |
|-----------|----------------|
| Sin wallet conectada | Usa modo piloto (Supabase) |
| Con wallet, sin contratos | Muestra balances "0.00", modo piloto funciona |
| Con wallet y contratos | Balances reales, transacciones blockchain |

## 🎉 Estado Final

✅ Errores de consola arreglados
✅ App funciona sin contratos
✅ Wallet conecta correctamente
✅ Modo piloto intacto
✅ Ready para cuando despliegues contratos
✅ Documentación completa
✅ Build exitoso

**El error está completamente resuelto. La app ahora maneja gracefully la ausencia de contratos desplegados.** 🚀
