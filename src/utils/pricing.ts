// file: src/utils/pricing.ts
// description: Pricing calculation and validation utilities
// reference: Uniswap V3 price formulas and deviation checks

import type { PriceDeviationCheck } from '@/types/index.ts';

export function calculate_uniswap_v3_price(sqrt_price_x96: bigint, token0_decimals: number, token1_decimals: number): number {
  const q96 = 2 ** 96;
  const sqrt_price = Number(sqrt_price_x96) / q96;
  const price_raw = sqrt_price * sqrt_price;
  const decimal_adjustment = 10 ** (token0_decimals - token1_decimals);
  return price_raw * decimal_adjustment;
}

export function calculate_median(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }

  return sorted[mid] ?? 0;
}

export function calculate_deviation(value1: number, value2: number): number {
  if (value2 === 0) {
    throw new Error('Cannot calculate deviation with zero denominator');
  }
  return Math.abs((value1 - value2) / value2) * 100;
}

export function check_price_deviation(
  chainlink_price: number,
  dex_median_price: number,
  soft_threshold_pct: number = 2,
  critical_threshold_pct: number = 5
): PriceDeviationCheck {
  const deviation_pct = calculate_deviation(dex_median_price, chainlink_price);

  if (deviation_pct >= critical_threshold_pct) {
    return { is_valid: false, deviation_pct, threshold_pct: critical_threshold_pct, warning_level: 'CRITICAL' };
  }

  if (deviation_pct >= soft_threshold_pct) {
    return { is_valid: true, deviation_pct, threshold_pct: soft_threshold_pct, warning_level: 'SOFT' };
  }

  return { is_valid: true, deviation_pct, threshold_pct: 0, warning_level: 'NONE' };
}

export function format_price_to_decimals(raw_value: bigint, decimals: number): number {
  const divisor = 10 ** decimals;
  return Number(raw_value) / divisor;
}

export function calculate_weighted_average(prices: number[], weights: number[]): number {
  if (prices.length !== weights.length || prices.length === 0) {
    throw new Error('Prices and weights arrays must have the same non-zero length');
  }

  const total_weight = weights.reduce((sum, w) => sum + w, 0);

  if (total_weight === 0) {
    throw new Error('Total weight cannot be zero');
  }

  const weighted_sum = prices.reduce((sum, price, i) => sum + price * (weights[i] ?? 0), 0);

  return weighted_sum / total_weight;
}

export function is_price_fresh(updated_at: bigint, current_timestamp: number, max_age_seconds: number = 3600): boolean {
  const age_seconds = current_timestamp - Number(updated_at);
  return age_seconds <= max_age_seconds;
}
