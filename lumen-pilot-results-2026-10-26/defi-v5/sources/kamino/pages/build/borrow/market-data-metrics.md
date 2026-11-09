> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Data and Metrics

> Learn how to access market data including supply APY, borrow APY, TVL, and utilization rates for lending reserves

## Get Market Information

Retrieve market-wide TVL metrics for deposits and borrows.

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());

console.log({
totalDepositsUsd: market!.getTotalDepositTVL().toFixed(2),
totalBorrowsUsd: market!.getTotalBorrowTVL().toFixed(2),
});
```

View Code

## Get Reserve Supply and Borrow APY

Fetch historical supply APY and borrow APY data for a specific reserve over time.

**TypeScript**

```typescript theme={null}
const API_BASE_URL = 'https://api.kamino.finance';
const marketPubkey = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
const reservePubkey = '37Jk2zkz23vkAYBT66HM2gaqJuNg2nYLsCreQAVt5MWK';

const params = new URLSearchParams({
start: '2026-10-15T00:00:00.000Z',
end: '2026-10-22T00:00:00.000Z',
frequency: 'day',
});

const res = await fetch(
`${API_BASE_URL}/kamino-market/${marketPubkey}/reserves/${reservePubkey}/metrics/history?${params}`
);
if (!res.ok) {
console.log(`Request failed: ${res.status} ${res.statusText}`);
}

const { history } = await res.json();

console.table(
history.map((item) => ({
  date: item.timestamp.slice(0, 10),
  symbol: item.metrics.symbol,
  supplyAPY: `${(item.metrics.supplyInterestAPY * 100).toFixed(2)}%`,
  borrowAPY: `${(item.metrics.borrowInterestAPY * 100).toFixed(2)}%`,
  depositTvlUsd: Number(item.metrics.depositTvl).toFixed(2),
  borrowTvlUsd: Number(item.metrics.borrowTvl).toFixed(2),
}))
);
```

View Code

## Get Reserve Information

Check detailed metrics for all reserves including supply APY, borrow APY, deposit TVL, borrow TVL, and utilization rates.

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoMarket,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const ledgerInstant = await getCurrentLedgerInstant(rpc);

const reserves = market!.getReserves().map((reserve) => ({
  symbol: reserve.getTokenSymbol(),
  kind: reserve.getKind().toString(),
  supplyAPY: `${(reserve.totalSupplyAPY(ledgerInstant) * 100).toFixed(2)}%`,
  borrowAPY: `${(reserve.totalBorrowAPY(ledgerInstant) * 100).toFixed(2)}%`,
  utilization: `${(reserve.calculateUtilizationRatio() * 100).toFixed(2)}%`,
  depositTvlUsd: reserve.getDepositTvl().toFixed(2),
  borrowTvlUsd: reserve.getBorrowTvl().toFixed(2),
}));

console.table(reserves);
```

> [!NOTE]
>
> A token can have several reserves: one variable-rate reserve plus fixed-rate ones, so each row shows its kind. Fixed-rate APYs depend on the slot duration passed to `KaminoMarket.load`. A hard-coded value such as 400 ms shows them at about half their real rate, because mainnet slots are closer to 210 ms.

View Code

## Get Reserve Reward History

Fetches historical KLend reward metrics for a specific deposit and borrow reserve pair.

> [!NOTE]
>
> This endpoint returns KMNO reward incentives for specific deposit and borrow reserve combinations.

**TypeScript**

```typescript theme={null}
const API_BASE_URL = 'https://api.kamino.finance';
const depositReservePubkey = 'd4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q';
const borrowReservePubkey = 'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59';

const params = new URLSearchParams({
start: '2025-11-07T00:00:00.000Z',
end: '2025-11-14T23:59:59.999Z',
frequency: 'day',
});

const res = await fetch(
`${API_BASE_URL}/klend/${depositReservePubkey}/${borrowReservePubkey}/rewards/history?${params}`
);
if (!res.ok) {
console.log(`Request failed: ${res.status} ${res.statusText}`);
}

const rewards = await res.json();

console.table(
rewards.map((item) => ({
  date: item.timestamp.slice(0, 10),
  rewardToken: item.rewardTokenMint,
  rewardAPY: `${(item.rewardApy * 100).toFixed(2)}%`,
}))
);
```

> [!NOTE]
>
> The endpoint only returns rows for windows when the pair had KMNO incentives. Other windows return an empty array.

View Code

## Get User Obligation Info

Retrieve detailed obligation information including deposits, borrows, and health metrics.

**TypeScript**

```typescript expandable theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoMarket,
  VanillaObligation,
  PROGRAM_ID,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const userAddress = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const obligation = await market!.getObligationByWallet(userAddress, new VanillaObligation(PROGRAM_ID));

if (!obligation) {
  console.log('No obligation found for user:', userAddress);
}

const positions = [
  ...obligation!.getDeposits().map((position) => ({ side: 'deposit', ...position })),
  ...obligation!.getBorrows().map((position) => ({ side: 'borrow', ...position })),
];

console.table(
  positions.map((position) => ({
    side: position.side,
    symbol: market!.getReserveByAddress(position.reserveAddress)?.getTokenSymbol(),
    amount: position.amount.div(position.mintFactor).toFixed(6),
    valueUsd: position.marketValueRefreshed.toFixed(2),
  }))
);

console.log({
  ltv: `${obligation!.refreshedStats.loanToValue.mul(100).toFixed(2)}%`,
  liquidationLtv: `${obligation!.refreshedStats.liquidationLtv.mul(100).toFixed(2)}%`,
  borrowUtilization: `${obligation!.refreshedStats.borrowUtilization.mul(100).toFixed(2)}%`,
});
```

View Code

## Get All User Obligations

Retrieve all obligations for a user wallet, including different obligation types across the market.

**TypeScript**

```typescript expandable theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
KaminoMarket,
ObligationTypeTag,
getCurrentLedgerInstant,
getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const userAddress = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const obligations = await market!.getAllUserObligations(userAddress, await getCurrentLedgerInstant(rpc));

if (obligations.length === 0) {
console.log('No obligations found for wallet:', userAddress);
}

for (const obligation of obligations) {
console.log(`\nObligation ${obligation.obligationAddress} (${ObligationTypeTag[obligation.obligationTag]})`);
console.table(
  [
    ...obligation.getDeposits().map((position) => ({ side: 'deposit', ...position })),
    ...obligation.getBorrows().map((position) => ({ side: 'borrow', ...position })),
  ].map((position) => ({
    side: position.side,
    symbol: market!.getReserveByAddress(position.reserveAddress)?.getTokenSymbol(),
    amount: position.amount.div(position.mintFactor).toFixed(6),
    valueUsd: position.marketValueRefreshed.toFixed(2),
  }))
);
console.log({
  ltv: `${obligation.refreshedStats.loanToValue.mul(100).toFixed(2)}%`,
  liquidationLtv: `${obligation.refreshedStats.liquidationLtv.mul(100).toFixed(2)}%`,
});
}
```

View Code

## Get All Obligations by Reserve

Retrieve all obligations that have deposits in a specific reserve. Useful for analyzing reserve utilization and user exposure.

**TypeScript**

```typescript expandable theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
KaminoMarket,
ObligationTypeTag,
getCurrentLedgerInstant,
getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const reserveAddress = address('37Jk2zkz23vkAYBT66HM2gaqJuNg2nYLsCreQAVt5MWK');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const obligations = await market!.getAllObligationsByDepositedReserve(
reserveAddress,
await getCurrentLedgerInstant(rpc)
);

console.log(`Found ${obligations.length} obligations with deposits in this reserve`);

console.table(
obligations.map((obligation) => ({
  obligation: obligation.obligationAddress,
  type: ObligationTypeTag[obligation.obligationTag],
  depositUsd: obligation.getDepositByReserve(reserveAddress)?.marketValueRefreshed.toFixed(2),
  totalBorrowsUsd: obligation.refreshedStats.userTotalBorrow.toFixed(2),
  ltv: `${obligation.refreshedStats.loanToValue.mul(100).toFixed(2)}%`,
}))
);
```

> [!WARNING]
>
> This reads every obligation in the market. Public RPC endpoints reject it, so use a private RPC.

View Code

## Get User Transaction History

Access all transaction history for a user's wallet across deposits, borrows, repayments, and liquidations.

**TypeScript**

```typescript theme={null}
const API_BASE_URL = 'https://api.kamino.finance';
const marketPubkey = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
const userPubkey = 'EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY';

const res = await fetch(`${API_BASE_URL}/v2/kamino-market/${marketPubkey}/users/${userPubkey}/transactions`);
if (!res.ok) {
console.log(`Request failed: ${res.status} ${res.statusText}`);
}

const transactionsByObligation = await res.json();

for (const [obligation, transactions] of Object.entries(transactionsByObligation)) {
console.log(`\nObligation ${obligation}`);
console.table(
  transactions.map((tx) => ({
    date: tx.createdOn.slice(0, 10),
    type: tx.transactionName,
    token: tx.liquidityToken,
    amount: tx.liquidityTokenAmount,
    usdValue: Number(tx.liquidityUsdValue).toFixed(2),
  }))
);
}
```

> [!NOTE]
>
> Results are grouped by obligation address. A market where the wallet has no obligation returns an empty object.

View Code


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.