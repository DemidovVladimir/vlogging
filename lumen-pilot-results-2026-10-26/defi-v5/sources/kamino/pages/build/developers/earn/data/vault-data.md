> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vault

## Reading Vault Data

Retrieve vault TVL, APY, farm rewards, allocation weights, and user share balances using the Kamino SDK and API.

> [!NOTE]
>
> Historical vault data is only available via the API.

**Step 1**

### Get All Vaults

This fetches all available Kamino vaults from the API, and returns an array of vault objects containing address, state, and configuration data for each vault.

```typescript icon="typescript" getAllVaults theme={null}
const url = 'https://api.kamino.finance/kvaults/vaults';
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const vaults = await res.json();

console.log({
  address: vaults[0].address,
  name: vaults[0].state.name,
  tokenMint: vaults[0].state.tokenMint,
  sharesIssued: vaults[0].state.sharesIssued,
  tokenAvailable: vaults[0].state.tokenAvailable,
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)

**Step 2**

### Get Vault Info

Retrieves real-time vault metrics including holdings, APY rates, and exchange rate. And uses the SDK to query on-chain vault state and performance data.

> [!NOTE]
>
> Using the SDK requires a private RPC connection or the public rate-limited [RPC endpoint](https://api.mainnet-beta.solana.com).

**TypeScript**

```typescript icon="typescript" getVaultInfo theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  await getMedianSlotDurationInMsFromLastEpochs()
);
const ledgerInstant = await getCurrentLedgerInstant(rpc);

const apys = await vault.getAPYs(ledgerInstant);

console.log({
  holdings: (await vault.getVaultHoldings(ledgerInstant)).asJSON(),
  actualAPY: apys.actualAPY.netAPY.toString(),
  theoreticalAPY: apys.theoreticalAPY.netAPY.toString(),
  exchangeRate: (await vault.getExchangeRate(ledgerInstant)).toString(),
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-01-get-vault-info-example/index.ts)

**Rust**

> [!NOTE]
>
> Read and inspect a vault's on-chain state with the [`kvault-interface`](https://crates.io/crates/kvault-interface) crate — configuration, fees, AUM, and per-reserve allocations — using zero-copy deserialization, no SDK or RPC framework required beyond `solana-client`.

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
kvault-interface = "0.1.0"
solana-client = "2.3"
solana-pubkey = "2.1"
```

**Step 2**

### Fetch and Parse the Vault

`from_account_data::<VaultState>` deserializes the raw account bytes into a zero-copy `VaultState` view.

```rust theme={null}
use std::str::FromStr;

use kvault_interface::{
    from_account_data,
    state::{VaultAllocation, VaultState},
    Fraction,
};
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;

let rpc = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());
let vault_pubkey = Pubkey::from_str("HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E").unwrap();

let vault_account = rpc.get_account(&vault_pubkey).unwrap();
let vault = from_account_data::<VaultState>(&vault_account.data).unwrap();
```

**Step 3**

### Read Vault Configuration

```rust theme={null}
println!("Vault: {vault_pubkey}");
println!("  Admin: {}", vault.vault_admin_authority);
println!("  Token mint: {}", vault.token_mint);
println!("  Available liquidity: {}", vault.token_available);
println!("  Shares issued: {}", vault.shares_issued);
println!("  Performance fee: {} bps", vault.performance_fee_bps);
println!("  Management fee: {} bps", vault.management_fee_bps);

let prev_aum = Fraction::from_bits(u128::from(vault.prev_aum_sf));
println!("  Previous AUM: {prev_aum:.6}");
```

> [!NOTE]
>
> Fields suffixed with `_sf` are **scaled fractions** (fixed-point integers, 68 integer bits + 60 fractional bits). Convert them to a readable decimal with `Fraction::from_bits(u128::from(value))`.

**Step 4**

### Inspect Per-Reserve Allocations

The vault splits its assets across Klend reserves. Empty slots have a default `reserve` pubkey, so filter those out.

```rust theme={null}
let active_allocations: Vec<&VaultAllocation> = vault
    .vault_allocation_strategy
    .iter()
    .filter(|a| a.reserve != Pubkey::default())
    .collect();

println!("\n  Active allocations: {}", active_allocations.len());
for alloc in &active_allocations {
    let target = Fraction::from_bits(u128::from(alloc.token_target_allocation_sf));
    println!("    Reserve: {}", alloc.reserve);
    println!("      Weight: {}", alloc.target_allocation_weight);
    println!("      cToken balance: {}", alloc.ctoken_allocation);
    println!("      Token cap: {}", alloc.token_allocation_cap);
    println!("      Target allocation: {target:.6}");
}
```

[View Code](https://github.com/Kamino-Finance/kvault/blob/master/libs/kvault-interface/examples/vault_data.rs)

**Step 3**

### Get User Vault Position Historical Info

This queries historical performance metrics for a specific user's position in a vault over a time range, and returns time-series data including the user's balance, yield, and allocation changes.

```typescript icon="typescript" getUserVaultPositionHistory theme={null}
const kvaultPubkey = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // vault address
const ownerPubkey = 'AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As'; // user address

const API_BASE_URL = 'https://api.kamino.finance';

const params = new URLSearchParams({
  start: '2024-01-01T00:00:00.000Z',
  end: '2025-01-01T00:00:00.000Z',
}).toString();

const url = `${API_BASE_URL}/kvaults/users/${ownerPubkey}/vaults/${kvaultPubkey}/metrics/history?${params}`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();
console.log(data);
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-08-get-user-vault-position-historical-info-example/index.ts)

**Step 4**

### Get Vault Metrics History

Retrieves historical vault-level performance metrics including TVL, APY, and farm rewards APY. Returns time-series data showing the vault's total value locked, yield rates, and reward rates over time.

```typescript icon="typescript" getVaultMetricsHistory theme={null}
const kvaultPubkey = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // vault address

const API_BASE_URL = 'https://api.kamino.finance';

const params = new URLSearchParams({
  start: '2024-06-01T00:00:00.000Z',
  end: '2025-01-01T00:00:00.000Z',
}).toString();

const url = `${API_BASE_URL}/kvaults/vaults/${kvaultPubkey}/metrics/history?${params}`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const item of data) {
  console.log({
    tvl: item.tvl,
    apy: item.apy,
    apyFarmRewards: item.apyFarmRewards,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)

**Step 5**

### Get Advanced Vault Allocation Info

Queries the vault's allocation strategy showing how funds are distributed across different reserves with their target weights and current allocations.

```typescript icon="typescript" getVaultAllocations theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const vault = new KaminoVault(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  await getMedianSlotDurationInMsFromLastEpochs()
);

const allocations = await vault.getVaultAllocations();

for (const [address, overview] of allocations) {
  console.log(
    `Reserve: ${address}: weight ${overview.targetWeight.toString()}, allocation: ${overview.ctokenAllocationLamports.toString()}`
  );
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-06-get-vault-advanced-info-allocations-example/index.ts)

**Step 6**

### Get Advanced Vault Incentives Info

Retrieves detailed incentive information for the vault including delegated farm rewards, reserve farm incentives, and direct vault farm incentives along with comprehensive vault overview metrics.

```typescript icon="typescript" getVaultIncentives theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { Farms } from '@kamino-finance/farms-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await kaminoManager.loadVaultReserves(vaultState);
const ledgerInstant = await getCurrentLedgerInstant(rpc);

const vaultTokenPrice = new Decimal(1.0); // as it is an USDC vault the token price is 1
const vaultOverview = await kaminoManager.getVaultOverview(
  vault,
  vaultTokenPrice,
  ledgerInstant,
  vaultReservesMap,
  await kaminoManager.loadKaminoMarketsForVaultReserves(vaultReservesMap),
  await kaminoManager.loadVaultFarmStates([vaultState], vaultReservesMap),
  new Farms(rpc),
  await kaminoManager.loadKVaultGlobalConfig(),
  ledgerInstant
);

console.log('delegated farm incentives', vaultOverview.delegatedFarmIncentives);
console.log('reserves farm incentives', vaultOverview.reservesFarmsIncentives);
console.log('vault farm incentives', vaultOverview.vaultFarmIncentives);
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-07-get-vault-advanced-info-incentives-example/index.ts)

**Step 7**

### Vault Revenue Share

Earn revenue by deploying vaults with custom fee structures. Set performance fees on profits and management fees on assets under management.

```typescript icon="typescript" vaultRevenueShare theme={null}
import { address, generateKeyPairSigner } from '@solana/kit';
import { KaminoVaultConfig } from '@kamino-finance/klend-sdk';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { Decimal } from 'decimal.js';

const adminSigner = await generateKeyPairSigner();
const tokenMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

const kaminoVaultConfig = new KaminoVaultConfig({
  admin: adminSigner,
  tokenMint: tokenMint,
  tokenMintProgramId: TOKEN_PROGRAM_ADDRESS,
  performanceFeeRatePercentage: new Decimal(10.0),  // 10% performance fee on profits
  managementFeeRatePercentage: new Decimal(1.0),    // 1% annual management fee on AUM
  name: 'Revenue Share Vault',
  vaultTokenSymbol: 'kUSDC',
  vaultTokenName: 'kUSDC receipt',
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.