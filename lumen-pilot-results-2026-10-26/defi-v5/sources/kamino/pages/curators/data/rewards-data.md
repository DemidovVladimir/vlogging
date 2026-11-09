> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Rewards Data

> Query vault rewards, incentive programs, and reward APY data

Access vault reward information, incentive programs, and farm data via the REST API and TypeScript SDK. Use these endpoints to monitor reward distribution and calculate incentive APYs for your vault.

## Vault Rewards

Query all active reward programs across vaults.

```typescript API theme={null}
const response = await fetch('https://api.kamino.finance/kvaults/rewards');
const rewards = await response.json();
console.log('All vault rewards:', rewards);
```

```bash curl theme={null}
curl https://api.kamino.finance/kvaults/rewards
```

## Vault Incentive Data

Get detailed incentive information for a specific vault including delegated farm rewards, reserve farm incentives, and direct vault farm incentives.

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const kaminoManager = new KaminoManager(rpc);

const vaultTokenPrice = new Decimal(1.0); // adjust for non-stablecoin vaults
const vaultOverview = await kaminoManager.getVaultOverview(vault, vaultTokenPrice);

console.log('Delegated farm incentives:', vaultOverview.delegatedFarmIncentives);
console.log('Reserve farm incentives:', vaultOverview.reservesFarmsIncentives);
console.log('Vault farm incentives:', vaultOverview.vaultFarmIncentives);
```

### Incentive Types

| Type | Description |
| - | - |
| **Delegated Farm Incentives** | Rewards delegated from the vault farm to depositors |
| **Reserve Farm Incentives** | Rewards from individual lending reserve farms that the vault participates in |
| **Vault Farm Incentives** | Direct rewards distributed through the vault's own farm |

## Reward APY Calculation

Calculate the total reward APY for a vault by combining incentive data from the vault overview.

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const kaminoManager = new KaminoManager(rpc);

const vaultTokenPrice = new Decimal(1.0);
const vaultOverview = await kaminoManager.getVaultOverview(vault, vaultTokenPrice);

// The vault overview contains APY breakdown by source
console.log('Full vault overview:', vaultOverview);
```

> [!NOTE]
>
> Reward APYs are dynamic and depend on total deposits, reward emission rates, and token prices. Query this data regularly for accurate dashboard displays.

## Additional Resources

> **[Full API Reference](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples/kvault-tutorial)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.