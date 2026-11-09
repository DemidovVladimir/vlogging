> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Farms

> Learn how to build with Kamino Farms, the rewards distribution layer for Kamino products

## Overview

Kamino Farms is the rewards distribution layer for Kamino products. Farms distribute incentive tokens to depositors, suppliers, and borrowers across the protocol, including KMNO emissions on vaults and lending positions. The TypeScript SDK provides access to farm and user state, along with instructions to stake, unstake, and harvest rewards.

> [!NOTE]
>
> Farms attached to lending positions and kvaults are **delegated**: position accounting lives in the parent program (klend or kvault), and unstake is a two-step flow gated by a cooldown. Read [Farm rewards](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards) for the conceptual model before integrating.

## Key Components of Farms Integration

> **Farm State**
>
> Decode a farm's reward tokens, per-second emission rates, total staked amount, cooldown period, and scope-oracle binding.

> **User Positions**
>
> Read a wallet's stake across one or many farms, pending rewards per reward token, and pending-unstake cooldown status.

> **Stake & Claim**
>
> Initialize user state, stake / unstake (with cooldown handling), and harvest accrued rewards in one or all reward tokens.

## Locating a Farm Address

The SDK reads any farm given its pubkey. Three places that pubkey can come from:

| Source | Where to look |
| - | - |
| **CDN** | `https://cdn.kamino.finance/resources.json`, under `mainnet-beta.extraFarms`. |
| **Klend reserve fields** | A reserve account's `state.farmCollateral` (supply side) or `state.farmDebt` (borrow side) field. |
| **Kvault state** | A kvault account's `state.vaultFarm` field. List vaults at `https://api.kamino.finance/kvaults/vaults`. |

## Integration Options

> **TypeScript SDK**
>
> On-chain reads and transaction building for stake, unstake, harvest, and user-state management. TS/JS only.

### Stake

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms, fetchFarmState } from '@kamino-finance/farms-sdk';
import { getScopePricesFromFarm } from '@kamino-finance/farms-sdk/dist/utils/option';
import Decimal from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const farms = new Farms(rpc);

const FARM = address('9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6');
const STAKE_MINT = address('3EmfhZ3KUaYdwKZ9CwfGoKRqQqUV1MhSCVL5Ch7szX7e');

const { data: farmState } = await fetchFarmState(rpc, FARM);

const scopePrices = getScopePricesFromFarm(farmState);
const amountLamports = new Decimal(0.02).mul(
  new Decimal(10).pow(Number(farmState.token.decimals)),
);

// Refresh the farm so reward accounting is current, then stake.
const instructions = [
  await farms.refreshFarmIx(FARM, scopePrices),
  await farms.stakeIx(signer, FARM, amountLamports, STAKE_MINT, scopePrices),
];

console.log('Stake Instructions:', instructions);
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> For the full stake flow including first-time user-state creation and transaction confirmation, see [Stake](https://kamino.com/docs/build/developers/rewards/operations/stake.md).

### Unstake

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Farms, fetchFarmState } from '@kamino-finance/farms-sdk';
import { getScopePricesFromFarm } from '@kamino-finance/farms-sdk/dist/utils/option';
import { WAD } from '@kamino-finance/farms-sdk/dist/utils/utils';
import Decimal from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const farms = new Farms(rpc);

const FARM = address('9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6');

const { data: farmState } = await fetchFarmState(rpc, FARM);

const scopePrices = getScopePricesFromFarm(farmState);
const { key: userStateKey } =
  await farms.getUserStateKeyForUndelegatedFarm(signer.address, FARM);

// unstakeIx takes WAD-scaled shares. Refresh the farm and user, then unstake.
const amountScaled = new Decimal(0.02)
  .mul(new Decimal(10).pow(Number(farmState.token.decimals)))
  .mul(WAD);

const instructions = [
  await farms.refreshFarmIx(FARM, scopePrices),
  await farms.refreshUserIx(userStateKey, FARM, scopePrices),
  await farms.unstakeIx(signer, FARM, amountScaled, scopePrices),
];

console.log('Unstake Instructions:', instructions);
```

[View Code](https://github.com/Kamino-Finance/farms-sdk)

> [!NOTE]
>
> Unstaking starts the withdrawal cooldown. After it elapses, withdraw the tokens back to your wallet. See [Unstake](https://kamino.com/docs/build/developers/rewards/operations/unstake.md).

## What's Covered

> **[Farms](https://kamino.com/docs/build/developers/rewards/data/farm-state.md)**
>
> Read farm state, discover farms, and compute or simulate incentive APY.

> **[User Position Data](https://kamino.com/docs/build/developers/rewards/data/user-position.md)**
>
> Fetch a wallet's stake, lockup and cooldown status, and pending rewards.

> **[Stake](https://kamino.com/docs/build/developers/rewards/operations/stake.md)**
>
> Initialize user state and stake share tokens into a farm.

> **[Unstake](https://kamino.com/docs/build/developers/rewards/operations/unstake.md)**
>
> Unstake into pending withdrawal and start the cooldown.

> **[Withdraw](https://kamino.com/docs/build/developers/rewards/operations/withdraw-unstaked.md)**
>
> Move unstaked tokens back to your wallet after the cooldown.

> **[Harvest](https://kamino.com/docs/build/developers/rewards/operations/harvest.md)**
>
> Claim all pending reward tokens in one transaction.

## Relevant Links

> **[Farms SDK repository](https://github.com/Kamino-Finance/farms-sdk)**
>
> TypeScript SDK source, on-chain program docs, and example scripts.

> **[KFarms program](https://github.com/Kamino-Finance/kfarms)**
>
> Rust source for the on-chain farms program.

> **[NPM SDK package](https://www.npmjs.com/package/@kamino-finance/farms-sdk)**
>
> Install the TypeScript SDK to integrate reward operations.

> **[Farm Rewards Concepts](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards)**
>
> Vault Farm, Autocompound, Insurance Pool farm, and cooldowns explained.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.