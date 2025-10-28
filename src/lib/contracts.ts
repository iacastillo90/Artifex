export const CONTRACT_ADDRESSES = {
  BASE_SEPOLIA: {
    ARTX_TOKEN: import.meta.env.VITE_ARTX_TOKEN_ADDRESS || '',
    CREATOR_PROFILE: import.meta.env.VITE_CREATOR_PROFILE_ADDRESS || '',
    CONTENT: import.meta.env.VITE_CONTENT_ADDRESS || '',
    SUBSCRIPTIONS: import.meta.env.VITE_SUBSCRIPTIONS_ADDRESS || '',
    TIPPING: import.meta.env.VITE_TIPPING_ADDRESS || '',
    TREASURY: import.meta.env.VITE_TREASURY_ADDRESS || '',
    USDC: import.meta.env.VITE_USDC_ADDRESS || '',
  },
  LOCALHOST: {
    ARTX_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CREATOR_PROFILE: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    CONTENT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    SUBSCRIPTIONS: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    TIPPING: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    TREASURY: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    USDC: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
};

export const CHAIN_CONFIG = {
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
  },
  LOCALHOST: {
    id: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
  },
};

export const getContractAddresses = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return CONTRACT_ADDRESSES.BASE_SEPOLIA;
    case 31337:
      return CONTRACT_ADDRESSES.LOCALHOST;
    default:
      return CONTRACT_ADDRESSES.LOCALHOST;
  }
};

export const USDC_DECIMALS = 6;
export const ARTX_DECIMALS = 18;
