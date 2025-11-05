import { ethers } from 'ethers';

// Update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  VAULT: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000',
  STRATEGY_MANAGER: process.env.NEXT_PUBLIC_STRATEGY_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000',
  AAVE_ADAPTER: process.env.NEXT_PUBLIC_AAVE_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  MORPHO_ADAPTER: process.env.NEXT_PUBLIC_MORPHO_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  SPARK_ADAPTER: process.env.NEXT_PUBLIC_SPARK_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  UNISWAP_ADAPTER: process.env.NEXT_PUBLIC_UNISWAP_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// Contract ABIs (simplified for frontend use)
export const VAULT_ABI = [
  'function deposit(uint256 assets, address receiver) external returns (uint256)',
  'function withdraw(uint256 assets, address receiver, address owner) external returns (uint256)',
  'function redeem(uint256 shares, address receiver, address owner) external returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function donateYield() external returns (uint256)',
  'function donationAddress() external view returns (address)',
  'function getAccumulatedYield() external view returns (uint256)',
  'function totalUserDeposits() external view returns (uint256)',
  'function asset() external view returns (address)',
  'function convertToShares(uint256 assets) external view returns (uint256)',
  'function convertToAssets(uint256 shares) external view returns (uint256)',
];

export const STRATEGY_MANAGER_ABI = [
  'function setAllocationWeights(tuple(uint256 aave, uint256 morpho, uint256 spark, uint256 uniswap) weights) external',
  'function rebalance() external',
  'function getAllocationStatus() external view returns (uint256 totalAssets, uint256 aaveBalance, uint256 morphoBalance, uint256 sparkBalance, uint256 uniswapBalance, tuple(uint256 aave, uint256 morpho, uint256 spark, uint256 uniswap) weights)',
  'function currentAllocation() external view returns (tuple(uint256 aave, uint256 morpho, uint256 spark, uint256 uniswap))',
];

export const ADAPTER_ABI = [
  'function getYieldRate() external view returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  'function balanceOf() external view returns (uint256)',
];

export const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

// Helper function to get contract instance
export function getContract(
  address: string,
  abi: any[],
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(address, abi, signerOrProvider);
}

// Vault contract helpers
export async function getVaultInfo(provider: ethers.Provider) {
  const vault = getContract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, provider);
  
  const [totalAssets, donationAddress, accumulatedYield, totalUserDeposits] = await Promise.all([
    vault.totalAssets(),
    vault.donationAddress(),
    vault.getAccumulatedYield(),
    vault.totalUserDeposits(),
  ]);

  return {
    totalAssets: ethers.formatEther(totalAssets),
    donationAddress,
    accumulatedYield: ethers.formatEther(accumulatedYield),
    totalUserDeposits: ethers.formatEther(totalUserDeposits),
  };
}

// Strategy Manager helpers
export async function getAllocationStatus(provider: ethers.Provider) {
  const strategyManager = getContract(
    CONTRACT_ADDRESSES.STRATEGY_MANAGER,
    STRATEGY_MANAGER_ABI,
    provider
  );

  const status = await strategyManager.getAllocationStatus();
  
  return {
    totalAssets: ethers.formatEther(status.totalAssets),
    aaveBalance: ethers.formatEther(status.aaveBalance),
    morphoBalance: ethers.formatEther(status.morphoBalance),
    sparkBalance: ethers.formatEther(status.sparkBalance),
    uniswapBalance: ethers.formatEther(status.uniswapBalance),
    weights: {
      aave: Number(status.weights.aave),
      morpho: Number(status.weights.morpho),
      spark: Number(status.weights.spark),
      uniswap: Number(status.weights.uniswap),
    },
  };
}

// Get yield rates from adapters
export async function getYieldRates(provider: ethers.Provider) {
  const aaveAdapter = getContract(CONTRACT_ADDRESSES.AAVE_ADAPTER, ADAPTER_ABI, provider);
  const morphoAdapter = getContract(CONTRACT_ADDRESSES.MORPHO_ADAPTER, ADAPTER_ABI, provider);
  const sparkAdapter = getContract(CONTRACT_ADDRESSES.SPARK_ADAPTER, ADAPTER_ABI, provider);
  const uniswapAdapter = getContract(CONTRACT_ADDRESSES.UNISWAP_ADAPTER, ADAPTER_ABI, provider);

  const [aaveRate, morphoRate, sparkRate, uniswapRate] = await Promise.all([
    aaveAdapter.getYieldRate(),
    morphoAdapter.getYieldRate(),
    sparkAdapter.getYieldRate(),
    uniswapAdapter.getYieldRate(),
  ]);

  return {
    aave: Number(ethers.formatEther(aaveRate)),
    morpho: Number(ethers.formatEther(morphoRate)),
    spark: Number(ethers.formatEther(sparkRate)),
    uniswap: Number(ethers.formatEther(uniswapRate)),
  };
}

// User balance helper
export async function getUserBalance(userAddress: string, provider: ethers.Provider) {
  const vault = getContract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, provider);
  const assetAddress = await vault.asset();
  const asset = getContract(assetAddress, ERC20_ABI, provider);

  const [vaultShares, assetBalance] = await Promise.all([
    vault.balanceOf(userAddress),
    asset.balanceOf(userAddress),
  ]);

  const assetValue = await vault.convertToAssets(vaultShares);

  return {
    shares: ethers.formatEther(vaultShares),
    assetValue: ethers.formatEther(assetValue),
    walletBalance: ethers.formatEther(assetBalance),
  };
}