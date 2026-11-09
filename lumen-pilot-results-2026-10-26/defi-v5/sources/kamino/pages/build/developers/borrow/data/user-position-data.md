> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# User Obligation

## Manage User Obligations

Manage and retrieve user obligations, positions, and transaction history using the Kamino SDK and API.

> [!NOTE]
>
> Historical obligation data is only available via the API.

### Get User Obligation Info

Retrieve detailed obligation information including deposits, borrows, and health metrics.

**TypeScript**

```typescript expandable title="getUserObligation.ts" theme={null}
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

**Rust**

```rust expandable title="get_user_obligation.rs" theme={null}
use klend_interface::state::Obligation;
use klend_interface::{from_account_data, pda, Fraction, KLEND_PROGRAM_ID};
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let market_pubkey = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF")?;
let user_pubkey = Pubkey::from_str("EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY")?;

let (obligation_pubkey, _bump) = pda::obligation(
    &KLEND_PROGRAM_ID,
    0,
    0,
    &user_pubkey,
    &market_pubkey,
    &Pubkey::default(),
    &Pubkey::default(),
);

let obligation_account = rpc_client.get_account(&obligation_pubkey)?;
let obligation = from_account_data::<Obligation>(&obligation_account.data)?;
println!("Obligation owner: {}", obligation.owner);

println!("\nDeposits (Collateral):");
for deposit in obligation.deposits.iter().filter(|d| d.deposit_reserve != Pubkey::default()) {
    println!("  Reserve: {}", deposit.deposit_reserve);
    println!("    Deposited amount (cTokens): {}", deposit.deposited_amount);
}

println!("\nBorrows:");
for borrow in obligation.borrows.iter().filter(|b| b.borrow_reserve != Pubkey::default()) {
    let borrowed: f64 = Fraction::from_bits(u128::from(borrow.borrowed_amount_sf)).to_num();
    println!("  Reserve: {}", borrow.borrow_reserve);
    println!("    Borrowed amount: {borrowed:.6}");
}

let deposited_value: f64 = Fraction::from_bits(u128::from(obligation.deposited_value_sf)).to_num();
let allowed_borrow: f64 = Fraction::from_bits(u128::from(obligation.allowed_borrow_value_sf)).to_num();
let unhealthy_borrow: f64 = Fraction::from_bits(u128::from(obligation.unhealthy_borrow_value_sf)).to_num();
let borrowed_value: f64 = Fraction::from_bits(u128::from(obligation.borrow_factor_adjusted_debt_value_sf)).to_num();

println!("\nMetrics at the obligation's last refresh:");
println!("  Deposited value: ${deposited_value:.2}");
println!("  Allowed borrow value: ${allowed_borrow:.2}");
println!("  Unhealthy borrow value: ${unhealthy_borrow:.2}");
println!("  Current borrow value: ${borrowed_value:.2}");
println!("  Borrowing disabled: {}", obligation.borrowing_disabled > 0);
```

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/user_position.rs)

### Get All User Obligations

Retrieve all obligations for a user wallet, including different obligation types across the market.

**TypeScript**

```typescript expandable title="getAllUserObligations.ts" theme={null}
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

### Get All Obligations by Reserve

Retrieve all obligations that have deposits in a specific reserve. Useful for analyzing reserve utilization and user exposure.

**TypeScript**

```typescript expandable title="getAllObligationsByReserve.ts" theme={null}
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

### Get User Transaction History

Access all transaction history for a user's wallet across deposits, borrows, repayments, and liquidations.

**TypeScript**

```typescript title="getTransactionHistory.ts" theme={null}
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

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.