> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Flash Loans

> Execute atomic flash loan transactions on Kamino

## Flash Loans

**TypeScript**

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, and Kit transaction building.

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
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  none,
  assertIsTransactionWithinSizeLimit,
} from '@solana/kit';
import {
  KaminoMarket,
  PROGRAM_ID,
  getFlashLoanInstructions,
  getAssociatedTokenAddress,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { getAddMemoInstruction } from '@solana-program/memo';
import Decimal from 'decimal.js';
```

**Step 2**

### Setup Market and Signer

Load your keypair, initialize RPC connections, and load the Kamino market.

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market
const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Configure Flash Loan Parameters

Set the token, the flash loan amount in lamports (1 USDC), and the wallet's token account that receives it.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const flashLoanAmount = new Decimal(1_000_000);
const usdcAta = await getAssociatedTokenAddress(usdcMint, signer.address, usdcReserve.getLiquidityTokenProgram());
```

**Step 4**

### Build Flash Loan Instructions

Generate the flash borrow and flash repay instructions using the Kamino SDK.

```typescript theme={null}
const lendingMarketAuthority = await market!.getLendingMarketAuthority();

const { flashBorrowIx, flashRepayIx } = getFlashLoanInstructions({
  borrowIxIndex: 0,
  userTransferAuthority: signer,
  lendingMarketAuthority,
  lendingMarketAddress: market!.getAddress(),
  reserve: usdcReserve,
  amountLamports: flashLoanAmount,
  destinationAta: usdcAta,
  referrerAccount: none(),
  referrerTokenState: none(),
  programId: PROGRAM_ID,
});
```

> [!NOTE]
>
> `borrowIxIndex: 0` says that the flash borrow instruction is at index 0 in the transaction. The SDK uses this to validate that repayment occurs in the same transaction.

> [!NOTE]
>
> The flash repay takes the amount plus the reserve's flash loan fee (`reserve.state.config.fees.flashLoanFeeSf`, 0.001% for USDC on the SOL/BTC Market). The wallet must already hold enough USDC in that token account to pay the fee, or the repay fails with insufficient funds.

**Step 5**

### Add Your Custom Instructions

Create your custom instructions to execute with the borrowed funds. In this example, we use a simple memo instruction.

```typescript theme={null}
const memoIx = getAddMemoInstruction({ memo: 'Hello Kamino' });

const allInstructions = [flashBorrowIx, memoIx, flashRepayIx];
```

**Step 6**

### Build and Send Transaction

Build the transaction with a fresh blockhash and send it to the network.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(allInstructions, tx)
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: false,
});

console.log('Flash loan successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> Your flash loan transaction is complete! The borrowed funds were used for your operations and automatically repaid within the same atomic transaction.

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
use klend_interface::helpers;
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
use spl_associated_token_account::get_associated_token_address;

let user_token_account = get_associated_token_address(&owner, &reserve.liquidity_mint);
```

**Step 5**

### Build Flash Loan Instructions

```rust theme={null}
let (borrow_ix, repay_ix) = helpers::flash::flash_loan(
    owner,
    &reserve,
    user_token_account, // source for repayment
    user_token_account, // destination for borrowed funds
    1_000_000,          // 1 USDC (6 decimals)
    0,                  // borrow instruction index in the transaction
    None,               // no referrer
);
```

> [!NOTE]
>
> The `borrow_instruction_index` parameter specifies the position of the flash borrow instruction in the final transaction. Set to `0` if it is the first instruction.

**Step 6**

### Compose and Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

// Insert your custom instructions between borrow and repay
let your_custom_instructions = vec![/* your logic here */];

let mut all_instructions = vec![borrow_ix];
all_instructions.extend(your_custom_instructions);
all_instructions.push(repay_ix);

let message = Message::new(&all_instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Flash loan successful! Signature: {signature}");
```

> [!NOTE]
>
> The flash borrow and repay must be in the same transaction. You can insert any number of instructions between them.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.