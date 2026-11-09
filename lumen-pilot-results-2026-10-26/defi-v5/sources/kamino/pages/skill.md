---
title: Kamino Finance
name: Kamino Finance
description: "Solana DeFi protocol for automated yield optimization, borrowing and lending, leveraged positions, and concentrated liquidity vaults. Three product areas: Docs (end-user guides), Buildkit (developer APIs, TypeScript SDK, and Rust crate), and Curators (institutional vault management)."
metadata:
    author: kamino
    version: "1.0"
    mintlify-proj: kamino
---

## Capabilities

Kamino Finance is the largest borrowing and lending protocol on Solana, offering the following core product lines:

**Multiply** — One-click leveraged yield vaults. Users open positions with automated flash loan mechanics and eMode for capital-efficient exposure to yield-bearing assets (e.g. SOL).

**Borrow/Lend (Klend)** — Lending markets. Users supply collateral to borrow assets or earn interest on deposits. Supports Cross Mode and Isolated Mode, multiple asset tiers, and automated liquidations.

**Liquidity Vaults** — Automated concentrated liquidity strategies on Solana DEXes. Auto-compound, auto-rebalance, and auto-swap handle all position management.

**Earn Vaults (K-Vaults)** — Curated yield vaults that distribute capital across multiple Klend reserves to maximize returns. Accessible to both end users and institutional curators.

Developers can integrate through the REST API for language-agnostic access, the TypeScript SDK for full transaction construction and on-chain interactions, or the Rust `klend-interface` crate for Rust clients, bots, and CPI integrations. Borrow provides the Rust interface crate directly, while Earn includes Rust client and CPI integration examples in its documentation. The kamino CLI via Klend SDK can also be used to create and manage curator vaults.

## OpenAPI Specifications

- **Kamino Public API**: https://api.kamino.finance/openapi/json?openapi=3.0.0
  - Vault data, market data, user positions, historical metrics, rewards
- **Kamino Transaction API (KTX)**: https://api.kamino.finance/ktx/documentation/json
  - Transaction building for deposit, withdraw, borrow, repay — returns unsigned Solana transactions

## Skills

### Earn Vault Operations (Buildkit)

Developer reference with SDK and API examples: https://kamino.com/docs/build/developers/earn.md

**Vault Data Queries**
- `GET /kvaults/vaults` — List all Kamino Earn vaults
- `GET /kvaults/vaults/{pubkey}` — Get single vault by address
- `GET /kvaults/vaults/{pubkey}/metrics` — Current vault metrics (APY, TVL, utilization)
- `GET /kvaults/vaults/{pubkey}/metrics/history` — Historical vault metrics
- SDK: `vault.getVaultHoldings(ledgerInstant)`, `vault.getAPYs(ledgerInstant)`, `vault.getExchangeRate(ledgerInstant)` (`ledgerInstant = await getCurrentLedgerInstant(rpc)`)
- Developer guide (SDK + API examples): https://kamino.com/docs/build/developers/earn/data/vault-data.md
- Get vault APYs (how-to, API + SDK): https://kamino.com/docs/build/earn/get-vault-apys.md

**User Vault Positions**
- `GET /kvaults/users/{pubkey}/positions` — All user vault positions
- `GET /kvaults/users/{userPubkey}/positions/{vaultPubkey}` — Single user position
- `GET /kvaults/users/{userPubkey}/vaults/{vaultPubkey}/pnl` — Current PnL and cost basis
- `GET /kvaults/users/{pubkey}/transactions` — All vault transactions for user
- Buildkit guide (SDK + API examples): https://kamino.com/docs/build/developers/earn/data/user-position-data.md

**Vault Deposit**
- `POST /ktx/kvault/deposit` — Build unsigned deposit transaction
- `POST /ktx/kvault/deposit-instructions` — Get deposit instructions with lookup tables
- SDK: `vault.depositIxs(signer, amount, reservesMap, farmState, null)`
- Buildkit guide (TypeScript SDK, Rust client, Rust CPI): https://kamino.com/docs/build/developers/earn/operations/deposit.md
- SDK recipe: https://kamino.com/docs/build/recipes/earn/earn-via-sdk.md
- Tutorial: https://kamino.com/docs/build/tutorials/earn/earn-and-withdraw.md

**Vault Withdraw**
- `POST /ktx/kvault/withdraw` — Build unsigned withdraw transaction
- `POST /ktx/kvault/withdraw-instructions` — Get withdraw instructions with lookup tables
- SDK: `vault.withdrawIxs(signer, shares, ledgerInstant, reservesMap, farmState, null)`
- Buildkit guide (TypeScript SDK, Rust client, Rust CPI): https://kamino.com/docs/build/developers/earn/operations/withdraw.md
- SDK recipe: https://kamino.com/docs/build/recipes/earn/earn-withdraw-via-sdk.md

**Vault Creation (SDK only)**
- SDK: `KaminoManager.createVaultIxs(vaultConfig)` — Initialize new vault
- Buildkit guide (SDK): https://kamino.com/docs/build/developers/earn/data/advanced-concepts/creating-a-vault.md
- Tutorial: https://kamino.com/docs/build/tutorials/earn/creating-a-vault.md

### Borrow Market Operations (Buildkit)

Developer reference with SDK and API examples: https://kamino.com/docs/build/developers/borrow.md

**Market Data**
- `GET /v2/kamino-market` — All Kamino Lending markets
- `GET /kamino-market/{pubkey}/reserves/metrics` — Current reserve metrics (APY, TVL, LTV)
- `GET /kamino-market/{marketPubkey}/reserves/{reservePubkey}/metrics/history` — Historical reserve metrics
- SDK: `KaminoMarket.load(rpc, marketAddress, await getMedianSlotDurationInMsFromLastEpochs())`, `market.getTotalDepositTVL()`
- SDK: `market.getExistingFloatRateReserveByMint(mint)`: variable-rate reserve for a token; actions take its `reserveAddress` because a token can have several reserves (variable and fixed rate)
- Buildkit guide (TypeScript SDK + Rust `klend-interface`): https://kamino.com/docs/build/developers/borrow/data/market-data.md

**User Loan Positions**
- `GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations` — All user obligations
- `GET /klend/loans/{pubkey}` — Specific loan details
- SDK: `market.getObligationByWallet(userAddress, new VanillaObligation(PROGRAM_ID))`
- Buildkit guide (TypeScript SDK + Rust `klend-interface`): https://kamino.com/docs/build/developers/borrow/data/user-position-data.md

**Deposit Collateral**
- `POST /ktx/klend/deposit` — Build unsigned deposit transaction
- SDK: `KaminoAction.buildDepositTxns({ kaminoMarket, amount, reserveAddress, owner, obligation: new VanillaObligation(PROGRAM_ID), useV2Ixs: true, scopeRefreshConfig: undefined, initUserMetadata: { skipInitialization: false, skipLutCreation: true }, currentLedgerInstant })`
- Buildkit guide (TypeScript SDK + Rust `klend-interface`): https://kamino.com/docs/build/developers/borrow/operations/deposit.md

**Borrow Assets**
- `POST /ktx/klend/borrow` — Build unsigned borrow transaction
- SDK: `KaminoAction.buildBorrowTxns({ kaminoMarket, amount, reserveAddress, owner, obligation, useV2Ixs: true, scopeRefreshConfig: undefined, currentLedgerInstant })`
- Buildkit guide (TypeScript SDK + Rust `klend-interface`): https://kamino.com/docs/build/developers/borrow/operations/borrow.md

**Repay Debt**
- `POST /ktx/klend/repay` — Build unsigned repay transaction
- SDK: `KaminoAction.buildRepayTxns({ kaminoMarket, amount, reserveAddress, owner, obligation, useV2Ixs: true, scopeRefreshConfig: undefined, currentLedgerInstant })`
- Buildkit guide (TypeScript SDK + Rust `klend-interface`): https://kamino.com/docs/build/developers/borrow/operations/repay.md

**Withdraw Collateral**
- `POST /ktx/klend/withdraw` — Build unsigned withdraw transaction
- SDK: `KaminoAction.buildWithdrawTxns({ kaminoMarket, amount, reserveAddress, owner, obligation, useV2Ixs: true, scopeRefreshConfig: undefined, currentLedgerInstant })`
- Buildkit guide (TypeScript SDK + Rust `klend-interface`): https://kamino.com/docs/build/developers/borrow/operations/withdraw.md

### Multiply Operations (Buildkit)

**Position Health Monitoring**
- `GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations` — Get all user obligations including multiply positions
- SDK: `market.getUserObligationsByTag(ObligationTypeTag.Multiply, userAddress, ledgerInstant)` — Filter obligations by type
- Metrics: Total Deposit, Total Borrow, Net Value, Leverage, Borrow Limit, Liquidation LTV
- Guide: https://kamino.com/docs/build/developers/multiply/data/health-metrics.md

**Flash Loans**
- Requires: `@kamino-finance/klend-sdk`
- SDK: `getFlashLoanInstructions({...})` — Returns `{ flashBorrowIx, flashRepayIx }` for an uncollateralized loan repaid in the same transaction
- Guide: https://kamino.com/docs/build/developers/multiply/flash-loans.md

**Deposit with xStocks**
- Requires: `@kamino-finance/klend-sdk`
- SDK: Create leveraged positions through atomic looping
- Guide: https://kamino.com/docs/build/developers/multiply/operations/deposit-xstocks.md

**Repay with xStocks**
- Requires: `@kamino-finance/klend-sdk`
- SDK: Repay debt on leveraged positions
- Guide: https://kamino.com/docs/build/developers/multiply/operations/repay-xstocks.md

**Withdraw with xStocks**
- Requires: `@kamino-finance/klend-sdk`
- SDK: Withdraw collateral from leveraged positions
- Guide: https://kamino.com/docs/build/developers/multiply/operations/withdraw-xstocks.md

**Deleverage with xStocks**
- Requires: `@kamino-finance/klend-sdk`
- SDK: `getWithdrawWithLeverageIxs()`: shrink the position and withdraw value while keeping its LTV, so leverage stays the same. To lower leverage, repay debt
- Guide: https://kamino.com/docs/build/developers/multiply/operations/deleverage-xstocks.md

**Repay with Collateral (KSwap)**
- Requires: `@kamino-finance/klend-sdk`, `@kamino-finance/kswap-sdk@2.9.0`, `@kamino-finance/scope-sdk`, `@solana-program/address-lookup-table`
- SDK: `getRepayWithCollIxs()` with `quoter`/`swapper` callbacks built on `kswap.getAllRoutes(params, await loadRouterContext(rpc, tokenIn, tokenOut))`; quote `priceAInB` is the mid price (`amountOut / amountIn` in token units)
- Sequencing: (1) build one candidate transaction per swap route, (2) compress each with lookup tables from `POST /luts/find-minimal` (one request per candidate), (3) send the best-output candidate that fits the size limit
- Guide: https://kamino.com/docs/build/developers/multiply/operations/repay-collateral.md

**Multiply Deposit (KSwap)**
- Requires: `@kamino-finance/klend-sdk`, `@kamino-finance/kswap-sdk@2.9.0`, `@kamino-finance/scope-sdk`, `@solana-program/address-lookup-table`
- SDK: `getDepositWithLeverageIxs()` with `quoter`/`swapper` callbacks built on `kswap.getAllRoutes()`, `getScopeRefreshIxForObligationAndReserves()`
- Sequencing: (1) for a wallet without Kamino user metadata, send one `getUserLutAddressAndSetupIxs(market, signer, none(), false)` setup tx, (2) build one candidate transaction per swap route, (3) compress each with lookup tables from `POST /luts/find-minimal`, (4) send the best-output candidate that fits the size limit
- Tutorial: https://kamino.com/docs/build/tutorials/borrow/multiply-deposit-kswap.md

### Liquidity Vault Operations (Buildkit)

Developer reference with SDK and API examples: https://kamino.com/docs/build/developers/liquidity.md

**Strategy Data Queries**
- `GET /strategies?env=mainnet-beta&status=LIVE` — List all live strategies
- `GET /strategies/{pubkey}/metrics?env=mainnet-beta` — Current strategy metrics (share price, TVL, APY)
- `GET /v2/strategies/{pubkey}/history` — Historical strategy metrics
- `GET /strategies/tvl?env=mainnet-beta` — Aggregate TVL across all strategies
- `GET /strategies/fees-and-rewards?env=mainnet-beta&period=24h` — Fees and rewards earned
- SDK: `kamino.getStrategiesWithFilters()`, `kamino.getStrategyShareData()`, `kamino.getStrategySharePrice()`
- Buildkit guide (SDK + API examples): https://kamino.com/docs/build/developers/liquidity/data/strategy.md

**User Position Data**
- `GET /v2/strategies/{pubkey}/shareholders/{wallet}/pnl` — Current PnL and cost basis
- `GET /v2/strategies/{pubkey}/shareholders/{wallet}/pnl/history` — Historical PnL
- `GET /strategies/{pubkey}/shareholders/{wallet}/fees-and-rewards` — User fees and rewards
- `GET /v2/shareholders/{wallet}/transactions` — User transactions across strategies
- SDK: `kamino.getUserPositions()`
- Buildkit guide (SDK + API examples): https://kamino.com/docs/build/developers/liquidity/data/user-position.md

**Deposit**
- SDK (single-sided, auto-swaps half via Jupiter): `kamino.singleSidedDepositTokenB(strategy, amount, signer, slippageBps)`
- SDK (two-sided): `kamino.deposit(strategyWithAddress, amountA, amountB, signer)`
- Buildkit guide (SDK): https://kamino.com/docs/build/developers/liquidity/operations/deposit.md

**Withdraw**
- SDK: `kamino.withdrawAllShares(strategyWithAddress, signer)`
- Buildkit guide (SDK): https://kamino.com/docs/build/developers/liquidity/operations/withdraw.md

### Portfolio (Buildkit)

Cross-product position and reward data for a wallet. Developer reference with examples: https://kamino.com/docs/build/developers/portfolio.md

**Full Portfolio**
- `GET /portfolio/{pubkey}` — All of a wallet's positions across Kamino products in one call (lending, multiply, leverage, liquidity, earn, private credit, staking). Source data; totals/PnL are composed client-side
- Buildkit guide (response fields + examples): https://kamino.com/docs/build/developers/portfolio/response.md

**Pending Rewards**
- `GET /portfolio/{pubkey}/rewards` — Pending farm rewards for a wallet across all products

### Scope SDK Operations (Buildkit)

Developer reference with SDK and API examples: https://kamino.com/docs/build/developers/oracle/overview.md

**Read All Prices**
- `GET /oracles/prices?source=scope` — Off-chain aggregated Scope prices keyed by mint
- SDK: `scope.getSingleOraclePrices({ config })`
- Buildkit guide (SDK + API examples): https://kamino.com/docs/build/developers/oracle/data/prices.md

**Get a Single Token Price**
- `GET /prices?source=scope` — Off-chain price by mint
- SDK: `scope.getPriceFromChain(chain, oraclePrices)` — resolves via a scope chain (up to 4 hops)
- Buildkit guide (SDK + API examples): https://kamino.com/docs/build/developers/oracle/data/prices.md

**Token Price History**
- `GET /prices/history?token={mint|symbol}` — Historical USD price series for a token. Returns `[price, timestamp]` pairs oldest-to-newest
- Optional params: `frequency` (`minute`|`hour`|`day`), `start`/`end` (ISO 8601)
- API reference: https://kamino.com/docs/build/api-reference/oracle/token-prices-history.md

**Feed Internals**
- SDK: `scope.getSingleFeedConfiguration()`, `scope.getChainMetadata()`, `scope.getOracleMappings()`
- Buildkit guide: https://kamino.com/docs/build/developers/oracle/data/feeds.md

**Refresh Prices (Permissionless Crank)**
- SDK: `scope.refreshPriceListIx({ config }, tokens)` — Returns one instruction refreshing the listed slots, or `null` when none of them can be refreshed this way (e.g. Pyth Lazer slots)
- Buildkit guide: https://kamino.com/docs/build/developers/oracle/operations/refresh.md

### Advanced Borrow Operations (Buildkit)

**Referral System**
- Requires: `@kamino-finance/klend-sdk`
- SDK: `getInitReferrerStateAndShortUrlIxs()`, `getReferrerForShortUrl()`
- Tutorial: https://kamino.com/docs/build/tutorials/borrow/referrer-setup.md

### Curators (Market and Vault Curation)

Curators deploy and operate their own lending markets and vaults. The pages below cover the full setup and day-2 management flow, with UI, SDK, and CLI walkthroughs. Curation code lives on the linked pages; none is inlined here.

**Vault Curation**
- Overview: https://kamino.com/docs/curators/vaults.md
- How vaults work: https://kamino.com/docs/curators/vaults/concepts/how-vaults-work.md
- Create a vault: https://kamino.com/docs/curators/vaults/guides/create-a-vault.md
- Configure allocations: https://kamino.com/docs/curators/vaults/guides/configure-allocations.md
- Configure fixed-rate allocations: https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md
- Enable whitelisted reserves: https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md
- Set up the insurance pool: https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md
- Enable permissioning: https://kamino.com/docs/curators/vaults/guides/enable-permissioning.md
- Collect fees: https://kamino.com/docs/curators/vaults/guides/collect-fees.md
- Configure farms: https://kamino.com/docs/curators/vaults/guides/configure-farms.md
- Transfer admin to multisig: https://kamino.com/docs/curators/vaults/guides/transfer-admin.md
- Parameter reference: https://kamino.com/docs/curators/reference/parameters.md

**Market Curation**
- Overview: https://kamino.com/docs/curators/markets.md
- Quickstart: https://kamino.com/docs/curators/markets/quickstart.md
- Create a market: https://kamino.com/docs/curators/markets/creating-a-market.md
- Market settings: https://kamino.com/docs/curators/markets/market-settings.md
- Transfer ownership to multisig: https://kamino.com/docs/curators/markets/transfer-to-multisig.md
- Add reserves: https://kamino.com/docs/curators/markets/adding-reserves.md
- Configure oracles: https://kamino.com/docs/curators/markets/configuring-oracles.md
- Scope oracle types: https://kamino.com/docs/curators/markets/scope-oracle-types.md
- Risk parameters: https://kamino.com/docs/curators/markets/risk-parameters.md
- Withdrawal caps: https://kamino.com/docs/curators/markets/withdrawal-caps.md
- Farms and rewards: https://kamino.com/docs/curators/markets/farms-and-rewards.md
- Fixed-rate reserves: https://kamino.com/docs/curators/markets/fixed-rate-reserves.md
- Updating reserves (day-2): https://kamino.com/docs/curators/markets/reserve-management.md
- Reserve config reference: https://kamino.com/docs/curators/markets/reserve-parameters.md
- Market config reference: https://kamino.com/docs/curators/markets/market-config-reference.md

**Optional Market Features**
- Liquidations: https://kamino.com/docs/curators/markets/liquidations.md
- Elevation groups (eMode): https://kamino.com/docs/curators/markets/elevation-groups.md
- Permissioned markets: https://kamino.com/docs/curators/markets/permissioned-markets.md
- Auto-deleverage: https://kamino.com/docs/curators/markets/auto-deleverage.md
- Borrow orders: https://kamino.com/docs/curators/markets/borrow-orders.md
- Obligation orders: https://kamino.com/docs/curators/markets/obligation-orders.md
- Withdrawal queue: https://kamino.com/docs/curators/markets/withdrawal-queue.md

**CLI (kamino-manager)**
- Market CLI command index: https://kamino.com/docs/curators/markets/cli-command-index.md
- Install and setup: https://kamino.com/docs/build/cli/installation-setup.md
- Market operations: https://kamino.com/docs/build/cli/market-operations.md
- Vault operations: https://kamino.com/docs/build/cli/vault-operations.md

**Curator Data Queries**
- `GET /kvaults/vaults/{pubkey}` — Vault details and current state
- `GET /kvaults/vaults/{pubkey}/metrics` — Vault performance metrics
- `GET /kvaults/users/{userPubkey}/positions/{vaultPubkey}` — Depositor positions
- `GET /kvaults/rewards` — Active vault reward programs
- Read market data (API and SDK): https://kamino.com/docs/curators/markets/market-data.md
- Programmatic integration (SDK, API, RPC): https://kamino.com/docs/curators/markets/programmatic-integration.md

### Rewards & Yield

**KLend Rewards**
- `GET /klend/users/{pubkey}/rewards` — User claimable KLend rewards
- `GET /klend/rewards` — All active KLend reward metrics
- Requires (SDK reward calc): `@kamino-finance/farms-sdk` — `FarmState`, `calculateCurrentRewardPerToken()`
- Requires (SDK claim): `@kamino-finance/farms-sdk` — `Farms`, `farm.claimForUserForFarmAllRewardsIx()`
- Tutorial (APY calc): https://kamino.com/docs/build/tutorials/borrow/calculate-reserve-reward-apy.md
- Tutorial (claim): https://kamino.com/docs/build/tutorials/borrow/claim-user-rewards.md

**KVault Rewards**
- `GET /kvaults/rewards` — All active vault rewards
- `GET /kvaults/users/{pubkey}/rewards` — User season points per vault

**Farms (staking and rewards via `@kamino-finance/farms-sdk`)**
- Overview: https://kamino.com/docs/build/developers/rewards/overview.md
- Farm state, discovery, incentive APY: https://kamino.com/docs/build/developers/rewards/data/farm-state.md
- User stake, pending rewards, lockup and cooldown: https://kamino.com/docs/build/developers/rewards/data/user-position.md
- Stake (`stakeIx`): https://kamino.com/docs/build/developers/rewards/operations/stake.md
- Unstake (`unstakeIx`): https://kamino.com/docs/build/developers/rewards/operations/unstake.md
- Withdraw unstaked (`withdrawUnstakedDepositIx`): https://kamino.com/docs/build/developers/rewards/operations/withdraw-unstaked.md
- Harvest all rewards (`claimForUserForFarmAllRewardsIx`): https://kamino.com/docs/build/developers/rewards/operations/harvest.md

**Staking Yields**
- `GET /v2/staking-yields` — Latest staking yields for all LSTs
- `GET /yields/{yieldSource}/history` — Historical yield data

### Utility

**Tokens**
- `GET /tokens-api/tokens` — Token metadata and market data for all tokens known to Kamino. Returns mint, symbol, name, decimals, logo URL, verification status, 24h trading volume, and market cap
- Query params: `verified` (boolean), `limit` (default 20, max 1000), `mint` (base58), `symbol`
- API reference: https://kamino.com/docs/build/api-reference/tokens/token-list.md

**Oracle Prices**
- `GET /oracles/prices` — All oracle prices for Klend market assets
- `GET /prices` — USD prices for all tokens tracked by Kamino
- `GET /prices/history` — Historical USD price series for a token. Returns `[price, timestamp]` pairs oldest-to-newest. Params: `token` (mint or symbol, required), `frequency` (`minute`|`hour`|`day`), `start`/`end` (ISO 8601)

**Portfolio**
- `GET /portfolio/{pubkey}` — All of a wallet's positions across Kamino products in one call (lending, multiply, leverage, liquidity, earn, private credit, staking). Source data; totals/PnL are composed client-side
- `GET /portfolio/{pubkey}/rewards` — Pending farm rewards for a wallet across all products

**Lookup Tables**
- `POST /luts/find-minimal` — Find minimal LUT set for transaction compression
- CDN resource: `GET https://cdn.kamino.finance/resources.json` — Returns token-pair-specific LUT addresses under `mainnet-beta.multiplyLUTsPairs[collMint][debtMint]` and `mainnet-beta.repayWithCollLUTs[collMint-debtMint]`

**Solana Metadata**
- `GET /epochs` — Epoch start/end times and slot numbers
- `GET /slots/duration` — Median slot duration from last 3 epochs (SDK: `getMedianSlotDurationInMsFromLastEpochs()`; pass it to `KaminoMarket.load`, since a hard-coded value misstates fixed-rate APYs)

## Workflows

### Deposit into Earn Vault (REST API)

1. List vaults: `GET /kvaults/vaults`
2. Get metrics: `GET /kvaults/vaults/{pubkey}/metrics`
3. Build deposit tx: `POST /ktx/kvault/deposit` with `{ wallet, kvault, amount }`
4. Sign and send transaction client-side

Full walkthrough: https://kamino.com/docs/build/recipes/earn/earn-via-api.md

### Earn and Borrow Operations

Full walkthrough per operation (TypeScript SDK, Rust, and REST API where available):
- Earn deposit: https://kamino.com/docs/build/developers/earn/operations/deposit.md
- Earn withdraw: https://kamino.com/docs/build/developers/earn/operations/withdraw.md
- Borrow deposit collateral: https://kamino.com/docs/build/developers/borrow/operations/deposit.md
- Borrow assets: https://kamino.com/docs/build/developers/borrow/operations/borrow.md
- Repay debt: https://kamino.com/docs/build/developers/borrow/operations/repay.md
- Withdraw collateral: https://kamino.com/docs/build/developers/borrow/operations/withdraw.md

### Create a Curator Vault (TypeScript SDK)

1. Install: `npm install @kamino-finance/klend-sdk @solana/kit`
2. Configure: `new KaminoVaultConfig({ admin, tokenMint, performanceFeeRatePercentage, ... })`
3. Create: `KaminoManager.createVaultIxs(config)`
4. Set allocations, configure farm, transfer to multisig

Full walkthrough: https://kamino.com/docs/build/tutorials/earn/creating-a-vault.md
Curator guide: https://kamino.com/docs/curators/vaults/guides/create-a-vault.md

## Integration

**REST API** — Language-agnostic HTTP endpoints
- Base URL: `https://api.kamino.finance`
- OpenAPI Spec (Data): https://api.kamino.finance/openapi/json?openapi=3.0.0
- OpenAPI Spec (Transactions): https://api.kamino.finance/ktx/documentation/json
- Guide: https://kamino.com/docs/build/developers/api-vs-sdk.md

**TypeScript SDK** — On-chain transaction building
- GitHub: https://github.com/Kamino-Finance/klend-sdk
- Core: `npm install @kamino-finance/klend-sdk @solana/kit`
- Concentrated liquidity vaults: `npm install @kamino-finance/kliquidity-sdk`
- Farm staking and rewards: `npm install @kamino-finance/farms-sdk`
- KSwap routing (multiply, repay-with-collateral): `npm install @kamino-finance/kswap-sdk@2.9.0`
- KSwap swap API: https://kamino.com/docs/build/api-reference/kswap/swap.md
- Scope SDK (oracle prices, feed config, refresh): `npm install @kamino-finance/scope-sdk`
- LUT fetching (multiply, repay-with-collateral): `npm install @solana-program/address-lookup-table`
- `@solana/kit` versions differ: klend-sdk 13 and kswap-sdk 2.9.0 use kit 2; farms-sdk 5 and kliquidity-sdk 16 use kit 8, so install them in separate projects

**Rust Interface Crate (Borrow markets)** for Rust clients, bots, and on-chain CPI
- Crate: https://crates.io/crates/klend-interface
- Examples: https://github.com/Kamino-Finance/klend/tree/master/libs/klend-interface/examples

**Documentation**
- Product Docs: https://kamino.com/docs.md
- Developer Docs: https://kamino.com/docs/build.md
- Curator Docs: https://kamino.com/docs/curators.md

## Context

- Full page index: https://kamino.com/docs/llms.txt
- API Reference: https://kamino.com/docs/build/api-reference/introduction.md
- Risk Dashboard: https://risk.kamino.finance
- Discord: https://discord.com/invite/kamino
