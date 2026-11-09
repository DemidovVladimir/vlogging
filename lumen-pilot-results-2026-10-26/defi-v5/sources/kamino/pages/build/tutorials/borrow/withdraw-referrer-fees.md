> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdraw Referrer Fees

> Withdraw accumulated referral fees from borrowing activity

Follow this guide to withdraw the referral fees you've earned from referred users' borrowing activity.

## Withdraw Referrer Fees

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
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
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

### Check Accumulated Fees

Fees accrue per reserve, in that reserve's token. Amounts are in lamports, so divide by the reserve's mint factor.

```typescript theme={null}
const allFees = await market!.getAllReferrerFeesCumulative(signer.address);

console.table(
  [...allFees.entries()].map(([reserveAddress, fees]) => {
    const reserve = market!.getReserveByAddress(reserveAddress);
    return {
      symbol: reserve?.getTokenSymbol(),
      lifetimeFees: reserve ? fees.div(reserve.getMintFactor()).toFixed(6) : fees.toFixed(0),
    };
  })
);

const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);
const unclaimedFees = await market!.getReferrerFeesUnclaimedForReserve(signer.address, usdcReserve);

console.log('Unclaimed USDC fees:', unclaimedFees.div(usdcReserve.getMintFactor()).toFixed(6));
if (unclaimedFees.isZero()) {
  console.log('No USDC referrer fees to withdraw for', signer.address);
}
```

**Step 4**

### Build Withdraw Instructions

Withdraw the unclaimed USDC fees to the wallet.

```typescript theme={null}
const withdrawFeesAction = await KaminoAction.buildWithdrawReferrerFeeTxns({
  owner: signer,
  reserveAddress: usdcReserve.address,
  kaminoMarket: market!,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!NOTE]
>
> A wallet that has never earned fees in the reserve has no referrer token state for it, and the withdrawal fails with `AccountOwnedByWrongProgram` (3007).

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(withdrawFeesAction), tx)
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

console.log('Referrer fees withdrawn! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> Fee withdrawal complete. The accumulated referral fees have been transferred to the referrer wallet.

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
    withdraw_referrer_fees,
    WithdrawReferrerFeesAccounts,
};
use klend_interface::pda::{self, ReservePdas};
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;
use std::str::FromStr;
use spl_associated_token_account::get_associated_token_address;

let referrer = signer.pubkey();
let lending_market = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF").unwrap();
let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();
let reserve_liquidity_mint = Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();

// Derive PDAs
let (referrer_token_state, _) = pda::referrer_token_state(
    &KLEND_PROGRAM_ID, &referrer, &reserve_pubkey
);
let (lending_market_authority, _) = pda::lending_market_authority(
    &KLEND_PROGRAM_ID, &lending_market
);
let reserve_pdas = ReservePdas::derive(&KLEND_PROGRAM_ID, &reserve_pubkey);

// Derive referrer's ATA for the reserve liquidity mint
let referrer_token_account = get_associated_token_address(&referrer, &reserve_liquidity_mint);

let ix = withdraw_referrer_fees(WithdrawReferrerFeesAccounts {
    referrer,
    referrer_token_state,
    reserve: reserve_pubkey,
    reserve_liquidity_mint,
    reserve_supply_liquidity: reserve_pdas.liquidity_supply_vault,
    referrer_token_account,
    lending_market,
    lending_market_authority,
    token_program: spl_token::ID,
});
```

**Step 4**

### Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&[ix], Some(&referrer));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Withdraw fees successful! Signature: {signature}");
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.