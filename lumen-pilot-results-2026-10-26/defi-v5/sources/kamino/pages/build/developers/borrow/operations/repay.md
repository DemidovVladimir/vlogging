> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Repay

> Repay borrowed assets

Return borrowed assets to reduce or close positions. The SDK handles transaction building, instruction creation for debt repayment.

## Repay

Return borrowed assets into the reserve.

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

### Build Repay Instructions

Repay part of the USDT loan from the USDT in the wallet.

```typescript theme={null}
const usdtMint = address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const usdtReserve = market!.getExistingFloatRateReserveByMint(usdtMint);

const repayAction = await KaminoAction.buildRepayTxns({
  kaminoMarket: market!,
  amount: new BN(500_000),
  reserveAddress: usdtReserve.address,
  owner: signer,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!TIP]
>
> To repay the whole loan including accrued interest, pass `new BN(U64_MAX)` as the amount (`U64_MAX` is exported by the SDK). The program repays the exact debt, so no dust is left.

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(repayAction), tx)
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

console.log('Repay successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The repayment is complete. The debt in the borrow position is reduced.

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
let repay_reserve_pubkey = Pubkey::from_str("FBSyPnxtHKLBZ4UeeUyAnbtFuAmTHLtso9YtsqRDRWpM").unwrap();

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

// User's ATA for the repay token (e.g. USDT)
let repay_liquidity_mint = Pubkey::from_str("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB").unwrap();
let user_source_liquidity = get_associated_token_address(&owner, &repay_liquidity_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
let instructions = ctx.repay(
    owner,
    &repay_reserve_pubkey,
    user_source_liquidity,
    1_000_000, // 1 USDT (6 decimals)
)?;
// Returns: [refresh_reserves..., refresh_obligation, repay_obligation_liquidity_v2]
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
println!("Repay successful! Signature: {signature}");
```

> [!NOTE]
>
> Repaying reduces your debt and improves your loan-to-value (LTV) ratio, making your position healthier and reducing liquidation risk.

> [!TIP]
>
> The repay is complete. Your debt has been reduced.

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/repay.rs)

> **What Happens When You Repay?**
>
> 1. Assets are transferred from your wallet to the reserve pool
> 2. Your borrow amount decreases in your obligation
> 3. You stop paying interest on the repaid amount
> 4. Your loan-to-value (LTV) ratio decreases (healthier position)
> 5. Your available borrowing capacity increases

> **Repayment and Interest**
>
> **Repay some of your debt to improve your LTV:**
>
> * Repaying entire borrowed amount + accrued interest eliminates debt
> * Full repayment allows you to withdraw all collateral
> * You must repay the principal + accrued interest
> * Interest accrues continuously


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.