# ============================================================================
# SPIRIT SMART CONTRACTS - FOUNDRY MAKEFILE
# ============================================================================
# Each target clearly states what it deploys/does
# All deployments use Foundry (forge) with automatic Etherscan verification
# ============================================================================

# Configuration
NETWORK ?= sepolia
ACCOUNT ?= deployer
VERIFY ?= --verify

# Include environment variables
-include .env

# ============================================================================
# HELP & INFO
# ============================================================================

.PHONY: help
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "SPIRIT SMART CONTRACTS - DEPLOYMENT COMMANDS"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "CORE DEPLOYMENTS:"
	@echo "  deploy-spirit-registry-v2          Deploy Spirit Registry V2 (Identity+Validation+Reputation+Controller)"
	@echo "  deploy-spirit-identity-registry    Deploy only Identity Registry"
	@echo "  deploy-spirit-validation-registry  Deploy only Validation Registry"
	@echo "  deploy-spirit-reputation-registry  Deploy only Reputation Registry"
	@echo "  deploy-spirit-controller           Deploy only Registry Controller"
	@echo ""
	@echo "NFT DEPLOYMENTS:"
	@echo "  deploy-abraham-early-works         Deploy Abraham Early Works NFT"
	@echo "  deploy-abraham-covenant            Deploy Abraham Covenant NFT"
	@echo "  deploy-gepetto-toys                Deploy Gepetto Toys NFT"
	@echo "  deploy-solienne-manifesto          Deploy Solienne Manifesto NFT"
	@echo "  deploy-solienne-origin-series      Deploy Solienne Origin Series NFT"
	@echo ""
	@echo "AUCTION DEPLOYMENTS:"
	@echo "  deploy-abraham-auction             Deploy Abraham Auction contract"
	@echo "  deploy-thirteen-year-auction       Deploy 13-Year Auction NFT"
	@echo ""
	@echo "SUPERFLUID DEPLOYMENTS:"
	@echo "  deploy-distribution-pool           Deploy Superfluid Distribution Pool"
	@echo "  deploy-spirit-supertoken           Deploy SPIRIT SuperToken"
	@echo ""
	@echo "BUILD & TEST:"
	@echo "  build                              Build all contracts with Forge"
	@echo "  test                               Run all tests"
	@echo "  test-spirit-registry               Test Spirit Registry contracts"
	@echo "  test-nfts                          Test NFT contracts"
	@echo "  clean                              Clean build artifacts"
	@echo ""
	@echo "UTILITIES:"
	@echo "  verify-contract                    Verify specific contract on Etherscan"
	@echo "  get-deployment-addresses           Show latest deployment addresses"
	@echo "  check-balance                      Check deployer balance"
	@echo ""
	@echo "USAGE:"
	@echo "  make deploy-spirit-registry-v2 NETWORK=sepolia ACCOUNT=mykey"
	@echo "  make deploy-gepetto-toys NETWORK=base ACCOUNT=prod"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ============================================================================
# BUILD & TEST
# ============================================================================

.PHONY: build
build:
	@echo "🔨 Building all contracts..."
	@forge build
	@echo "✅ Build complete"

.PHONY: test
test:
	@echo "🧪 Running all tests..."
	@forge test -vv
	@echo "✅ Tests complete"

.PHONY: test-spirit-registry
test-spirit-registry:
	@echo "🧪 Testing Spirit Registry contracts..."
	@forge test --match-path "test/Spirit/*" -vv
	@echo "✅ Spirit Registry tests complete"

.PHONY: test-nfts
test-nfts:
	@echo "🧪 Testing NFT contracts..."
	@forge test --match-path "test/*NFT*" -vv
	@echo "✅ NFT tests complete"

.PHONY: clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	@forge clean
	@rm -rf out cache broadcast
	@echo "✅ Clean complete"

# ============================================================================
# SPIRIT REGISTRY V2 DEPLOYMENTS
# ============================================================================

.PHONY: deploy-spirit-registry-v2
deploy-spirit-registry-v2:
	@echo "🚀 Deploying Spirit Registry V2 System to $(NETWORK)..."
	@echo "  Components: Identity, Validation, Reputation, Controller"
	@forge script script/DeploySpiritRegistryV2.s.sol:DeploySpiritRegistryV2 \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Spirit Registry V2 deployed to $(NETWORK)"

.PHONY: deploy-spirit-identity-registry
deploy-spirit-identity-registry:
	@echo "🆔 Deploying Spirit Identity Registry to $(NETWORK)..."
	@forge script script/DeploySpiritIdentityRegistry.s.sol:DeploySpiritIdentityRegistry \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Spirit Identity Registry deployed to $(NETWORK)"

.PHONY: deploy-spirit-validation-registry
deploy-spirit-validation-registry:
	@echo "✔️ Deploying Spirit Validation Registry to $(NETWORK)..."
	@forge script script/DeploySpiritValidationRegistry.s.sol:DeploySpiritValidationRegistry \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Spirit Validation Registry deployed to $(NETWORK)"

.PHONY: deploy-spirit-reputation-registry
deploy-spirit-reputation-registry:
	@echo "⭐ Deploying Spirit Reputation Registry to $(NETWORK)..."
	@forge script script/DeploySpiritReputationRegistry.s.sol:DeploySpiritReputationRegistry \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Spirit Reputation Registry deployed to $(NETWORK)"

.PHONY: deploy-spirit-controller
deploy-spirit-controller:
	@echo "🎮 Deploying Spirit Registry Controller to $(NETWORK)..."
	@forge script script/DeploySpiritController.s.sol:DeploySpiritController \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Spirit Controller deployed to $(NETWORK)"

# ============================================================================
# ABRAHAM NFT DEPLOYMENTS
# ============================================================================

.PHONY: deploy-abraham-early-works
deploy-abraham-early-works:
	@echo "🎨 Deploying Abraham Early Works NFT to $(NETWORK)..."
	@forge script script/DeployAbrahamEarlyWorks.s.sol:DeployAbrahamEarlyWorks \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Abraham Early Works NFT deployed to $(NETWORK)"

.PHONY: deploy-abraham-covenant
deploy-abraham-covenant:
	@echo "📜 Deploying Abraham Covenant NFT to $(NETWORK)..."
	@forge script script/DeployAbrahamCovenant.s.sol:DeployAbrahamCovenant \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Abraham Covenant NFT deployed to $(NETWORK)"

.PHONY: deploy-abraham-auction
deploy-abraham-auction:
	@echo "🔨 Deploying Abraham Auction to $(NETWORK)..."
	@forge script script/DeployAbrahamAuction.s.sol:DeployAbrahamAuction \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Abraham Auction deployed to $(NETWORK)"

# ============================================================================
# GEPETTO NFT DEPLOYMENTS
# ============================================================================

.PHONY: deploy-gepetto-toys
deploy-gepetto-toys:
	@echo "🧸 Deploying Gepetto Toys NFT to $(NETWORK)..."
	@forge script script/DeployGepettoToys.s.sol:DeployGepettoToys \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Gepetto Toys NFT deployed to $(NETWORK)"

.PHONY: deploy-gepetto-minter
deploy-gepetto-minter:
	@echo "🏭 Deploying Gepetto Minter to $(NETWORK)..."
	@forge script script/DeployGepettoMinter.s.sol:DeployGepettoMinter \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Gepetto Minter deployed to $(NETWORK)"

# ============================================================================
# SOLIENNE NFT DEPLOYMENTS
# ============================================================================

.PHONY: deploy-solienne-manifesto
deploy-solienne-manifesto:
	@echo "📖 Deploying Solienne Manifesto NFT to $(NETWORK)..."
	@forge script script/DeploySolienneManifesto.s.sol:DeploySolienneManifesto \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Solienne Manifesto NFT deployed to $(NETWORK)"

.PHONY: deploy-solienne-origin-series
deploy-solienne-origin-series:
	@echo "🌟 Deploying Solienne Origin Series NFT to $(NETWORK)..."
	@forge script script/DeploySolienneOriginSeries.s.sol:DeploySolienneOriginSeries \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Solienne Origin Series NFT deployed to $(NETWORK)"

.PHONY: deploy-solienne-genesis-portraits
deploy-solienne-genesis-portraits:
	@echo "🖼️ Deploying Solienne Genesis Portraits NFT to $(NETWORK)..."
	@forge script script/DeploySolienneGenesisPortraits.s.sol:DeploySolienneGenesisPortraits \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Solienne Genesis Portraits NFT deployed to $(NETWORK)"

# ============================================================================
# AUCTION DEPLOYMENTS
# ============================================================================

.PHONY: deploy-thirteen-year-auction
deploy-thirteen-year-auction:
	@echo "📅 Deploying Thirteen Year Auction NFT to $(NETWORK)..."
	@forge script script/DeployThirteenYearAuction.s.sol:DeployThirteenYearAuction \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Thirteen Year Auction NFT deployed to $(NETWORK)"

.PHONY: deploy-daily-auction
deploy-daily-auction:
	@echo "📆 Deploying Daily Auction NFT to $(NETWORK)..."
	@forge script script/DeployDailyAuction.s.sol:DeployDailyAuction \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Daily Auction NFT deployed to $(NETWORK)"

# ============================================================================
# SUPERFLUID DEPLOYMENTS
# ============================================================================

.PHONY: deploy-distribution-pool
deploy-distribution-pool:
	@echo "💧 Deploying Superfluid Distribution Pool to $(NETWORK)..."
	@forge script script/DeployDistributionPool.s.sol:DeployDistributionPool \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Distribution Pool deployed to $(NETWORK)"

.PHONY: deploy-spirit-supertoken
deploy-spirit-supertoken:
	@echo "🌊 Deploying SPIRIT SuperToken to $(NETWORK)..."
	@forge script script/DeploySpiritSuperToken.s.sol:DeploySpiritSuperToken \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ SPIRIT SuperToken deployed to $(NETWORK)"

# ============================================================================
# AGENT REGISTRY DEPLOYMENTS
# ============================================================================

.PHONY: deploy-agent-registry
deploy-agent-registry:
	@echo "🤖 Deploying Agent Registry to $(NETWORK)..."
	@forge script script/DeployAgentRegistry.s.sol:DeployAgentRegistry \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY) \
		-vvv
	@echo "✅ Agent Registry deployed to $(NETWORK)"

# ============================================================================
# VERIFICATION
# ============================================================================

.PHONY: verify-contract
verify-contract:
	@echo "🔍 Verifying contract on Etherscan..."
	@if [ -z "$(ADDRESS)" ] || [ -z "$(CONTRACT)" ]; then \
		echo "❌ Usage: make verify-contract ADDRESS=0x... CONTRACT=ContractName"; \
		exit 1; \
	fi
	@forge verify-contract $(ADDRESS) $(CONTRACT) \
		--chain $(NETWORK) \
		--watch
	@echo "✅ Contract verified"

# ============================================================================
# UTILITIES
# ============================================================================

.PHONY: get-deployment-addresses
get-deployment-addresses:
	@echo "📋 Latest deployment addresses for $(NETWORK):"
	@if [ -d "broadcast" ]; then \
		find broadcast -name "*.json" -path "*/$(NETWORK)/*" -exec echo {} \; | \
		xargs jq -r '.transactions[] | select(.contractName != null) | "\(.contractName): \(.contractAddress)"' 2>/dev/null | \
		sort -u; \
	else \
		echo "No deployments found"; \
	fi

.PHONY: check-balance
check-balance:
	@echo "💰 Checking balance for $(ACCOUNT) on $(NETWORK)..."
	@ADDR=$$(cast wallet address --account $(ACCOUNT)); \
	BALANCE=$$(cast balance $$ADDR --rpc-url $(NETWORK)); \
	echo "Address: $$ADDR"; \
	echo "Balance: $$BALANCE wei"; \
	echo "Balance: $$(cast from-wei $$BALANCE) ETH"

.PHONY: estimate-gas
estimate-gas:
	@echo "⛽ Estimating gas for deployment..."
	@if [ -z "$(SCRIPT)" ]; then \
		echo "❌ Usage: make estimate-gas SCRIPT=DeploySpiritRegistryV2"; \
		exit 1; \
	fi
	@forge script script/$(SCRIPT).s.sol:$(SCRIPT) \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--estimate-gas

# ============================================================================
# NETWORK SHORTCUTS
# ============================================================================

.PHONY: use-mainnet
use-mainnet:
	@echo "🔷 Switching to Ethereum Mainnet"
	$(eval NETWORK := ethereum)

.PHONY: use-sepolia
use-sepolia:
	@echo "🔶 Switching to Sepolia Testnet"
	$(eval NETWORK := sepolia)

.PHONY: use-base
use-base:
	@echo "🔵 Switching to Base Mainnet"
	$(eval NETWORK := base)

.PHONY: use-base-sepolia
use-base-sepolia:
	@echo "🟦 Switching to Base Sepolia"
	$(eval NETWORK := base-sepolia)

.PHONY: use-local
use-local:
	@echo "🏠 Switching to Local Network"
	$(eval NETWORK := localhost)

# ============================================================================
# LOCAL DEVELOPMENT
# ============================================================================

.PHONY: start-local-node
start-local-node:
	@echo "🔨 Starting local Anvil node..."
	@anvil --accounts 10 --balance 10000

.PHONY: fork-mainnet
fork-mainnet:
	@echo "🍴 Forking Ethereum mainnet locally..."
	@anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/$(RPC_API_KEY)

.PHONY: fork-base
fork-base:
	@echo "🍴 Forking Base mainnet locally..."
	@anvil --fork-url https://base-mainnet.g.alchemy.com/v2/$(RPC_API_KEY)

# ============================================================================
# CONFIGURATION
# ============================================================================

.PHONY: show-config
show-config:
	@echo "📋 Current Configuration:"
	@echo "  NETWORK: $(NETWORK)"
	@echo "  ACCOUNT: $(ACCOUNT)"
	@echo "  VERIFY: $(VERIFY)"
	@echo ""
	@echo "📁 Foundry Config:"
	@forge config

.PHONY: install-deps
install-deps:
	@echo "📦 Installing Foundry dependencies..."
	@forge install OpenZeppelin/openzeppelin-contracts --no-commit
	@forge install foundry-rs/forge-std --no-commit
	@echo "✅ Dependencies installed"

.PHONY: update-deps
update-deps:
	@echo "📦 Updating Foundry dependencies..."
	@forge update
	@echo "✅ Dependencies updated"

# ============================================================================
# END
# ============================================================================