> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Add Reserves

> Add token reserves to your market

A reserve is the per-asset lending pool inside a market. Each reserve holds one mint, has its own LTV / liquidation threshold / IR curve, and connects to one oracle. A market without reserves accepts nothing; reserves are how you list assets.

> [!NOTE]
>
> Each (mint, market) pair can have at most one reserve. If you need multiple reserves for the same asset (e.g., separate fixed-term tracks), each one needs its own market.

## Prerequisites

| Item | Where to get it |
| - | - |
| Market address | Output of [Create a market](https://kamino.com/docs/curators/markets/creating-a-market.md) |
| Token mint address | The SPL Token or Token-2022 mint of the asset |
| Mint program ID | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` for SPL Token, `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` for Token-2022 |
| Oracle ID | Scope feed pubkey (see [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)) |
| Risk parameters | LTV, liquidation threshold, IR curve, caps (see [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md)) |

**SDK**

## Add a reserve via SDK

The SDK exposes `kaminoManager.addAssetToMarketIxs(params)` which returns instructions for both creating the reserve account and applying its initial config. Build the asset config using `AssetReserveConfig` (or `AssetReserveConfigCli` if you want to load a JSON-shaped config).

**1. Import dependencies**

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  generateKeyPairSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
} from '@solana/kit';
import {
  KaminoManager,
  AssetReserveConfig,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { findAssociatedTokenPda } from '@solana-program/token-2022';
import { Decimal } from 'decimal.js';
```

**2. Initialize KaminoManager**

```typescript theme={null}
const adminSigner = await parseKeypairFile('/path/to/admin.json');

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);
```

**3. Build the asset config**

```typescript theme={null}
const assetConfig = new AssetReserveConfig({
  mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),     // USDC
  mintTokenProgram: TOKEN_PROGRAM_ADDRESS,
  tokenName: 'USDC',
  mintDecimals: 6,
  priceFeed: {
    scopePriceConfigAddress: address('<SCOPE_ORACLE_PRICES_PUBKEY>'),
    scopeChain: [0],                                                  // Scope chain indices
    scopeTwapChain: [52],
  },
  loanToValuePct: 90,
  liquidationThresholdPct: 92,
  borrowRateCurve: {
    points: [
      { utilizationRateBps: 0,     borrowRateBps: 0 },
      { utilizationRateBps: 7000,  borrowRateBps: 400 },
      { utilizationRateBps: 9000,  borrowRateBps: 1500 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      // pad to 11 points by repeating the final point
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
      { utilizationRateBps: 10000, borrowRateBps: 5000 },
    ],
  },
  depositLimit: new Decimal(1_000_000),
  borrowLimit:  new Decimal(900_000),
});
```

For full control over every reserve field (including elevation-groups, fixed-term, withdrawal caps, etc.), use `AssetReserveConfigCli` and load a `ReserveConfig` JSON object:

```typescript theme={null}
import { AssetReserveConfigCli } from '@kamino-finance/klend-sdk';
import { ReserveConfig } from '@kamino-finance/klend-sdk/dist/@codegen/klend/types';

const reserveConfig: ReserveConfig = /* fully-populated ReserveConfig object */;
const assetConfig = new AssetReserveConfigCli(
  address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  TOKEN_PROGRAM_ADDRESS,
  reserveConfig,
);
```

**4. Generate the reserve keypair and admin liquidity source**

```typescript theme={null}
const reserveKeypair = await generateKeyPairSigner();

// The admin's associated token account for the asset (used to seed the reserve at init)
const [adminLiquiditySource] = await findAssociatedTokenPda({
  mint: assetConfig.mint,
  owner: adminSigner.address,
  tokenProgram: TOKEN_PROGRAM_ADDRESS,
});
```

**5. Build and submit the transactions**

`addAssetToMarketIxs` returns two batches of instructions — one for creating the reserve account, another for applying the config. Submit them in order.

```typescript theme={null}
const { createReserveIxs, configUpdateIxs } = await kaminoManager.addAssetToMarketIxs({
  admin: adminSigner,
  adminLiquiditySource,
  marketAddress: address('<MARKET_ADDRESS>'),
  assetConfig,
  reserveKeypair,
});

async function buildAndSendTx(ixs: any[]) {
  const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  const signed = await signTransactionMessageWithSigners(
    pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(adminSigner, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
      (tx) => appendTransactionMessageInstructions(ixs, tx)
    )
  );
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
    commitment: 'confirmed',
  });
}

// Step 1: create the reserve account
await buildAndSendTx(createReserveIxs);

// Step 2: apply the config (may be split across multiple transactions for size reasons)
for (const { ixs } of configUpdateIxs) {
  await buildAndSendTx(ixs);
}

console.log('Reserve created:', reserveKeypair.address);
```

`configUpdateIxs` is an array because a full config update may exceed a single transaction's size limit; the SDK splits it into chunks. Submit each chunk in order.

### Cloning an existing reserve config via SDK

To spawn a sibling reserve with the same parameters as an existing one, fetch the source's config and pass it through `AssetReserveConfigCli`:

```typescript theme={null}
import { Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';

const sourceReserve = await Reserve.fetch(rpc, address('<EXISTING_RESERVE_ADDRESS>'));
if (!sourceReserve) throw new Error('Reserve not found');

const clonedConfig = sourceReserve.config;
// Update tokenInfo and any reserve-specific fields before applying
clonedConfig.tokenInfo.name = encodeTokenName('NEW_TOKEN');
clonedConfig.tokenInfo.scopeConfiguration.priceFeed = address('<NEW_SCOPE_FEED>');

const newAssetConfig = new AssetReserveConfigCli(
  address('<NEW_TOKEN_MINT>'),
  TOKEN_PROGRAM_ADDRESS,
  clonedConfig,
);
// Use newAssetConfig in addAssetToMarketIxs
```

**API**

> [!NOTE]
>
> **Adding reserves is not available via the REST API.** The Kamino API supports reading reserve metrics and historical data; reserve creation and configuration is an admin operation available through the **SDK** or **Kamino CLI**.

To add a reserve, use the **SDK** or **Kamino CLI** tabs.

For reading reserve data after creation, see [Read market data](https://kamino.com/docs/curators/markets/market-data.md) and the [API reference](https://kamino.com/docs/build/api-reference/introduction.md).

**Kamino CLI**

## Add a reserve via CLI

A reserve is added with a single CLI call referencing a JSON config file.

### The reserve config file

The reserve config is a JSON file authored once per reserve. Fields use camelCase in JSON; the on-chain Rust struct uses snake\_case. The CLI handles the conversion.

A reference config ships with klend-sdk:

[ klend-sdk/configs/reserve\_config\_example.json](https://github.com/Kamino-Finance/klend-sdk/blob/master/configs/reserve_config_example.json)

> [!WARNING]
>
> The example file may contain legacy fields that the program ignores (`assetTier`, `multiplierSideBoost`, `multiplierTagBoost`). Treat them as no-ops; the canonical schema is in the [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md).

A minimum viable reserve config:

```json theme={null}
{
  "status": 0,
  "loanToValuePct": 65,
  "liquidationThresholdPct": 75,
  "minLiquidationBonusBps": 500,
  "maxLiquidationBonusBps": 1000,
  "badDebtLiquidationBonusBps": 99,
  "borrowFactorPct": 100,
  "depositLimit": "1000000000000",
  "borrowLimit": "900000000000",
  "fees": {
    "borrowFee": "0",
    "flashLoanFee": "0"
  },
  "borrowRateCurve": {
    "points": [
      { "utilizationRateBps": 0,     "borrowRateBps": 0 },
      { "utilizationRateBps": 7000,  "borrowRateBps": 500 },
      { "utilizationRateBps": 8500,  "borrowRateBps": 1000 },
      { "utilizationRateBps": 10000, "borrowRateBps": 5000 }
    ]
  },
  "tokenInfo": {
    "name": "USDC",
    "maxAgePriceSeconds": 120,
    "maxAgeTwapSeconds": 240,
    "maxTwapDivergenceBps": 4050,
    "scopeConfiguration": {
      "priceFeed": "<SCOPE_PRICE_FEED_PUBKEY>",
      "priceChain": [0, 65535, 65535, 65535],
      "twapChain": [52, 65535, 65535, 65535]
    }
  },
  "depositWithdrawalCap": {
    "configCapacity": "0",
    "configIntervalLengthSeconds": "86400"
  },
  "debtWithdrawalCap": {
    "configCapacity": "0",
    "configIntervalLengthSeconds": "86400"
  }
}
```

### Add the reserve

```bash theme={null}
yarn kamino-manager add-asset-to-market \
  --market <MARKET_ADDRESS> \
  --mint <TOKEN_MINT> \
  --mint-program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA \
  --reserve-config-path ./configs/my_reserve_config.json \
  --mode execute
```

For a Token-2022 asset, replace the mint program ID:

```bash theme={null}
yarn kamino-manager add-asset-to-market \
  --market <MARKET_ADDRESS> \
  --mint <TOKEN_2022_MINT> \
  --mint-program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --reserve-config-path ./configs/my_reserve_config.json \
  --mode execute
```

The CLI prints the new reserve address. Repeat for each additional asset.

### Cloning an existing reserve config

To spawn a sibling reserve with similar parameters:

```bash theme={null}
# 1. Download the source reserve's config
yarn kamino-manager download-reserve-config \
  --reserve <EXISTING_RESERVE_ADDRESS> \
  --output ./configs/cloned_reserve.json

# 2. Edit ./configs/cloned_reserve.json — update tokenInfo.name and the oracle config

# 3. Add the new reserve using the cloned file
yarn kamino-manager add-asset-to-market \
  --market <MARKET_ADDRESS> \
  --mint <NEW_TOKEN_MINT> \
  --mint-program-id <MINT_PROGRAM_ID> \
  --reserve-config-path ./configs/cloned_reserve.json \
  --mode execute
```

## What the program does on-chain

1. Allocates a new `Reserve` zero-copy account
2. Initializes its `ReserveConfig` from your input
3. Sets `Reserve.lending_market` to your market address
4. Validates that the oracle accounts referenced in `tokenInfo` actually match the configured pubkeys
5. Initializes the reserve's `liquidity` and `collateral` substructures (zero balances)
6. Initializes the reserve's `WithdrawQueue` (empty)

The reserve immediately accepts deposits if `status: 0` (Active) and `depositLimit > 0`. Borrows additionally require `borrowLimit > 0`.

## Verify

After creation:

| Channel | How |
| - | - |
| SDK | `Reserve.fetch(rpc, reserveAddress)` and inspect `config` |
| CLI | `yarn kamino-manager download-reserve-config --reserve <RESERVE_ADDRESS>` |
| API | `GET https://api.kamino.finance/kamino-market/<MARKET>/reserves/metrics` |

Confirm:

* `status: 0`
* `tokenInfo.scopeConfiguration.priceFeed` is populated
* `borrowRateCurve.points[0].utilizationRateBps == 0`
* `depositLimit > 0` and `borrowLimit > 0` if you want both directions usable

## Common errors

| Error | Cause |
| - | - |
| `InvalidOracleConfig` | The oracle account in `tokenInfo` doesn't match the on-chain account passed to the instruction. Run `get-oracle-mappings`. |
| `InvalidScopePriceAccount` | Same as above, oracle-specific. |
| `InvalidTwapConfig` | TWAP enabled (`maxTwapDivergenceBps > 0`) but `maxAgeTwapSeconds == 0`, or the configured oracle source has no TWAP. |
| `Reserve already exists for this mint` | This (mint, market) pair already has a reserve. Use `update-reserve-config` instead. |

## What's next

> **[Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)**
>
> Pick the right oracle source and set TWAP and staleness guards.

> **[Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md)**
>
> Choose LTV, thresholds, IR curves, and caps for the asset.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.