// file: src/types/index.ts
// description: Core type definitions for Chainlink price monitoring system
// reference: Ethereum Mainnet Pricing Utility specification

import type { Address } from 'viem';

export type ChainId = 1 | 43114 | 8453 | 42161;

export type SupportedAsset = 'ETH' | 'BTC';

export interface ChainConfig {
  readonly chain_id: ChainId;
  readonly name: string;
  readonly rpc_urls: readonly string[];
  readonly block_time_seconds: number;
  readonly finality_blocks: number;
}

export interface TokenConfig {
  readonly address: Address;
  readonly decimals: number;
  readonly symbol: string;
}

export interface ChainlinkFeedConfig {
  readonly address: Address;
  readonly decimals: number;
  readonly description: string;
  readonly heartbeat_seconds: number;
}

export interface UniswapV3PoolConfig {
  readonly address?: Address;
  readonly token0: Address;
  readonly token1: Address;
  readonly fee: number;
  readonly factory: Address;
}

export interface ChainlinkPriceData {
  readonly round_id: bigint;
  readonly answer: bigint;
  readonly started_at: bigint;
  readonly updated_at: bigint;
  readonly answered_in_round: bigint;
  readonly decimals: number;
}

export interface DexPriceData {
  readonly sqrt_price_x96: bigint;
  readonly tick: number;
  readonly price_normalized: number;
  readonly pool_address: Address;
  readonly source: string;
}

export interface BirdeyePriceData {
  readonly address: string;
  readonly value: number;
  readonly timestamp: number;
  readonly chart_type: string;
}

export interface AggregatedPriceData {
  readonly chain_id: ChainId;
  readonly symbol: string;
  readonly chainlink: number;
  readonly dex_median: number;
  readonly birdeye: number | null;
  readonly deviation_pct: number;
  readonly liquidity_weighted: number;
  readonly confidence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly timestamp: number;
  readonly block_number: bigint;
}

export interface PriceDeviationCheck {
  readonly is_valid: boolean;
  readonly deviation_pct: number;
  readonly threshold_pct: number;
  readonly warning_level: 'NONE' | 'SOFT' | 'CRITICAL';
}

export interface ChainlinkLatestRoundDataResult {
  readonly roundId: bigint;
  readonly answer: bigint;
  readonly startedAt: bigint;
  readonly updatedAt: bigint;
  readonly answeredInRound: bigint;
}

export interface UniswapV3Slot0Result {
  readonly sqrtPriceX96: bigint;
  readonly tick: number;
  readonly observationIndex: number;
  readonly observationCardinality: number;
  readonly observationCardinalityNext: number;
  readonly feeProtocol: number;
  readonly unlocked: boolean;
}

export interface BirdeyeSubscriptionMessage {
  readonly type: 'SUBSCRIBE_PRICE';
  readonly data: { readonly queryType: 'complex', readonly query: string };
}

export interface BirdeyePriceMessage {
  readonly type: 'PRICE_DATA';
  readonly data: { readonly address: string, readonly value: number, readonly timestamp: number };
}

export type BirdeyeMessage = BirdeyeSubscriptionMessage | BirdeyePriceMessage;
