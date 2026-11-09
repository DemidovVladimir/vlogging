> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Calculate Extra Farm Reward APY

> Calculate APY for extra farm stablecoin rewards

> [!NOTE]
>
> Extra farms provide additional rewards to users who deposit specific collateral and borrow specific assets.

## Calculate Extra Farm Reward APY

Calculate APY for extra farm rewards paid in stablecoins like CASH that are pegged to USD.

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, and decimal calculations.

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { fetchAllMaybeFarmState, calculateCurrentRewardPerToken } from '@kamino-finance/farms-sdk';
import { KaminoMarket, PROGRAM_ID, lamportsToNumberDecimal } from '@kamino-finance/klend-sdk';
import Decimal from 'decimal.js';

type ExtraFarm = { market: string; farm: string; collMint: string; debtMint: string };
type Resources = { 'mainnet-beta': { extraFarms: ExtraFarm[] } };
```

**Step 2**

### Initialize RPC and Load Market

Set up the Solana RPC connection and load the Kamino market.

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const mainMarketAddress = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');

// Load market and get CASH and SOL mints from reserves
const market = await KaminoMarket.load(rpc, mainMarketAddress, 400, PROGRAM_ID);

let cashReserve, solReserve;
for (const reserve of market!.reserves.values()) {
  if (reserve.stats.symbol === 'CASH') cashReserve = reserve;
  if (reserve.stats.symbol === 'SOL') solReserve = reserve;
}

if (!cashReserve || !solReserve) {
  console.log('CASH or SOL reserve not found');
}

const cashMint = cashReserve!.getLiquidityMint().toString();
const solMint = solReserve!.getLiquidityMint().toString();
```

> [!NOTE]
>
> This example targets the SOL/CASH extra farm pair where users deposit SOL collateral and borrow CASH to earn rewards.

**Step 3**

### Get and Filter Extra Farms

Fetch the list of extra farms from the CDN and filter by SOL collateral and CASH debt.

```typescript theme={null}
// Get extraFarms from CDN API and filter by SOL/CASH pair
const cdnRes = await fetch('https://cdn.kamino.finance/resources.json');
const allResources = (await cdnRes.json()) as Resources;

const kaminoResources = allResources['mainnet-beta'];
const extraFarmsForMarket = kaminoResources.extraFarms.filter((f) => f.market === mainMarketAddress.toString());

// Filter by collateral (SOL) and debt (CASH) mints
const solCashFarms = extraFarmsForMarket.filter((f) => f.collMint === solMint && f.debtMint === cashMint);
```

> [!NOTE]
>
> The CDN resources endpoint provides a list of all extra farms. We filter for farms that specifically reward SOL collateral deposits paired with CASH borrows.

**Step 4**

### Fetch All Farm States in Batch

Fetch all farm states in a single batch request for better performance.

```typescript theme={null}
// Fetch all farm states in batch
const farmAddresses = solCashFarms.map((f) => address(f.farm));
const farmStates = await fetchAllMaybeFarmState(rpc, farmAddresses);

const farms = solCashFarms.flatMap((extraFarm, index) => {
  const farmState = farmStates[index];
  return farmState.exists ? [{ farm: extraFarm.farm, farmState: farmState.data }] : [];
});
```

> [!NOTE]
>
> Using `fetchAllMaybeFarmState` fetches all farm states in a single batch request.

**Step 5**

### Calculate APY for SOL/CASH Farms

Loop through the fetched farms and calculate APY for CASH rewards.

```typescript theme={null}
for (const { farm, farmState } of farms) {
  const totalStaked = lamportsToNumberDecimal(
    farmState.totalStakedAmount.toString(),
    Number(farmState.token.decimals) || 6
  );

  const cashReward = farmState.rewardInfos.find(
    (r) => r.token.mint.toString() === cashMint && r.rewardsAvailable > 0n
  );

  if (cashReward && !totalStaked.isZero()) {
    const currentTime = new Decimal(Date.now() / 1000);

    // Calculate APY from farm rewards
    const rewardPerTokenPerSecond = calculateCurrentRewardPerToken(cashReward, currentTime); // returns the raw value
    const divisor = new Decimal(10)
      .pow(cashReward.rewardsPerSecondDecimals.toString())
      .mul(new Decimal(10).pow(cashReward.token.decimals.toString()));
    const adjustedRewardPerToken = new Decimal(rewardPerTokenPerSecond).div(divisor);
    const dailyRewards = adjustedRewardPerToken.mul(86400);
    const apy = Decimal.pow(dailyRewards.div(totalStaked).plus(1), 365).minus(1);

    console.log(`ExtraFarm: ${farm}`);
    console.log(`  CASH APY: ${(apy.toNumber() * 100).toFixed(2)}%\n`);
  }
}
```

> [!TIP]
>
> The script outputs the APY for SOL/CASH extra farms paying CASH rewards. The `calculateCurrentRewardPerToken` helper from farms-sdk handles the reward schedule logic. Since CASH is pegged to USD, no price lookup is required.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.