> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Farms

> Read farm state, discover farms, and compute reward APY with the Kamino Farms SDK

## Reading Farm Data

> [!NOTE]
>
> A **delegated** farm (for example a klend reserve farm or a kvault farm) has no stake-token mint of its own. A delegate authority stakes on users' behalf, so `farmState.token.mint` is empty and `farmState.delegateAuthority` is set. A **non-delegated** farm owns its stake token, so `farmState.token` gives the stake mint and decimals. For the TypeScript shapes used below, see [Farm Types](#farm-types).

> **Farm state fields reference**
>
> A `FarmState` account exposes the values below. An `Address` field set to the default pubkey means it is unused, for example `strategyId` and `vaultId` on a farm attached to neither.
>
> | Field | Type | Description |
> | - | - | - |
> | `token` | `TokenInfo` | Stake token: mint, decimals, and token program. Empty on delegated farms. |
> | `rewardInfos` | `RewardInfo[]` | Fixed-size array of reward slots. Only slots with a real mint are active. |
> | `numRewardTokens` | `BN` | Count of active reward tokens. |
> | `totalStakedAmount` | `BN` | Total tokens staked and earning rewards, in raw units. |
> | `isFarmDelegated` | `number` | `1` when the farm is delegated, so a delegate authority stakes on users' behalf. |
> | `isFarmFrozen` | `number` | `1` when the farm is frozen and no new deposits are allowed. |
> | `delegateAuthority` | `Address` | The delegate that stakes for users. Set only on delegated farms. |
> | `depositWarmupPeriod` | `number` | Seconds between a deposit and when it starts earning. `0` if unused. |
> | `withdrawalCooldownPeriod` | `number` | Seconds between unstaking and being able to withdraw. |
> | `depositCapAmount` | `BN` | Maximum total stake the farm accepts, in raw units. |
> | `lockingDuration` | `BN` | Deposit lockup length, in the farm's time unit. |
> | `lockingEarlyWithdrawalPenaltyBps` | `BN` | Penalty in basis points for withdrawing before the lockup ends. |
> | `scopePrices` | `Address` | Scope oracle prices account the farm reads for reward accrual. |
> | `strategyId` | `Address` | kliquidity strategy this farm is attached to. Default if none. |
> | `vaultId` | `Address` | kvault this farm is attached to. Default if none. |
> | `farmVault` | `Address` | Token account that holds the staked tokens. |

### Get Farm State

Live on-chain read of a single farm: stake token, totals, time gates, and reward slots.

```typescript icon="typescript" getFarmState theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { fetchFarmState, DEFAULT_PUBLIC_KEY } from '@kamino-finance/farms-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const FARM = address('9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6'); // farm address

const rpc = createSolanaRpc(RPC_ENDPOINT);

const { data: farmState } = await fetchFarmState(rpc, FARM);

console.log('Delegated:', farmState.isFarmDelegated === 1);
console.log('Frozen:', farmState.isFarmFrozen === 1);
console.log('Total staked (raw):', farmState.totalStakedAmount.toString());
console.log('Deposit warmup (s):', farmState.depositWarmupPeriod);
console.log('Withdrawal cooldown (s):', farmState.withdrawalCooldownPeriod);

// rewardInfos is a fixed-size array; only slots with a real mint are active.
const activeRewards = farmState.rewardInfos.filter(
  (r) => r.token.mint.toString() !== DEFAULT_PUBLIC_KEY.toString(),
);
activeRewards.forEach((r) =>
  console.log({
    mint: r.token.mint.toString(),
    decimals: Number(r.token.decimals),
    rewardsAvailable: r.rewardsAvailable.toString(),
    rewardType: r.rewardType,
  }),
);
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `depositWarmupPeriod` and `withdrawalCooldownPeriod` are farm-level time gates in seconds, stored on the farm state with no REST equivalent. The cooldown is the wait between unstaking and being able to withdraw. To load several farms at once, use `fetchAllFarmState(rpc, [addr, ...])`. On a non-delegated farm, `farms.getStakedAmountForFarm(FARM)` returns the total staked in share units, already divided by the stake-token decimals.

### Find Farms

Discover farms by their stake token, or batch-load known farm addresses in one call.

```typescript icon="typescript" findFarms theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms } from '@kamino-finance/farms-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const STAKE_MINT = address('AYUjc3a3QQUiLE6jP7V29UMeUZGADdtiVxhSjoLcqYwr'); // stake (share) token mint
const FARM_ADDRESSES = [
  address('8qcg3HogEhVXXUxkgbgcC8wtZgVwRjQsaxiCMYRpkvKA'),
  address('DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi'),
];

const rpc = createSolanaRpc(RPC_ENDPOINT);
const farms = new Farms(rpc);

// Discover by stake mint (non-delegated farms only).
const byMint = await farms.getFarmsForMint(STAKE_MINT);
byMint.forEach((f) => console.log('farm:', f.key.toString()));

// Batch-load specific farms by address (any farm type).
const byKeys = await farms.getAllFarmStatesByPubkeys(FARM_ADDRESSES);
byKeys.forEach((f) =>
  console.log({
    farm: f.key.toString(),
    delegated: f.farmState.isFarmDelegated === 1,
    rewardCount: f.farmState.numRewardTokens.toString(),
  }),
);
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `getFarmsForMint` filters on the stake-token mint, so it only finds non-delegated farms. Delegated farms leave that field empty, so you get their address elsewhere (a reserve's `farmCollateral` / `farmDebt`, or a kvault's `vaultFarm`; see the locating table in the [overview](https://kamino.com/docs/build/developers/rewards/overview.md)) and batch-load them with `getAllFarmStatesByPubkeys`.

### Get Incentive APY

Compute a farm's reward APY two ways: the easy path for a strategy farm, and the generic path for any farm.

```typescript icon="typescript" getIncentiveApy theme={null}
import { createSolanaRpc, address, type Address } from '@solana/kit';
import { Farms } from '@kamino-finance/farms-sdk';
import { Kamino } from '@kamino-finance/kliquidity-sdk';
import Decimal from 'decimal.js';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const ORACLE_PRICES_URL = 'https://api.kamino.finance/oracles/prices?source=scope';

const FARM = address('DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi'); // farm address
const STRATEGY = address('CjUsr5w686AHi1qNHYUggz6jGoAPwKVA4K9v4hQaGtzu'); // strategy address
const STAKE_DECIMALS = 6; // strategy share token decimals

const rpc = createSolanaRpc(RPC_ENDPOINT);
const farms = new Farms(rpc);
const kamino = new Kamino('mainnet-beta', rpc);

// 1. Easy path: APY straight from the strategy, no prices to supply.
const byStrategy = await farms.getRewardsAPYForStrategy(STRATEGY);
console.log('Total incentives APY:', (byStrategy.totalIncentivesApy * 100).toFixed(4) + '%');

// 2. Generic path: supply reward prices and the staked-token price yourself.
const rows: Array<{ mint: string; price: string }> = await (await fetch(ORACLE_PRICES_URL)).json();
const priceByMint = new Map(rows.map((r) => [r.mint, new Decimal(r.price)]));
const getPrice = async (mint: Address): Promise<Decimal> =>
  priceByMint.get(mint.toString()) ?? new Decimal(0);

const stakedTokenPrice = await kamino.getStrategySharePrice(STRATEGY);
const [farmAndKey] = await farms.getAllFarmStatesByPubkeys([FARM]);

const calc = await farms.calculateFarmIncentivesApy(
  farmAndKey,
  getPrice,
  stakedTokenPrice,
  STAKE_DECIMALS,
);
calc.incentivesStats.forEach((s) =>
  console.log({
    mint: s.rewardMint.toString(),
    apy: (s.incentivesApy * 100).toFixed(4) + '%',
    yearlyRewards: s.yearlyRewards.toString(),
  }),
);
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `getRewardsAPYForStrategy` is the easy path for a strategy farm: the SDK derives the share price and reward prices itself. `calculateFarmIncentivesApy` is generic and works for any farm, but you supply a `getPrice` callback for reward tokens (from the oracle endpoint) plus the staked-token price (from the kliquidity SDK, since a strategy share is not an oracle-tracked asset). The two totals land close to each other.

### Simulate APY After Stake or Unstake

Project how the incentive APY changes after a hypothetical stake or unstake, reusing the `getPrice` callback and `stakedTokenPrice` from the previous example.

```typescript icon="typescript" simulateApy theme={null}
const totalStaked = await farms.getStakedAmountForFarm(FARM); // total staked, in share units
const [farmAndKey] = await farms.getAllFarmStatesByPubkeys([FARM]);

const scenarios = [
  { label: 'baseline (no change)', delta: new Decimal(0) },
  { label: 'stake +100% (double the pool)', delta: totalStaked },
  { label: 'unstake -50% (halve the pool)', delta: totalStaked.div(2).neg() },
];

for (const s of scenarios) {
  const sim = await farms.simulateFarmIncentivesApy(
    farmAndKey,
    s.delta,
    getPrice,
    stakedTokenPrice,
    STAKE_DECIMALS,
  );
  console.log(`${s.label}: ${(sim.totalIncentivesApy * 100).toFixed(4)}%`);
}
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `stakedTokenDelta` is in share units (the decimal share amount, not raw lamports) and adds to the current total stake. A positive delta simulates staking more, so the same rewards spread over a bigger pool and APY falls. A negative delta simulates unstaking, so APY rises.

## Farm Types

TypeScript shapes used by the Farms SDK for farm reads.

**FarmState**

On-chain farm account. Fetched with `fetchFarmState` / `fetchAllFarmState`. See the collapsible field reference at the top of the page for what each value means.

```typescript theme={null}
class FarmState {
  token: TokenInfo;                 // stake token (empty on delegated farms)
  rewardInfos: RewardInfo[];        // fixed-size; unused slots have a default mint
  numRewardTokens: BN;
  totalStakedAmount: BN;
  isFarmDelegated: number;          // 1 when delegated
  isFarmFrozen: number;
  delegateAuthority: Address;       // set on delegated farms
  depositWarmupPeriod: number;      // seconds
  withdrawalCooldownPeriod: number; // seconds
  depositCapAmount: BN;
  scopePrices: Address;
  strategyId: Address;
  vaultId: Address;
}
```

**TokenInfo**

A token's mint, decimals, and owning token program.

```typescript theme={null}
class TokenInfo {
  mint: Address;
  decimals: BN;
  tokenProgram: Address;
}
```

**RewardInfo**

One reward slot on a farm.

```typescript theme={null}
class RewardInfo {
  token: TokenInfo;                // reward token mint and decimals
  rewardsVault: Address;
  rewardsAvailable: BN;
  minClaimDurationSeconds: BN;     // claim cooldown for this reward
  rewardType: number;
  rewardsPerSecondDecimals: number;
}
```

**FarmIncentives**

Per-reward APY breakdown returned by the APY methods.

```typescript theme={null}
type FarmIncentives = {
  incentivesStats: IncentiveRewardStats[];
  totalIncentivesApy: number;
};

type IncentiveRewardStats = {
  rewardMint: Address;
  rewardDecimals: Decimal;
  incentivesApy: number;
  yearlyRewards: Decimal;
  dailyRewards: Decimal;
  hasRewardAvailable: boolean;
};
```

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Repository](https://github.com/Kamino-Finance/farms-sdk)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.