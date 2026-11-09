> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# User Position

## Reading User Position Data

Retrieve user holdings, profit and loss, fees and rewards, and transaction history using the Kamino API.

> [!NOTE]
>
> Historical user data is only available via the API. For the TypeScript shapes returned by the methods below, see [Position Types](#position-types).

### Get User Positions

Live read of a wallet's positions with USD value calculated from each strategy's share price.

```typescript icon="typescript" getUserPositions theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Kamino } from '@kamino-finance/kliquidity-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const WALLET = address('YOUR_WALLET_ADDRESS'); // user address

const rpc = createSolanaRpc(RPC_ENDPOINT);
const kamino = new Kamino('mainnet-beta', rpc);

const positions = await kamino.getUserPositions(WALLET);

console.log(`Wallet: ${WALLET}`);
console.log(`Positions: ${positions.length}`);

for (const p of positions) {
  const shareData = await kamino.getStrategyShareData(p.strategy);
  const usdValue = p.sharesAmount.mul(shareData.price);
  console.log({
    strategy: p.strategy.toString(),
    dex: p.strategyDex,
    shareMint: p.shareMint.toString(),
    sharesAmount: p.sharesAmount.toString(),
    sharePriceUsd: shareData.price.toString(),
    valueUsd: usdValue.toString(),
  });
}
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get User PnL

Returns current profit and loss data for a user's position in a specific strategy. Returns USD, SOL, and token denominations.

```typescript icon="typescript" getUserPnl theme={null}
const strategyPubkey = '2H4xebnp2M9JYgPPfUw58uUQahWF8f1YTNxwwtmdqVYV'; // strategy address
const walletPubkey = 'YOUR_WALLET_ADDRESS'; // user address

const url = `https://api.kamino.finance/v2/strategies/${strategyPubkey}/shareholders/${walletPubkey}/pnl?env=mainnet-beta`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

console.log({
  totalPnlUsd: data.totalPnl?.usd,
  totalPnlSol: data.totalPnl?.sol,
  totalPnlToken: data.totalPnl?.token,
  totalCostBasisUsd: data.totalCostBasis?.usd,
});
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get User PnL History

Returns time-series PnL snapshots for charting a user's position over time.

```typescript icon="typescript" getUserPnlHistory theme={null}
const strategyPubkey = '2H4xebnp2M9JYgPPfUw58uUQahWF8f1YTNxwwtmdqVYV'; // strategy address
const walletPubkey = 'YOUR_WALLET_ADDRESS'; // user address

const url = `https://api.kamino.finance/v2/strategies/${strategyPubkey}/shareholders/${walletPubkey}/pnl/history?env=mainnet-beta`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const item of data.history) {
  console.log({
    timestamp: item.timestamp,
    pnlUsd: item.pnl?.usd,
    positionValueUsd: item.positionValue?.usd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get User Fees and Rewards

Returns cumulative fees and rewards earned by the user in a specific strategy.

```typescript icon="typescript" getUserFeesAndRewards theme={null}
const strategyPubkey = '2H4xebnp2M9JYgPPfUw58uUQahWF8f1YTNxwwtmdqVYV'; // strategy address
const walletPubkey = 'YOUR_WALLET_ADDRESS'; // user address

const url = `https://api.kamino.finance/strategies/${strategyPubkey}/shareholders/${walletPubkey}/fees-and-rewards?env=mainnet-beta`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

console.log(data);
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get User Rewards History

Returns historical rewards earned by a wallet across all strategies.

```typescript icon="typescript" getUserRewardsHistory theme={null}
const walletPubkey = 'YOUR_WALLET_ADDRESS'; // user address

const url = `https://api.kamino.finance/strategies/shareholders/${walletPubkey}/rewards/history?env=mainnet-beta`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

console.log(data);
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get User Transactions

Deposit, withdrawal, and claim transaction history for a wallet across all strategies.

```typescript icon="typescript" getUserTransactions theme={null}
const walletPubkey = 'YOUR_WALLET_ADDRESS'; // user address

const url = `https://api.kamino.finance/v2/shareholders/${walletPubkey}/transactions?env=mainnet-beta`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

for (const tx of data.transactions) {
  console.log({
    timestamp: tx.timestamp,
    type: tx.type,
    strategy: tx.strategy,
    amountUsd: tx.amountUsd,
  });
}
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

## Position Types

TypeScript shapes returned by the Kliquidity SDK for user position reads.

**KaminoPosition**

A user's share holdings in a specific strategy.

```typescript theme={null}
interface KaminoPosition {
  strategy: Address;
  shareMint: Address;
  sharesAmount: Decimal;
  strategyDex: Dex;
}
```

**Holdings**

Available and invested token values with USD valuations.

```typescript theme={null}
type Holdings = {
  available: TokenAmounts;
  availableUsd: Decimal;
  invested: TokenAmounts;
  investedUsd: Decimal;
  totalSum: Decimal;
};
```

**TokenAmounts**

Pair of token quantities (A and B amounts).

```typescript theme={null}
type TokenAmounts = {
  a: Decimal;
  b: Decimal;
};
```

**ShareData**

Current share price with strategy balances.

```typescript theme={null}
type ShareData = {
  price: Decimal;
  balance: StrategyBalances;
};
```

**StrategyHolder**

A wallet and its share count in a strategy.

```typescript theme={null}
type StrategyHolder = {
  holderPubkey: Address;
  amount: Decimal;
};
```

**WithdrawShares**

Bundle of instructions for executing share withdrawals. `closeSharesAtaIx` is optional — it's only returned when the withdrawal closes the entire position and the shares ATA can be cleaned up.

```typescript theme={null}
type WithdrawShares = {
  prerequisiteIxs: TransactionInstruction[];
  withdrawIx: TransactionInstruction;
  closeSharesAtaIx?: TransactionInstruction;
};
```

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.