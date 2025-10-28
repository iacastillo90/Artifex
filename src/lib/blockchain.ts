import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { getContractAddresses, USDC_DECIMALS, ARTX_DECIMALS } from './contracts';

const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

const ARTX_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

const SUBSCRIPTIONS_ABI = [
  'function subscribe(address creator, uint256 months) external',
  'function isSubscribed(address creator, address user) view returns (bool)',
  'function registerCreator(uint256 monthlyPrice) external',
];

const TIPPING_ABI = [
  'function sendTip(address creator, uint256 amount, string message) external',
];

const CONTENT_ABI = [
  'function publishContent(string memory ipfsHash, uint8 contentType, uint8 accessType, uint256 price) external returns (uint256)',
  'function purchaseContent(uint256 tokenId) external',
];

export class BlockchainService {
  private provider: BrowserProvider | null = null;
  private signer: any | null = null;
  private chainId: number | null = null;

  async connect(): Promise<{ address: string; chainId: number }> {
    if (!window.ethereum) {
      throw new Error('MetaMask no instalado');
    }

    try {
      this.provider = new BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);
      this.signer = await this.provider.getSigner();

      return {
        address: accounts[0],
        chainId: this.chainId,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al conectar wallet');
    }
  }

  async getUSDCBalance(address: string): Promise<string> {
    if (!this.provider || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);
    const usdcContract = new Contract(contracts.USDC, USDC_ABI, this.provider);
    const balance = await usdcContract.balanceOf(address);
    return formatUnits(balance, USDC_DECIMALS);
  }

  async getARTXBalance(address: string): Promise<string> {
    if (!this.provider || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);
    const artxContract = new Contract(contracts.ARTX_TOKEN, ARTX_ABI, this.provider);
    const balance = await artxContract.balanceOf(address);
    return formatUnits(balance, ARTX_DECIMALS);
  }

  async approveUSDC(spenderAddress: string, amount: string): Promise<string> {
    if (!this.signer || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);
    const usdcContract = new Contract(contracts.USDC, USDC_ABI, this.signer);

    const amountInWei = parseUnits(amount, USDC_DECIMALS);
    const tx = await usdcContract.approve(spenderAddress, amountInWei);
    await tx.wait();

    return tx.hash;
  }

  async subscribe(creatorAddress: string, months: number, totalPrice: string): Promise<string> {
    if (!this.signer || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);

    await this.approveUSDC(contracts.SUBSCRIPTIONS, totalPrice);

    const subscriptionsContract = new Contract(
      contracts.SUBSCRIPTIONS,
      SUBSCRIPTIONS_ABI,
      this.signer
    );

    const tx = await subscriptionsContract.subscribe(creatorAddress, months);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async sendTip(creatorAddress: string, amount: string, message: string): Promise<string> {
    if (!this.signer || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);

    await this.approveUSDC(contracts.TIPPING, amount);

    const tippingContract = new Contract(contracts.TIPPING, TIPPING_ABI, this.signer);

    const amountInWei = parseUnits(amount, USDC_DECIMALS);
    const tx = await tippingContract.sendTip(creatorAddress, amountInWei, message);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async publishContent(
    ipfsHash: string,
    contentType: number,
    accessType: number,
    price: string
  ): Promise<string> {
    if (!this.signer || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);
    const contentContract = new Contract(contracts.CONTENT, CONTENT_ABI, this.signer);

    const priceInWei = price !== '0' ? parseUnits(price, USDC_DECIMALS) : 0;
    const tx = await contentContract.publishContent(ipfsHash, contentType, accessType, priceInWei);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async purchaseContent(tokenId: number, price: string): Promise<string> {
    if (!this.signer || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);

    await this.approveUSDC(contracts.CONTENT, price);

    const contentContract = new Contract(contracts.CONTENT, CONTENT_ABI, this.signer);

    const tx = await contentContract.purchaseContent(tokenId);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async registerCreator(monthlyPrice: string): Promise<string> {
    if (!this.signer || !this.chainId) throw new Error('Wallet no conectada');

    const contracts = getContractAddresses(this.chainId);
    const subscriptionsContract = new Contract(
      contracts.SUBSCRIPTIONS,
      SUBSCRIPTIONS_ABI,
      this.signer
    );

    const priceInWei = parseUnits(monthlyPrice, USDC_DECIMALS);
    const tx = await subscriptionsContract.registerCreator(priceInWei);
    const receipt = await tx.wait();

    return receipt.hash;
  }
}

export const blockchainService = new BlockchainService();
