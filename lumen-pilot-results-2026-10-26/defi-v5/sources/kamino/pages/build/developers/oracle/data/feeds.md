> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Feeds

> Inspect a Scope feed's configuration, chain metadata, and oracle mappings

## Reading Feed Internals

Beyond prices, the Scope SDK exposes the wiring behind a feed: its top-level `Configuration` account, the per-hop metadata for a scope chain (provider plus oracle type), and the raw per-slot oracle mappings.

### Feed Configuration

A feed's `Configuration` holds the admin and the accounts it owns: `oraclePrices`, `oracleMappings`, `tokensMetadata`, and `oracleTwaps`.

```typescript icon="typescript" feedConfiguration theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

const rpc = createSolanaRpc(RPC_ENDPOINT);
const scope = new Scope('mainnet-beta', rpc);

const [configAddress, config] = await scope.getSingleFeedConfiguration({
  config: SCOPE_MAINNET_HUBBLE_FEED.configuration,
});

console.log('Config account:', configAddress);
console.log({
  admin: config.admin.toString(),
  adminCached: config.adminCached.toString(),
  oraclePrices: config.oraclePrices.toString(),
  oracleMappings: config.oracleMappings.toString(),
  tokensMetadata: config.tokensMetadata.toString(),
  oracleTwaps: config.oracleTwaps.toString(),
});
```

[View Code](https://github.com/Kamino-Finance/scope-sdk)

> [!NOTE]
>
> List every feed on the Scope program with `scope.getAllConfigurations()`.

### Chain Metadata (what backs a price)

`getChainMetadata` returns one entry per hop of a scope chain, telling you which provider serves the price and which oracle type produces it (one of about 40 kinds, including `PythPull`, `ScopeTwap`, `SplStake`, `DiscountToMaturity`, `MostRecentOf`, and `CappedFloored`).

```typescript icon="typescript" chainMetadata theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const CHAIN = [0, 65535, 65535, 65535]; // SOL/USD, single-hop

const rpc = createSolanaRpc(RPC_ENDPOINT);
const scope = new Scope('mainnet-beta', rpc);

const metadata = await scope.getChainMetadata(
  { config: SCOPE_MAINNET_HUBBLE_FEED.configuration },
  CHAIN,
);

metadata.forEach((m, hop) => {
  console.log(`hop ${hop}: ${m.name} (${m.simpleName})`);
  console.log(`  provider: ${m.provider} | oracleType: ${m.oracleType}`);
  console.log(`  nestedOracles: ${JSON.stringify(m.nestedOracles)}`);
});
```

> [!NOTE]
>
> The oracle type is chosen by the feed admin at config time (`updateFeedMapping`). This call only inspects what is already set. For the curator-facing configuration side, see [Scope Oracle Types](https://kamino.com/docs/curators/markets/scope-oracle-types.md).

### Oracle Mappings (raw per-slot wiring)

`getOracleMappings` returns the raw per-slot wiring behind every price in the feed. Where `getChainMetadata` humanizes one chain's hops, the mappings expose every slot: the source account Scope reads, the oracle type discriminant, TWAP smoothing config, and the Reference Price Check slot.

```typescript icon="typescript" oracleMappings theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const NONE = 65535;

const rpc = createSolanaRpc(RPC_ENDPOINT);
const scope = new Scope('mainnet-beta', rpc);

const m = await scope.getOracleMappings({
  config: SCOPE_MAINNET_HUBBLE_FEED.configuration,
});

// First 6 slots.
m.priceInfoAccounts.slice(0, 6).forEach((acct, slot) => {
  console.log({
    slot,
    source: acct.toString(),
    oracleType: m.priceTypes[slot],
    twapEnabled: m.twapEnabledBitmask[slot].bitmask !== 0,
    refPriceSlot: m.refPrice[slot] === NONE ? 'none' : m.refPrice[slot],
  });
});
```

> [!NOTE]
>
> `65535` is the unset sentinel throughout. `refPrice` is the slot an incoming price is sanity-checked against, the Reference Price Check feature described in [Scope Oracle Types](https://kamino.com/docs/curators/markets/scope-oracle-types.md).

## Additional Resources

> **[SDK Repository](https://github.com/Kamino-Finance/scope-sdk)**

> **[Scope Oracle Types](https://kamino.com/docs/curators/markets/scope-oracle-types.md)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.