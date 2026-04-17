# Solienne Distributor

Automated distribution service for Solienne Manifesto NFTs. Listens for `SaleConfigured` events on the Base blockchain and automatically distributes manifestos to active subscribers.

## Features

- **Real-time Event Listening**: Uses Alchemy WebSockets to monitor smart contract events
- **Automatic Distribution**: Checks if manifesto needs distribution and executes batch distribution to subscribers
- **Multi-Version Support**: Aggregates subscribers from V1, V2, and V3 contracts for seamless migration
- **Multi-Network Support**: Works with Base Mainnet and Base Sepolia
- **Robust Error Handling**: Includes retry logic with exponential backoff
- **Production Ready**: Type-safe TypeScript, structured logging, graceful shutdown
- **Gas Optimization**: Configurable gas settings for cost-effective transactions
- **Secure**: Environment-based configuration, private keys never committed

## Architecture

```
src/
├── config/
│   ├── env.ts           # Environment configuration with validation
│   └── logger.ts        # Structured logging setup
├── contracts/
│   └── abi.ts          # Smart contract ABI definitions
├── services/
│   ├── EventListener.ts # Alchemy WebSocket event listener
│   ├── Distributor.ts   # Distribution logic and contract interactions
│   └── RetryManager.ts  # Retry logic with exponential backoff
└── index.ts            # Main application entry point
```

## Prerequisites

- Node.js >= 18.0.0
- An Alchemy API key ([Get one here](https://www.alchemy.com/))
- A funded wallet with private key (for gas fees)
- The deployed FixedPriceManifestoMinter contract address

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

Edit `.env` with your settings:

```bash
# Network (Base Sepolia for testing, Base Mainnet for production)
CHAIN_ID=84532                    # 84532 = Base Sepolia, 8453 = Base Mainnet
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Alchemy WebSocket
ALCHEMY_API_KEY=your_alchemy_api_key

# Redis (for distribution tracking)
REDIS_URL=redis://localhost:6379

# Contract Addresses
MINTER_CONTRACT_ADDRESS=0x...         # V3 minter contract (for events, distribution, and V3 subscribers)
SUBSCRIBERS_ADDRESS_V2=0x...          # Optional: V2 contract (for V2 subscribers)
SUBSCRIBERS_ADDRESS_V1=0x...          # Optional: V1 contract (for legacy V1 subscribers)

# Wallet (KEEP SECURE!)
DISTRIBUTOR_PRIVATE_KEY=0x...    # Private key with funds for gas

# Optional: Gas Configuration
GAS_LIMIT=500000
MAX_FEE_PER_GAS=20               # In gwei (optional)
MAX_PRIORITY_FEE_PER_GAS=2       # In gwei (optional)
```

### Network Settings

**Base Sepolia (Testnet)**
- Chain ID: `84532`
- RPC: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- Explorer: https://sepolia.basescan.org/
- Faucet: https://www.alchemy.com/faucets/base-sepolia

**Base Mainnet (Production)**
- Chain ID: `8453`
- RPC: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- Explorer: https://basescan.org/

## Usage

### Development

```bash
# Run with auto-reload
npm run dev

# Run with watch mode
npm run dev:watch

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### Production

```bash
# Build
npm run build

# Start
npm start

# Or use PM2 for process management
pm2 start dist/index.js --name solienne-distributor
```

## How It Works

1. **Event Monitoring**: The service connects to Alchemy WebSocket and listens for `SaleConfigured` events
2. **Event Detection**: When a new manifesto sale is created via `createManifestoAndSale()`
3. **Distribution Check**: Checks if the manifesto has already been distributed today using Redis
4. **Subscriber Aggregation**: If not distributed, fetches all active subscribers from V1, V2, and V3 contracts (configured)
   - Subscribers from multiple contracts are combined
   - Duplicates are allowed - same address can receive manifesto multiple times if subscribed to multiple versions
5. **Batch Distribution**: Calls `distributeToSubscribersBatch()` with active subscribers (max 200 per batch)
6. **Retry Logic**: Retries failed transactions with exponential backoff
7. **Logging**: All actions are logged with transaction hashes for audit trail

## Multi-Version Subscriber Support

The distributor supports reading subscribers from multiple contract versions simultaneously, enabling seamless migration from V1 → V2 → V3:

### Configuration Options

- **V3 (Required)**: `MINTER_CONTRACT_ADDRESS` - The current V3 minter contract
  - Used for: Event listening, distribution transactions, and V3 subscriber reading

- **V2 (Optional)**: `SUBSCRIBERS_ADDRESS_V2` - The V2 subscriber contract
  - Used for: Reading V2 subscribers only

- **V1 (Optional)**: `SUBSCRIBERS_ADDRESS_V1` - The legacy V1 subscriber contract
  - Used for: Reading V1 subscribers only

### Behavior

- All configured subscriber contracts are queried in parallel for efficiency
- Subscribers are combined into a single list **without deduplication**
- If the same address subscribes to multiple versions, they receive the manifesto multiple times
- This allows for graceful migration while maintaining backwards compatibility

### Example Setup

```bash
# During V1 → V2 → V3 migration
MINTER_CONTRACT_ADDRESS=0xV3...      # Current V3 contract
SUBSCRIBERS_ADDRESS_V2=0xV2...       # V2 contract (optional)
SUBSCRIBERS_ADDRESS_V1=0xV1...       # V1 contract (optional)
```

The distributor will fetch and combine subscribers from all three contracts.

## Error Handling

- **Configuration Errors**: App crashes on startup if required env vars are missing
- **Connection Errors**: Auto-reconnects to WebSocket with exponential backoff (max 10 attempts)
- **Transaction Errors**: Retries failed distributions up to 3 times with configurable delays
- **Graceful Shutdown**: Handles SIGTERM/SIGINT for clean shutdowns

## Security

- **Private Keys**: Never committed to git (see `.gitignore`)
- **Environment Variables**: All secrets in `.env` file
- **Wallet Permissions**: Distributor wallet only needs to call `distributeToSubscribersBatch()`
- **Contract Validation**: All addresses validated before use

## Monitoring

The service logs structured JSON with the following information:

- Event detections with transaction hashes
- Distribution status (success/failure/skipped)
- Gas used per transaction
- Retry attempts and reasons
- WebSocket connection status
- Error details with stack traces

### Log Levels

- `trace`: Very detailed debugging
- `debug`: Detailed debugging information
- `info`: General information (default)
- `warn`: Warning messages
- `error`: Error messages
- `fatal`: Fatal errors

Set via `LOG_LEVEL` in `.env`.

## Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start dist/index.js --name solienne-distributor

# Monitor
pm2 logs solienne-distributor
pm2 status

# Auto-restart on server reboot
pm2 startup
pm2 save
```

## Testing

Test on Base Sepolia first:

1. Deploy contract to Base Sepolia
2. Set `CHAIN_ID=84532` in `.env`
3. Fund distributor wallet with Sepolia ETH
4. Run the service: `npm run dev`
5. Create a test manifesto and sale
6. Verify distribution transaction on [Sepolia BaseScan](https://sepolia.basescan.org/)

## Troubleshooting

### "Configuration Error: Missing required environment variable"
- Ensure all required variables are set in `.env`
- Check `.env.example` for reference

### "WebSocket connection closed"
- Check your Alchemy API key is valid
- Verify network connectivity
- Service will auto-reconnect

### "Insufficient funds"
- Ensure distributor wallet has enough ETH for gas
- Check gas price settings in `.env`

### "Transaction reverted"
- Verify contract address is correct
- Check wallet has `distributeToSubscribersBatch()` permissions
- Review contract state (paused, etc.)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
