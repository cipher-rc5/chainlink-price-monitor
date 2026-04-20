// file: src/index.ts
// description: Main entry point for Chainlink price monitoring system
// reference: Real-time price monitoring with multi-chain support

import { appendFileSync } from 'node:fs';
import { PriceAggregatorService } from '@/services/aggregator.ts';
import type { AggregatedPriceData, ChainId } from '@/types/index.ts';

function format_error(error: unknown): string {
  if (error instanceof Error) return error.message.split('\n')[0] ?? error.message;
  return String(error);
}

type OutputFormat = 'pretty' | 'jsonl-stdout' | 'jsonl-file';

function parse_output_format(): OutputFormat {
  const raw = process.env.OUTPUT_FORMAT?.trim().toLowerCase();
  if (raw === 'jsonl-stdout' || raw === 'jsonl-file') return raw;
  return 'pretty';
}

function serialize_jsonl(price_data: AggregatedPriceData): string {
  return JSON.stringify({ ...price_data, block_number: price_data.block_number.toString() });
}

const SUPPORTED_CHAINS: ChainId[] = [1, 43114, 8453, 42161];

const CHAIN_PAIRS: Record<ChainId, string[]> = { 1: ['ETH/USD', 'BTC/USD'], 43114: ['AVAX/USD'], 8453: ['ETH/USD'], 42161: ['ETH/USD'] };

async function monitor_prices(): Promise<void> {
  const output_format = parse_output_format();
  const jsonl_file_path = process.env.JSONL_FILE_PATH?.trim() || 'prices.jsonl';

  console.log('Initializing Chainlink Price Monitor...');
  console.log('Supported chains:', SUPPORTED_CHAINS.join(', '));
  console.log('Output format:', output_format);
  if (output_format === 'jsonl-file') console.log('JSONL output file:', jsonl_file_path);

  const use_birdeye = process.env.BIRDEYE_ENABLED === 'true' && Boolean(process.env.BIRDEYE_WS_URL?.trim());
  const aggregator = new PriceAggregatorService(use_birdeye);

  const poll_interval_ms = 30000;

  async function fetch_and_display_prices(): Promise<void> {
    if (output_format === 'pretty') {
      console.log('\n' + '='.repeat(80));
      console.log('Price Update:', new Date().toISOString());
      console.log('='.repeat(80));
    }

    for (const chain_id of SUPPORTED_CHAINS) {
      const pairs = CHAIN_PAIRS[chain_id];
      if (!pairs) continue;

      if (output_format === 'pretty') console.log(`\nChain ID: ${chain_id}`);

      try {
        const prices = await aggregator.get_multiple_aggregated_prices(chain_id, pairs);

        for (const [pair_name, price_data] of prices) {
          if (output_format === 'jsonl-stdout') {
            process.stdout.write(serialize_jsonl(price_data) + '\n');
          } else if (output_format === 'jsonl-file') {
            appendFileSync(jsonl_file_path, serialize_jsonl(price_data) + '\n');
          } else {
            console.log(`\n  ${pair_name}:`);
            console.log(`    Chainlink:         $${price_data.chainlink.toFixed(2)}`);
            console.log(`    DEX Median:        $${price_data.dex_median.toFixed(2)}`);
            if (price_data.birdeye !== null) {
              console.log(`    Birdeye:           $${price_data.birdeye.toFixed(2)}`);
            }
            console.log(`    Liquidity Weighted: $${price_data.liquidity_weighted.toFixed(2)}`);
            console.log(`    Deviation:         ${price_data.deviation_pct.toFixed(4)}%`);
            console.log(`    Confidence:        ${price_data.confidence}`);
            if (price_data.deviation_pct > 2) {
              console.log(`    WARNING: Price deviation exceeds 2% threshold`);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching prices for chain ${chain_id}: ${format_error(error)}`);
      }
    }
  }

  await fetch_and_display_prices();

  setInterval(() => {
    fetch_and_display_prices().catch((error) => {
      console.error(`Error in price monitoring loop: ${format_error(error)}`);
    });
  }, poll_interval_ms);

  process.on('SIGINT', async () => {
    console.log('\nShutting down price monitor...');
    await aggregator.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down price monitor...');
    await aggregator.cleanup();
    process.exit(0);
  });
}

monitor_prices().catch((error) => {
  console.error(`Fatal error in price monitor: ${format_error(error)}`);
  process.exit(1);
});
