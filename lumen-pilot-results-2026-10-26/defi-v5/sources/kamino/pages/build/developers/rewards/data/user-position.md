> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# User Position

> Read a wallet's farm stake, lockup and cooldown status, and pending rewards with the Kamino Farms SDK

## Reading User Position Data

> [!NOTE]
>
> The reads below use the non-delegated helpers (`getUserForUndelegatedFarm`, `getUserStateKeyForUndelegatedFarm`). For delegated farms, position accounting lives in the parent program (klend or kvault). For the TypeScript shapes returned here, see [Position Types](#position-types).

### Get All Positions

Live read of every farm a wallet is staked in, with the active stake valued in USD.

```typescript icon="typescript" getAllPositions theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms, DEFAULT_PUBLIC_KEY } from '@kamino-finance/farms-sdk';
import { Kamino } from '@kamino-finance/kliquidity-sdk';
import Decimal from 'decimal.js';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const USER = address('YOUR_WALLET_ADDRESS'); // user address

const rpc = createSolanaRpc(RPC_ENDPOINT);
const farms = new Farms(rpc);
const kamino = new Kamino('mainnet-beta', rpc);
const now = new Decimal(Math.floor(Date.now() / 1000));

const sumStake = (m: Map<unknown, Decimal>): Decimal =>
  [...m.values()].reduce((acc, v) => acc.add(v), new Decimal(0));

const positions = await farms.getAllFarmsForUser(USER, now);
if (positions.size === 0) console.log('No farm positions for', USER);

for (const [farm, userFarm] of positions) {
  const activeShares = sumStake(userFarm.activeStakeByDelegatee);
  const isStrategyFarm = userFarm.strategyId.toString() !== DEFAULT_PUBLIC_KEY.toString();
  const price = isStrategyFarm ? await kamino.getStrategySharePrice(userFarm.strategyId) : null;
  console.log({
    farm: farm.toString(),
    activeShares: activeShares.toString(),
    valueUsd: price ? '$' + activeShares.mul(price).toFixed(2) : 'n/a',
  });
}
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `getAllFarmsForUser` returns a `Map<farmAddress, UserFarm>` with stake in share units. For USD value, multiply active shares by the share price. On a strategy farm the share price comes from the kliquidity SDK, because the stake token is a strategy share rather than an oracle-tracked asset.

### Get Position Detail

Deep detail for one farm: active stake plus pending deposit and withdrawal, with their unlock timestamps.

```typescript icon="typescript" getPositionDetail theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms } from '@kamino-finance/farms-sdk';
import { Kamino } from '@kamino-finance/kliquidity-sdk';
import Decimal from 'decimal.js';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const FARM = address('9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6'); // non-delegated farm
const STRATEGY = address('ErNSr9mSDC9EkuvfUZQvedqTFiybvRsF838tiXn3Ektd'); // for the share price
const USER = address('YOUR_WALLET_ADDRESS'); // user address

const rpc = createSolanaRpc(RPC_ENDPOINT);
const farms = new Farms(rpc);
const kamino = new Kamino('mainnet-beta', rpc);
const now = new Decimal(Math.floor(Date.now() / 1000));

const sumStake = (m: Map<unknown, Decimal>): Decimal =>
  [...m.values()].reduce((acc, v) => acc.add(v), new Decimal(0));

const tsToText = (ts: { toString(): string }): string => {
  const secs = Number(ts.toString());
  return secs > 0 ? new Date(secs * 1000).toISOString() : 'none';
};

const userFarm = await farms.getUserForUndelegatedFarm(USER, FARM, now);
const active = sumStake(userFarm.activeStakeByDelegatee);
const pendingDeposit = sumStake(userFarm.pendingDepositStakeByDelegatee);
const pendingWithdrawal = sumStake(userFarm.pendingWithdrawalUnstakeByDelegatee);
const price = await kamino.getStrategySharePrice(STRATEGY);

console.log({
  activeStakeEarning: active.toString(),
  valueUsd: '$' + active.mul(price).toFixed(2),
  pendingDepositWarmingUp: pendingDeposit.toString(),
  becomesActiveAt: tsToText(userFarm.userState.pendingDepositStakeTs),
  pendingWithdrawalCoolingDown: pendingWithdrawal.toString(),
  withdrawableAt: tsToText(userFarm.userState.pendingWithdrawalUnstakeTs),
});
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> Active stake earns rewards. Pending deposit is warming up and becomes active at `pendingDepositStakeTs`. Pending withdrawal is cooling down and becomes withdrawable at `pendingWithdrawalUnstakeTs`. The stake amounts come back in share units; the unlock timestamps live on the raw `userState`.

### Get Lockup and Cooldown

A wallet's deposit lockup status on a farm: the full lockup period, how much the user has left, and when it frees up.

```typescript icon="typescript" getLockupAndCooldown theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms } from '@kamino-finance/farms-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const FARM = address('DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi'); // non-delegated farm
const USER = address('YOUR_WALLET_ADDRESS'); // user address

const rpc = createSolanaRpc(RPC_ENDPOINT);
const farms = new Farms(rpc);
const nowSeconds = Math.floor(Date.now() / 1000);

const { lockupRemainingDuration, farmLockupOriginalDuration, farmLockupExpiry } =
  await farms.getLockupDurationAndExpiry(FARM, USER, nowSeconds);

const status =
  lockupRemainingDuration <= 0
    ? 'unlocked'
    : `locked until ${new Date(farmLockupExpiry * 1000).toISOString()}`;

console.log({
  farmLockupPeriodSeconds: farmLockupOriginalDuration,
  remainingForUserSeconds: lockupRemainingDuration,
  status,
});
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `getLockupDurationAndExpiry` returns three values in seconds: the farm's full lockup period, how much of it this user has left, and the unix expiry timestamp. This is the deposit lockup. It is distinct from the per-unstake withdrawal cooldown shown in the position detail, which is driven by `pendingWithdrawalUnstakeTs` once you actually unstake. Use it to enable or disable a withdraw button and show a countdown.

### Get Pending Rewards

A wallet's claimable rewards on a farm, per reward token, in tokens and USD, with whether each has cleared its claim cooldown.

```typescript icon="typescript" getPendingRewards theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms, fetchFarmState, DEFAULT_PUBLIC_KEY } from '@kamino-finance/farms-sdk';
import Decimal from 'decimal.js';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const ORACLE_PRICES_URL = 'https://api.kamino.finance/oracles/prices?source=scope';
const FARM = address('DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi'); // farm address
const USER = address('YOUR_WALLET_ADDRESS'); // user address

const rpc = createSolanaRpc(RPC_ENDPOINT);
const farms = new Farms(rpc);
const now = new Decimal(Math.floor(Date.now() / 1000));

const { data: farmState } = await fetchFarmState(rpc, FARM);

const { userState } = await farms.getUserStateKeyForUndelegatedFarm(USER, FARM);

const rows: Array<{ mint: string; price: string }> = await (await fetch(ORACLE_PRICES_URL)).json();
const priceByMint = new Map(rows.map((r) => [r.mint, new Decimal(r.price)]));

// getOraclePrices reads the farm's on-chain Scope prices, which the rewards calc needs.
const oraclePrices = await farms.getOraclePrices(farmState);
const { userPendingRewardAmounts, hasReward } = farms.getUserPendingRewards(
  userState,
  farmState,
  now,
  oraclePrices,
);

console.log('Has claimable reward:', hasReward);

farmState.rewardInfos.forEach((info, i) => {
  const mint = info.token.mint;
  if (mint.toString() === DEFAULT_PUBLIC_KEY.toString()) return;

  const decimals = Number(info.token.decimals);
  const amount = userPendingRewardAmounts[i].div(new Decimal(10).pow(decimals));
  if (amount.lte(0)) return;

  const price = priceByMint.get(mint.toString());
  const minClaim = Number(info.minClaimDurationSeconds.toString());
  const sinceClaim = now.toNumber() - Number(userState.lastClaimTs[i].toString());
  const claimable = sinceClaim >= minClaim ? 'Yes' : `in ~${Math.ceil((minClaim - sinceClaim) / 60)}m`;

  console.log({
    reward: mint.toString(),
    pending: amount.toString(),
    valueUsd: price ? '$' + amount.mul(price).toFixed(2) : 'n/a',
    claimable,
  });
});
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> `getUserPendingRewards` returns one pending amount per reward slot in raw units, plus a `hasReward` flag. Humanize each amount by its reward-token decimals and value it with the oracle endpoint. `getOraclePrices(farmState)` takes the `FarmState` object, not the address. A reward is claimable once `now` minus `lastClaimTs` has cleared the reward's `minClaimDurationSeconds`.

## Position Types

TypeScript shapes returned by the Farms SDK for user position reads.

**UserFarm**

A wallet's position in one farm, with stake in share units, grouped by delegatee.

```typescript theme={null}
type UserFarm = {
  userStateAddress: Address;
  farm: Address;
  stakedToken: Address;
  activeStakeByDelegatee: Map<Address, Decimal>;
  pendingDepositStakeByDelegatee: Map<Address, Decimal>;
  pendingWithdrawalUnstakeByDelegatee: Map<Address, Decimal>;
  pendingRewards: PendingReward[];
  delegateAuthority: Address;
  strategyId: Address;
  userState: UserState;
};
```

**UserState**

On-chain user account. Stake amounts are WAD-scaled; timestamps are unix seconds.

```typescript theme={null}
class UserState {
  owner: Address;
  farmState: Address;
  isFarmDelegated: number;
  activeStakeScaled: BN;
  pendingDepositStakeScaled: BN;
  pendingDepositStakeTs: BN;
  pendingWithdrawalUnstakeScaled: BN;
  pendingWithdrawalUnstakeTs: BN;
  lastClaimTs: BN[];            // per reward slot
  rewardsIssuedUnclaimed: BN[]; // per reward slot
}
```

**PendingReward**

One reward token's pending amount on a position.

```typescript theme={null}
type PendingReward = {
  rewardTokenMint: Address;
  rewardTokenProgramId: Address;
  rewardType: number;
  cumulatedPendingRewards: Decimal;
  pendingRewardsByDelegatee: Map<Address, Decimal>;
};
```

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Repository](https://github.com/Kamino-Finance/farms-sdk)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.