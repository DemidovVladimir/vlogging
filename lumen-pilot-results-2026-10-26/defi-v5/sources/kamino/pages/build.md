> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Build

> Integrate Kamino for yield or crypto loans

# Build on Kamino

Deposit to earn, lend or borrow programmatically, and use our APIs to read market data and user positions. Available via TypeScript SDK, REST APIs and full working examples.

[ Get Started ](https://kamino.com/docs/build/developers/overview.md)

![Build on Kamino section background illustration](https://mintcdn.com/kamino-3d73a151/lP5bd214efImJ7R7/images/bg-hero.png?fit=max\&auto=format\&n=lP5bd214efImJ7R7\&q=85\&s=438df1f8f5bc6c92ac322c32ca8bc060)

## Integration Guides

> **[Earn - Kamino Vaults](https://kamino.com/docs/build/earn.md)**
>
> Lending strategies to earn yield
>
> * Vault and user data
> * Current & historical data
> * Deposit & Withdraw txn
> * Deploy vaults

> **[Borrow - Kamino Lend](https://kamino.com/docs/build/borrow.md)**
>
> Flexible lending and borrowing
>
> * User and PnL data
> * Historical yield & liquidity
> * Deposit & Withdraw txn
> * Borrow & Repay txn

> **[API Reference](https://kamino.com/docs/build/api-reference/introduction.md)**
>
> APIs for data & transactions
>
> * Current & historical data
> * Build transactions
> * Earn vaults
> * Borrow lend

## Quick Snippets

**Deposit on Earn**

```typescript theme={null}
import { createSolanaRpc, address, generateKeyPairSigner } from '@solana/kit';
import { KaminoManager, KaminoVault, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const signer = await generateKeyPairSigner();
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(rpc, address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), slotDuration);

const vaultState = await vault.getState();
const { depositIxs } = await vault.depositIxs(
  signer,
  new Decimal(100.0),
  await manager.loadVaultReserves(vaultState),
  await manager.loadVaultFarmState(vaultState),
  null
);
```

**Borrow**

```typescript theme={null}
import { createSolanaRpc, address, generateKeyPairSigner } from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import BN from 'bn.js';

const signer = await generateKeyPairSigner();
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const market = await KaminoMarket.load(
  rpc,
  address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'),
  await getMedianSlotDurationInMsFromLastEpochs()
);
const usdtReserve = market!.getExistingFloatRateReserveByMint(address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'));

const borrowAction = await KaminoAction.buildBorrowTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdtReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});

```

**Get Earn balances**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault, getCurrentLedgerInstant, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'),
  await getMedianSlotDurationInMsFromLastEpochs()
);

const user = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');
const shares = await vault.getUserShares(user);
const rate = await vault.getExchangeRate(await getCurrentLedgerInstant(rpc));

console.log({
  shares: shares.totalShares.toString(),
  tokens: shares.totalShares.mul(rate).toString(),
});
```

**Get Loan health**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, VanillaObligation, PROGRAM_ID, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());

const userAddress = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');
const obligation = await market!.getObligationByWallet(userAddress, new VanillaObligation(PROGRAM_ID));

console.log('Loan-to-Value:', obligation!.loanToValue().toFixed(4));

```

**Get Market data**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const market = await KaminoMarket.load(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'),
  await getMedianSlotDurationInMsFromLastEpochs()
);

console.log({
  totalDepositsUsd: market!.getTotalDepositTVL().toFixed(2),
  totalBorrowsUsd: market!.getTotalBorrowTVL().toFixed(2),
});

```

## Earn Tutorials

Quick tutorials for depositing into Earn vaults.

> **[Earn via API](https://kamino.com/docs/build/recipes/earn/earn-via-api.md)**
>
> Deposit to vaults using REST API

> **[Earn via SDK](https://kamino.com/docs/build/recipes/earn/earn-via-sdk.md)**
>
> Deposit to vaults using TypeScript SDK

> **[Earn with Privy Wallet](https://kamino.com/docs/build/recipes/earn/earn-with-privy.md)**
>
> Integrate deposits with Privy embedded wallets

## Deploy an Earn Vault and Get Revenue Share

Any builder can deploy a private or public Earn Vault and get revenue share in just a few lines of code.

```typescript theme={null}
const tokenMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
const kaminoManager = new KaminoManager(rpc, slotDuration);

const kaminoVaultConfig = new KaminoVaultConfig({
  admin: adminSigner,
  tokenMint: tokenMint,
  tokenMintProgramId: TOKEN_PROGRAM_ADDRESS,
  performanceFeeRatePercentage: new Decimal(10.0),
  managementFeeRatePercentage: new Decimal(1.0),
  name: 'Earn USDC Vault',
  vaultTokenSymbol: 'kUSDC',
  vaultTokenName: 'kUSDC receipt',
});

const { vault: vaultSigner, initVaultIxs: instructions } =
  await kaminoManager.createVaultIxs(kaminoVaultConfig);
```

[Start Earning ](https://kamino.com/docs/build/earn.md)

## Kamino management portal

No code solution to deploy markets, vaults and rewards.

> **[Earn Vaults](https://kamino.com/curators/vaults)**
>
> Deploy custom earn vault and earn revenue share.

> **[Borrow markets](https://kamino.com/curators/markets)**
>
> Choose collateral, debt, interest rate and oracle.

> **[Incentive campaigns](https://manage.kamino.com)**
>
> Incentive campaigns, points and more.

[manage.kamino.com ](https://manage.kamino.com)

## Developer Tools

> **[TypeScript SDK](https://github.com/Kamino-Finance/klend-sdk)**

> **[Earn Code Examples](https://kamino.com/docs/build/earn/index.md)**

> **[Borrow Code Examples](https://kamino.com/docs/build/borrow/index.md)**

> **[Smart Contract Repo](https://github.com/Kamino-Finance/klend)**

Found a vulnerability? Kamino's [Bug Bounty program](https://kamino.com/docs/security/bug-bounty.md) on Sherlock offers rewards up to 1,000,000 USDC.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.