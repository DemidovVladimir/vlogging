> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Vault APYs

> Fetch vault APY data using the API or SDK

## How Vault APY Is Calculated

Vault APY is a blended rate based on the reserves the vault's capital is deployed across.

```
Vault APY ≈ Σ (Reserve APY × Allocation Weight)
```

Each reserve earns yield based on its utilization and borrow rate. A reserve at 80% utilization earning 8% APY contributes to the vault's total yield based on its allocation weight, the share of capital deployed there. Allocation weights sum to 100% across all active reserves.

**Example — a USDC vault with two allocations:**

| Reserve | Allocation | APY |
| - | - | - |
| USDC SOL/BTC Market | 60% | 8% |
| USDC JLP Market | 40% | 12% |

```
Blended APY = (60% × 8%) + (40% × 12%) = 9.6%
```

Underlying borrow rates and utilization levels change continuously, so vault APY fluctuates. Quoted APYs are trailing averages and are not guaranteed forward-looking rates.

The displayed APY includes base interest from borrowers plus KMNO emissions when active. APY accounts for compounding. In Kamino vaults, earnings are continuously reinvested, increasing the vault share price over time.

**API**

**Step 1**

### Fetch All Vaults

Retrieve the list of all available vaults on Kamino.

```typescript theme={null}
const API_BASE_URL = 'https://api.kamino.finance';
const response = await fetch(`${API_BASE_URL}/kvaults/vaults`);
const vaults = await response.json();
```

> [!NOTE]
>
> The `/kvaults/vaults` endpoint returns all vaults with basic information including vault addresses, token mints, and strategies.

**Step 2**

### Get APY for Each Vault

Fetch APY metrics for all vaults in parallel using the vault public keys.

```typescript theme={null}
// Fetch all vault metrics in parallel
const vaultMetrics = await Promise.all(
  vaults.map(async (vault) => {
    const response = await fetch(
      `${API_BASE_URL}/kvaults/vaults/${vault.address}/metrics`
    );
    const metrics = await response.json();

    return {
      address: vault.address,
      apy7d: metrics.apy7d,
      apy30d: metrics.apy30d,
      apy90d: metrics.apy90d,
    };
  })
);

// Display all vault APYs
vaultMetrics.forEach((vault) => {
  console.log(`\n${vault.address}:`);
  console.log(`  7-day APY: ${(vault.apy7d * 100).toFixed(2)}%`);
  console.log(`  30-day APY: ${(vault.apy30d * 100).toFixed(2)}%`);
  console.log(`  90-day APY: ${(vault.apy90d * 100).toFixed(2)}%`);
});
```

> [!NOTE]
>
> The `/kvaults/vaults/{pubkey}/metrics` endpoint returns historical APY data across multiple timeframes (7-day, 24-hour, 30-day, 90-day, 180-day, 365-day).

> [!TIP]
>
> You now have APY data for all vaults across multiple timeframes.

**SDK**

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication and Kamino SDK.

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';
import {
  KaminoManager,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
```

**Step 2**

### Initialize SDK

Set up the RPC connection and create a Kamino Manager instance.

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);
```

**Step 3**

### Load All Vaults and Their Reserves

Retrieve all vaults, then load the reserves of every vault in one batched call.

```typescript theme={null}
const vaults = await kaminoManager.getAllVaults();
const vaultStates = await Promise.all(vaults.map((vault) => vault.getState()));
const allReservesMap = await kaminoManager.loadVaultsReserves(vaultStates);
const ledgerInstant = await getCurrentLedgerInstant(rpc);
```

> [!NOTE]
>
> `loadVaultsReserves` fetches the reserves for all vaults at once. Loading reserves vault by vault means hundreds of RPC calls, which hits the rate limits of public RPC endpoints.

**Step 4**

### Get APYs for Each Vault

Calculate the actual and theoretical APY of each vault from the shared reserves map.

```typescript theme={null}
const vaultAPYs = [];
for (const vault of vaults) {
  const vaultState = await vault.getState();
  const hasReserves = vaultState.vaultAllocationStrategy.some((a) => allReservesMap.has(a.reserve));
  if (!hasReserves) continue;

  const actualAPY = await kaminoManager.getVaultActualAPY(vaultState, ledgerInstant, allReservesMap);
  const theoreticalAPY = await kaminoManager.getVaultTheoreticalAPY(vaultState, ledgerInstant, allReservesMap);

  vaultAPYs.push({
    address: vault.address.toString(),
    name: kaminoManager.getDecodedVaultName(vaultState),
    actualAPY: `${actualAPY.netAPY.mul(100).toFixed(2)}%`,
    theoreticalAPY: `${theoreticalAPY.netAPY.mul(100).toFixed(2)}%`,
  });
}

console.table(vaultAPYs);
```

> [!NOTE]
>
> Each APY result contains `grossAPY` and `netAPY` (after fees), calculated from on-chain state. The actual APY is based on the amounts currently invested in each reserve. The theoretical APY assumes all of the vault's funds are invested according to its allocation weights. Vaults with no allocations yet are skipped.

> [!TIP]
>
> You've successfully fetched vault APYs using the Kamino SDK.

## Related Resources

> **[Lending Vaults Concepts](https://kamino.com/docs/products/lending-vaults/concepts.md)**
>
> Learn how vaults work under the hood

> **[Vault Data](https://kamino.com/docs/build/earn/vault-data-positions.md)**
>
> Query vault metrics and positions

> **[Benchmark Rate](https://kamino.com/docs/products/lending-vaults/benchmark-rate.md)**
>
> Compare vault yields to market baseline

> **[Earn Deposit](https://kamino.com/docs/build/recipes/earn/earn-via-api.md)**
>
> Deposit into vaults via API


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.