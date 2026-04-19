// file: src/config/chains.ts
// description: Multi-chain configuration for Ethereum, Avalanche, Base, and Arbitrum
// reference: Ethereum Mainnet Pricing Utility specification

import type { ChainConfig, ChainId, ChainlinkFeedConfig, TokenConfig, UniswapV3PoolConfig } from '@/types/index.ts';
import type { Address } from 'viem';

function compact_urls(...urls: Array<string | undefined>): string[] {
  return urls.filter((url): url is string => Boolean(url && url.trim()));
}

function blink_rpc(chain_slug: string): string | undefined {
  const api_key = process.env.BLINK_API_KEY?.trim();
  if (!api_key) return undefined;
  return `https://${chain_slug}.blinklabs.xyz/v1/${api_key}`;
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  1: {
    chain_id: 1,
    name: 'Ethereum Mainnet',
    rpc_urls: compact_urls(process.env.ETH_RPC_URL, blink_rpc('eth'), 'https://eth.llamarpc.com'),
    block_time_seconds: 12,
    finality_blocks: 64
  },
  43114: {
    chain_id: 43114,
    name: 'Avalanche C-Chain',
    rpc_urls: compact_urls(process.env.AVALANCHE_RPC_URL, blink_rpc('avalanche-mainnet'), 'https://api.avax.network/ext/bc/C/rpc'),
    block_time_seconds: 2,
    finality_blocks: 1
  },
  8453: {
    chain_id: 8453,
    name: 'Base',
    rpc_urls: compact_urls(process.env.BASE_RPC_URL, blink_rpc('base'), 'https://mainnet.base.org'),
    block_time_seconds: 2,
    finality_blocks: 1
  },
  42161: {
    chain_id: 42161,
    name: 'Arbitrum One',
    rpc_urls: compact_urls(process.env.ARBITRUM_RPC_URL, blink_rpc('arbitrum-one'), 'https://arb1.arbitrum.io/rpc'),
    block_time_seconds: 0.25,
    finality_blocks: 1
  }
} as const;

export const TOKENS: Record<ChainId, Record<string, TokenConfig>> = {
  1: {
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH' },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, symbol: 'WBTC' },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC' },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT' },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI' }
  },
  43114: {
    WAVAX: { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18, symbol: 'WAVAX' },
    WETH: { address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18, symbol: 'WETH' },
    WBTC: { address: '0x50b7545627a5162F82A992c33b87aDc75187B218', decimals: 8, symbol: 'WBTC' },
    USDC: { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6, symbol: 'USDC' }
  },
  8453: {
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18, symbol: 'WETH' },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, symbol: 'USDC' }
  },
  42161: {
    WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, symbol: 'WETH' },
    WBTC: { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, symbol: 'WBTC' },
    USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, symbol: 'USDC' }
  }
} as const;

export const CHAINLINK_FEEDS: Record<ChainId, Record<string, ChainlinkFeedConfig>> = {
  1: {
    'ETH/USD': { address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', decimals: 8, description: 'ETH / USD', heartbeat_seconds: 3600 },
    'BTC/USD': { address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', decimals: 8, description: 'BTC / USD', heartbeat_seconds: 3600 }
  },
  43114: {
    'AVAX/USD': { address: '0x0A77230d17318075983913bC2145DB16C7366156', decimals: 8, description: 'AVAX / USD', heartbeat_seconds: 3600 },
    'ETH/USD': { address: '0x976B3D034E162d8bD72D6b9C989d545b839003b0', decimals: 8, description: 'ETH / USD', heartbeat_seconds: 3600 },
    'BTC/USD': { address: '0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743', decimals: 8, description: 'BTC / USD', heartbeat_seconds: 3600 }
  },
  8453: {
    'ETH/USD': { address: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', decimals: 8, description: 'ETH / USD', heartbeat_seconds: 1200 }
  },
  42161: {
    'ETH/USD': { address: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', decimals: 8, description: 'ETH / USD', heartbeat_seconds: 3600 },
    'BTC/USD': { address: '0x6ce185860a4963106506C203335A2910413708e9', decimals: 8, description: 'BTC / USD', heartbeat_seconds: 3600 }
  }
} as const;

export const UNISWAP_V3_FACTORIES: Record<ChainId, Address> = {
  1: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  43114: '0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD',
  8453: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
  42161: '0x1F98431c8aD98523631AE4a59f267346ea31F984'
} as const;

export const DEX_POOLS: Record<ChainId, Record<string, UniswapV3PoolConfig[]>> = {
  1: {
    'ETH/USD': [{
      address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
      token0: TOKENS[1]!.USDC!.address,
      token1: TOKENS[1]!.WETH!.address,
      fee: 500,
      factory: UNISWAP_V3_FACTORIES[1]!
    }, {
      address: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
      token0: TOKENS[1]!.USDC!.address,
      token1: TOKENS[1]!.WETH!.address,
      fee: 3000,
      factory: UNISWAP_V3_FACTORIES[1]!
    }],
    'BTC/USD': [{ token0: TOKENS[1]!.WBTC!.address, token1: TOKENS[1]!.USDC!.address, fee: 3000, factory: UNISWAP_V3_FACTORIES[1]! }]
  },
  43114: {
    'AVAX/USD': [{
      token0: TOKENS[43114]!.WAVAX!.address,
      token1: TOKENS[43114]!.USDC!.address,
      fee: 3000,
      factory: UNISWAP_V3_FACTORIES[43114]!
    }]
  },
  8453: {
    'ETH/USD': [{
      token0: TOKENS[8453]!.WETH!.address,
      token1: TOKENS[8453]!.USDC!.address,
      fee: 500,
      factory: UNISWAP_V3_FACTORIES[8453]!
    }]
  },
  42161: {
    'ETH/USD': [{
      token0: TOKENS[42161]!.WETH!.address,
      token1: TOKENS[42161]!.USDC!.address,
      fee: 500,
      factory: UNISWAP_V3_FACTORIES[42161]!
    }]
  }
} as const;
