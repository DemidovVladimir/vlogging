> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vaults

> Learn how to retrieve vault TVL, APY, farm rewards, allocation weights, and user share balances using the Kamino SDK and API

> **[Earn Vaults](https://kamino.com/docs/build/earn/index.md)**
>
> Earn interest on assets

## Get Vault Information

Retrieve vault holdings, APY and exchange rate information.

**TypeScript**

```typescript theme={null}
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

## Get User Position

Check a user's share balance and token value for a specific vault.

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(
  rpc,
  address('A2wsxhA7pF4B2UKVfXocb6TAAP9ipfPJam6oMKgDE5BK'),
  await getMedianSlotDurationInMsFromLastEpochs()
);

const user = address('883AnESJiUVzCnwowgaWCpXp4EGsK4JMVzUUUcjSSs62');

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

## Get All User Positions

Fetch a user's share balances across all vaults they participate in.

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const manager = new KaminoManager(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  await getMedianSlotDurationInMsFromLastEpochs()
);

const user = address('883AnESJiUVzCnwowgaWCpXp4EGsK4JMVzUUUcjSSs62');
const userSharesAllVaults = await manager.getUserSharesBalanceAllVaults(user);

userSharesAllVaults.forEach((shares, vault) => {
  if (shares.totalShares.gt(0)) {
    console.log(`User shares in ${vault}:`, shares.totalShares.toString());
  }
});
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-03-get-user-all-vaults-positions-example/index.ts)

## Deposit to Vault

Generate deposit instructions to add tokens to a vault. To sign and send them, follow the [deposit guide](https://kamino.com/docs/build/developers/earn/operations/deposit.md).

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address, createNoopSigner } from '@solana/kit';
import { KaminoManager, KaminoVault, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);

const { depositIxs, stakeInFarmIfNeededIxs } = await vault.depositIxs(
  createNoopSigner(address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY')), // user
  new Decimal(100.0),
  vaultReservesMap,
  farmState,
  null
);

console.log('Deposit Instructions:', [...depositIxs, ...stakeInFarmIfNeededIxs]);
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-04-user-deposit-example/index.ts)

## Withdraw from Vault

Generate withdrawal instructions to remove shares from a vault. To sign and send them, follow the [withdraw guide](https://kamino.com/docs/build/developers/earn/operations/withdraw.md).

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address, createNoopSigner } from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('A2wsxhA7pF4B2UKVfXocb6TAAP9ipfPJam6oMKgDE5BK'),
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);

const { unstakeFromFarmIfNeededIxs, withdrawIxs, postWithdrawIxs } = await vault.withdrawIxs(
  createNoopSigner(address('883AnESJiUVzCnwowgaWCpXp4EGsK4JMVzUUUcjSSs62')), // user
  new Decimal(1.5), // withdraw 1.5 shares
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  farmState,
  null
);

console.log('Withdraw Instructions:', [...unstakeFromFarmIfNeededIxs, ...withdrawIxs, ...postWithdrawIxs]);
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-05-user-withdraw-example/index.ts)

## Get Vault Allocations

View how vault assets are allocated across different reserves with target weights.

**TypeScript**

```typescript theme={null}
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

## Get Vault Incentives

Access comprehensive vault incentive data including farm and reserve rewards.

**TypeScript**

```typescript theme={null}
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

## Get Vault Metrics History

Retrieve historical vault-level performance metrics including TVL, APY, and farm rewards APY over time.

**TypeScript**

```typescript theme={null}
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

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-10-get-vault-historical-info-example/index.ts)

## Get User Position History

Retrieve historical performance metrics for a user's position in a specific vault.

**TypeScript**

```typescript theme={null}
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
    apy: item.apy,
    cumulativeInterestEarnedUsd: item.cumulativeInterestEarnedUsd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-08-get-user-vault-position-historical-info-example/index.ts)

## Get All User Position History

Fetch cumulative historical metrics for a user across all their vault positions.

**TypeScript**

```typescript theme={null}
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

## Get User Vault Position History

Access historical metrics for a user's position in a specific vault over time.

**TypeScript**

```typescript theme={null}
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

for (const item of data) {
  console.log({
    createdOn: item.createdOn,
    sharesAmount: item.sharesAmount,
    usdAmount: item.usdAmount,
    apy: item.apy,
    cumulativeInterestEarnedUsd: item.cumulativeInterestEarnedUsd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-10-get-vault-historical-info-example/index.ts)

## Get User P\&L

Calculate a user's profit and loss for their position in a vault.

**TypeScript**

```typescript theme={null}
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

## Vault Revenue Share

Earn revenue by deploying vaults with custom fee structures. Set performance fees on profits and management fees on assets under management.

**TypeScript**

```typescript theme={null}
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


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.