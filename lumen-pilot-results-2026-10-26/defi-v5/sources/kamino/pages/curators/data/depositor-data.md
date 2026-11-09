> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Depositor & Position Data

> Query depositor positions, P&L, transaction history, and metrics

Access depositor position data, profit & loss tracking, and transaction history via the REST API and TypeScript SDK. Use these endpoints to monitor your vault's depositors and their positions.

## User Positions (All Vaults)

Get all vault positions for a specific wallet address.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager } from '@kamino-finance/klend-sdk';

const manager = new KaminoManager(
  createSolanaRpc('https://api.mainnet-beta.solana.com')
);

const user = address('<WALLET_ADDRESS>');
const userSharesAllVaults = await manager.getUserSharesBalanceAllVaults(user);

userSharesAllVaults.forEach((shares, vault) => {
  console.log(`User shares in ${vault}:`, shares);
});
```

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/positions'
);
const positions = await response.json();
console.log('All positions:', positions);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/positions
```

## User Vault Position

Get a specific user's position in a specific vault, including share balance and token value.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault } from '@kamino-finance/klend-sdk';

const vault = new KaminoVault(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('<VAULT_ADDRESS>')
);

const user = address('<WALLET_ADDRESS>');
const shares = await vault.getUserShares(user);
const rate = await vault.getExchangeRate();

console.log({
  shares: shares.totalShares.toString(),
  tokens: shares.totalShares.mul(rate).toString(),
});
```

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/positions/<VAULT_ADDRESS>'
);
const position = await response.json();
console.log('Vault position:', position);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/positions/<VAULT_ADDRESS>
```

## User Vault P\&L

Get current profit and loss data for a user's position in a specific vault. Returns P\&L in USD, SOL, and token denominations.

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/<VAULT_ADDRESS>/users/<WALLET_ADDRESS>/pnl'
);
const pnl = await response.json();
console.log('User P&L:', pnl);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/<VAULT_ADDRESS>/users/<WALLET_ADDRESS>/pnl
```

## User Vault P\&L History

Query historical profit and loss data. Returns transaction-level P\&L history with cost basis, realized gains, and position values.

> [!NOTE]
>
> P\&L history is only available via the API.

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/vaults/<VAULT_ADDRESS>/pnl/history'
);
const pnlHistory = await response.json();
console.log('P&L history:', pnlHistory);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/vaults/<VAULT_ADDRESS>/pnl/history
```

## User Vault Metrics History

Retrieve historical performance metrics for a specific user and vault. Returns time-series data including shares, APY, and cumulative interest earned.

> [!NOTE]
>
> Metrics history is only available via the API.

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/vaults/<VAULT_ADDRESS>/metrics/history'
);
const metricsHistory = await response.json();
console.log('User vault metrics history:', metricsHistory);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/vaults/<VAULT_ADDRESS>/metrics/history
```

## User Total Metrics History

Query cumulative performance metrics for a user across all vaults over a time range. Returns aggregated time-series data.

> [!NOTE]
>
> Total metrics history is only available via the API.

```typescript API theme={null}
const params = new URLSearchParams({
  start: '2025-01-01T00:00:00.000Z',
  end: '2025-12-31T00:00:00.000Z',
}).toString();

const response = await fetch(
  `https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/metrics/history?${params}`
);
const totalMetrics = await response.json();
console.log('Total metrics history:', totalMetrics);
```

```bash curl theme={null}
curl "https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/metrics/history?start=2025-01-01T00:00:00.000Z&end=2025-12-31T00:00:00.000Z"
```

## User Transactions

Query deposit and withdrawal transaction history for a user.

> [!NOTE]
>
> Transaction history is only available via the API.

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/transactions'
);
const transactions = await response.json();
console.log('User transactions:', transactions);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/users/<WALLET_ADDRESS>/transactions
```

## Additional Resources

> **[Full API Reference](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.