> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vault Data

> Query vault details, metrics, holdings, and historical performance

Access vault state, metrics, and historical data via the REST API and TypeScript SDK. Use these endpoints to build dashboards, monitoring tools, and analysis pipelines.

## List All Vaults

Fetch all available Kamino vaults with their state and configuration.

```typescript SDK theme={null}
import { createSolanaRpc } from '@solana/kit';
import { KaminoManager } from '@kamino-finance/klend-sdk';

const manager = new KaminoManager(
  createSolanaRpc('https://api.mainnet-beta.solana.com')
);

// Use the API for listing all vaults (SDK reads individual vaults on-chain)
```

```typescript API theme={null}
const response = await fetch('https://api.kamino.finance/kvaults/vaults');
const vaults = await response.json();

vaults.forEach((vault: any) => {
  console.log({
    address: vault.address,
    name: vault.state.name,
    tokenMint: vault.state.tokenMint,
    sharesIssued: vault.state.sharesIssued,
    tokenAvailable: vault.state.tokenAvailable,
  });
});
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/vaults
```

## Vault Details

Get the full state and configuration for a specific vault.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault } from '@kamino-finance/klend-sdk';

const vault = new KaminoVault(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('<VAULT_ADDRESS>')
);

const holdings = await vault.getVaultHoldings();
console.log('Holdings:', holdings.asJSON());
```

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>'
);
const vault = await response.json();

console.log('Name:', vault.state.name);
console.log('Token mint:', vault.state.tokenMint);
console.log('Shares issued:', vault.state.sharesIssued);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>
```

## Current Metrics

Get real-time metrics including APY, exchange rate, and TVL.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault } from '@kamino-finance/klend-sdk';

const vault = new KaminoVault(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('<VAULT_ADDRESS>')
);

console.log({
  apys: await vault.getAPYs(),
  exchangeRate: (await vault.getExchangeRate()).toString(),
  holdings: (await vault.getVaultHoldings()).asJSON(),
});
```

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/metrics'
);
const metrics = await response.json();
console.log('Current metrics:', metrics);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/metrics
```

## Metrics History

Query historical vault performance over a time range. Returns time-series data including TVL, APY, and exchange rate changes.

> [!NOTE]
>
> Historical data is only available via the API.

```typescript API theme={null}
const params = new URLSearchParams({
  start: '2025-01-01T00:00:00.000Z',
  end: '2025-12-31T00:00:00.000Z',
}).toString();

const response = await fetch(
  `https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/metrics/history?${params}`
);
const history = await response.json();
console.log('Historical metrics:', history);
```

```bash curl theme={null}
curl "https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/metrics/history?start=2025-01-01T00:00:00.000Z&end=2025-12-31T00:00:00.000Z"
```

## Vault Summary

Get aggregated summary statistics for all vaults.

```typescript API theme={null}
const response = await fetch('https://api.kamino.finance/kvaults/summary');
const summary = await response.json();
console.log('Program summary:', summary);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/summary
```

## Token Metadata

Get the receipt token metadata for a vault.

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/mint/metadata'
);
const metadata = await response.json();
console.log('Token metadata:', metadata);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/mint/metadata
```

## Additional Resources

> **[Full API Reference](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.