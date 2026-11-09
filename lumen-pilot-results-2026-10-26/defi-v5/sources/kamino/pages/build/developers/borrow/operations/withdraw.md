> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdraw

> Withdraw liquidity or collateral

Withdraw liquidity or collateral from the reserve. The SDK handles transaction building, instruction creation, and collateral release calculations.

## Withdraw for Lending

Withdraw liquidity from the reserve.

**TypeScript**

**Step 1**

### Import Dependencies

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getAssociatedTokenAddress,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import BN from 'bn.js';
```

**Step 2**

### Load Market and Initialize RPC

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Build Redeem Instructions

Redeem all of the wallet's USDC reserve cTokens for USDC, principal plus the interest they earned.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const cTokenAccount = await getAssociatedTokenAddress(usdcReserve.getCTokenMint(), signer.address);
const { value: cTokenBalance } = await rpc.getTokenAccountBalance(cTokenAccount).send();

const redeemAction = await KaminoAction.buildRedeemReserveCollateralTxns({
  kaminoMarket: market!,
  amount: new BN(cTokenBalance.amount),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!NOTE]
>
> The amount is in cTokens, not USDC, so this reads the wallet's cToken balance and redeems all of it.

**Step 4**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(redeemAction), tx)
);
```

**Step 5**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Redeem successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The withdrawal is complete. The cTokens are redeemed and the USDC is back in the wallet.

**Rust**

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
klend-interface = "0.6.0"
solana-pubkey = "2.1"
solana-instruction = "2.1"
solana-sdk = "~2.3"
solana-client = "~2.3"
spl-token = "7"
spl-associated-token-account = "6"
```

> [!NOTE]
>
> `klend-interface` is a lightweight Rust instruction builder that creates `Vec<Instruction>` with required refresh instructions prepended automatically.

**Step 2**

### Set Up RPC Client

```rust theme={null}
use solana_client::rpc_client::RpcClient;
use solana_sdk::signer::keypair::read_keypair_file;
use solana_sdk::signer::Signer;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let signer = read_keypair_file("/path/to/your/keypair.json")
    .expect("Failed to read keypair file");
let owner = signer.pubkey();
```

**Step 3**

### Fetch Reserve Data

```rust theme={null}
use klend_interface::ReserveInfo;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();

let reserve_data = rpc_client.get_account(&reserve_pubkey)?;
let reserve = ReserveInfo::from_account_data(reserve_pubkey, &reserve_data.data)?;
```

> [!NOTE]
>
> Use `ReserveInfo::from_account_data(pubkey, &data)` to construct reserve info from raw RPC account bytes.

**Step 4**

### Derive Token Accounts

```rust theme={null}
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use spl_associated_token_account::get_associated_token_address;

// User's ATA for the underlying token (e.g. USDC)
let user_destination_liquidity = get_associated_token_address(&owner, &reserve.liquidity_mint);

// User's ATA for the cToken (collateral token received when depositing)
let (collateral_mint, _) = pda::reserve_collateral_mint(&KLEND_PROGRAM_ID, &reserve_pubkey);
let user_source_collateral = get_associated_token_address(&owner, &collateral_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
use klend_interface::helpers;

let collateral_amount = 1_000_000; // amount of cTokens to redeem

let instructions = helpers::withdraw::redeem(
    owner,
    &reserve,
    user_source_collateral,     // cToken account (burned)
    user_destination_liquidity, // receives underlying tokens + interest
    collateral_amount,
);
// Returns: [refresh_reserve, redeem_reserve_collateral]
```

> [!NOTE]
>
> For simple lending withdrawals (no obligation), use `helpers::withdraw::redeem()` to redeem cTokens for the underlying liquidity plus accrued interest. Use `ObligationContext::withdraw()` if you need to withdraw collateral from an obligation (borrowing flow).

**Step 6**

### Build and Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Redeem successful! Signature: {signature}");
```

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/redeem_ctokens.rs)

## Withdraw for Borrowing

Withdraw collateral from an obligation.

**TypeScript**

**Step 1**

### Import Dependencies

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import BN from 'bn.js';
```

**Step 2**

### Load Market and Initialize RPC

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Load the Obligation

Load the wallet's borrow position so the SDK refreshes every reserve it uses.

```typescript theme={null}
const obligation = await market!.getObligationByWallet(signer.address, new VanillaObligation(PROGRAM_ID));

if (!obligation) {
  console.log('No borrow position found for', signer.address);
}
```

**Step 4**

### Build Withdraw Instructions

Withdraw USDC collateral from the borrow position.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const withdrawAction = await KaminoAction.buildWithdrawTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!TIP]
>
> With open borrows, the withdrawal must keep the position under its borrow limit. To withdraw all of a deposit, pass `new BN(U64_MAX)` as the amount (`U64_MAX` is exported by the SDK).

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(withdrawAction), tx)
);
```

**Step 6**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Withdraw successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The withdrawal is complete. The collateral is back in the wallet.

**Rust**

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
klend-interface = "0.6.0"
solana-pubkey = "2.1"
solana-instruction = "2.1"
solana-sdk = "~2.3"
solana-client = "~2.3"
spl-token = "7"
spl-associated-token-account = "6"
```

> [!NOTE]
>
> `klend-interface` is a lightweight Rust instruction builder that creates `Vec<Instruction>` with required refresh instructions prepended automatically.

**Step 2**

### Set Up RPC Client

```rust theme={null}
use solana_client::rpc_client::RpcClient;
use solana_sdk::signer::keypair::read_keypair_file;
use solana_sdk::signer::Signer;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let signer = read_keypair_file("/path/to/your/keypair.json")
    .expect("Failed to read keypair file");
let owner = signer.pubkey();
```

**Step 3**

### Build Obligation Context

```rust theme={null}
use klend_interface::ObligationContext;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let lending_market = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF").unwrap();
let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();

// Derive the obligation PDA
let (obligation_pubkey, _) = pda::obligation(
    &KLEND_PROGRAM_ID, 0, 0, &owner, &lending_market,
    &Pubkey::default(), &Pubkey::default(),
);

// Fetch the obligation account
let obligation_data = rpc_client.get_account(&obligation_pubkey)?;

// Discover which reserves the obligation references
let reserve_addrs = ObligationContext::reserve_addresses_for_obligation(&obligation_data.data)?;

// Fetch all reserve accounts in one RPC call
let reserve_accounts = rpc_client.get_multiple_accounts(&reserve_addrs)?;

// Build the context
let reserves: Vec<(Pubkey, &[u8])> = reserve_addrs.iter()
    .zip(reserve_accounts.iter())
    .filter_map(|(addr, acc)| acc.as_ref().map(|a| (*addr, a.data.as_slice())))
    .collect();
let ctx = ObligationContext::from_account_data(
    obligation_pubkey, &obligation_data.data, &reserves
)?;
```

> [!NOTE]
>
> `ObligationContext` is the recommended approach for obligation-based operations. It fetches the obligation and its associated reserves, then provides convenient `.deposit()`, `.borrow()`, `.repay()`, and `.withdraw()` methods.

**Step 4**

### Derive Token Accounts

```rust theme={null}
use spl_associated_token_account::get_associated_token_address;

// User's ATA for the withdrawal token (e.g. USDC)
let liquidity_mint = Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
let user_dest_liquidity = get_associated_token_address(&owner, &liquidity_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
let instructions = ctx.withdraw(
    owner,
    &reserve_pubkey,
    user_dest_liquidity,
    1_000_000, // 1 USDC (6 decimals)
)?;
// Returns: [refresh_reserves..., refresh_obligation, withdraw_and_redeem]
```

> [!NOTE]
>
> Use `helpers::withdraw::redeem()` if you hold cTokens without an obligation — see the [Withdraw for Lending](https://kamino.com/docs/build/developers/borrow/operations/withdraw.md#withdraw-for-lending) tab.

**Step 6**

### Build and Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Withdrawal successful! Signature: {signature}");
```

> [!TIP]
>
> The withdrawal is complete. Your collateral has been returned to your wallet.

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/withdraw_obligation.rs)

> **What Happens When You Withdraw Collateral?**
>
> 1. The collateral amount is removed from your obligation
> 2. Your borrowing capacity decreases
> 3. Your loan-to-value (LTV) ratio increases


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.