# Chainlink Price Monitor

Real-time monitoring system for Chainlink pricing data with multi-DEX validation and Birdeye WebSocket integration.

## Features

- Chainlink on-chain oracle price feeds (ETH/USD, BTC/USD)
- Multi-DEX price aggregation (Uniswap V3, SushiSwap, Curve)
- Birdeye WebSocket real-time price monitoring
- Multi-chain support (Ethereum, Avalanche, Base, Arbitrum)
- Bun runtime with strict TypeScript type-safety
- Median price calculation with deviation detection
- Freshness validation and circuit breakers

## Requirements

- Bun >= 1.0.0

## Installation

```bash
bun install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Usage

Development mode with auto-reload:

```bash
bun run dev
```

Production mode:

```bash
bun run start
```

Build:

```bash
bun run build
```

Type check:

```bash
bun run type-check
```

## Supported Chains

- Ethereum Mainnet (Chain ID: 1)
- Avalanche C-Chain (Chain ID: 43114)
- Base (Chain ID: 8453)
- Arbitrum One (Chain ID: 42161)

## Architecture

- `src/types/` - TypeScript type definitions
- `src/config/` - Chain and contract configurations
- `src/services/` - Core pricing services
- `src/utils/` - Utility functions
- `src/index.ts` - Main entry point


reference
https://claude.ai/chat/28607883-605d-4b13-b080-8ef9db757b32

## License

MIT
