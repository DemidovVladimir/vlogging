> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Agent Integrations: Using OpenClaw with Kamino

> Build an OpenClaw skill to enable AI agents to autonomously interact with Kamino's lending markets and yield vaults

> [!TIP]
>
> By the end of this tutorial, you will have the following skill files configured for your agent.

| File | Purpose |
| - | - |
| [`SKILL.md`](#skill-md) | Main skill instructions: capabilities, quick reference, and workflows |
| [`references/setup.md`](#references/setup-md) | Environment setup: RPC, wallet keypair, OpenClaw config |
| [`references/earn.md`](#references/earn-md) | Earn vault operations: deposit, withdraw, vault data, user positions |
| [`references/borrow.md`](#references/borrow-md) | Borrow market operations: deposit, borrow, repay, withdraw, market data |
| [`references/multiply.md`](#references/multiply-md) | Multiply operations: leveraged positions, flash loans, position health |
| [`references/liquidity.md`](#references/liquidity-md) | Liquidity strategy operations: deposit, withdraw, strategy metrics, user PnL |
| [`references/rewards.md`](#references/rewards-md) | Farm operations: stake, unstake, harvest, farm state, pending rewards |
| [`references/api.md`](#references/api-md) | Complete REST API endpoint reference for all products |

## Prerequisites

* Node.js 22+
* Solana wallet with SOL for transaction fees
* RPC endpoint

## Skill Folder Structure

**1. Create Skill Directory**

Create a new directory for the Kamino skill in your OpenClaw workspace:

```bash theme={null}
mkdir -p ~/.openclaw/workspace/skills/kamino
cd ~/.openclaw/workspace/skills/kamino
```

**2. Create File Structure**

Create the following files in the directory:

```
kamino/
├── SKILL.md              # Main skill instructions for the agent
└── references/
    ├── setup.md          # Environment and SDK setup
    ├── earn.md           # Kamino Earn operations (vaults)
    ├── borrow.md         # Kamino Borrow operations (lending)
    ├── multiply.md       # Kamino Multiply operations (leverage)
    ├── liquidity.md      # Kamino Liquidity operations (strategies)
    ├── rewards.md        # Kamino Rewards operations (farms)
    └── api.md            # Kamino API reference
```

```bash theme={null}
mkdir -p references
touch SKILL.md references/setup.md references/earn.md references/borrow.md references/multiply.md references/liquidity.md references/rewards.md references/api.md
```

**3. Get a Solana RPC Endpoint**

Choose an RPC provider:

* **Free**: `https://api.mainnet-beta.solana.com` (rate limited)
* **Recommended**: Helius, QuickNode, or Triton (paid, production-ready)

**4. Create or Use Existing Wallet Keypair**

Create a new keypair if needed:

```bash theme={null}
solana-keygen new --outfile ~/solana-wallet.json
```

Or use an existing keypair file.

**5. Configure OpenClaw**

Add your Solana credentials to `~/.openclaw/openclaw.json`:

```json theme={null}
{
  "gateway": {
    "env": {
      "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com",
      "SOLANA_WS_URL": "wss://api.mainnet-beta.solana.com",
      "WALLET_KEYPAIR_PATH": "/path/to/your/solana-wallet.json"
    }
  }
}
```

Replace `/path/to/your/solana-wallet.json` with the actual path to your keypair file.

**6. Restart OpenClaw Gateway**

After updating the configuration:

```bash theme={null}
openclaw gateway restart
```

**7. Verify Setup**

Test your RPC connection:

```bash theme={null}
curl -X POST $SOLANA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### For Other AI Agents

* **Claude**: Copy the SKILL.md content into your conversation or attach as a file
* **Cursor**: Clone into `.cursor/skills/kamino` directory
* **Custom Agents**: Reference the markdown files directly

## File Templates

Copy the following templates into your skill files.

### SKILL.md

The main skill file that teaches agents how to interact with Kamino:

```markdown expandable theme={null}
# Kamino Skill

Interact with Kamino Finance on Solana: Earn vaults, Borrow markets, Liquidity strategies, and Rewards farms.

## Prerequisites

See [setup.md](references/setup.md) for installation and configuration.

Required:
- Solana RPC endpoint
- Wallet keypair for signing transactions
- `@solana/kit` and relevant Kamino SDKs installed

## What You Can Do

**Kamino Earn** - Deposit into yield-generating vaults
**Kamino Borrow** - Supply collateral, borrow assets, repay loans
**Kamino Multiply** - Open and manage leveraged positions
**Kamino Liquidity** - Deposit into automated concentrated liquidity strategies
**Kamino Rewards** - Stake, unstake, and harvest farm rewards
**KSwap** - Swap between any two tokens via Kamino's swap aggregator
**Oracle (Scope)** - Read token prices on-chain or via REST

## Quick Reference

| Operation | Method | Reference |
|-----------|--------|-----------|
| Earn: Deposit | SDK or API | [earn.md](references/earn.md) |
| Earn: Withdraw | SDK or API | [earn.md](references/earn.md) |
| Borrow: Deposit Collateral | SDK or API | [borrow.md](references/borrow.md) |
| Borrow: Borrow Assets | SDK or API | [borrow.md](references/borrow.md) |
| Borrow: Repay Loan | SDK or API | [borrow.md](references/borrow.md) |
| Borrow: Withdraw Collateral | SDK or API | [borrow.md](references/borrow.md) |
| Multiply: Open Position | SDK | [multiply.md](references/multiply.md) |
| Multiply: Monitor Health | SDK | [multiply.md](references/multiply.md) |
| Multiply: Repay or Withdraw | SDK | [multiply.md](references/multiply.md) |
| Liquidity: Deposit | SDK | [liquidity.md](references/liquidity.md) |
| Liquidity: Withdraw | SDK | [liquidity.md](references/liquidity.md) |
| Liquidity: Strategy Data | SDK or API | [liquidity.md](references/liquidity.md) |
| Rewards: Stake | SDK | [rewards.md](references/rewards.md) |
| Rewards: Unstake | SDK | [rewards.md](references/rewards.md) |
| Rewards: Harvest | SDK | [rewards.md](references/rewards.md) |
| KSwap: Swap Tokens | API | [api.md](references/api.md) |
| Oracle: Read Prices | SDK or API | [api.md](references/api.md) |
| Query Market Data | SDK | [borrow.md](references/borrow.md) |
| Get Vault/Market Lists | API | [api.md](references/api.md) |

## Core Workflow

### For Kamino Earn:
1. Choose a vault (get list via API or use known address)
2. Deposit tokens to earn yield
3. Withdraw vault shares when needed

### For Kamino Borrow:
1. Supply collateral to a market
2. Borrow assets against your collateral
3. Monitor health factor (keep LTV below 75%)
4. Repay loans and withdraw collateral

### For Kamino Multiply:
1. Choose a strategy (LST, JLP, stablecoin, or xStocks)
2. Open a leveraged position with target leverage
3. Monitor LTV and liquidation risk
4. Adjust leverage, repay debt, or close position

### For Kamino Liquidity:
1. Choose a strategy (get list via API or use known address)
2. Deposit tokens (single-sided or two-sided)
3. Monitor share price and PnL
4. Withdraw shares when needed

### For Kamino Rewards:
1. Find the farm for your position (by stake mint or known address)
2. Stake share tokens into the farm
3. Monitor pending rewards
4. Harvest rewards or unstake and withdraw

**SOL/BTC Market**: `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF`

## Reference Files

- **[setup.md](references/setup.md)** — Installation and OpenClaw configuration
- **[earn.md](references/earn.md)** — Vault deposit/withdraw code examples
- **[borrow.md](references/borrow.md)** — Lending market operations
- **[multiply.md](references/multiply.md)** — Leveraged position operations
- **[liquidity.md](references/liquidity.md)** — Liquidity strategy operations
- **[rewards.md](references/rewards.md)** — Farm staking and reward harvesting
- **[api.md](references/api.md)** — Complete API endpoint reference
```

### references/setup.md

Setup guide for using Kamino with OpenClaw:

```markdown expandable theme={null}
# Kamino Setup

Configure OpenClaw to interact with Kamino Finance protocols on Solana.

## Prerequisites

Before using this skill, you need:
- OpenClaw installed (Node.js 22+)
- Solana RPC endpoint (get from Helius, QuickNode, or use public endpoint)
- Solana wallet keypair file for signing transactions

For complete developer documentation: https://kamino.com/docs/build

## SDK Versions

The SDKs use different `@solana/kit` versions, so install them in separate projects:
- `@kamino-finance/klend-sdk` 13 and `@kamino-finance/kswap-sdk` 2.9.0 (Earn, Borrow, Multiply): kit 2
- `@kamino-finance/farms-sdk` 5 and `@kamino-finance/kliquidity-sdk` 16 (Rewards, Liquidity): kit 8

**SOL/BTC Market**: `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF`
```

### references/earn.md

Kamino Earn vault operations:

````markdown expandable theme={null}
# Kamino Earn Operations

Deposit into yield-generating vaults, withdraw shares, and query vault/user data.

## Dependencies

```bash
npm install @solana/kit @kamino-finance/klend-sdk decimal.js
```

## SDK Instantiation

```typescript
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoVault,
  KaminoManager,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();

const vault = new KaminoVault(
  rpc,
  address('VAULT_PUBKEY_HERE'),
  slotDuration
);

const manager = new KaminoManager(rpc, slotDuration);

const ledgerInstant = await getCurrentLedgerInstant(rpc);
```

## SDK Operations

| What to Do | SDK Method | Documentation |
|------------|------------|---------------|
| **Transactions** |
| Deposit to vault | `vault.depositIxs(signer, amount, reservesMap, farmState, null)` | [Recipe](https://docs.kamino.finance/build/recipes/earn/earn-via-sdk) |
| Withdraw from vault | `vault.withdrawIxs(signer, shareAmount, ledgerInstant, reservesMap, farmState, null)` | [Recipe](https://docs.kamino.finance/build/recipes/earn/earn-withdraw-via-sdk) |
| **Read Vault Data** |
| Get vault holdings | `vault.getVaultHoldings(ledgerInstant)` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/vault-data) |
| Get vault APY | `vault.getAPYs(ledgerInstant)` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/vault-data) |
| Get exchange rate | `vault.getExchangeRate(ledgerInstant)` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/vault-data) |
| Get allocations | `vault.getVaultAllocations()` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/vault-data) |
| Get vault overview | `manager.getVaultOverview(vault, tokenPrice, ledgerInstant, ...)` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/vault-data) |
| **Read User Data** |
| Get user shares | `vault.getUserShares(userAddress)` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/user-position-data) |
| Get all positions | `manager.getUserSharesBalanceAllVaults(userAddress)` | [Data Docs](https://kamino.com/docs/build/developers/earn/data/user-position-data) |

## API Operations

| What to Do | API Endpoint | Documentation |
|------------|--------------|---------------|
| **Transactions** |
| Deposit to vault | `POST /ktx/kvault/deposit` | [Recipe](https://docs.kamino.finance/build/recipes/earn/earn-via-api) |
| Withdraw from vault | `POST /ktx/kvault/withdraw` | [Recipe](https://docs.kamino.finance/build/recipes/earn/earn-withdraw-via-api) |
| **Read Vault Data** |
| List all vaults | `GET /kvaults/vaults` | [API Docs](https://api-docs.kamino.finance) |
| Get vault details | `GET /vault/{vaultPubkey}` | [API Docs](https://api-docs.kamino.finance) |
| Get vault metrics | `GET /vault/{vaultPubkey}/metrics` | [API Docs](https://api-docs.kamino.finance) |
| Historical metrics | `GET /vault/{vaultPubkey}/metrics/history` | [API Docs](https://api-docs.kamino.finance) |
| **Read User Data** |
| Get user positions | `GET /kvaults/users/{wallet}/positions` | [API Docs](https://api-docs.kamino.finance) |
| Get vault position | `GET /kvaults/users/{wallet}/vaults/{vaultPubkey}/position` | [API Docs](https://api-docs.kamino.finance) |
| Get position PnL | `GET /kvaults/users/{wallet}/vaults/{vaultPubkey}/pnl` | [API Docs](https://api-docs.kamino.finance) |
| Get transactions | `GET /kvaults/users/{wallet}/transactions` | [API Docs](https://api-docs.kamino.finance) |

## Important Notes

- Withdrawals use **vault share amounts**, not underlying token amounts
- SDK automatically handles farm unstaking if needed
- API transactions use Address Lookup Tables - must use `decompileTransactionMessageFetchingLookupTables`
- Historical data only available via API

## Complete Tutorial

[Earn and Withdraw Tutorial](https://docs.kamino.finance/build/tutorials/earn/earn-and-withdraw)
````

### references/borrow\.md

Kamino Borrow operations (deposit collateral, borrow, repay, withdraw):

````markdown expandable theme={null}
# Kamino Borrow Operations

Supply collateral, borrow assets, repay loans, withdraw collateral, and query market/user data.

**SOL/BTC Market**: `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF`

## Dependencies

```bash
npm install @solana/kit @kamino-finance/klend-sdk bn.js decimal.js
```

## SDK Instantiation

```typescript
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoMarket,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const ledgerInstant = await getCurrentLedgerInstant(rpc);

const userAddress = address('USER_WALLET_ADDRESS');
const obligation = await market!.getObligationByWallet(userAddress, new VanillaObligation(PROGRAM_ID));
```

## SDK Operations

| What to Do | SDK Method | Documentation |
|------------|------------|---------------|
| **Transactions** |
| Deposit collateral | `KaminoAction.buildDepositTxns({ kaminoMarket, amount, reserveAddress, owner, obligation, useV2Ixs, scopeRefreshConfig, initUserMetadata, currentLedgerInstant })` | [Guide](https://kamino.com/docs/build/developers/borrow/operations/deposit) |
| Borrow | `KaminoAction.buildBorrowTxns({ ... })` | [Guide](https://kamino.com/docs/build/developers/borrow/operations/borrow) |
| Repay | `KaminoAction.buildRepayTxns({ ... })` | [Guide](https://kamino.com/docs/build/developers/borrow/operations/repay) |
| Withdraw collateral | `KaminoAction.buildWithdrawTxns({ ... })` | [Guide](https://kamino.com/docs/build/developers/borrow/operations/withdraw) |
| Supply for interest (cTokens) | `KaminoAction.buildDepositReserveLiquidityTxns({ ... })` | [Tutorial](https://kamino.com/docs/build/tutorials/borrow/mint-ctokens) |
| Fixed-rate borrow order | `KaminoBorrowOrder.createFixedTermBorrowOrder({ ... })` + `KaminoAction.buildDepositAndSetBorrowOrderTxns({ ... })` | [Tutorial](https://kamino.com/docs/build/borrow/tutorials/fixed-rate-borrowing) |
| Instructions from an action | `KaminoAction.actionToIxs(action)` | |
| **Read Market Data** |
| Get the variable-rate reserve for a token | `market.getExistingFloatRateReserveByMint(mint)` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/market-data) |
| Get all reserves | `market.getReserves()` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/market-data) |
| Get reserve kind (variable or fixed rate) | `reserve.getKind().toString()` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/market-data) |
| Get total deposit / borrow TVL | `market.getTotalDepositTVL()`, `market.getTotalBorrowTVL()` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/market-data) |
| Get reserve supply / borrow APY | `reserve.totalSupplyAPY(ledgerInstant)`, `reserve.totalBorrowAPY(ledgerInstant)` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/market-data) |
| Get reserve utilization (0 to 1) | `reserve.calculateUtilizationRatio()` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/market-data) |
| **Read User Data** |
| Get user's obligation | `market.getObligationByWallet(user, new VanillaObligation(PROGRAM_ID))` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/user-position-data) |
| Get all user obligations | `market.getAllUserObligations(user, ledgerInstant)` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/user-position-data) |
| Get deposits / borrows | `obligation.getDeposits()`, `obligation.getBorrows()` (amounts in lamports; divide by `mintFactor`) | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/user-position-data) |
| Get LTV and liquidation LTV | `obligation.refreshedStats.loanToValue`, `obligation.refreshedStats.liquidationLtv` | [Data Docs](https://kamino.com/docs/build/developers/borrow/data/user-position-data) |

## API Operations

| What to Do | API Endpoint | Documentation |
|------------|--------------|---------------|
| **Transactions** |
| Deposit collateral | `POST /ktx/klend/deposit` | [Recipe](https://kamino.com/docs/build/recipes/borrow/deposit-via-api) |
| Borrow assets | `POST /ktx/klend/borrow` | [Recipe](https://kamino.com/docs/build/recipes/borrow/borrow-via-api) |
| Repay loan | `POST /ktx/klend/repay` | [Recipe](https://kamino.com/docs/build/recipes/borrow/repay-via-api) |
| Withdraw collateral | `POST /ktx/klend/withdraw` | [Recipe](https://kamino.com/docs/build/recipes/borrow/withdraw-via-api) |
| **Read Market Data** |
| List all markets | `GET /v2/kamino-market` | [API Docs](https://kamino.com/docs/build/api-reference/introduction) |
| Reserve metrics | `GET /kamino-market/{marketPubkey}/reserves/metrics` | [API Docs](https://kamino.com/docs/build/api-reference/introduction) |
| Historical reserve APY and borrow curve | `GET /kamino-market/{marketPubkey}/reserves/{reservePubkey}/metrics/history` | [API Docs](https://kamino.com/docs/build/api-reference/borrow/market-data/market-reserve-metrics-history) |
| **Read User Data** |
| Get user obligations | `GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations` | [API Docs](https://kamino.com/docs/build/api-reference/introduction) |
| Get user transactions | `GET /v2/kamino-market/{marketPubkey}/users/{userPubkey}/transactions` | [API Docs](https://kamino.com/docs/build/api-reference/introduction) |

## Important Notes

- **Reserve address, not mint**: a token can have several reserves (one variable-rate plus fixed-rate ones). Actions take `reserveAddress`; use `getExistingFloatRateReserveByMint(mint)` for the variable-rate one.
- **Ledger instant**: actions, APYs, and obligation lookups take `await getCurrentLedgerInstant(rpc)`, not a slot.
- **Slot duration**: load the market with `getMedianSlotDurationInMsFromLastEpochs()`. A hard-coded 400 ms shows fixed-rate APYs at about half their real value.
- **First deposit**: pass `initUserMetadata: { skipInitialization: false, skipLutCreation: true }` so account setup fits in one transaction; without it the deposit fails with `0x17a3`.
- **Full repay or withdraw**: pass `new BN(U64_MAX)` as the amount.
- **Health checks**: verify LTV against liquidation LTV before borrowing or withdrawing collateral.
- **API transactions** use lookup tables; decompile with `decompileTransactionMessageFetchingLookupTables`.

## Complete Tutorials

- [Deposit and Borrow Tutorial](https://kamino.com/docs/build/tutorials/borrow/deposit-and-borrow)
- [Repay and Withdraw Tutorial](https://kamino.com/docs/build/tutorials/borrow/repay-and-withdraw)
- [Fixed-Rate Borrowing](https://kamino.com/docs/build/borrow/tutorials/fixed-rate-borrowing)
````

### references/multiply.md

Kamino Multiply leveraged position operations:

````markdown expandable theme={null}
# Kamino Multiply Operations

Open leveraged positions, monitor health, repay, withdraw, and shrink positions.

## Dependencies

```bash
npm install @solana/kit @kamino-finance/klend-sdk @kamino-finance/kswap-sdk@2.9.0 @kamino-finance/scope-sdk @solana-program/address-lookup-table bn.js decimal.js
```

## SDK Instantiation

```typescript
import { createSolanaRpc, createSolanaRpcSubscriptions, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
import { KswapSdk } from '@kamino-finance/kswap-sdk';
import { Scope } from '@kamino-finance/scope-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const kswap = new KswapSdk('https://api.kamino.finance/kswap', rpc, rpcSubscriptions);
const scope = new Scope('mainnet-beta', rpc);
```

## SDK Operations

| What to Do | SDK Method | Documentation |
|------------|------------|---------------|
| **Transactions** |
| Open or add to a leveraged position | `getDepositWithLeverageIxs({ ... })` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/deposit-xstocks) |
| Repay debt by selling collateral | `getRepayWithCollIxs({ ... })` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/repay-collateral) |
| Repay debt from the wallet | `KaminoAction.buildRepayTxns({ ... })` with the `MultiplyObligation` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/repay-xstocks) |
| Withdraw collateral | `KaminoAction.buildWithdrawTxns({ ... })` with the `MultiplyObligation` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/withdraw-xstocks) |
| Shrink the position, keep leverage | `getWithdrawWithLeverageIxs({ ... })` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/deleverage-xstocks) |
| Flash loan | `getFlashLoanInstructions({ ... })` | [Guide](https://kamino.com/docs/build/developers/multiply/flash-loans) |
| Swap routes | `kswap.getAllRoutes(params, await loadRouterContext(rpc, tokenIn, tokenOut))` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/deposit-xstocks) |
| **Read Position Data** |
| Get multiply positions | `market.getUserObligationsByTag(ObligationTypeTag.Multiply, userAddress, ledgerInstant)` | [Guide](https://kamino.com/docs/build/developers/multiply/data/health-metrics) |
| Get position LTV / liquidation LTV | `obligation.refreshedStats.loanToValue`, `obligation.refreshedStats.liquidationLtv` | [Guide](https://kamino.com/docs/build/developers/multiply/data/health-metrics) |
| Get leverage and net value | `obligation.refreshedStats.leverage`, `obligation.refreshedStats.netAccountValue` | [Guide](https://kamino.com/docs/build/developers/multiply/data/health-metrics) |
| Get position amounts (token units) | `obligation.getDepositAmountByReserve(collReserve)`, `obligation.getBorrowAmountByReserve(debtReserve)` | [Guide](https://kamino.com/docs/build/developers/multiply/operations/deleverage-xstocks) |

## Important Notes

- Use kswap-sdk 2.9.0: the last version on `@solana/kit` 2, which klend-sdk 13 uses.
- The quoter's `priceAInB` must be the mid price (`amountOut / amountIn` in token units), before slippage; the SDK applies slippage itself.
- `kswap.getBestRoute` currently returns no routes; use `getAllRoutes`.
- The leverage functions return one candidate transaction per swap route. Compress each with lookup tables from `POST /luts/find-minimal` (one request per candidate) and send the best-output one that fits the size limit.
- The leverage functions expect the wallet's user metadata to exist; create it first for a new wallet.
- `getWithdrawWithLeverageIxs` keeps the position's LTV; to lower leverage, repay debt.
- Flash loan repay includes a small fee; the wallet must hold it in the borrowed token.
- Leveraged combo operations are TypeScript SDK only.

## Complete Guides

- [Flash Loans](https://kamino.com/docs/build/developers/multiply/flash-loans)
- [Open Position (xStocks)](https://kamino.com/docs/build/developers/multiply/operations/deposit-xstocks)
- [Repay with Collateral](https://kamino.com/docs/build/developers/multiply/operations/repay-collateral)
- [Monitor Position Health](https://kamino.com/docs/build/developers/multiply/data/health-metrics)
````

### references/liquidity.md

Kamino Liquidity strategy operations:

````markdown expandable theme={null}
# Kamino Liquidity Operations

Deposit into automated concentrated liquidity strategies, withdraw shares, and query strategy/user data.

## Dependencies

```bash
npm install @solana/kit @kamino-finance/kliquidity-sdk decimal.js
```

## SDK Instantiation

```typescript
import { createSolanaRpc, address } from '@solana/kit';
import { Kamino } from '@kamino-finance/kliquidity-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const kamino = new Kamino('mainnet-beta', rpc);
```

## SDK Operations

| What to Do | SDK Method | Documentation |
|------------|------------|---------------|
| **Transactions** |
| Single-sided deposit | `kamino.singleSidedDepositTokenB(strategy, amount, signer, slippageBps)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/operations/deposit) |
| Two-sided deposit | `kamino.deposit(strategyWithAddress, amountA, amountB, signer)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/operations/deposit) |
| Withdraw all shares | `kamino.withdrawAllShares(strategyWithAddress, signer)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/operations/withdraw) |
| **Read Strategy Data** |
| Get all strategies | `kamino.getAllStrategiesWithFilters(filters)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/data/strategy) |
| Get share price and balances | `kamino.getStrategyShareData(strategyAddress)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/data/strategy) |
| Get share price only | `kamino.getStrategySharePrice(strategyAddress)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/data/strategy) |
| **Read User Data** |
| Get user positions | `kamino.getUserPositions(walletAddress)` | [Guide](https://docs.kamino.finance/build/developers/liquidity/data/user-position) |

## API Operations

| What to Do | API Endpoint | Documentation |
|------------|--------------|---------------|
| **Read Strategy Data** |
| List all strategies | `GET /strategies?status=LIVE` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/strategy-data/strategies-list) |
| Get strategy metrics | `GET /strategies/{pubkey}/metrics` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/strategy-data/strategy-metrics) |
| Historical metrics | `GET /v2/strategies/{pubkey}/history` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/strategy-data/strategy-metrics-history) |
| Total TVL | `GET /strategies/tvl` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/strategy-data/strategies-tvl) |
| Fees and rewards | `GET /strategies/fees-and-rewards?period=24h` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/strategy-data/strategies-fees-and-rewards) |
| **Read User Data** |
| User PnL | `GET /v2/strategies/{pubkey}/shareholders/{wallet}/pnl` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/user-data/user-pnl) |
| User transactions | `GET /v2/shareholders/{wallet}/transactions` | [API Ref](https://kamino.com/docs/build/api-reference/liquidity/user-data/user-transactions) |

## Important Notes

- Single-sided deposit auto-swaps half the input via the SDK's built-in swap router
- Withdrawals return both Token A and Token B proportionally
- Use `POST /luts/find-minimal` for address lookup table resolution on deposits and withdrawals
- Historical data only available via API

## Complete Guide

- [Deposit Guide](https://docs.kamino.finance/build/developers/liquidity/operations/deposit)
- [Withdraw Guide](https://docs.kamino.finance/build/developers/liquidity/operations/withdraw)
````

### references/rewards.md

Kamino Rewards farm operations:

````markdown expandable theme={null}
# Kamino Rewards Operations

Stake into farms, unstake, harvest rewards, and query farm/user data.

## Dependencies

```bash
npm install @solana/kit @kamino-finance/farms-sdk decimal.js
```

## SDK Instantiation

```typescript
import { createSolanaRpc, address } from '@solana/kit';
import { Farms, fetchFarmState } from '@kamino-finance/farms-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const farms = new Farms(rpc);
```

## SDK Operations

| What to Do | SDK Method | Documentation |
|------------|------------|---------------|
| **Transactions** |
| Stake tokens | `farms.stakeIx(...)` | [Guide](https://docs.kamino.finance/build/developers/rewards/operations/stake) |
| Unstake tokens | `farms.unstakeIx(...)` | [Guide](https://docs.kamino.finance/build/developers/rewards/operations/unstake) |
| Withdraw unstaked | `farms.withdrawUnstakedDepositIx(...)` | [Guide](https://docs.kamino.finance/build/developers/rewards/operations/withdraw-unstaked) |
| Harvest all rewards | `farms.claimForUserForFarmAllRewardsIx(...)` | [Guide](https://docs.kamino.finance/build/developers/rewards/operations/harvest) |
| **Read Farm Data** |
| Get farm state | `fetchFarmState(rpc, farmAddress)` (fields are `bigint`) | [Guide](https://docs.kamino.finance/build/developers/rewards/data/farm-state) |
| Batch-load farms | `farms.getAllFarmStatesByPubkeys(addresses)` | [Guide](https://docs.kamino.finance/build/developers/rewards/data/farm-state) |
| Find farms by mint | `farms.getFarmsForMint(stakeMint)` | [Guide](https://docs.kamino.finance/build/developers/rewards/data/farm-state) |
| Get incentive APY | `farms.getRewardsAPYForStrategy(strategyAddress)` | [Guide](https://docs.kamino.finance/build/developers/rewards/data/farm-state) |
| **Read User Data** |
| Get all user positions | `farms.getAllFarmsForUser(walletAddress, now)` | [Guide](https://docs.kamino.finance/build/developers/rewards/data/user-position) |
| Get pending rewards | `farms.getUserPendingRewards(userState, farmState, now, oraclePrices)` | [Guide](https://docs.kamino.finance/build/developers/rewards/data/user-position) |
| Get lockup status | `farms.getLockupDurationAndExpiry(farm, user, now)` | [Guide](https://docs.kamino.finance/build/developers/rewards/data/user-position) |

## API Operations

| What to Do | API Endpoint | Documentation |
|------------|--------------|---------------|
| Farm transactions | `GET /farms/{farmPubkey}/transactions` | [API Ref](https://kamino.com/docs/build/api-reference/rewards/farm-transactions) |
| Farm management history | `GET /farms/{farmPubkey}/management-history` | [API Ref](https://kamino.com/docs/build/api-reference/rewards/farm-management-history) |
| User farm transactions | `GET /farms/users/{pubkey}/transactions` | [API Ref](https://kamino.com/docs/build/api-reference/rewards/user-transactions) |
| Oracle prices (for reward valuation) | `GET /oracles/prices` | [API Ref](https://kamino.com/docs/build/api-reference/oracle/oracle-prices) |

## Important Notes

- **Delegated farms** (klend reserve farms, kvault farms) have no stake mint; a delegate authority stakes on behalf of users
- **Non-delegated farms** own their stake token; use `getFarmsForMint` to discover them
- Unstaking triggers a **withdrawal cooldown** before tokens can be withdrawn
- Reward valuation requires oracle prices from `GET /oracles/prices?source=scope`
- Farm operations are SDK-only; there are no transaction-building API endpoints for farms

## Complete Guide

- [Farm State Guide](https://docs.kamino.finance/build/developers/rewards/data/farm-state)
- [User Position Guide](https://docs.kamino.finance/build/developers/rewards/data/user-position)
- [Stake Guide](https://docs.kamino.finance/build/developers/rewards/operations/stake)
- [Harvest Guide](https://docs.kamino.finance/build/developers/rewards/operations/harvest)
````

### references/api.md

Kamino REST API endpoints:

```markdown expandable theme={null}
# Kamino API Reference

Quick reference for Kamino Finance REST API.

## Base URL

`https://api.kamino.finance`

No API key required for public endpoints.

## Complete Documentation

- Full API Reference: https://kamino.com/docs/build/api-reference/introduction
- OpenAPI Specification: https://api-docs.kamino.finance

## Key Endpoints

**Kamino Earn:**
- `POST /ktx/kvault/deposit` - Deposit to vault
- `POST /ktx/kvault/withdraw` - Withdraw from vault
- `GET /kvaults/vaults` - List all vaults
- `GET /kvaults/users/{walletAddress}/positions` - User positions

**Kamino Borrow:**
- `POST /ktx/klend/deposit` - Deposit collateral
- `POST /ktx/klend/borrow` - Borrow assets
- `POST /ktx/klend/repay` - Repay loan
- `POST /ktx/klend/withdraw` - Withdraw collateral
- `GET /v2/kamino-market` - List all markets
- `GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations` - User obligations

**Kamino Multiply:**
- Multiply operations are SDK-only (no API transaction endpoints)
- Monitor positions via `GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations`

**Kamino Liquidity:**
- `GET /strategies?status=LIVE` - List all strategies
- `GET /strategies/{pubkey}/metrics` - Strategy metrics
- `GET /v2/strategies/{pubkey}/history` - Historical metrics
- `GET /strategies/tvl` - Total TVL
- `GET /v2/strategies/{pubkey}/shareholders/{wallet}/pnl` - User PnL
- `GET /v2/shareholders/{wallet}/transactions` - User transactions

**Kamino Rewards (Farms):**
- `GET /farms/{farmPubkey}/transactions` - Farm transactions
- `GET /farms/{farmPubkey}/management-history` - Farm management history
- `GET /farms/users/{pubkey}/transactions` - User farm transactions

**Oracle:**
- `GET /oracles/prices` - Oracle prices with timestamp and staleness
- `GET /prices` - Token USD prices by mint

**KSwap (Token Swaps):**
- `GET /kswap/swap/` - Get best route and transaction for swapping between two tokens

**Utilities:**
- `POST /luts/find-minimal` - Find minimal Address Lookup Tables

## Important Notes

- All transaction endpoints return base64-encoded transactions
- Transactions use Address Lookup Tables and require `decompileTransactionMessageFetchingLookupTables`
- Client must decode, sign with fresh blockhash, and submit transactions
- Farm operations (stake, unstake, harvest) are SDK-only with no API transaction endpoints
```

## Usage Examples

Once installed, your agent can execute commands like:

* "Deposit 100 USDC into the SOL-USDC vault"
* "Check my current lending positions on Kamino"
* "Withdraw 50% of my vault shares"
* "Supply 1000 USDC to the lending market"
* "What's the APY on the SOL-USDC vault?"
* "Deposit into the KMNO/USDC liquidity strategy"
* "What are my pending farm rewards?"
* "Harvest all rewards from my staked positions"
* "Swap 1 SOL to USDC"
* "Get the current SOL price from the oracle"

For detailed code examples, see the Kamino documentation links in the reference files.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.