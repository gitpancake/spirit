# 🤖 AgentRegistry Contract Listener

Production-ready TypeScript service for real-time monitoring of AgentRegistry smart contract events on Sepolia testnet. Automatically syncs contract data to your cache system via secure webhook delivery.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=Ethereum&logoColor=white)

## ✨ Features

- 🚀 **Real-time Event Monitoring** - WebSocket-based listening for all AgentRegistry events
- 🔄 **Intelligent Initial Sync** - Discovers existing tokens via `currentTokenId()` and syncs to cache  
- 🎯 **Smart Event Routing** - Different webhook endpoints for different event types
- 🔒 **Secure Webhooks** - HMAC-SHA256 signature verification for all requests
- 💪 **Production Ready** - Comprehensive error handling, retries, logging, and monitoring
- 🐳 **Docker Support** - Multi-stage builds with security best practices
- ⚡ **TypeScript First** - Full type safety and modern JavaScript features

## 🏗️ Architecture

```mermaid
graph TB
    A[AgentRegistry Contract] -->|WebSocket| B[Contract Listener]
    B --> C{Event Router}
    C -->|agent_registered<br/>agent_deregistered<br/>token_uri_updated| D[/api/webhooks/cache-update]
    C -->|transfer| E[/api/webhooks/ownership-update]  
    C -->|trainer_added<br/>trainer_removed| F[/api/webhooks/trainer-update]
    D --> G[Your Cache System]
    E --> G
    F --> G
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Your own RPC provider (Alchemy, Infura, etc.)
- Webhook endpoint URLs on your API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contract-listener
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values (see Configuration section)
   ```

4. **Start in development**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RPC_URL` | WebSocket RPC endpoint | `wss://eth-sepolia.g.alchemy.com/v2/your-key` |
| `RPC_HTTP_URL` | HTTP RPC endpoint | `https://eth-sepolia.g.alchemy.com/v2/your-key` |
| `CONTRACT_ADDRESS` | AgentRegistry contract address | `0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1` |
| `WEBHOOK_URL` | Base webhook URL | `https://your-api.com/api/webhooks/agent-registry` |
| `WEBHOOK_SECRET` | Secret for webhook signatures | `your-secure-secret-key` |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level (error/warn/info/debug) |
| `PORT` | `8080` | HTTP server port |
| `CHAIN_ID` | `11155111` | Sepolia testnet chain ID |
| `INITIAL_SYNC_ENABLED` | `true` | Enable startup sync |
| `WEBHOOK_MAX_RETRIES` | `3` | Webhook retry attempts |
| `WEBHOOK_TIMEOUT` | `10000` | Webhook timeout (ms) |

## 📡 Contract Events Monitored

| Event | Description | Cache Action | Webhook Endpoint |
|-------|-------------|--------------|------------------|
| `AgentRegistered` | New agent minted | Add to cache | `/cache-update` |
| `AgentDeregistered` | Agent burned/removed | Remove from cache | `/cache-update` |
| `TokenURIUpdated` | Metadata URI changed | Update cache | `/cache-update` |
| `Transfer` | Ownership change | Update owner | `/ownership-update` |
| `TrainerAdded` | Trainer assigned | Update relationships | `/trainer-update` |
| `TrainerRemoved` | Trainer removed | Update relationships | `/trainer-update` |

## 🔗 Webhook Integration

### Payload Structure

All webhooks include this structure:

```typescript
{
  event: "agent_registered" | "agent_deregistered" | "token_uri_updated" | "transfer" | "trainer_added" | "trainer_removed",
  data: {
    tokenId: string;
    // Event-specific fields...
  },
  metadata: {
    blockNumber: string;
    blockHash: string;
    transactionHash: string;
    logIndex: number;
    timestamp: number;
    chainId: number;
    contractAddress: string;
  }
}
```

### Security Headers

```http
Content-Type: application/json
X-Signature-256: sha256={hmac_signature}
User-Agent: contract-listener/1.0.0
```

### Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return `sha256=${expectedSignature}` === signature;
}
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Configure environment
cp .env.example .env
# Edit .env with your settings

# Deploy with Docker Compose
docker-compose up -d
```

### Using Docker directly

```bash
docker build -t contract-listener .
docker run -d --name contract-listener --env-file .env contract-listener
```

## 📊 Monitoring & Health Checks

### HTTP Endpoints

- `GET /health` - Health check with memory usage and sync status
- `GET /status` - Detailed service status with block information  
- `POST /sync` - Manual sync trigger (development only)

### Example Health Response

```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "rss": 45,
    "heapUsed": 23,
    "heapTotal": 35
  },
  "listener": {
    "listening": true,
    "contractAddress": "0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1",
    "chainId": 11155111
  },
  "timestamp": "2025-01-02T19:07:40.564Z"
}
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev        # Development with hot reload
npm run build      # Build TypeScript to JavaScript  
npm start          # Run production build
npm run lint       # Run ESLint
npm run typecheck  # TypeScript compiler check
npm test           # Run test suite
npm run clean      # Clean build directory
```

### Project Structure

```
contract-listener/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment validation
│   ├── services/
│   │   ├── agent-registry-listener.ts    # Event monitoring
│   │   ├── agent-registry-sync.ts        # Initial sync logic
│   │   └── webhook-service.ts            # Webhook delivery
│   ├── abi/
│   │   └── AgentRegistry.ts              # Contract ABI
│   ├── types/
│   │   └── events.ts                     # TypeScript interfaces
│   └── index.ts                          # Application entry point
├── Dockerfile                            # Production container
├── docker-compose.yml                    # Local deployment
└── package.json                          # Dependencies & scripts
```

## 🔧 Cache System Integration

Perfect for cache architectures like:

```typescript
// Token mappings
[tokenId] -> [ipfsHash]
[ipfsHash] -> [metadata]
[ipfsHash] -> [imageData]

// Relationships  
[tokenId] -> [owner]
[tokenId] -> [trainers[]]
[userAddress] -> [ownedTokens[]]
```

The service provides all data needed for cache management:
- ✅ Complete IPFS URIs for metadata fetching
- ✅ Previous URIs for cache invalidation
- ✅ Ownership data for access control  
- ✅ Trainer relationships for permissions

## 🚨 Error Handling

### Automatic Recovery
- **WebSocket disconnections** - Automatic reconnection with exponential backoff
- **Webhook failures** - 3 retry attempts with increasing delays
- **RPC errors** - Graceful degradation and detailed logging
- **Application crashes** - Initial sync on restart catches missed events

### Monitoring & Alerts
- Comprehensive structured logging with Pino
- Health check endpoints for monitoring systems
- Memory usage tracking
- Connection status reporting

## 🔒 Security Best Practices

- ✅ **HMAC webhook signatures** for request authenticity
- ✅ **Environment variable validation** with Zod
- ✅ **Multi-stage Docker builds** with non-root user
- ✅ **Input sanitization** and proper error handling
- ✅ **No hardcoded secrets** in codebase
- ✅ **Secure defaults** for all configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run linting and type checks (`npm run lint && npm run typecheck`)
5. Commit with conventional commits
6. Push and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Current Configuration

- **Contract**: `0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1` (AgentRegistry)
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Events**: All AgentRegistry events (registration, deregistration, transfers, trainers)
- **Deployment**: Production-ready with Docker support

Built with ❤️ for decentralized agent management systems.