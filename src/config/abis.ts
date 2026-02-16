// file: src/config/abis.ts
// description: Smart contract ABIs for Chainlink, Uniswap V3, and ERC20
// reference: AggregatorV3Interface and UniswapV3Pool specifications

export const AGGREGATOR_V3_INTERFACE_ABI = [{
  inputs: [],
  name: 'latestRoundData',
  outputs: [
    { internalType: 'uint80', name: 'roundId', type: 'uint80' },
    { internalType: 'int256', name: 'answer', type: 'int256' },
    { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
    { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
    { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
  ],
  stateMutability: 'view',
  type: 'function'
}, {
  inputs: [],
  name: 'decimals',
  outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
  stateMutability: 'view',
  type: 'function'
}, {
  inputs: [],
  name: 'description',
  outputs: [{ internalType: 'string', name: '', type: 'string' }],
  stateMutability: 'view',
  type: 'function'
}] as const;

export const UNISWAP_V3_POOL_ABI = [{
  inputs: [],
  name: 'slot0',
  outputs: [
    { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
    { internalType: 'int24', name: 'tick', type: 'int24' },
    { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
    { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
    { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
    { internalType: 'uint8', name: 'feeProtocol', type: 'uint8' },
    { internalType: 'bool', name: 'unlocked', type: 'bool' }
  ],
  stateMutability: 'view',
  type: 'function'
}] as const;

export const UNISWAP_V3_FACTORY_ABI = [{
  inputs: [{ internalType: 'address', name: 'tokenA', type: 'address' }, { internalType: 'address', name: 'tokenB', type: 'address' }, {
    internalType: 'uint24',
    name: 'fee',
    type: 'uint24'
  }],
  name: 'getPool',
  outputs: [{ internalType: 'address', name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function'
}] as const;

export const ERC20_ABI = [{
  inputs: [],
  name: 'decimals',
  outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
  stateMutability: 'view',
  type: 'function'
}, {
  inputs: [],
  name: 'symbol',
  outputs: [{ internalType: 'string', name: '', type: 'string' }],
  stateMutability: 'view',
  type: 'function'
}] as const;
