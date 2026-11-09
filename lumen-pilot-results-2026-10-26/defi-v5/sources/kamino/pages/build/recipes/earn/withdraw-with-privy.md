> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdraw to Privy Wallet and Check Balance

> Use a Privy-managed wallet to perform secure Earn withdrawals and check USDC balance

Withdraw from Kamino Earn vaults using Privy embedded wallets and check the resulting USDC balance. This integration allows users to withdraw without managing their own private keys.

## Earn Withdraw to Privy

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
```

**Step 2**

### Configure Privy and Initialize Client

Set up your Privy credentials and initialize the Privy client and RPC connection.

```typescript theme={null}
const PRIVY_APP_ID = 'your-privy-app-id';
const PRIVY_APP_SECRET = 'your-privy-app-secret';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const WS_ENDPOINT = 'wss://api.mainnet-beta.solana.com';
const VAULT_ADDRESS = 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'; // Steakhouse USDC vault
const AUTH_KEY_PRIVATE = 'your-auth-key-private';
const WALLET_ID = 'your-wallet-id';

const privy = new PrivyClient({
  appId: PRIVY_APP_ID,
  appSecret: PRIVY_APP_SECRET,
});

const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
```

**Step 3**

### Get Wallet and Load the Vault

Retrieve the Privy wallet, then load the vault's state, reserves, and farm state once. The withdraw instructions need all three.

```typescript theme={null}
const wallet = await privy.wallets().get(WALLET_ID);
const noopSigner = createNoopSigner(address(wallet.address));

const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(rpc, address(VAULT_ADDRESS), slotDuration);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);
```

> [!NOTE]
>
> A noop signer is used to build instructions without requiring the actual private key. Privy will handle signing later.

**Step 4**

### Check User Shares

Query the wallet's vault shares to determine how much can be withdrawn.

```typescript theme={null}
const userShares = await vault.getUserShares(noopSigner.address);
console.log(
  `Vault shares: ${userShares.unstakedShares.toString()} unstaked, ${userShares.stakedShares.toString()} staked`
);

if (userShares.totalShares.isZero()) console.log('No shares to withdraw');
```

> [!NOTE]
>
> The total shares represent the user's position in the vault. Both staked and unstaked shares are included in the withdrawal.

**Step 5**

### Build Withdrawal Instructions

Generate the unstake and withdraw instructions for all of the wallet's shares.

```typescript theme={null}
const bundle = await vault.withdrawIxs(
  noopSigner,
  userShares.totalShares,
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  farmState,
  null, // first-loss capital farm
  undefined, // payer
  undefined, // withdrawal penalties
  true // close the farm account once the position is empty
);
const instructions = [...bundle.unstakeFromFarmIfNeededIxs, ...bundle.withdrawIxs, ...bundle.postWithdrawIxs];
```

> [!NOTE]
>
> Staked shares are unstaked from the vault's farm in the same transaction, before they are withdrawn. Without `unstakeFromFarmIfNeededIxs`, withdrawing staked shares fails with `CannotWithdrawZeroShares`. The last argument closes the wallet's farm account after a full withdrawal and returns its rent.

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

Fetch the latest blockhash and construct the compressed withdrawal transaction message.

```typescript theme={null}
const { value: withdrawBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const withdrawTxMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(withdrawBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress)
);
```

**Step 8**

### Sign Transaction with Privy

Compile the transaction, serialize it, and sign using Privy's wallet API.

```typescript theme={null}
const compiledWithdrawTx = compileTransaction(withdrawTxMessage);
assertIsTransactionWithinSizeLimit(compiledWithdrawTx);

const withdrawSignResponse = await privy.wallets().solana().signTransaction(WALLET_ID, {
  transaction: getBase64EncodedWireTransaction(compiledWithdrawTx),
  authorization_context: { authorization_private_keys: [AUTH_KEY_PRIVATE] },
});
```

> [!NOTE]
>
> Privy handles the signing securely using the embedded wallet. The private key never leaves Privy's infrastructure.

**Step 9**

### Send and Confirm Transaction

Decode the transaction Privy signed, then send it and wait for confirmation.

```typescript theme={null}
const signedWithdrawTx = {
  ...getTransactionDecoder().decode(getBase64Encoder().encode(withdrawSignResponse.signed_transaction)),
  lifetimeConstraint: compiledWithdrawTx.lifetimeConstraint,
};
assertTransactionIsFullySigned(signedWithdrawTx);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedWithdrawTx, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Withdrawal successful! Signature:', getSignatureFromTransaction(signedWithdrawTx));
```

> [!NOTE]
>
> Privy returns the signed transaction as a base64 string. Decoding it and adding the blockhash lifetime from the compiled transaction lets `sendAndConfirmTransactionFactory` send it and wait until it is confirmed or its blockhash expires.

**Step 10**

### Check USDC Balance

Query the wallet's USDC balance using Privy's balance API.

```typescript theme={null}
const balance = await privy.wallets().balance.get(WALLET_ID, {
  asset: 'usdc',
  chain: 'solana',
});
const usdcBalance = balance.balances[0];
console.log(`USDC Balance: ${usdcBalance.display_values.usdc}`);
```

> [!TIP]
>
> Your withdrawal is complete! The user's vault shares have been redeemed for USDC, and the balance is now available in their Privy wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.