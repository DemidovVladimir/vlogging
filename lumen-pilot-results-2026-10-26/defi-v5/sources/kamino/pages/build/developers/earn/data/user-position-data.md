> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# User Position

## Reading User Position Data

Retrieve user positions, balances, and transaction history using the Kamino SDK and API.

> [!NOTE]
>
> Historical vault data is only available via the API.

**Step 1**

### Get User Positions

Retrieves user share balances across all vaults. Uses the SDK to query the user's positions in every vault they hold shares in.

> [!NOTE]
>
> Using the SDK requires a private RPC connection or the public rate-limited [RPC endpoint](https://api.mainnet-beta.solana.com).

```typescript icon="typescript" getUserPositions theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const manager = new KaminoManager(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  await getMedianSlotDurationInMsFromLastEpochs()
);

const user = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');
const userSharesAllVaults = await manager.getUserSharesBalanceAllVaults(user);

userSharesAllVaults.forEach((shares, vault) => {
  if (shares.totalShares.gt(0)) {
    console.log(`User shares in ${vault}:`, shares.totalShares.toString());
  }
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-03-get-user-all-vaults-positions-example/index.ts)

**Step 2**

### Get User Vault Position

Retrieves user share balance and token value for a specific vault. Uses the SDK to calculate both shares held and their equivalent token amount.

**TypeScript**

```typescript icon="typescript" getUserVaultPosition theme={null}
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

const user = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');

const shares = await vault.getUserShares(user);
const rate = await vault.getExchangeRate(await getCurrentLedgerInstant(rpc));

console.log({
  unstakedShares: shares.unstakedShares.toString(),
  stakedShares: shares.stakedShares.toString(),
  totalShares: shares.totalShares.toString(),
  tokens: shares.totalShares.mul(rate).toString(), // the user's position in tokens
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-02-get-user-vault-position-example/index.ts)

**Rust**

> [!NOTE]
>
> Read a user's vault position with the [`kvault-interface`](https://crates.io/crates/kvault-interface) crate: look up their share balance and value it in underlying tokens using the vault's current exchange rate (AUM ÷ shares issued).

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
kvault-interface = "0.1.0"
solana-client = "2.3"
solana-pubkey = "2.1"
spl-associated-token-account = "6"
```

**Step 2**

### Fetch Vault State

```rust theme={null}
use std::str::FromStr;

use kvault_interface::{pda, state::VaultState, Fraction, KVAULT_PROGRAM_ID};
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use spl_associated_token_account::get_associated_token_address;

let rpc = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());

let vault_pubkey = Pubkey::from_str("HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E").unwrap();
let user = Pubkey::from_str("EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY").unwrap();

let vault_account = rpc.get_account(&vault_pubkey).unwrap();
let vault = kvault_interface::from_account_data::<VaultState>(&vault_account.data).unwrap();
```

**Step 3**

### Read the User's Share Balance

The shares mint is a PDA of the vault. Read the `amount` field (bytes 64..72, u64 little-endian) from the user's shares ATA.

```rust theme={null}
let (shares_mint, _bump) = pda::shares_mint(&KVAULT_PROGRAM_ID, &vault_pubkey);
let user_shares_ata = get_associated_token_address(&user, &shares_mint);

let shares_account = rpc.get_account(&user_shares_ata).unwrap();
let user_shares = u64::from_le_bytes(shares_account.data[64..72].try_into().unwrap());
```

> [!NOTE]
>
> This only counts shares held in the user's share ATA. If the vault has a share farm (`VaultState::vault_farm` is set), most users keep their shares **staked in the farm**, so a complete implementation must also read the staked balance from `vault.vault_farm` (Kamino Farms) and add it.

**Step 4**

### Compute Exchange Rate and Position Value

```rust theme={null}
let aum = Fraction::from_bits(u128::from(vault.prev_aum_sf));
let total_shares = vault.shares_issued;

println!("Vault: {vault_pubkey}");
println!("  Total AUM: {aum:.6}");
println!("  Shares issued: {total_shares}");
println!("\nUser: {user}");
println!("  Shares held: {user_shares}");

if total_shares > 0 {
    let exchange_rate = aum / Fraction::from_num(total_shares);
    let position_value = Fraction::from_num(user_shares) * exchange_rate;
    println!("  Exchange rate: {exchange_rate:.6} tokens/share");
    println!("  Position value: {position_value:.6} tokens");
} else {
    println!("  Vault has no shares issued");
}
```

[View Code](https://github.com/Kamino-Finance/kvault/blob/master/libs/kvault-interface/examples/user_position.rs)

**Step 3**

### Get User Vault Transactions

Queries transaction history for a specific user and vault over a time range. Returns time-series data including position changes and transaction details.

```typescript icon="typescript" getUserVaultTransactions theme={null}
const kvaultPubkey = 'A2wsxhA7pF4B2UKVfXocb6TAAP9ipfPJam6oMKgDE5BK';
const ownerPubkey = '883AnESJiUVzCnwowgaWCpXp4EGsK4JMVzUUUcjSSs62'; // user

const API_BASE_URL = 'https://api.kamino.finance';

const params = new URLSearchParams({
  start: '2024-01-01T00:00:00.000Z',
  end: '2025-10-01T00:00:00.000Z',
}).toString();

const url = `${API_BASE_URL}/kvaults/users/${ownerPubkey}/vaults/${kvaultPubkey}/metrics/history?${params}`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const item of data) {
  console.log({
    createdOn: item.createdOn,
    sharesAmount: item.sharesAmount,
    usdAmount: item.usdAmount,
    cumulativeInterestEarnedUsd: item.cumulativeInterestEarnedUsd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-08-get-user-vault-position-historical-info-example/index.ts)

**Step 4**

### Get User Total Metrics History

Queries cumulative performance metrics for a user across all vaults over a time range. Returns aggregated time-series data including total positions and earnings.

```typescript icon="typescript" getUserTotalMetricsHistory theme={null}
const ownerPubkey = 'AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As'; // user address

const API_BASE_URL = 'https://api.kamino.finance';

const params = new URLSearchParams({
  start: '2024-01-01T00:00:00.000Z',
  end: '2025-11-20T00:00:00.000Z',
}).toString();

const url = `${API_BASE_URL}/kvaults/users/${ownerPubkey}/metrics/history?${params}`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const item of data) {
  console.log({
    createdOn: item.createdOn,
    usdAmount: item.usdAmount,
    solAmount: item.solAmount,
    weightedApy: item.weightedApy,
    cumulativeInterestEarnedUsd: item.cumulativeInterestEarnedUsd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-09-get-user-all-vaults-positions-historical-info-example/index.ts)

**Step 5**

### Get User Vault Metrics History

Retrieves historical performance metrics for a specific user and vault. Returns time-series data including shares, APY, and cumulative interest earned.

```typescript icon="typescript" getUserVaultMetricsHistory theme={null}
const kvaultPubkey = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // vault address
const ownerPubkey = 'AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As'; // user address

const API_BASE_URL = 'https://api.kamino.finance';

const url = `${API_BASE_URL}/kvaults/users/${ownerPubkey}/vaults/${kvaultPubkey}/metrics/history`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const item of data) {
  console.log({
    createdOn: item.createdOn,
    sharesAmount: item.sharesAmount,
    apy: item.apy,
    cumulativeInterestEarnedUsd: item.cumulativeInterestEarnedUsd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-08-get-user-vault-position-historical-info-example/index.ts)

**Step 6**

### Get User Vault PnL

Retrieves current profit and loss data for a user's position in a specific vault. Returns PnL metrics in USD, SOL, and token denominations.

```typescript icon="typescript" getUserVaultPnL theme={null}
const kvaultPubkey = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // vault address
const ownerPubkey = 'AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As'; // user address

const API_BASE_URL = 'https://api.kamino.finance';

const url = `${API_BASE_URL}/kvaults/${kvaultPubkey}/users/${ownerPubkey}/pnl`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

console.log({
  totalPnlUsd: data.totalPnl.usd,
  totalPnlSol: data.totalPnl.sol,
  totalPnlToken: data.totalPnl.token,
  totalCostBasisUsd: data.totalCostBasis.usd,
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-11-get-vault-user-pnl-example/index.ts)

**Step 7**

### Get User Vault PnL History

Queries historical profit and loss data for a user's vault position. Returns transaction-level PnL history with cost basis, realized gains, and position values.

```typescript icon="typescript" getUserVaultPnLHistory theme={null}
const kvaultPubkey = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // vault address
const ownerPubkey = 'AxqtG9SHDkZTLSWg81Sp7VqAzQpRqXtR9ziJ3VQAS8As'; // user address

const API_BASE_URL = 'https://api.kamino.finance';

const url = `${API_BASE_URL}/kvaults/users/${ownerPubkey}/vaults/${kvaultPubkey}/pnl/history`;
const res = await fetch(url);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const item of data.history) {
  console.log({
    timestamp: item.timestamp,
    pnlUsd: item.pnl?.usd,
    costBasisUsd: item.costBasis?.usd,
    positionValueUsd: item.positionValue?.usd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.