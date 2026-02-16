# Chainlink Price Monitor - Project Structure

```
chainlink-price-monitor/
├── src/
│   ├── config/
│   │   ├── abis.ts              # Smart contract ABIs (Chainlink, Uniswap V3, ERC20)
│   │   └── chains.ts            # Multi-chain configuration with contract addresses
│   ├── services/
│   │   ├── aggregator.ts        # Price aggregation combining all data sources
│   │   ├── birdeye.ts           # Birdeye WebSocket client for real-time prices
│   │   ├── chainlink.ts         # Chainlink oracle price feed reader
│   │   └── dex.ts               # Multi-DEX price aggregation (Uniswap V3)
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── pricing.ts           # Pricing calculations and validations
│   └── index.ts                 # Main entry point with monitoring loop
├── .env                         # Environment variables (BLINK_API_KEY)
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore patterns
├── bunfig.toml                  # Bun runtime configuration
├── package.json                 # Project dependencies and scripts
├── README.md                    # Project documentation
├── STRUCTURE.md                 # This file - project structure
└── tsconfig.json                # TypeScript configuration (ES2024, strict)

## Key Features by File

### src/config/abis.ts
- Chainlink AggregatorV3Interface ABI
- Uniswap V3 Pool ABI
- Uniswap V3 Factory ABI
- ERC20 token ABI

### src/config/chains.ts
- Chain configurations (Ethereum, Avalanche, Base, Arbitrum)
- Token addresses (WETH, WBTC, USDC, USDT, DAI, WAVAX)
- Chainlink price feed addresses
- Uniswap V3 factory addresses
- DEX pool configurations

### src/services/chainlink.ts
- Latest price fetching from Chainlink oracles
- Price freshness validation (heartbeat checks)
- Multi-feed price fetching
- Normalized price conversion

### src/services/dex.ts
- Uniswap V3 pool price reading
- Dynamic pool address resolution
- Median price calculation across multiple pools
- Support for multiple fee tiers

### src/services/birdeye.ts
- WebSocket connection management
- Real-time OHLC price streaming
- Automatic reconnection logic
- Price data caching

### src/services/aggregator.ts
- Combines Chainlink, DEX, and Birdeye data
- Median price aggregation
- Liquidity-weighted price calculation
- Deviation detection and confidence scoring

### src/utils/pricing.ts
- Uniswap V3 price formula implementation
- Median calculation
- Deviation percentage calculation
- Price freshness validation
- Weighted average calculation

### src/types/index.ts
- Comprehensive TypeScript types for all data structures
- Chain configurations
- Token and feed configurations
- Price data structures
- Aggregation results

### src/index.ts
- Main monitoring loop
- Multi-chain price polling
- Console output formatting
- Graceful shutdown handling

## Supported Chains

1. Ethereum Mainnet (Chain ID: 1)
   - ETH/USD, BTC/USD
   - Multiple Uniswap V3 pools

2. Avalanche C-Chain (Chain ID: 43114)
   - AVAX/USD, ETH/USD, BTC/USD
   - Uniswap V3 pools

3. Base (Chain ID: 8453)
   - ETH/USD
   - Uniswap V3 pools

4. Arbitrum One (Chain ID: 42161)
   - ETH/USD, BTC/USD
   - Uniswap V3 pools

## Data Flow

1. Chainlink Service → Fetches on-chain oracle prices
2. DEX Service → Queries Uniswap V3 pools for spot prices
3. Birdeye Service → Streams real-time market prices (optional)
4. Aggregator Service → Combines all sources:
   - Calculates median DEX price
   - Computes deviation from Chainlink
   - Generates liquidity-weighted price
   - Assigns confidence score
5. Main Loop → Polls every 30 seconds and displays results

## Type Safety

- Strict TypeScript configuration (ES2024)
- No implicit any
- Strict null checks
- No unused parameters or variables
- Exhaustive switch cases
- Index signature checks
```
