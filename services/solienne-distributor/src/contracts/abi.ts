// FixedPriceManifestoMinterV3 ABI (also compatible with V2)
// Only including the functions and events we need for the distributor service

export const MINTER_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'saleId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'manifestoId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256',
      },
    ],
    name: 'SaleConfigured',
    type: 'event',
  },
  // Functions
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'subscribers',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: 'manifestoId',
        type: 'uint256',
      },
    ],
    name: 'distributeToSubscribersBatch',
    outputs: [
      {
        internalType: 'uint256',
        name: 'successCount',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'start',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'end',
        type: 'uint256',
      },
    ],
    name: 'getActiveSubscribersBatch',
    outputs: [
      {
        internalType: 'address[]',
        name: 'addresses',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: 'count',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalSubscriberCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'saleId',
        type: 'uint256',
      },
    ],
    name: 'getSale',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'manifestoId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'price',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'startTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endTime',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'active',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'exists',
            type: 'bool',
          },
        ],
        internalType: 'struct FixedPriceManifestoMinterV2.Sale',
        name: 'sale',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextSaleId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Event signature for filtering (V2: saleId is first, manifestoId is second)
export const SALE_CONFIGURED_EVENT_SIGNATURE =
  'SaleConfigured(uint256,uint256,uint256,uint256,uint256)';

// FixedPriceManifestoMinter V1 ABI (legacy contract - read-only for subscribers and sale enumeration)
export const MINTER_ABI_V1 = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'start',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'end',
        type: 'uint256',
      },
    ],
    name: 'getActiveSubscribersBatch',
    outputs: [
      {
        internalType: 'address[]',
        name: 'addresses',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: 'count',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalSubscriberCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'saleId',
        type: 'uint256',
      },
    ],
    name: 'getSale',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'manifestoId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'price',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'startTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endTime',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'active',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'exists',
            type: 'bool',
          },
        ],
        internalType: 'struct FixedPriceManifestoMinter.Sale',
        name: 'sale',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextSaleId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
