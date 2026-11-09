> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deposit with Referral

> Deposit funds with a referrer who earns commission from a user's borrowing activity

## Deposit with Referral

A UserMetadata account stores the referrer information. The referrer must be included when the account is created. After it is set, the referrer cannot be changed.

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
  some,
} from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  DEFAULT_PUBLIC_KEY,
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

### Check the Referrer on Record

The referrer is stored in the wallet's user metadata, created by its first Kamino deposit. If the account already exists, pass the referrer on record.

```typescript theme={null}
const REFERRER = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');

const [, userMetadata] = await market!.getUserMetadata(signer.address);
const referrer = userMetadata ? userMetadata.referrer : REFERRER;

if (userMetadata) {
  console.log('Referrer already fixed for this wallet:', referrer === DEFAULT_PUBLIC_KEY ? 'none' : referrer);
}
```

> [!WARNING]
>
> The referrer can only be set when the user metadata account is created and can't be changed after. A wallet that already used Kamino without a referral has `DEFAULT_PUBLIC_KEY` (`11111111111111111111111111111111`) on record, meaning no referrer, and can't get one. Passing a different referrer than the one on record makes the transaction fail.

**Step 4**

### Build Deposit Instructions with Referrer

Deposit USDC as collateral with the referrer attached.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const depositAction = await KaminoAction.buildDepositTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  initUserMetadata: { skipInitialization: false, skipLutCreation: true },
  referrer: some(referrer),
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

**Step 5**

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

**Step 6**

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
> The deposit with referral is complete. The referrer is linked to the account and earns a share of the interest it pays on borrows.

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

### Initialize User with Referrer

Create the user metadata account linked to a referrer before depositing.

```rust theme={null}
use klend_interface::helpers;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let referrer = Pubkey::from_str("EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY").unwrap();

// Derive the referrer's user_metadata PDA
let (referrer_user_metadata, _) = pda::user_metadata(&KLEND_PROGRAM_ID, &referrer);

// Your user's address lookup table (created during onboarding)
let user_lookup_table = Pubkey::from_str("YOUR_USER_LOOKUP_TABLE_PUBKEY").unwrap();

let init_ixs = helpers::lifecycle::init_user(
    owner,
    owner,                         // fee payer
    user_lookup_table,
    Some(referrer_user_metadata),  // links to this referrer
);
```

> [!WARNING]
>
> Once a UserMetadata account has a referrer, it cannot be changed. The original referrer permanently earns commission from the user's borrowing activity.

**Step 4**

### Build Obligation Context

Derive the obligation PDA and build the context for depositing.

```rust theme={null}
use klend_interface::ObligationContext;

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

**Step 5**

### Build Deposit Instructions

```rust theme={null}
use spl_associated_token_account::get_associated_token_address;

let liquidity_mint = Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
let user_source_liquidity = get_associated_token_address(&owner, &liquidity_mint);

let deposit_ixs = ctx.deposit(
    owner,
    &reserve_pubkey,
    user_source_liquidity,
    1_000_000, // 1 USDC
)?;
```

**Step 6**

### Send Transactions

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

// Transaction 1: Initialize user metadata with referrer
let message = Message::new(&init_ixs, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
rpc_client.send_and_confirm_transaction(&tx)?;

// Transaction 2: Deposit with referral
let message = Message::new(&deposit_ixs, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Deposit with referral successful! Signature: {signature}");
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.