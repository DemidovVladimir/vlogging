> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Allocation Data

> Query current allocations, weights, and historical allocation changes

Access vault allocation state, reserve distribution, and historical allocation changes via the REST API and TypeScript SDK. Use these endpoints to monitor how your vault distributes capital across reserves.

## Current Allocations

Query the current allocation state including reserve weights, ctoken allocations, and target distributions.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault } from '@kamino-finance/klend-sdk';

const vault = new KaminoVault(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('<VAULT_ADDRESS>')
);

const allocations = await vault.getVaultAllocations();

for (const [reserveAddress, overview] of allocations) {
  console.log(
    `Reserve: ${reserveAddress}: ` +
    `weight ${overview.targetWeight.toString()}, ` +
    `allocation: ${overview.ctokenAllocation.toString()}`
  );
}
```

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>'
);
const vault = await response.json();

// Allocation data is part of the vault state
console.log('Vault state with allocations:', vault.state);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>
```

## Vault Overview with Allocations

Get a comprehensive overview including allocation data, incentives, and performance metrics.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const kaminoManager = new KaminoManager(rpc);

const vaultTokenPrice = new Decimal(1.0); // adjust for non-stablecoin vaults
const vaultOverview = await kaminoManager.getVaultOverview(vault, vaultTokenPrice);

console.log('Overview:', vaultOverview);
console.log('Reserve farm incentives:', vaultOverview.reservesFarmsIncentives);
console.log('Delegated farm incentives:', vaultOverview.delegatedFarmIncentives);
```

## Allocation Volume History

Query historical allocation volume changes over time. Track how capital distribution across reserves has evolved.

> [!NOTE]
>
> Historical allocation data is only available via the API.

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/allocation-volume/history'
);
const history = await response.json();
console.log('Allocation history:', history);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/vaults/<VAULT_ADDRESS>/allocation-volume/history
```

## Additional Resources

> **[Full API Reference](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.