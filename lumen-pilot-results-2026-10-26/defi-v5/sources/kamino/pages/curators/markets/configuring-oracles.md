> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure Oracles

> Wire each reserve to a price feed with the right TWAP and staleness guards

Every reserve needs a valid oracle. Oracle configuration lives inside the reserve config under `tokenInfo`. Reserves are priced through **Scope**, Kamino's price aggregator.

## How pricing works

Scope combines provider feeds (**Chainlink** and **Pyth Pro**) into a single, manipulation-resistant chain of indices, and exposes [custom oracle types](https://kamino.com/docs/curators/markets/scope-oracle-types.md) for fixed-income, pegged, multi-source, and LST assets.

You wire a reserve to a Scope feed by setting `scopeConfiguration` in `tokenInfo`: the price chain, TWAP chain, and guards. For an asset that isn't in Scope yet, coordinate with the Kamino team to add it before listing.

## Required tokenInfo fields

| Field | Type | What it does |
| - | - | - |
| `name` | string (≤32 bytes UTF-8) | Asset symbol |
| `maxAgePriceSeconds` | u64 | Reject the spot price if older than this many seconds |
| `maxAgeTwapSeconds` | u64 | Reject the TWAP if older than this many seconds. Required if TWAP is enabled |
| `maxTwapDivergenceBps` | u64 | Maximum divergence between spot and TWAP in basis points. `0` disables the guard |
| `heuristic` | `{ lower, upper, exp }` | Sanity bounds. Reject prices outside `[lower * 10^exp, upper * 10^exp]`. All zeros disables |
| `blockPriceUsage` | `0` or `1` | If `1`, the reserve is configured but the program rejects any operation needing a price (emergency switch) |

Plus the Scope feed:

* `scopeConfiguration` — Scope feed pubkey + price chain + TWAP chain

**SDK**

## Update oracle config via SDK

The most direct path for changing just the Scope oracle on an existing reserve is `kaminoManager.updateReserveScopeOracleConfigurationIxs`. For broader reserve updates that include oracle changes, use `updateReserveIxs` with a full `ReserveConfig`.

**1. Initialize KaminoManager and fetch the reserve**

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
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
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket, Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const adminSigner = await parseKeypairFile('/path/to/admin.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketAddress = address('<MARKET_ADDRESS>');
const reserveAddress = address('<RESERVE_ADDRESS>');

const market = await LendingMarket.fetch(rpc, marketAddress);
if (!market) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: market };
```

**2. Update Scope oracle configuration**

```typescript theme={null}
const updateIxs = await kaminoManager.updateReserveScopeOracleConfigurationIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  {
    scopePriceConfigAddress: address('3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C'),
    scopeChain:     [0, 65535, 65535, 65535],
    scopeTwapChain: [52, 65535, 65535, 65535],
  },
);

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

for (const { ixs } of updateIxs) {
  await buildAndSendTx(ixs);
}
```

`65535` (`u16::MAX`) is the unused-slot sentinel. A single-hop Scope chain uses `[N, 65535, 65535, 65535]`.

**3. Adjusting the TWAP / staleness guards**

To change the staleness and TWAP guards, fetch the reserve's full config, mutate the relevant `tokenInfo` fields, and apply via `updateReserveIxs`:

```typescript theme={null}
const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');

const newConfig = { ...reserve.config };
newConfig.tokenInfo = {
  ...reserve.config.tokenInfo,
  maxAgePriceSeconds: 120n,
  maxAgeTwapSeconds: 240n,
  maxTwapDivergenceBps: 4050n,
};

const updateIxs = await kaminoManager.updateReserveIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  newConfig,
);

for (const { ixs } of updateIxs) {
  await buildAndSendTx(ixs);
}
```

### Looking up oracle IDs

List every named slot on a Scope feed with its index, then use the index of your asset in the reserve's oracle config.

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';
import { fetchTokenMetadatas } from '@kamino-finance/scope-sdk/dist/@codegen/scope/accounts';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const scope = new Scope('mainnet-beta', rpc);
const feed = { config: SCOPE_MAINNET_HUBBLE_FEED.configuration };
const NONE = 65535;

const [, config] = await scope.getSingleFeedConfiguration(feed);
const mappings = await scope.getOracleMappings(feed);
const { data: metadatas } = await fetchTokenMetadatas(rpc, config.tokensMetadata);

mappings.priceTypes.forEach((_, slot) => {
  const [entry] = Scope.getChainMetadataSync(mappings, metadatas, [slot, NONE, NONE, NONE]);
  if (entry?.name) console.log(slot, entry.name);
});
```

> [!NOTE]
>
> This reads the Hubble feed. To read another Scope feed, replace `SCOPE_MAINNET_HUBBLE_FEED.configuration` with that feed's configuration address.

Or call the kamino-manager CLI's `get-oracle-mappings` command (next tab) to retrieve the canonical IDs.

**API**

> [!NOTE]
>
> **Oracle configuration is not available via the REST API.** The API serves read access to oracle-derived prices and reserve metrics; oracle configuration is an admin operation available through the **SDK** or **Kamino CLI**.

To update a reserve's oracle config, use the **SDK** or **Kamino CLI** tabs.

To read current price data via API, see the [API reference](https://kamino.com/docs/build/api-reference/introduction.md).

**Kamino CLI**

## Configure oracles via CLI

Oracle configuration sits inside the reserve config JSON under the `tokenInfo` key. Edit it like any other reserve field, then apply via `update-reserve-config`. For a focused command that only updates the Scope oracle, use the SDK (no dedicated CLI command exists).

### Find the right oracle IDs

```bash theme={null}
yarn kamino-manager get-oracle-mappings
```

Returns the Scope feed pubkeys and indices that klend supports for known mints. Copy the IDs for your asset into the reserve config.

If your asset isn't in `get-oracle-mappings`, coordinate with the Kamino team to add a Scope feed for it before listing.

### Scope configuration

```json theme={null}
"tokenInfo": {
  "name": "USDC",
  "maxAgePriceSeconds": 120,
  "maxAgeTwapSeconds": 240,
  "maxTwapDivergenceBps": 4050,
  "scopeConfiguration": {
    "priceFeed": "3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C",
    "priceChain": [0, 65535, 65535, 65535],
    "twapChain": [52, 65535, 65535, 65535]
  }
}
```

| Field | What it is |
| - | - |
| `priceFeed` | The Scope `OraclePrices` account pubkey |
| `priceChain` | Up to four `u16` indices into the Scope feed; the first non-`65535` entry is the primary price |
| `twapChain` | Same shape, for the TWAP indices |

`65535` is the sentinel for "unused slot." A single-hop price uses `[N, 65535, 65535, 65535]`.

### Apply the update

```bash theme={null}
# Download the current reserve config
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE>.json

# Edit ./configs/<RESERVE>.json — update tokenInfo

# Inspect the change
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode inspect

# Apply
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode execute
```

## TWAP and staleness guards

The two guards work together to reject manipulated or stale prices.

| Guard | What it catches |
| - | - |
| `maxAgePriceSeconds` | Spot price older than this is rejected. Set to `120` for liquid assets, lower for high-stakes reserves |
| `maxAgeTwapSeconds` | TWAP older than this is rejected. Typically 2–4× `maxAgePriceSeconds` |
| `maxTwapDivergenceBps` | If spot deviates from TWAP by more than this, the price is rejected. Set to `4050` (≈40.5%) for volatile assets, lower for stables. `0` disables |

If TWAP is enabled (`maxTwapDivergenceBps > 0`) the Scope feed must expose a TWAP chain. The on-chain validator returns `InvalidTwapConfig` if you enable the guard against a feed with no TWAP.

## Price heuristic

The heuristic is an absolute price band:

```json theme={null}
"heuristic": {
  "lower": 9,
  "upper": 11,
  "exp": 1
}
```

With `exp: 1`, the price is accepted only when `0.9 ≤ price ≤ 1.1`. Useful for stables you expect to peg. Set all zeros to disable.

## Block price usage (emergency)

`blockPriceUsage: 1` is an emergency switch: the reserve is configured normally but the program refuses any operation that needs the price. Use it when you need to halt a reserve immediately while preparing a real config update.

## Choosing for new assets

| Asset type | Recommended setup |
| - | - |
| Major stablecoins (USDC, USDT, USDS) | Scope, with a tight heuristic and TWAP guard |
| Major liquid assets (SOL, BTC, ETH) | Scope |
| LSTs (mSOL, jitoSOL, INF, etc.) | Scope (uses LST → SOL → USD chain) |
| Pegged or fixed-income assets | Scope [custom oracle types](https://kamino.com/docs/curators/markets/scope-oracle-types.md) (CappedFloored, DiscountToMaturity) |
| Tokenized off-chain assets | Coordinate with the Kamino team to add to Scope |

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — every `tokenInfo` field documented
* [Oracle architecture overview](https://kamino.com/docs/security/oracles) — Scope, price protection, manipulation resistance


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.