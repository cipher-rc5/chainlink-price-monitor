// file: src/services/aggregator.ts
// description: Price aggregation service combining Chainlink, DEX, and Birdeye data
// reference: Median aggregation strategy with deviation checks

import { BirdeyeService } from '@/services/birdeye.ts';
import { ChainlinkService } from '@/services/chainlink.ts';
import { DexPriceService } from '@/services/dex.ts';
import type { AggregatedPriceData, BirdeyePriceData, ChainId } from '@/types/index.ts';
import { calculate_weighted_average, check_price_deviation } from '@/utils/pricing.ts';

function format_error(error: unknown): string {
  if (error instanceof Error) return error.message.split('\n')[0] ?? error.message;
  return String(error);
}

export class PriceAggregatorService {
  private chainlink_service: ChainlinkService;
  private dex_service: DexPriceService;
  private birdeye_service: BirdeyeService | null = null;
  private birdeye_cache: Map<string, number>;

  constructor (use_birdeye = false) {
    this.chainlink_service = new ChainlinkService();
    this.dex_service = new DexPriceService();
    this.birdeye_cache = new Map();

    if (use_birdeye) {
      this.birdeye_service = new BirdeyeService();
      this.initialize_birdeye().catch((error) => {
        console.error(`Failed to initialize Birdeye service: ${format_error(error)}`);
      });
    }
  }

  private async initialize_birdeye(): Promise<void> {
    if (!this.birdeye_service) return;

    await this.birdeye_service.connect();

    this.birdeye_service.subscribe_price(['ETH', 'BTC'], (price_data: BirdeyePriceData) => {
      this.birdeye_cache.set(price_data.address, price_data.value);
    });
  }

  async get_aggregated_price(chain_id: ChainId, pair_name: string, block_number?: bigint): Promise<AggregatedPriceData> {
    const [chainlink_price, dex_median_price] = await Promise.all([
      this.chainlink_service.get_price_normalized(chain_id, pair_name),
      this.dex_service.get_median_price(chain_id, pair_name)
    ]);

    const birdeye_price = this.birdeye_cache.get(pair_name.split('/')[0] ?? '') ?? null;

    const deviation_check = check_price_deviation(chainlink_price, dex_median_price);

    const prices_to_average = [chainlink_price, dex_median_price];
    const weights = [1.0, 1.0];

    if (birdeye_price !== null) {
      prices_to_average.push(birdeye_price);
      weights.push(0.5);
    }

    const liquidity_weighted = calculate_weighted_average(prices_to_average, weights);

    let confidence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' = 'VERY_HIGH';

    if (deviation_check.warning_level === 'CRITICAL') {
      confidence = 'LOW';
    } else if (deviation_check.warning_level === 'SOFT') {
      confidence = 'MEDIUM';
    } else if (birdeye_price !== null) {
      confidence = 'VERY_HIGH';
    } else {
      confidence = 'HIGH';
    }

    return {
      chain_id,
      symbol: pair_name,
      chainlink: chainlink_price,
      dex_median: dex_median_price,
      birdeye: birdeye_price,
      deviation_pct: deviation_check.deviation_pct,
      liquidity_weighted,
      confidence,
      timestamp: Math.floor(Date.now() / 1000),
      block_number: block_number ?? 0n
    };
  }

  async get_multiple_aggregated_prices(chain_id: ChainId, pair_names: string[]): Promise<Map<string, AggregatedPriceData>> {
    const results = new Map<string, AggregatedPriceData>();

    await Promise.all(pair_names.map(async (pair_name) => {
      try {
        const price_data = await this.get_aggregated_price(chain_id, pair_name);
        results.set(pair_name, price_data);
      } catch (error) {
        console.error(`Failed to aggregate price for ${pair_name} on chain ${chain_id}: ${format_error(error)}`);
      }
    }));

    return results;
  }

  async cleanup(): Promise<void> {
    if (this.birdeye_service) {
      this.birdeye_service.disconnect();
    }
  }
}
