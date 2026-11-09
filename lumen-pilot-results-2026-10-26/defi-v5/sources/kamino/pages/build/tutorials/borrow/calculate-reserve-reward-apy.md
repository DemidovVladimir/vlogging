> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Calculate Reserve Reward APY

> Calculate collateral and debt farm reward APY for market reserves

Follow this tutorial to calculate reward APY for both deposit and borrow positions on Kamino lending reserves.

> [!NOTE]
>
> **Reserve Farms vs Extra Farms**
>
> Reserve farms are attached directly to a reserve and reward all users who deposit or borrow that reserve asset. Depositors earn rewards through collateral farms, while borrowers earn rewards through debt farms.
>
> Extra farms reward users only when specific collateral and debt combinations are used. Rewards are conditional on holding qualifying positions rather than simply depositing or borrowing a single reserve.
>
> This tutorial focuses on reserve farms.

## Calculate Reserve Reward APY

Calculate APY for both collateral and debt farm rewards on a specific reserve.

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, and decimal calculations.

```typescript theme={null}
import { createSolanaRpc, address, type Address } from '@solana/kit';
import { KaminoMarket, PROGRAM_ID, lamportsToNumberDecimal } from '@kamino-finance/klend-sdk';
import { fetchAllMaybeFarmState, calculateCurrentRewardPerToken } from '@kamino-finance/farms-sdk';
import Decimal from 'decimal.js';

type PriceData = { mint: string; price: string };

const DEFAULT_PUBKEY = '11111111111111111111111111111111';
```

**Step 2**

### Initialize RPC and Fetch Prices

Set up the Solana RPC connection and fetch token prices from the Kamino API.

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const mainMarket = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const usdsMint = address('USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA');

// Fetch token prices from Kamino API
const pricesRes = await fetch('https://api.kamino.finance/oracles/prices?markets=main');
const pricesData = (await pricesRes.json()) as PriceData[];
const priceMap = new Map<string, number>();
for (const p of pricesData) {
  priceMap.set(p.mint, parseFloat(p.price));
}
```

> [!NOTE]
>
> Creating a price map allows quick lookups for multiple reward tokens. The example uses USDS reserve which has both collateral and debt farm rewards active.

**Step 3**

### Load Market and Reserve

Load the Kamino market and get the reserve by its mint address.

```typescript theme={null}
// Load market and reserve
const market = await KaminoMarket.load(rpc, mainMarket, 400, PROGRAM_ID);
const [reserve] = market!.getReservesByMint(usdsMint);

if (!reserve) {
  console.log('Reserve not found');
} else {
```

> [!NOTE]
>
> The `getReservesByMint` method returns the reserves for a mint (here, the first one), and retrieves the reserve configuration including references to both the collateral farm and debt farm addresses.

**Step 4**

### Collect and Fetch Farm Addresses

Collect both collateral and debt farm addresses, checking they're not the default pubkey, then fetch all farms in parallel.

```typescript theme={null}
  // Collect debt and collateral farm addresses
  const farmsToFetch: { name: string; address: Address }[] = [];
  if (reserve.state.farmCollateral.toString() !== DEFAULT_PUBKEY) {
    farmsToFetch.push({ name: 'Collateral Farm Rewards', address: reserve.state.farmCollateral });
  }
  if (reserve.state.farmDebt.toString() !== DEFAULT_PUBKEY) {
    farmsToFetch.push({ name: 'Debt Farm Rewards', address: reserve.state.farmDebt });
  }

  // Fetch all farms in batch
  const farmAddresses = farmsToFetch.map((f) => f.address);
  const farmStates = await fetchAllMaybeFarmState(rpc, farmAddresses);

  const farms = farmsToFetch.flatMap((farmInfo, index) => {
    const state = farmStates[index];
    return state.exists ? [{ name: farmInfo.name, state: state.data }] : [];
  });
```

> [!NOTE]
>
> Checking for the default pubkey ensures we only fetch farms that are actually configured on the reserve. Using `fetchAllMaybeFarmState` fetches all farm states in a single batch request, which is more efficient than individual fetches.

**Step 5**

### Calculate Farm Reward APY

Calculate APY for each active reward on both collateral and debt farms.

```typescript theme={null}
  for (const farm of farms) {
    const totalStaked = lamportsToNumberDecimal(
      farm.state.totalStakedAmount.toString(),
      Number(farm.state.token.decimals) || 6
    );

    console.log(farm.name + ':');
    for (const rewardInfo of farm.state.rewardInfos) {
      if (rewardInfo.rewardsAvailable > 0n && !totalStaked.isZero()) {
        const rewardMint = rewardInfo.token.mint.toString();
        const rewardPrice = priceMap.get(rewardMint) || 1;
        const currentTime = new Decimal(Date.now() / 1000);

        // Calculate APY from farm rewards
        const rewardPerTokenPerSecond = calculateCurrentRewardPerToken(rewardInfo, currentTime); // returns the raw value
        const divisor = new Decimal(10)
          .pow(rewardInfo.rewardsPerSecondDecimals.toString())
          .mul(new Decimal(10).pow(rewardInfo.token.decimals.toString()));
        const adjustedRewardPerToken = new Decimal(rewardPerTokenPerSecond).div(divisor);
        const dailyRewards = adjustedRewardPerToken.mul(86400).mul(rewardPrice);
        const apy = Decimal.pow(dailyRewards.div(totalStaked).plus(1), 365).minus(1);

        console.log(`  Reward Token: ${rewardMint}`);
        console.log(`  APY: ${(apy.toNumber() * 100).toFixed(2)}%\n`);
      }
    }
  }
}
```

> [!TIP]
>
> The script outputs APY for all active rewards on both the collateral and debt farms. The `calculateCurrentRewardPerToken` helper from farms-sdk handles the reward schedule logic. Each reward is priced in USD and the total staked amount represents the value of all positions earning that reward.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.