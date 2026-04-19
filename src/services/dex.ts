// file: src/services/dex.ts
// description: Multi-DEX price aggregation service for Uniswap V3 pools
// reference: Uniswap V3 pool pricing and factory integration

import { UNISWAP_V3_FACTORY_ABI, UNISWAP_V3_POOL_ABI } from '@/config/abis.ts';
import { CHAINS, DEX_POOLS, TOKENS } from '@/config/chains.ts';
import type { ChainId, DexPriceData, UniswapV3Slot0Result } from '@/types/index.ts';
import { calculate_median, calculate_uniswap_v3_price } from '@/utils/pricing.ts';
import { type Address, createPublicClient, fallback, http, type PublicClient } from 'viem';

type UniswapV3Slot0Tuple = readonly [bigint, number, number, number, number, number, boolean];

const BASE_ASSET_TOKEN_SYMBOL: Record<string, string> = { ETH: 'WETH', BTC: 'WBTC', AVAX: 'WAVAX' };

function normalize_slot0(raw_data: unknown): UniswapV3Slot0Result {
  if (Array.isArray(raw_data)) {
    if (raw_data.length < 7) {
      throw new Error('Invalid Uniswap V3 slot0 response tuple');
    }

    const tuple = raw_data as unknown as UniswapV3Slot0Tuple;
    return {
      sqrtPriceX96: tuple[0],
      tick: tuple[1],
      observationIndex: tuple[2],
      observationCardinality: tuple[3],
      observationCardinalityNext: tuple[4],
      feeProtocol: tuple[5],
      unlocked: tuple[6]
    };
  }

  return raw_data as UniswapV3Slot0Result;
}

function format_error(error: unknown): string {
  if (error instanceof Error) return error.message.split('\n')[0] ?? error.message;
  return String(error);
}

export class DexPriceService {
  private clients: Map<ChainId, PublicClient>;

  constructor () {
    this.clients = new Map();
    this.initialize_clients();
  }

  private initialize_clients(): void {
    for (const [chain_id_str, config] of Object.entries(CHAINS)) {
      const chain_id = parseInt(chain_id_str) as ChainId;
      const transports = config.rpc_urls.map((url) => http(url));
      if (transports.length === 0) {
        throw new Error(`No RPC URLs configured for chain ${chain_id}`);
      }

      const transport = transports.length === 1 ? transports[0]! : fallback(transports);
      const client = createPublicClient({ transport });
      this.clients.set(chain_id, client);
    }
  }

  private get_client(chain_id: ChainId): PublicClient {
    const client = this.clients.get(chain_id);
    if (!client) {
      throw new Error(`Client not initialized for chain ${chain_id}`);
    }
    return client;
  }

  async get_pool_address(chain_id: ChainId, factory: Address, token0: Address, token1: Address, fee: number): Promise<Address> {
    const client = this.get_client(chain_id);

    const pool_address =
      (await client.readContract({
        address: factory,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: 'getPool',
        args: [token0, token1, fee]
      })) as Address;

    if (pool_address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Pool not found for ${token0}/${token1} with fee ${fee}`);
    }

    return pool_address;
  }

  async get_pool_price(chain_id: ChainId, pool_address: Address, token0_decimals: number, token1_decimals: number): Promise<DexPriceData> {
    const client = this.get_client(chain_id);

    const raw_slot0_data =
      (await client.readContract({ address: pool_address, abi: UNISWAP_V3_POOL_ABI, functionName: 'slot0' })) as unknown;

    const slot0_data = normalize_slot0(raw_slot0_data);

    const price_normalized = calculate_uniswap_v3_price(slot0_data.sqrtPriceX96, token0_decimals, token1_decimals);

    return { sqrt_price_x96: slot0_data.sqrtPriceX96, tick: slot0_data.tick, price_normalized, pool_address, source: 'Uniswap V3' };
  }

  async get_median_price(chain_id: ChainId, pair_name: string): Promise<number> {
    const pools_config = DEX_POOLS[chain_id]?.[pair_name];
    if (!pools_config || pools_config.length === 0) {
      throw new Error(`No DEX pools configured for ${pair_name} on chain ${chain_id}`);
    }

    const prices: number[] = [];
    const base_asset = pair_name.split('/')[0] ?? '';
    const base_token_symbol = BASE_ASSET_TOKEN_SYMBOL[base_asset];
    const base_token_address = base_token_symbol ? TOKENS[chain_id]?.[base_token_symbol]?.address : undefined;

    for (const pool_config of pools_config) {
      try {
        let pool_address = pool_config.address;

        if (!pool_address) {
          pool_address = await this.get_pool_address(
            chain_id,
            pool_config.factory,
            pool_config.token0,
            pool_config.token1,
            pool_config.fee
          );
        }

        const token0_symbol = Object.entries(TOKENS[chain_id] ?? {}).find(([_, config]) => config.address === pool_config.token0)?.[0];
        const token1_symbol = Object.entries(TOKENS[chain_id] ?? {}).find(([_, config]) => config.address === pool_config.token1)?.[0];

        if (!token0_symbol || !token1_symbol) {
          throw new Error('Token configuration not found');
        }

        const token0_decimals = TOKENS[chain_id]?.[token0_symbol]?.decimals ?? 18;
        const token1_decimals = TOKENS[chain_id]?.[token1_symbol]?.decimals ?? 6;

        const price_data = await this.get_pool_price(chain_id, pool_address, token0_decimals, token1_decimals);

        let normalized_price = price_data.price_normalized;
        if (base_token_address && pool_config.token1 === base_token_address) {
          normalized_price = normalized_price === 0 ? 0 : 1 / normalized_price;
        }

        prices.push(normalized_price);
      } catch (error) {
        console.error(`Failed to fetch price from pool ${pool_config.address ?? 'dynamic'}: ${format_error(error)}`);
      }
    }

    if (prices.length === 0) {
      throw new Error(`Failed to fetch any prices for ${pair_name} on chain ${chain_id}`);
    }

    return calculate_median(prices);
  }

  async get_all_pool_prices(chain_id: ChainId, pair_name: string): Promise<DexPriceData[]> {
    const pools_config = DEX_POOLS[chain_id]?.[pair_name];
    if (!pools_config || pools_config.length === 0) {
      throw new Error(`No DEX pools configured for ${pair_name} on chain ${chain_id}`);
    }

    const results: DexPriceData[] = [];
    const base_asset = pair_name.split('/')[0] ?? '';
    const base_token_symbol = BASE_ASSET_TOKEN_SYMBOL[base_asset];
    const base_token_address = base_token_symbol ? TOKENS[chain_id]?.[base_token_symbol]?.address : undefined;

    for (const pool_config of pools_config) {
      try {
        let pool_address = pool_config.address;

        if (!pool_address) {
          pool_address = await this.get_pool_address(
            chain_id,
            pool_config.factory,
            pool_config.token0,
            pool_config.token1,
            pool_config.fee
          );
        }

        const token0_symbol = Object.entries(TOKENS[chain_id] ?? {}).find(([_, config]) => config.address === pool_config.token0)?.[0];
        const token1_symbol = Object.entries(TOKENS[chain_id] ?? {}).find(([_, config]) => config.address === pool_config.token1)?.[0];

        if (!token0_symbol || !token1_symbol) {
          throw new Error('Token configuration not found');
        }

        const token0_decimals = TOKENS[chain_id]?.[token0_symbol]?.decimals ?? 18;
        const token1_decimals = TOKENS[chain_id]?.[token1_symbol]?.decimals ?? 6;

        const price_data = await this.get_pool_price(chain_id, pool_address, token0_decimals, token1_decimals);

        let normalized_price = price_data.price_normalized;
        if (base_token_address && pool_config.token1 === base_token_address) {
          normalized_price = normalized_price === 0 ? 0 : 1 / normalized_price;
        }

        results.push({ ...price_data, price_normalized: normalized_price });
      } catch (error) {
        console.error(`Failed to fetch price from pool ${pool_config.address ?? 'dynamic'}: ${format_error(error)}`);
      }
    }

    return results;
  }
}
