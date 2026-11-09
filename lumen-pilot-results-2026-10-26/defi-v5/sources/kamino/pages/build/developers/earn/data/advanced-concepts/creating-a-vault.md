> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a Vault

> Create and configure Kamino vaults with custom fee structures to earn revenue

> [!NOTE]
>
> Learn how to create a Kamino vault with [custom fee structures](#configure-vault), deposit limits, and allocation strategies. The SDK manages vault initialization, metadata setup, and lookup table creation to optimize future transactions.

## Creating a Vault

Initialize a new vault with custom configuration and prepare it for user deposits.

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
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Instruction,
} from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  KaminoVaultConfig,
  getMedianSlotDurationInMsFromLastEpochs,
  sleep,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { Decimal } from 'decimal.js';
```

**Step 2**

### Load Admin Keypair and Initialize Manager

Load the admin keypair from file and initialize the Kamino manager with proper slot timing.

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const adminSigner = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);
```

> [!NOTE]
>
> `parseKeypairFile` loads an existing keypair from a JSON file that will become the vault admin. The admin wallet needs SOL for rent and fees, plus a small amount of the vault token: creation takes an initial deposit of 1,000 lamports (0.001 USDC here) from it.

**Step 3**

### Configure Vault

Create a vault configuration with the core identity and fee structure.

```typescript theme={null}
const kaminoVaultConfig = new KaminoVaultConfig({
  admin: adminSigner,
  tokenMint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  tokenMintProgramId: TOKEN_PROGRAM_ADDRESS,
  performanceFeeRatePercentage: new Decimal(15.0),
  managementFeeRatePercentage: new Decimal(2.0),
  name: 'MyCustomVault',
  vaultTokenSymbol: 'USDC',
  vaultTokenName: 'MyCustomVaultToken',
  minDepositAmount: 1000,
  minWithdrawAmount: 10,
  minInvestAmount: 0,
  minInvestDelaySlots: 0,
  withdrawalPenaltyBps: 1,
  withdrawalPenaltyLamports: 1,
  crankFundFeePerReserve: 1,
});
```

> [!NOTE]
>
> The parameters from `minDepositAmount` down are optional. The values shown are the defaults, so omit them to keep the defaults. All parameters can be changed after creation. Unallocated weight and cap can only be set after creation, see the [Configure Vault Parameters](#configure-vault-parameters-post-creation) step below.

**Vault Configuration Parameters**

| Parameter | Type | Default | Description |
| - | - | - | - |
| `admin` | `TransactionSigner` | | Keypair that owns and manages the vault |
| `tokenMint` | `Address` | | SPL token mint address (e.g., USDC) |
| `tokenMintProgramId` | `Address` | | Token program of the mint (`TOKEN_PROGRAM_ADDRESS`, or the Token-2022 program for Token-2022 mints) |
| `performanceFeeRatePercentage` | `Decimal` | | Percentage of earned yield collected as fees |
| `managementFeeRatePercentage` | `Decimal` | | Annual percentage fee on total assets |
| `name` | `string` | | Vault name stored on-chain (max 40 characters) |
| `vaultTokenSymbol` | `string` | | Symbol for vault share token (max 5 characters) |
| `vaultTokenName` | `string` | | Display name for vault share token (max 10 characters) |
| `minDepositAmount` | `number` | 1000 | Optional. Minimum deposit per transaction (lamports) |
| `minWithdrawAmount` | `number` | 10 | Optional. Minimum withdrawal per transaction (lamports) |
| `minInvestAmount` | `number` | 0 | Optional. Minimum amount moved in a single investment (lamports) |
| `minInvestDelaySlots` | `number` | 0 | Optional. Slots between investments in a reserve |
| `withdrawalPenaltyBps` | `number` | 1 | Optional. Percentage-based withdrawal fee (basis points) |
| `withdrawalPenaltyLamports` | `number` | 1 | Optional. Absolute withdrawal fee (lamports) |
| `crankFundFeePerReserve` | `number` | 1 | Optional. Fee per reserve to fund crank operations (lamports) |
| `allowAllocationsInWhitelistedReservesOnly` | `boolean` | false | Optional. Only allow allocations to whitelisted reserves |
| `allowInvestInWhitelistedReservesOnly` | `boolean` | false | Optional. Only allow investing in whitelisted reserves |

**Step 4**

### Generate Vault Creation Instructions

Pass the vault configuration to the Kamino manager to generate all required initialization instructions.

```typescript theme={null}
const { vault: vaultSigner, initVaultIxs: instructions } = await kaminoManager.createVaultIxs(kaminoVaultConfig);

console.log('New vault address:', vaultSigner.address);
```

> [!NOTE]
>
> `createVaultIxs` returns a new vault keypair plus instruction bundles for initializing the vault, creating and filling its lookup table, creating its two farms (the Vault Farm for rewards and the First Loss Capital Farm), registering the farms on the vault, and setting the share token metadata. They are sent across four transactions in the steps below.

**Step 5**

### Create a Send Function

Vault creation sends several transactions, so define one function that builds, signs, and sends each of them.

```typescript theme={null}
async function sendTransaction(ixs: Instruction[], label: string) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(adminSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(ixs, tx)
  );

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  assertIsTransactionWithinSizeLimit(signedTransaction);

  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: 'confirmed',
    skipPreflight: true,
  });
  console.log(`${label}:`, getSignatureFromTransaction(signedTransaction));
}
```

> [!NOTE]
>
> `signTransactionMessageWithSigners` signs with every signer in the instructions, including the new vault keypair. The blockhash is fetched inside the function so each transaction gets a fresh one.

**Step 6**

### Initialize the Vault

Send the first transaction: it creates the vault, applies the configuration, and creates the vault's lookup table.

```typescript theme={null}
await sendTransaction(
  [
    ...instructions.createAtaIfNeededIxs,
    ...instructions.initVaultIxs,
    instructions.createLUTIx,
    ...instructions.cleanupIxs,
  ],
  'Vault initialized'
);
```

> [!NOTE]
>
> The share token metadata instruction is sent later, in the last transaction. Adding it here takes this transaction over Solana's 1,232-byte limit.

**Step 7**

### Create and Attach Farms

Create the Vault Farm and the First Loss Capital Farm, and register each one on the vault. Each farm is one transaction.

```typescript theme={null}
const vaultFarm = instructions.createVaultFarms.createVaultFarmIxs;
await sendTransaction(
  [...vaultFarm.setupFarmIxs, ...vaultFarm.updateFarmIxs, instructions.setFarmToVaultIxs.setFarmToVaultIx],
  'Vault Farm created'
);

const flcFarm = instructions.createVaultFarms.createFLCVaultFarmIxs;
const setFlcFarm = instructions.setFarmToVaultIxs.setFLCFarmToVaultIx;
if (flcFarm && setFlcFarm) {
  await sendTransaction(
    [...flcFarm.setupFarmIxs, ...flcFarm.updateFarmIxs, setFlcFarm],
    'First Loss Capital Farm created'
  );
}
```

> [!NOTE]
>
> If you skip this step, you can create farms later with `kaminoManager.createVaultFarmIxs` and register them with `kaminoManager.updateVaultFarmIxs` (Vault Farm) or `kaminoManager.updateVaultFirstLossCapitalFarmIxs` (First Loss Capital Farm). See [Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md) for the full post-creation flow.

**Step 8**

### Fill the Lookup Table and Set Share Metadata

Add the vault's accounts to its lookup table and set the share token metadata.

```typescript theme={null}
await sleep(2000);
await sendTransaction(
  [...instructions.populateLUTIxs, instructions.initSharesMetadataIx],
  'Lookup table filled and share metadata set'
);
```

> [!NOTE]
>
> A new lookup table can only be extended from the slot after it was created, so this transaction goes last. The lookup table keeps deposit and withdraw transactions for this vault small.

**Step 9**

### Verify the Setup

Check that every part of the vault was set up.

```typescript theme={null}
const vault = new KaminoVault(rpc, vaultSigner.address, slotDuration);
const status = await kaminoManager.getVaultSetupStatus(vault, kaminoVaultConfig);

if (status.allSet) {
  console.log('Vault created and fully set up:', vaultSigner.address);
} else {
  console.log('Setup incomplete:', status);
}
```

> [!NOTE]
>
> If a transaction failed, `kaminoManager.finishVaultSetup(vault, kaminoVaultConfig)` returns only the missing instructions, so you can send them without starting over.

**Step 10**

### Configure Vault Parameters (Post-Creation)

Set the parameters that are only available after creation (unallocated weight and cap), or update any parameter set during creation.

```typescript theme={null}
const vaultState = await vault.getState();
const vaultReservesMap = await kaminoManager.loadVaultReserves(vaultState);

const { updateVaultConfigIx: unallocWeightIx } =
  await kaminoManager.updateVaultUnallocatedWeightIxs(vault, 500, vaultReservesMap, adminSigner);
const { updateVaultConfigIx: unallocCapIx } =
  await kaminoManager.updateVaultUnallocatedTokensCapIxs(vault, 2000000, vaultReservesMap, adminSigner);

await sendTransaction([unallocWeightIx, unallocCapIx], 'Unallocated weight and cap set');
```

> [!NOTE]
>
> Every creation parameter has an update method with the same arguments, for example `kaminoManager.updateVaultMinDepositAmountIxs(vault, 1000, vaultReservesMap, adminSigner)`. Each returns `{ updateVaultConfigIx }`. The new vault holds no allocations yet: add reserves with `kaminoManager.updateVaultReserveAllocationIxs` before it can earn.

**Post-Creation Parameters**

| Method | Parameter | Default | Description |
| - | - | - | - |
| `updateVaultMinDepositAmountIxs` | `minDepositAmount` | 1000 | Minimum deposit per transaction (lamports) |
| `updateVaultMinWithdrawAmountIxs` | `minWithdrawAmount` | 10 | Minimum withdrawal per transaction (lamports) |
| `updateVaultMinInvestAmountIxs` | `minInvestAmount` | 0 | Minimum amount moved in a single investment (lamports) |
| `updateVaultMinInvestDelaySlotsIxs` | `minInvestDelaySlots` | 0 | Slots between investments in a reserve |
| `updateVaultWithdrawalPenaltyBpsIxs` | `withdrawalPenaltyBps` | 1 | Percentage-based withdrawal fee (basis points); returned to vault |
| `updateVaultWithdrawalPenaltyLamportsIxs` | `withdrawalPenaltyLamports` | 1 | Absolute withdrawal fee (lamports); system takes MAX of BPS and lamports |
| `updateVaultCrankFundFeePerReserveIxs` | `crankFundFeePerReserve` | 1 | Fee per reserve to fund crank operations (lamports) |
| `updateVaultUnallocatedWeightIxs` | `unallocatedWeight` | 500 | Relative weight for idle funds in total weight calculation |
| `updateVaultUnallocatedTokensCapIxs` | `unallocatedTokensCap` | 2000000 | Maximum absolute amount to keep unallocated (lamports) |

#### Full Code Example

```typescript expandable theme={null}
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
  type Instruction,
} from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  KaminoVaultConfig,
  getMedianSlotDurationInMsFromLastEpochs,
  sleep,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { Decimal } from 'decimal.js';

const KEYPAIR_FILE = '/path/to/your/keypair.json';
const adminSigner = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);

const kaminoVaultConfig = new KaminoVaultConfig({
  admin: adminSigner,
  tokenMint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  tokenMintProgramId: TOKEN_PROGRAM_ADDRESS,
  performanceFeeRatePercentage: new Decimal(15.0),
  managementFeeRatePercentage: new Decimal(2.0),
  name: 'MyCustomVault',
  vaultTokenSymbol: 'USDC',
  vaultTokenName: 'MyCustomVaultToken',
  minDepositAmount: 1000,
  minWithdrawAmount: 10,
  minInvestAmount: 0,
  minInvestDelaySlots: 0,
  withdrawalPenaltyBps: 1,
  withdrawalPenaltyLamports: 1,
  crankFundFeePerReserve: 1,
});

const { vault: vaultSigner, initVaultIxs: instructions } = await kaminoManager.createVaultIxs(kaminoVaultConfig);
console.log('New vault address:', vaultSigner.address);

async function sendTransaction(ixs: Instruction[], label: string) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(adminSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(ixs, tx)
  );

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  assertIsTransactionWithinSizeLimit(signedTransaction);

  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: 'confirmed',
    skipPreflight: true,
  });
  console.log(`${label}:`, getSignatureFromTransaction(signedTransaction));
}

await sendTransaction(
  [
    ...instructions.createAtaIfNeededIxs,
    ...instructions.initVaultIxs,
    instructions.createLUTIx,
    ...instructions.cleanupIxs,
  ],
  'Vault initialized'
);

const vaultFarm = instructions.createVaultFarms.createVaultFarmIxs;
await sendTransaction(
  [...vaultFarm.setupFarmIxs, ...vaultFarm.updateFarmIxs, instructions.setFarmToVaultIxs.setFarmToVaultIx],
  'Vault Farm created'
);

const flcFarm = instructions.createVaultFarms.createFLCVaultFarmIxs;
const setFlcFarm = instructions.setFarmToVaultIxs.setFLCFarmToVaultIx;
if (flcFarm && setFlcFarm) {
  await sendTransaction(
    [...flcFarm.setupFarmIxs, ...flcFarm.updateFarmIxs, setFlcFarm],
    'First Loss Capital Farm created'
  );
}

await sleep(2000);
await sendTransaction(
  [...instructions.populateLUTIxs, instructions.initSharesMetadataIx],
  'Lookup table filled and share metadata set'
);

const vault = new KaminoVault(rpc, vaultSigner.address, slotDuration);
const status = await kaminoManager.getVaultSetupStatus(vault, kaminoVaultConfig);

if (status.allSet) {
  console.log('Vault created and fully set up:', vaultSigner.address);
} else {
  console.log('Setup incomplete:', status);
}

const vaultState = await vault.getState();
const vaultReservesMap = await kaminoManager.loadVaultReserves(vaultState);

const { updateVaultConfigIx: unallocWeightIx } =
  await kaminoManager.updateVaultUnallocatedWeightIxs(vault, 500, vaultReservesMap, adminSigner);
const { updateVaultConfigIx: unallocCapIx } =
  await kaminoManager.updateVaultUnallocatedTokensCapIxs(vault, 2000000, vaultReservesMap, adminSigner);

await sendTransaction([unallocWeightIx, unallocCapIx], 'Unallocated weight and cap set');
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.