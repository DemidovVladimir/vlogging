> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Earn Deposit from Privy Wallet

> Use a Privy-managed wallet to perform secure Earn deposits

Deposit to Kamino Earn vaults using Privy embedded wallets. This integration allows users to deposit without managing their own private keys.

## Earn Deposit from Privy

**Step 1**

### Import Dependencies

Import the required packages for Privy client, Solana RPC communication, and Kamino SDK operations.

```typescript theme={null}
import { PrivyClient } from '@privy-io/node';
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compressTransactionMessageUsingAddressLookupTables,
  createNoopSigner,
  getBase64EncodedWireTransaction,
  compileTransaction,
  assertIsTransactionWithinSizeLimit,
  getBase64Encoder,
  getTransactionDecoder,
  assertTransactionIsFullySigned,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';
```

**Step 2**

### Configure Privy and Initialize Client

Set up your Privy credentials and initialize the Privy client and RPC connection.

```typescript theme={null}
const PRIVY_APP_ID = 'put-your-privy-app-id-here';
const PRIVY_APP_SECRET = 'put-your-privy-app-secret-here';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const WS_ENDPOINT = 'wss://api.mainnet-beta.solana.com';
const VAULT_ADDRESS = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // Steakhouse USDC Vault
const AUTH_KEY_ID = 'put-your-auth-key-id-here';
const AUTH_KEY_PRIVATE = 'put-your-auth-key-private-here';
const USER_EMAIL = 'put-your-email-here';

const privy = new PrivyClient({
  appId: PRIVY_APP_ID,
  appSecret: PRIVY_APP_SECRET,
});

const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
```

> [!NOTE]
>
> Update the configuration values with your Privy app credentials and user details. This example uses the Steakhouse USDC Vault.

**Step 3**

### Create Privy User and Wallet

Create a Privy user account and generate an embedded Solana wallet.

```typescript theme={null}
await privy.users().create({
  linked_accounts: [{ type: 'email', address: USER_EMAIL }]
});

const { id: walletId, address: walletAddress } = await privy.wallets().create({
  chain_type: 'solana',
  owner_id: AUTH_KEY_ID
});
```

> [!WARNING]
>
> Before proceeding, fund the wallet with SOL (for transaction fees) and USDC (for deposit). The wallet cannot submit transactions without sufficient funds.

**Step 4**

### Load the Vault

Initialize the vault and load its state, reserves, and farm state once. The deposit instructions need all three.

```typescript theme={null}
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(rpc, address(VAULT_ADDRESS), slotDuration);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);
```

**Step 5**

### Build Deposit Instructions

Generate the deposit instructions using a noop signer, with slippage protection on the minted shares.

```typescript theme={null}
const noopSigner = createNoopSigner(address(walletAddress));
const depositAmount = new Decimal(1.0); // 1 USDC

const minSharesOut = manager.estimateSharesFromTokens(
  vaultState,
  depositAmount,
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  10 // 0.1% slippage
);

const bundle = await vault.depositIxs(
  noopSigner,
  depositAmount,
  vaultReservesMap,
  farmState,
  null, // first-loss capital farm
  undefined, // payer
  undefined, // memo
  minSharesOut
);
const instructions = [...bundle.depositIxs, ...bundle.stakeInFarmIfNeededIxs];
```

> [!NOTE]
>
> A noop signer is used to build instructions without requiring the actual private key. Privy will handle signing later. Use the same `noopSigner` as the fee payer in the next steps, since two signer objects for one address cause a "Multiple distinct signers" error.

**Step 6**

### Load the Vault's Lookup Table

Fetch the vault's address lookup table to keep the transaction small.

```typescript theme={null}
const lookupTables = await fetchAllAddressLookupTable(rpc, [vaultState.vaultLookupTable]);
const lutsByAddress: Record<Address, Address[]> = {};
for (const lut of lookupTables) lutsByAddress[lut.address] = lut.data.addresses;
```

**Step 7**

### Build Transaction Message

Fetch the latest blockhash and construct the compressed transaction message.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const depositTransactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress)
);
```

**Step 8**

### Sign Transaction with Privy

Compile the transaction, serialize it, and sign using Privy's wallet API.

```typescript theme={null}
const compiledTransaction = compileTransaction(depositTransactionMessage);
assertIsTransactionWithinSizeLimit(compiledTransaction);

const signResponse = await privy.wallets().solana().signTransaction(walletId, {
  transaction: getBase64EncodedWireTransaction(compiledTransaction),
  authorization_context: {
    authorization_private_keys: [AUTH_KEY_PRIVATE]
  }
});
```

> [!NOTE]
>
> Privy handles the signing securely using the embedded wallet. The private key never leaves Privy's infrastructure.

**Step 9**

### Send and Confirm Transaction

Decode the transaction Privy signed, then send it and wait for confirmation.

```typescript theme={null}
const signedTransaction = {
  ...getTransactionDecoder().decode(getBase64Encoder().encode(signResponse.signed_transaction)),
  lifetimeConstraint: compiledTransaction.lifetimeConstraint,
};
assertTransactionIsFullySigned(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Deposit successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!NOTE]
>
> Privy returns the signed transaction as a base64 string. Decoding it and adding the blockhash lifetime from the compiled transaction lets `sendAndConfirmTransactionFactory` send it and wait until it is confirmed or its blockhash expires.

> [!TIP]
>
> Your deposit is complete! The user's funds are now deposited in the Kamino Earn vault using their Privy embedded wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.