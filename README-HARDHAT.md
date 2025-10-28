# Artifex Smart Contracts - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contracts
```bash
npx hardhat compile
```

### 3. Start Local Node (Terminal 1)
```bash
npx hardhat node
```
This will start a local Ethereum node at `http://127.0.0.1:8545` with 10 pre-funded test accounts.

### 4. Deploy Contracts (Terminal 2)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

This will:
- Deploy all 6 contracts (MockUSDC + 5 Artifex contracts)
- Configure cross-contract references
- Save addresses to `deployed-addresses.json`
- Export ABIs to `src/abis/`

### 5. Run E2E Tests
```bash
npx hardhat run scripts/runTests.js --network localhost
```

This comprehensive test simulates:
1. Distributing USDC to Creator and Fan
2. Creator creates profile
3. Creator registers for subscriptions ($9.99/month)
4. Creator publishes 3 posts (public, subscribers-only, pay-per-view)
5. Fan approves USDC spending
6. Fan subscribes to creator
7. Fan verifies access to subscribers-only content
8. Fan purchases pay-per-view content ($4.99)
9. Fan sends tip ($5.00)
10. Admin withdraws protocol fees (1%)

## Project Structure

```
project/
├── contracts/
│   ├── Artifex.sol           # Main contracts (5 contracts in 1 file)
│   └── MockUSDC.sol          # Mock USDC for testing
├── scripts/
│   ├── deploy.js             # Deployment script
│   └── runTests.js           # E2E test script
├── src/abis/                 # Generated ABIs (after deployment)
├── hardhat.config.js         # Hardhat configuration
└── deployed-addresses.json   # Contract addresses (after deployment)
```

## Contracts Overview

### 1. ArtifexCreatorProfile (ERC-721)
- Creator identity as NFTs
- Unique handles
- IPFS metadata

### 2. ArtifexContent (ERC-721)
- Content as NFTs
- 3 access types: PUBLIC, SUBSCRIBERS_ONLY, PAY_PER_VIEW
- 4 content types: VIDEO, GALLERY, ARTICLE, AUDIO

### 3. ArtifexSubscriptions (ERC-1155)
- Monthly subscriptions
- Auto-renew capability
- $9.99/month default (configurable)

### 4. ArtifexTreasury
- Receives 1% protocol fees
- Owner-controlled withdrawals
- Pausable for emergencies

### 5. ArtifexTipping
- P2P tips with 1% fee
- Direct creator-to-fan payments
- Optional messages

### 6. MockUSDC (ERC-20)
- 6 decimals (like real USDC)
- Mintable for testing
- 1M initial supply

## Common Commands

```bash
# Clean artifacts
npx hardhat clean

# Compile contracts
npx hardhat compile

# Start local node
npx hardhat node

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat run scripts/runTests.js --network localhost

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai

# Verify contract on Polygonscan
npx hardhat verify --network mumbai CONTRACT_ADDRESS
```

## Test Accounts

When you run `npx hardhat node`, you get 10 accounts with 10,000 ETH each:

```
Account #0: Admin/Deployer
Account #1: Creator (for testing)
Account #2: Fan (for testing)
Accounts #3-9: Available for additional testing
```

## Expected Test Results

After running `runTests.js`, you should see:

```
✅ Profile created
✅ Creator registered ($9.99/month)
✅ Content published (3 posts)
✅ USDC approvals granted
✅ Subscription successful
   - Fan paid: 9.99 USDC
   - Creator earned: 9.89 USDC (99%)
   - Protocol fee: 0.10 USDC (1%)
✅ Access granted to subscribers-only content
✅ PPV content purchased ($4.99)
✅ Tip sent ($5.00)
✅ Protocol fees withdrawn to treasury
```

## Gas Costs (Polygon Mainnet Estimates)

| Operation | Gas Used | Cost (MATIC) | Cost (USD) |
|-----------|----------|--------------|------------|
| Create Profile | ~150k | ~0.015 | $0.01 |
| Register Creator | ~80k | ~0.008 | $0.006 |
| Publish Content | ~180k | ~0.018 | $0.013 |
| Subscribe | ~120k | ~0.012 | $0.009 |
| Purchase PPV | ~100k | ~0.010 | $0.007 |
| Send Tip | ~90k | ~0.009 | $0.006 |

*Assumes MATIC = $0.70, Gas Price = 100 gwei*

## Troubleshooting

### Error: "Cannot find module 'hardhat'"
```bash
npm install --legacy-peer-deps
```

### Error: "deployed-addresses.json not found"
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Error: "Transaction reverted"
Make sure the local node is running in another terminal.

### Error: "Nonce too high"
Restart the local node:
```bash
# Stop node (Ctrl+C)
npx hardhat node
# Re-deploy
npx hardhat run scripts/deploy.js --network localhost
```

## Next Steps

1. **Frontend Integration**: Use the generated ABIs in `src/abis/` to connect your React app
2. **Mumbai Testnet**: Deploy to Polygon Mumbai for public testing
3. **Mainnet**: After audit, deploy to Polygon mainnet with real USDC

## Security Notes

- ✅ Using OpenZeppelin audited contracts
- ✅ ReentrancyGuard on all payment functions
- ✅ Pausable for emergency stops
- ✅ 1% protocol fee (configurable)
- ⚠️ Requires professional audit before mainnet

## Support

For issues or questions, check:
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin: https://docs.openzeppelin.com
- Polygon: https://docs.polygon.technology
