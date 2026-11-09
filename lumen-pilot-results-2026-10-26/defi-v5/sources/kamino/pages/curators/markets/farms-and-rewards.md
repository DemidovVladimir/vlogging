> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Farms & Rewards

> Initialize collateral and debt farms on reserves, fund emissions, claim rewards

Each reserve in a market can run two independent farms — one for depositors (collateral side) and one for borrowers (debt side). Farms distribute reward emissions over time to position holders, denominated in any token. They're the curator's primary lever for attracting deposits or driving borrow demand.

Farms are managed by the [KFarms](https://github.com/Kamino-Finance/kfarms) program. The klend `Reserve` account holds two `Pubkey` fields — `farm_collateral` and `farm_debt` — that link the reserve to its farm accounts on KFarms. Once linked, klend automatically updates the farm whenever a depositor or borrower's balance changes.

## Two farms per reserve

```rust theme={null}
struct Reserve {
    // ...
    farm_collateral: Pubkey,   // Pubkey::default() if no farm
    farm_debt: Pubkey,
    // ...
}
```

| Farm | Who earns | Use case |
| - | - | - |
| Collateral farm | Depositors / suppliers | Attract liquidity to a reserve. Most common |
| Debt farm | Borrowers | Subsidize borrowing. Used to bootstrap utilization or reward leveraged-yield strategies |

Each farm can distribute multiple reward tokens simultaneously, with independent emission rates and start/end times.

**SDK**

## Initialize a reserve farm via SDK

The klend `initFarmsForReserve` instruction creates a KFarms `FarmState` account and links it to the reserve's `farm_collateral` or `farm_debt` slot. The instruction is exposed in the SDK codegen.

```typescript theme={null}
import { initFarmsForReserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/instructions';
import { PROGRAM_ID } from '@kamino-finance/klend-sdk';

// Build args and accounts per the instruction's signature, then:
const ix = initFarmsForReserve(
  { mode: 0 },  // 0 = collateral, 1 = debt
  accounts,
  PROGRAM_ID,
);
// Sign with the curator's wallet and submit
```

For full args / accounts shapes, see the auto-generated source at `klend-sdk/src/@codegen/klend/instructions/initFarmsForReserve.ts`.

After the farm is created, configure emission rates and reward mints via the KFarms admin tooling — see the [farms-sdk](https://github.com/Kamino-Finance/farms-sdk) repository.

### Read farm state

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
import { FarmState } from '@kamino-finance/farms-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const market = await KaminoMarket.load(rpc, address('<MARKET_ADDRESS>'), slotDuration);

for (const reserve of market!.getReserves()) {
  const collFarm = reserve.getCollateralFarmAddress();
  const debtFarm = reserve.getDebtFarmAddress();

  if (collFarm) {
    const farmState = await FarmState.fetch(rpc, collFarm);
    console.log(`${reserve.symbol} collateral farm:`, farmState);
  }
  if (debtFarm) {
    const farmState = await FarmState.fetch(rpc, debtFarm);
    console.log(`${reserve.symbol} debt farm:`, farmState);
  }
}
```

### Claim rewards

```typescript theme={null}
import { Farms } from '@kamino-finance/farms-sdk';

const farms = new Farms(rpc);

const claimIxs = await farms.claimForUserForFarmAllRewardsIx(
  payer,                          // TransactionSigner
  address('<USER_WALLET>'),
  address('<FARM_ADDRESS>'),
  false,                          // isDelegated
);
// Bundle into a transaction and submit
```

For a step-by-step claiming walkthrough, see [Claim user rewards](https://kamino.com/docs/build/tutorials/borrow/claim-user-rewards.md).

**API**

The Kamino API exposes farm and reward data as REST endpoints:

| Endpoint | Returns |
| - | - |
| `GET /klend/rewards` | All active reward programs across reserves on klend |
| `GET /klend/users/{pubkey}/rewards` | Per-user claimable rewards across reserves |

```bash theme={null}
curl https://api.kamino.finance/klend/rewards
curl https://api.kamino.finance/klend/users/<USER_WALLET>/rewards
```

> [!NOTE]
>
> **Farm initialization, funding, and emission configuration is not available via the REST API.** Farms are initialized through the **SDK** or via klend's `initFarmsForReserve` instruction. Emissions are configured through the KFarms admin tooling.

For computing farm APYs from on-chain state, see [Calculate reserve reward APY](https://kamino.com/docs/build/tutorials/borrow/calculate-reserve-reward-apy.md).

**Kamino CLI**

## Read farm state via CLI

The kamino-manager CLI exposes a read-side query for farm APYs:

```bash theme={null}
yarn kamino-manager get-reserve-farms-apy \
  --reserve <RESERVE_ADDRESS>
```

For farm initialization, funding, and emission configuration, use the KFarms admin tooling — see the [farms-sdk](https://github.com/Kamino-Finance/farms-sdk) repository for the canonical command set.

## Initialization workflow

**1. Decide collateral side, debt side, or both**

Most markets initialize the collateral farm only. Initialize the debt farm only if you plan to incentivize borrowers.

**2. Generate the farm state keypair**

Each farm is its own on-chain account. Generate a fresh keypair to use as the farm address.

**3. Call init-farms-for-reserve**

The klend program initializes the farm via CPI to KFarms and stores the farm address on the reserve. After this, klend automatically refreshes the farm on every deposit / withdraw / borrow / repay touching the reserve.

**4. Configure emissions**

Use KFarms admin tooling to set reward tokens, emission rates, and start/end timestamps. The standard pattern is one reward mint per active campaign; multiple mints can run in parallel.

**5. Fund the farm**

Transfer the reward tokens to the farm's reward vault. Without funding, emissions accrue notionally but cannot be claimed.

## How emissions accrue

Once a farm is active and funded:

* klend auto-refreshes the farm on every position-changing operation (deposit, withdraw, borrow, repay)
* Each user's pending rewards accumulate proportionally to their share of the farm's total weight (collateral side: their share of total deposits; debt side: their share of total borrows)
* Rewards are claimable at any time via the KFarms `claim-rewards` instruction
* Emission rates are tokens-per-unit-time set on the KFarms `FarmState`

## Operating a farm

Common adjustments after launch:

| Action | How |
| - | - |
| Add a new reward token | Add the mint to the farm's reward set via KFarms admin instructions |
| Change emission rate | Update the rate via KFarms; the change applies prospectively |
| End a campaign | Set the campaign's end timestamp via KFarms; emissions stop accruing after that point |
| Top up reward funds | Transfer more tokens to the farm's reward vault |
| Drain unused rewards | Use KFarms admin to withdraw remaining unclaimed funds (subject to KFarms admin rules) |

Most curators operate the farm via Squads multisig once it's live. The KFarms admin authority should match the operational posture of the market itself.

## When to use a debt farm

Debt farms (rewards for borrowers) are less common than collateral farms but valuable in specific scenarios:

| Scenario | Why a debt farm makes sense |
| - | - |
| Bootstrapping a new fixed-term reserve | Subsidize borrowers until natural demand develops |
| Yield-leverage strategies (looping) | Rewards on the debt side compound the strategy's effective APY |
| Cross-incentive program | Reward both depositors (collateral) and borrowers (debt) on the same reserve to drive utilization toward a target |

Debt farms have the same mechanical structure as collateral farms (emission rates, reward mints, claim flow); only the underlying weight (borrow balances vs deposit balances) changes.

## Reference

* [KFarms repository](https://github.com/Kamino-Finance/kfarms) — the program source
* [farms-sdk](https://github.com/Kamino-Finance/farms-sdk) — TypeScript helpers for farm administration
* [Reserve reward APY tutorial](https://kamino.com/docs/build/tutorials/borrow/calculate-reserve-reward-apy.md)
* [Claim user rewards](https://kamino.com/docs/build/tutorials/borrow/claim-user-rewards.md)
* [Read market data → Rewards](https://kamino.com/docs/curators/markets/market-data.md#rewards-data)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.