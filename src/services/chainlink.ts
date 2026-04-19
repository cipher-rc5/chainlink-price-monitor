// file: src/services/chainlink.ts
// description: Chainlink oracle price feed reader with freshness validation
// reference: AggregatorV3Interface specification

import { AGGREGATOR_V3_INTERFACE_ABI } from '@/config/abis.ts';
import { CHAINLINK_FEEDS, CHAINS } from '@/config/chains.ts';
import type { ChainId, ChainlinkLatestRoundDataResult, ChainlinkPriceData } from '@/types/index.ts';
import { format_price_to_decimals, is_price_fresh } from '@/utils/pricing.ts';
import { createPublicClient, fallback, http, type PublicClient } from 'viem';

type ChainlinkLatestRoundDataTuple = readonly [bigint, bigint, bigint, bigint, bigint];

function format_error(error: unknown): string {
  if (error instanceof Error) return error.message.split('\n')[0] ?? error.message;
  return String(error);
}

function normalize_latest_round_data(raw_data: unknown): ChainlinkLatestRoundDataResult {
  if (Array.isArray(raw_data)) {
    if (raw_data.length < 5) {
      throw new Error('Invalid Chainlink latestRoundData response tuple');
    }

    const tuple = raw_data as unknown as ChainlinkLatestRoundDataTuple;
    return { roundId: tuple[0], answer: tuple[1], startedAt: tuple[2], updatedAt: tuple[3], answeredInRound: tuple[4] };
  }

  return raw_data as ChainlinkLatestRoundDataResult;
}

export class ChainlinkService {
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

  async get_latest_price(chain_id: ChainId, feed_name: string): Promise<ChainlinkPriceData> {
    const feeds = CHAINLINK_FEEDS[chain_id];
    if (!feeds) {
      throw new Error(`No Chainlink feeds configured for chain ${chain_id}`);
    }

    const feed_config = feeds[feed_name];
    if (!feed_config) {
      throw new Error(`Feed ${feed_name} not found for chain ${chain_id}`);
    }

    const client = this.get_client(chain_id);

    const raw_data =
      (await client.readContract({
        address: feed_config.address,
        abi: AGGREGATOR_V3_INTERFACE_ABI,
        functionName: 'latestRoundData'
      })) as unknown;

    const data = normalize_latest_round_data(raw_data);

    const current_timestamp = Math.floor(Date.now() / 1000);
    const is_fresh = is_price_fresh(data.updatedAt, current_timestamp, feed_config.heartbeat_seconds);

    if (!is_fresh) {
      throw new Error(
        `Stale price data for ${feed_name} on chain ${chain_id}. ` +
          `Last update: ${data.updatedAt}, age: ${current_timestamp - Number(data.updatedAt)}s`
      );
    }

    return {
      round_id: data.roundId,
      answer: data.answer,
      started_at: data.startedAt,
      updated_at: data.updatedAt,
      answered_in_round: data.answeredInRound,
      decimals: feed_config.decimals
    };
  }

  async get_price_normalized(chain_id: ChainId, feed_name: string): Promise<number> {
    const price_data = await this.get_latest_price(chain_id, feed_name);
    return format_price_to_decimals(price_data.answer, price_data.decimals);
  }

  async get_multiple_prices(chain_id: ChainId, feed_names: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    await Promise.all(feed_names.map(async (feed_name) => {
      try {
        const price = await this.get_price_normalized(chain_id, feed_name);
        results.set(feed_name, price);
      } catch (error) {
        console.error(`Failed to fetch ${feed_name} on chain ${chain_id}: ${format_error(error)}`);
      }
    }));

    return results;
  }
}
