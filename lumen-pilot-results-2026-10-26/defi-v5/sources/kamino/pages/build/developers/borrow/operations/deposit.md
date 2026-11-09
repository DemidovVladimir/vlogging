> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deposit

> Deposit assets as collateral or liquidity

Deposit assets as collateral or supply liquidity into Kamino lending reserves. The SDK handles transaction building, instruction creation, and obligation management for deposit operations.

## Deposit for Lending

Supply liquidity to the reserve and earn interest.

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

### Build Deposit Instructions

Supply USDC to the reserve. The wallet receives the reserve's cTokens, which grow in value as borrowers pay interest.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const depositAction = await KaminoAction.buildDepositReserveLiquidityTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!NOTE]
>
> This doesn't open a borrow position, so the `obligation` prop is required by the type but unused. A market can hold several reserves for the same token, so actions take a reserve address: `getExistingFloatRateReserveByMint` returns the variable-rate one. Redeem the cTokens with [Redeem cTokens](https://kamino.com/docs/build/tutorials/borrow/redeem-ctokens.md).

**Step 4**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(depositAction), tx)
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

console.log('Deposit successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The deposit is complete. The USDC is supplied to the reserve and earning interest.

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

Fetch the reserve account from the chain and construct `ReserveInfo` from its raw bytes.

```rust theme={null}
use klend_interface::helpers;
use klend_interface::ReserveInfo;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
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

Derive the user's associated token accounts for the liquidity mint and collateral mint.

```rust theme={null}
use spl_associated_token_account::get_associated_token_address;

// User's ATA for the deposit token (e.g. USDC)
let user_source_liquidity = get_associated_token_address(&owner, &reserve.liquidity_mint);

// Derive the collateral mint PDA, then the user's ATA for it
let (collateral_mint, _) = pda::reserve_collateral_mint(&KLEND_PROGRAM_ID, &reserve_pubkey);
let user_destination_collateral = get_associated_token_address(&owner, &collateral_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
let instructions = helpers::deposit::deposit(
    owner,
    &reserve,
    user_source_liquidity,       // user's USDC token account
    user_destination_collateral, // user's cToken account
    1_000_000,                   // 1 USDC (6 decimals)
);
// Returns: [refresh_reserve, deposit_reserve_liquidity]
```

**Step 6**

### Build and Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Deposit successful! Signature: {signature}");
```

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/deposit_lending.rs)

## Deposit for Borrowing

Deposit USDC as collateral to borrow other assets.

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

### Build Deposit Instructions

Deposit USDC as collateral into the wallet's borrow position.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const depositAction = await KaminoAction.buildDepositTxns({
  kaminoMarket: market!,
  amount: new BN(3_000_000),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  initUserMetadata: { skipInitialization: false, skipLutCreation: true },
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!NOTE]
>
> A first deposit also creates the wallet's user metadata and obligation accounts. `skipLutCreation: true` keeps that setup in the same transaction. Without it, the SDK also creates a user lookup table, which only activates a slot later, and the deposit fails with `0x17a3`.

**Step 4**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(depositAction), tx)
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

console.log('Deposit successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The deposit is complete. The collateral is now deposited and can be used for borrowing other assets.

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

Derive the obligation PDA, fetch its account data along with all associated reserves, and build an `ObligationContext`.

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

// User's ATA for the deposit token (e.g. USDC)
let liquidity_mint = Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
let user_source_liquidity = get_associated_token_address(&owner, &liquidity_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
let instructions = ctx.deposit(
    owner,
    &reserve_pubkey,
    user_source_liquidity,
    3_000_000, // 3 USDC (6 decimals)
)?;
// Returns: [refresh_reserves..., refresh_obligation, deposit_and_collateral_v2]
```

**Step 6**

### Build and Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Deposit successful! Signature: {signature}");
```

> [!TIP]
>
> The deposit is complete. Your collateral has been supplied and your borrow position is open.

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/deposit_borrowing.rs)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.