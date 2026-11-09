> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Refer User Without Deposit

> Create UserMetadata with a referrer without requiring an initial deposit

## Refer User Without Deposit

Create a UserMetadata account with a referrer without requiring an initial deposit. This allows you to link a referrer to a user before they perform any lending operations.

> [!NOTE]
>
> The referrer must be set when the UserMetadata account is created and cannot be changed afterward.

**TypeScript**

**Step 1**

### Import Dependencies

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  some,
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
  getUserLutAddressAndSetupIxs,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
```

**Step 2**

### Initialize RPC and Load Market

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market
const REFERRER = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Check Existing User Metadata

```typescript theme={null}
const [, userMetadata] = await market!.getUserMetadata(signer.address);

if (userMetadata) {
  console.log('User metadata already exists, so the referrer can no longer be set:', signer.address);
}
```

**Step 4**

### Build User Metadata Setup Instructions

```typescript theme={null}
const [, setupInstructions] = await getUserLutAddressAndSetupIxs(market!, signer, some(REFERRER), false);
```

> [!NOTE]
>
> The referrer's wallet must have Kamino user metadata itself. The instructions also create the wallet's lookup table; `false` skips filling it. For a wallet that already has user metadata, the SDK returns no instructions.

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(setupInstructions.flat(), tx)
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

console.log('Referrer linked! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> User metadata created. The referrer is now linked to the wallet and earns a share of the interest it pays on borrows.

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

Create the `init_user_metadata` instruction linking the user to a referrer without requiring a deposit.

```rust theme={null}
use klend_interface::instructions::referrer::{
    init_user_metadata,
    InitUserMetadataAccounts,
};
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let referrer = Pubkey::from_str("EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY").unwrap();

// Derive PDAs
let (user_metadata, _) = pda::user_metadata(&KLEND_PROGRAM_ID, &owner);
let (referrer_user_metadata, _) = pda::user_metadata(&KLEND_PROGRAM_ID, &referrer);

// Your user's address lookup table (created during onboarding)
let user_lookup_table = Pubkey::from_str("YOUR_USER_LOOKUP_TABLE_PUBKEY").unwrap();

let ix = init_user_metadata(
    InitUserMetadataAccounts {
        owner,
        fee_payer: owner,
        user_metadata,
        referrer_user_metadata: Some(referrer_user_metadata),
    },
    user_lookup_table,
);
```

> [!WARNING]
>
> Once UserMetadata is created with a referrer, the referrer cannot be changed. Always check if UserMetadata exists before attempting to create it.

**Step 4**

### Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&[ix], Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("UserMetadata created with referrer! Signature: {signature}");
```

> **When to Use This vs Deposit with Referral**
>
> **Use this method when:**
>
> * You want to link a referrer to a user before they make their first deposit
> * You're creating UserMetadata as a separate step from deposit operations
> * You have a simpler flow that doesn't require immediate deposit
>
> **Use Deposit with Referral when:**
>
> * You want to combine UserMetadata creation and deposit in a single transaction
> * The user is ready to deposit immediately
> * You want to minimize the number of transactions


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.