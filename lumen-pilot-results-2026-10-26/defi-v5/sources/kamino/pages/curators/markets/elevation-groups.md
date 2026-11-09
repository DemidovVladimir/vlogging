> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Elevation Groups (eMode)

> Configure relaxed risk parameters for correlated assets

Elevation groups (eMode, "efficiency mode") let a curator define a cluster of correlated assets, such as stablecoins together, liquid staking tokens paired with their underlying, or wrapped assets paired with their natives. Group members get higher LTV than they would individually, because price movement between them is small and recoverable.

A user enters an elevation group voluntarily; the program then applies the group's relaxed parameters to their position, overriding the default per-reserve parameters. If they leave the group or borrow an asset outside it, the per-reserve defaults take effect again.

A market supports **up to 32 elevation groups**.

## Anatomy of an elevation group

```rust theme={null}
struct ElevationGroup {
    id: u8,                              // 1..=32 (0 = ELEVATION_GROUP_NONE)
    ltv_pct: u8,                         // 0..=100
    liquidation_threshold_pct: u8,       // 0..=100, must be >= ltv_pct
    max_liquidation_bonus_bps: u16,      // tighter than default for correlated assets
    allow_new_loans: u8,                 // 0 = paused, 1 = active
    max_reserves_as_collateral: u8,      // limits diversification within group
    debt_reserve: Pubkey,                // the single permitted debt asset for this group
}
```

| Field | What it does |
| - | - |
| `id` | Group identifier, 1–32. `0` is reserved as the "no group" sentinel. |
| `ltv_pct` | LTV applied to *all* group-resident positions in this group |
| `liquidation_threshold_pct` | Liquidation threshold applied to all group-resident positions |
| `max_liquidation_bonus_bps` | Cap on liquidator bonus inside the group; usually tighter than default |
| `allow_new_loans` | `0` pauses new borrows in this group; `1` keeps it open |
| `max_reserves_as_collateral` | Maximum number of distinct reserves a single position may hold as collateral while in the group |
| `debt_reserve` | The single reserve a group member may borrow. All other reserves are unborrowable while in this group. |

## Per-reserve eMode opt-in

A reserve only appears in the groups it explicitly opts into.

```jsonc theme={null}
{
  "elevation_groups": [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "disable_usage_as_coll_outside_emode": 0,
  "borrow_limit_outside_elevation_group": "18446744073709551615",
  "borrow_limit_against_this_collateral_in_elevation_group": [
    "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
    "0", "0"
  ]
}
```

| Field | What it does |
| - | - |
| `elevation_groups` | Up to 20 group IDs this reserve belongs to. `0` slots are unused. |
| `disable_usage_as_coll_outside_emode` | If `1`, the reserve can only be used as collateral within an eMode group |
| `borrow_limit_outside_elevation_group` | Hard cap on borrows against this asset as collateral when the borrower is outside any group. `u64::MAX` (`18446744073709551615`) = no cap |
| `borrow_limit_against_this_collateral_in_elevation_group[i]` | Per-group cap on borrows using this asset as collateral, indexed by `group_id - 1` |

**SDK**

## Configure an elevation group via SDK

Elevation groups live on the market's `LendingMarket` struct. Reserves opt in via their `ReserveConfig.elevationGroups` array. Both updates use the standard market and reserve update flows.

**1. Initialize KaminoManager and fetch the market**

```typescript theme={null}
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket, Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { address } from '@solana/kit';

// ... rpc setup, adminSigner ...

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);
const marketAddress = address('<MARKET_ADDRESS>');

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };
```

**2. Define the group on the market**

```typescript theme={null}
const newLendingMarket = { ...marketState };
const elevationGroups = [...marketState.elevationGroups];

// Set group 1 (index 0)
elevationGroups[0] = {
  id: 1,
  ltvPct: 90,
  liquidationThresholdPct: 92,
  maxLiquidationBonusBps: 200,
  allowNewLoans: 1,
  maxReservesAsCollateral: 3,
  debtReserve: address('<USDC_RESERVE_PUBKEY>'),
  paddingPadding0: 0,
  padding1: [0n, 0n, 0n, 0n],
};

newLendingMarket.elevationGroups = elevationGroups as typeof marketState.elevationGroups;

const updateIxs = kaminoManager.updateLendingMarketIxs(
  adminSigner,
  marketWithAddress,
  newLendingMarket,
);
// submit each ix in order
```

**3. Opt each reserve into the group**

For each reserve participating in the group, fetch its config, set its `elevationGroups` array, and apply via `updateReserveIxs`.

```typescript theme={null}
const reserveAddress = address('<RESERVE_ADDRESS>');
const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');

const newConfig = { ...reserve.config };
const elevationGroupsList = [...newConfig.elevationGroups];
elevationGroupsList[0] = 1;        // opt this reserve into group 1
newConfig.elevationGroups = elevationGroupsList as typeof newConfig.elevationGroups;

// Optional: restrict this reserve to eMode-only collateral usage
newConfig.disableUsageAsCollOutsideEmode = 1;

const updateIxs = await kaminoManager.updateReserveIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  newConfig,
);
// submit each chunk in order
```

**API**

> [!NOTE]
>
> **Elevation group configuration is not available via the REST API.** The Kamino API serves read access to market and reserve state (including current elevation group configuration); configuration is an admin operation available through the **SDK** or **Kamino CLI**.

To configure elevation groups, use the **SDK** or **Kamino CLI** tabs.

**Kamino CLI**

## Configure an elevation group via CLI

Elevation groups are set via the market config. Each participating reserve must also be opted in via its own reserve config.

**1. Define the group on the market**

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>
```

Edit the downloaded `./configs/<MARKET>/market-<MARKET>.json`, locate the `elevation_groups` array, fill the relevant slot:

```jsonc theme={null}
{
  "elevation_groups": [
    {
      "id": 1,
      "ltv_pct": 90,
      "liquidation_threshold_pct": 92,
      "max_liquidation_bonus_bps": 200,
      "allow_new_loans": 1,
      "max_reserves_as_collateral": 3,
      "debt_reserve": "<USDC_RESERVE_PUBKEY>"
    }
    // ... 31 more slots, populated or left at defaults ...
  ]
}
```

Apply:

```bash theme={null}
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

**2. Opt each reserve into the group**

For each participating reserve:

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE>.json
```

Edit `elevation_groups`:

```jsonc theme={null}
{
  "elevation_groups": [1, 0, 0, 0, ...]
}
```

Apply:

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

## Worked example: stablecoin group

A market with USDC, USDT, USDS reserves wants stables-only positions to enjoy 95% LTV with a 96% liquidation threshold and a 1% max liquidator bonus.

**Group definition** (in market config):

```jsonc theme={null}
{
  "id": 1,
  "ltv_pct": 95,
  "liquidation_threshold_pct": 96,
  "max_liquidation_bonus_bps": 100,
  "allow_new_loans": 1,
  "max_reserves_as_collateral": 3,
  "debt_reserve": "<USDC_RESERVE_PUBKEY>"
}
```

**USDC reserve config:**

```jsonc theme={null}
{
  "elevation_groups": [1, 0, 0, 0, ...],
  "borrow_limit_against_this_collateral_in_elevation_group": [
    "100000000000",
    "0", "0", "0", ...
  ]
}
```

**USDT and USDS reserves:** same shape, opting into group 1.

A borrower enters the group via `request-elevation-group`, deposits any combination of USDC, USDT, USDS, and borrows USDC. Their position runs at the group's 95% LTV (overriding each reserve's default LTV).

## Worked example: SOL + LST group

A market with SOL, mSOL, jitoSOL, INF wants LST holders to borrow SOL at 90% LTV.

**Group definition:**

```jsonc theme={null}
{
  "id": 1,
  "ltv_pct": 90,
  "liquidation_threshold_pct": 92,
  "max_liquidation_bonus_bps": 200,
  "allow_new_loans": 1,
  "max_reserves_as_collateral": 4,
  "debt_reserve": "<SOL_RESERVE_PUBKEY>"
}
```

**LST reserves (mSOL, jitoSOL, INF):** opt into group 1, and consider setting `disable_usage_as_coll_outside_emode: 1` so these only function as collateral inside the group.

**SOL reserve:** also opt into group 1 (a borrower can deposit SOL alongside LSTs as collateral and still borrow SOL).

## Pausing a group

Set `allow_new_loans: 0` on the group definition. Existing positions continue to operate; their parameters stay relaxed; they can repay and exit. Used for incident response on a specific group without halting the whole market.

## Checklist before enabling

| Check | Why it matters |
| - | - |
| Confirmed correlation between members | A group is only safe if its assets move together. Test depeg / divergence history |
| Picked the right `debt_reserve` | The single permitted borrow asset. Pick the most liquid stable in the group, or the asset borrowers actually want |
| Set `max_reserves_as_collateral` | Caps diversification inside the group. Stricter limits reduce the cost of resolving a stuck position |
| Tightened `max_liquidation_bonus_bps` | Bonus should reflect actual liquidation slippage between correlated assets — usually tighter than defaults |
| Reserves are opted in | The group's parameters apply only to reserves that include the group ID in their `elevation_groups` array |
| Per-group borrow limits set | Without `borrow_limit_against_this_collateral_in_elevation_group`, the group has no per-asset cap and may concentrate too much risk |
| `disable_usage_as_coll_outside_emode` decided | For LSTs and similar, set to `1`. For stables, often `0` so they remain collateral outside the group too |

## Reference

* [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md) — default per-reserve LTV, threshold, borrow factor
* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — `elevation_groups` field shape
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `ElevationGroup` struct shape


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.