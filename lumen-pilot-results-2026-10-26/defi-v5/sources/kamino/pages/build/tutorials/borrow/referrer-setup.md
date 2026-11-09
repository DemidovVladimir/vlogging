> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Referral Code Setup

> Set up referrer state with a unique referral code

This tutorial shows you how to set up your own referral code that you can share with users to earn commission from their borrowing activity.

## How Referral Codes Work

Kamino's referral system allows referrers to earn commission from the borrowing activity of referred users. Each referrer creates a unique referral code that can be shared publicly without revealing a wallet address, providing a user-friendly way to distribute referral codes.
\[!NOTE] In the SDK, the `shortUrl` field represents the referral code.

**TypeScript**

**Step 1**

### Import Dependencies

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
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
  PROGRAM_ID,
  getInitReferrerStateAndShortUrlIxs,
  getReferrerForShortUrl,
  isShortUrlAvailable,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
```

**Step 2**

### Initialize RPC

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
```

**Step 3**

### Create Referrer State with Short URL

Check the referral code is free, then create the referrer state and short URL.

```typescript theme={null}
const shortUrl = 'your-referral-code';

if (!(await isShortUrlAvailable(rpc, shortUrl, PROGRAM_ID))) {
  console.log('Referral code is invalid or already taken:', shortUrl);
}

const initReferrerIx = await getInitReferrerStateAndShortUrlIxs({
  referrer: signer,
  shortUrl,
  programId: PROGRAM_ID,
});
```

> [!NOTE]
>
> The short URL must be unique, at most 32 characters, and use only ASCII letters, digits, underscore and hyphen. `isShortUrlAvailable` checks both. Each wallet gets one code.

**Step 4**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions([initReferrerIx], tx)
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

console.log('Referrer registered! Signature:', getSignatureFromTransaction(signedTransaction));
```

**Step 6**

### Verify Short URL Resolution

```typescript theme={null}
const referrer = await getReferrerForShortUrl(rpc, shortUrl, PROGRAM_ID);
console.log(`Code ${shortUrl} resolves to:`, referrer);
```

> [!TIP]
>
> Referrer setup complete. The short URL is active and can be shared with users to establish referral relationships.

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

### Derive PDAs and Build Instruction

```rust theme={null}
use klend_interface::instructions::referrer::{
    init_referrer_state_and_short_url,
    InitReferrerStateAndShortUrlAccounts,
};
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;

let referrer = signer.pubkey();
let short_url = format!("ref-{}", std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs());

// Derive required PDAs
let (referrer_state, _) = pda::referrer_state(&KLEND_PROGRAM_ID, &referrer);
let (referrer_short_url, _) = pda::short_url(&KLEND_PROGRAM_ID, &short_url);
let (referrer_user_metadata, _) = pda::user_metadata(&KLEND_PROGRAM_ID, &referrer);

let ix = init_referrer_state_and_short_url(
    InitReferrerStateAndShortUrlAccounts {
        referrer,
        referrer_state,
        referrer_short_url,
        referrer_user_metadata,
    },
    short_url.clone(),
);
```

> [!NOTE]
>
> The short URL must be unique, contain a maximum of 32 characters, and use only ASCII alphanumeric characters plus underscore and hyphen.

**Step 4**

### Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&[ix], Some(&referrer));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Referrer setup successful! Short URL: {short_url}");
println!("Signature: {signature}");
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.