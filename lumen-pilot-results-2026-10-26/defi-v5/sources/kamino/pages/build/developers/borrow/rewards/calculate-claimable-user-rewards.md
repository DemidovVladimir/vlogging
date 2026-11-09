> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Calculate Claimable User Rewards

> Calculate pending rewards for a user across all farm positions and check claimability

> [!NOTE]
>
> **Farm Position Types**
>
> User rewards can come from different types of farm positions:
>
> * **Liquidity Farms**: Rewards from providing liquidity to Kamino vaults
> * **Lend Farms**: Rewards from depositing collateral or holding vault shares
> * **Borrow Markets Farms**: Rewards from borrowing assets (debt farms) or holding collateral/debt combinations (extra farms)
> * **Multiply Farms**: Rewards from leveraged positions
>
> This tutorial shows how to identify all farm positions for a user and calculate their claimable rewards across all position types.

## Calculate Claimable User Rewards

Calculate pending rewards for a user across all farm positions and check if they are claimable based on cooldown periods.

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, and decimal calculations.

```typescript theme={null}
import { createSolanaRpc, address, type Address } from '@solana/kit';
import { Farms, fetchAllMaybeFarmState, type FarmState, type UserFarm, type PendingReward } from '@kamino-finance/farms-sdk';
import { VanillaObligation, PROGRAM_ID } from '@kamino-finance/klend-sdk';
import Decimal from 'decimal.js';

type FarmPositionType = 'Liquidity' | 'Lend' | 'Borrow Markets' | 'Multiply';

type RewardWithAmount = {
  reward: PendingReward;
  rewardInfo: FarmState['rewardInfos'][0];
  lastClaimTs: string;
  amount: Decimal;
};

const DEFAULT_PUBKEY = '11111111111111111111111111111111';
```

**Step 2**

### Initialize RPC and User Address

Set up the Solana RPC connection and define the user wallet and lending market addresses.

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const user = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');
const lendingMarket = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
```

**Step 3**

### Define Helper Functions

Create helper functions to validate addresses and determine farm position types. First, define the address validation helper:

```typescript theme={null}
// Helper function: Check if address is not default pubkey
const isNotDefaultPubkey = (addr: Address): boolean => {
  return addr.toString() !== DEFAULT_PUBKEY;
};
```

Next, create the farm type determination function that checks for Liquidity and Lend farms:

```typescript theme={null}
// Helper function: Determine farm position type based on farm and user state
const determineFarmType = (
  farmState: FarmState,
  userFarm: UserFarm,
  walletPubKey: Address,
  lendingMarketAddress: Address,
  obligationPDA: Address
): FarmPositionType => {
  // Check for Liquidity farm (has strategyId)
  if (isNotDefaultPubkey(farmState.strategyId)) {
    return 'Liquidity';
  }

  // Check for Lend vault farm (has vaultId)
  const isVaultFarm = isNotDefaultPubkey(farmState.vaultId);
  if (isVaultFarm) {
    return 'Lend';
  }
```

Finally, add the delegation logic to identify Borrow Markets and Multiply positions:

```typescript theme={null}
  // Calculate delegation variables
  const delegateeIsOwner = userFarm.userState.delegatee.toString() === userFarm.userState.owner.toString();
  const farmHasSecondDelegatedAuthority = isNotDefaultPubkey(farmState.secondDelegatedAuthority);
  const farmUserStateIsForObligation = userFarm.userState.delegatee.toString() === obligationPDA.toString();

  // Check for Lend collateral farm (delegated but not for obligation)
  if (!delegateeIsOwner && farmHasSecondDelegatedAuthority && !farmUserStateIsForObligation) {
    return 'Lend';
  }

  // Check for Borrow Markets (delegated to obligation)
  if (
    lendingMarketAddress &&
    (farmUserStateIsForObligation || walletPubKey.toString() === userFarm.userState.delegatee.toString())
  ) {
    return 'Borrow Markets';
  }
  // Default to Multiply
  return 'Multiply';
};
```

> [!NOTE]
>
> The `determineFarmType` function uses various state checks to identify the farm position type. Liquidity farms have a `strategyId`, Lend farms have a `vaultId` or specific delegation patterns, and Borrow Markets farms are identified by obligation delegation.

**Step 4**

### Fetch User Farms

Get all farms the user is participating in and fetch their states in parallel.

```typescript theme={null}
const farms = new Farms(rpc);
const currentTime = new Decimal(Math.floor(Date.now() / 1000));

// Get all farms user is participating in
const userFarms = await farms.getAllFarmsForUser(user, currentTime);

// Fetch farm states in batch
const farmAddresses = Array.from(userFarms.keys());
const farmStates = await fetchAllMaybeFarmState(rpc, farmAddresses);

// Build farm data objects
const farmsData = farmAddresses.flatMap((farmAddress, index) => {
  const farmState = farmStates[index];
  const userFarm = userFarms.get(farmAddress);
  return farmState.exists && userFarm ? [{ farmAddress, userFarm, farmState: farmState.data }] : [];
});
```

> [!NOTE]
>
> The `getAllFarmsForUser` method returns a map of all farms where the user has an active position. Using `fetchAllMaybeFarmState` fetches all farm states in a single batch request.

**Step 5**

### Calculate Obligation PDA and Display Rewards

Calculate the obligation PDA, then loop through all user farms to calculate pending rewards and check if they're claimable based on cooldown periods. First, calculate the obligation PDA:

```typescript theme={null}
// Calculate obligation PDA
const obligationType = new VanillaObligation(PROGRAM_ID);
const obligationPDA = await obligationType.toPda(lendingMarket, user);
```

Then iterate through farms and filter rewards with positive amounts:

```typescript theme={null}
for (const { farmAddress, userFarm, farmState } of farmsData) {
  // Determine farm type
  const farmType = determineFarmType(farmState, userFarm, user, lendingMarket, obligationPDA);

  // Filter and calculate token amounts
  const rewardsWithAmount = userFarm.pendingRewards
    .map((reward: PendingReward, index: number) => {
      const rewardInfo = farmState.rewardInfos[index];
      const lastClaimTs = userFarm.userState.lastClaimTs[index];

      if (reward.rewardTokenMint === DEFAULT_PUBKEY || !rewardInfo || !lastClaimTs) {
        return null;
      }

      const amount = new Decimal(reward.cumulatedPendingRewards.toString()).div(
        new Decimal(10).pow(Number(rewardInfo.token.decimals))
      );

      if (amount.gt(0)) {
        return { reward, rewardInfo, lastClaimTs: lastClaimTs.toString(), amount };
      }
      return null;
    })
    .filter((r): r is RewardWithAmount => r !== null);
```

Finally, check claimability based on cooldown periods and display the results:

```typescript theme={null}
  // Only display farm if it has valid rewards
  if (rewardsWithAmount.length > 0) {
    console.log(`${farmType} Farm: ${farmAddress.toString()}`);
    console.log(`  Owner: ${userFarm.userState.owner.toString()}`);
    console.log(`  Delegatee: ${userFarm.userState.delegatee.toString()}`);

    for (const { reward, rewardInfo, lastClaimTs, amount } of rewardsWithAmount) {
      // Check if reward is claimable based on cooldown period
      const minClaimDuration = new Decimal(rewardInfo.minClaimDurationSeconds.toString()).toNumber();
      const lastClaimTsNum = new Decimal(lastClaimTs).toNumber();
      const currentTimeNum = currentTime.toNumber();
      const timeSinceClaim = currentTimeNum - lastClaimTsNum;

      // Validate data (1 year = 31536000 seconds - anything larger is invalid)
      const isValidDuration = minClaimDuration < 31536000;
      const isValidTimestamp = timeSinceClaim >= 0 && timeSinceClaim < 31536000000;

      console.log(`  Reward: ${reward.rewardTokenMint}`);
      console.log(`  Amount: ${amount.toFixed(Number(rewardInfo.token.decimals))}`);

      if (!isValidDuration || !isValidTimestamp) {
        console.log(`  Claimable: No\n`);
      } else {
        const claimable = timeSinceClaim >= minClaimDuration;

        if (claimable) {
          console.log(`  Claimable: Yes\n`);
        } else {
          const timeRemaining = minClaimDuration - timeSinceClaim;
          console.log(`  Claimable: ${Math.ceil(timeRemaining / 60)}m\n`);
        }
      }
    }
  }
}
```

> [!TIP]
>
> The script outputs all pending rewards grouped by farm type and position. Each reward shows the token mint, amount, and claimability status. If a reward has a cooldown period, the remaining time is displayed in minutes.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.