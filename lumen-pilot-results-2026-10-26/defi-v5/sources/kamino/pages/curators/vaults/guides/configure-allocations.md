> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure allocations

> Add, edit, and remove reserve allocations on a vault — UI, SDK, and CLI

This guide is the operational walkthrough for managing vault allocations. For the conceptual model — Standard vs. Conditional, weights, caps, priority — read [Concepts → Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md) first. This page assumes you've already chosen the parameters you want.

For fixed-rate-specific allocation patterns and a focused step-by-step, see [Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md).

**UI**

## Configure via kamino.com/curators/vaults

### Add a reserve

**1. Open the Allocations tab**

Navigate to your vault on `kamino.com/curators/vaults` and open the **Allocations** tab.

**2. Click Add Reserve**

Opens the allocation configuration form.

**3. Select market and reserve**

The reserve picker shows market name and TVL, reserve type (floating or fixed-rate), supply APY, reserve TVL, and utilization. A market may contain multiple reserves for the same token (e.g. USDC floating, USDC 5% 3M, USDC 6% 6M).

**4. Set parameters**

| Parameter | Notes |
| - | - |
| Allocation Weight | Relative integer; ignored for Conditional allocations |
| Allocation Cap | Hard ceiling in tokens; binding limit for Conditional |
| Conditional Allocation toggle | Off = Standard (immediate deployment); On = Conditional (deploy on demand) |
| Allocation Priority | Default `0`; raise to protect this Standard allocation from being a source for Conditional fills |

**5. Submit**

Sign with your admin wallet, or generate a Squads proposal if the vault is multisig-controlled.

### Edit an existing allocation

Open the allocation entry on the Allocations tab. Adjust weight, cap, type toggle, or priority. Submit.

### Batch edit weights

To change weights across multiple reserves in a single transaction, use the batch-edit view. The UI shows real-time percentage recalculation and projected vault APY impact, including unallocated funds.

### Remove an allocation

Either set the weight (Standard) or cap (Conditional) to `0`, or remove the entry entirely. The removed reserve's share is redistributed to the remaining allocations per their weights.

**SDK**

## Configure via TypeScript SDK

### Add or update an allocation

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
} from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  Reserve,
  ReserveAllocationConfig,
  ReserveType,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { Decimal } from 'decimal.js';

const adminSigner = await parseKeypairFile('/path/to/your/keypair.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);

const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const reserveAddress = address('<RESERVE_ADDRESS>');

const reserveState = await Reserve.fetch(rpc, reserveAddress);
const reserveWithAddress = { address: reserveAddress, state: reserveState! };

// Standard allocation
const standardConfig = new ReserveAllocationConfig(
  reserveWithAddress,
  100000,                                    // weight
  new Decimal('18446744073709551615'),       // u64 max = no cap
  new ReserveType.Standard(),
  0,                                         // priority
);

// OR — Conditional allocation (typically for fixed-rate reserves)
const conditionalConfig = new ReserveAllocationConfig(
  reserveWithAddress,
  0,                                         // weight ignored for Conditional
  new Decimal('10000000'),                   // 10M token cap
  new ReserveType.Conditional(),
  0,                                         // priority
);

const { updateReserveAllocationIx } =
  await kaminoManager.updateVaultReserveAllocationIxs(vault, standardConfig, adminSigner);

const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
const signed = await signTransactionMessageWithSigners(
  pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayerSigner(adminSigner, tx),
    tx => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    tx => appendTransactionMessageInstructions([updateReserveAllocationIx], tx),
  ),
);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
  commitment: 'confirmed',
  skipPreflight: true,
});
```

The same `updateVaultReserveAllocationIxs` method handles both **adding a new reserve** and **updating an existing one** — the SDK detects whether the allocation already exists.

### Read current allocations

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoVault } from '@kamino-finance/klend-sdk';

const vault = new KaminoVault(
  createSolanaRpc('https://api.mainnet-beta.solana.com'),
  address('<VAULT_ADDRESS>'),
);

const allocations = await vault.getVaultAllocations();
for (const [reserveAddress, overview] of allocations) {
  console.log(
    `${reserveAddress}: ` +
    `weight ${overview.targetWeight}, ` +
    `cap ${overview.tokenAllocationCap}, ` +
    `current ${overview.ctokenAllocation}`,
  );
}
```

### Remove an allocation

```typescript theme={null}
const removeIx = await kaminoManager.removeReserveFromAllocationIx(
  vault,
  address('<RESERVE_ADDRESS>'),
  adminSigner,
);
// Build and send using the same pattern as above
```

If the underlying reserve has insufficient liquidity to deallocate fully, the deallocation queues through the [withdrawal queue](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md).

### Read vault overview with incentives

```typescript theme={null}
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const overview = await kaminoManager.getVaultOverview(
  vault,
  new Decimal(1.0), // deposit token price (adjust for non-stablecoin vaults)
);

console.log('APYs:', overview.actualSupplyAPY);
console.log('Reserve farm incentives:', overview.reservesFarmsIncentives);
```

**CLI**

## Configure via Kamino CLI

> [!NOTE]
>
> Complete the [CLI installation guide](https://kamino.com/docs/build/cli/installation-setup.md) first. Commands require a `.env` file with `ADMIN` and `RPC` configured.

### Add or update an allocation

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --allocation-weight <WEIGHT> \
  --allocation-cap <CAP> \
  --allocation-type <Standard|Conditional> \
  --priority <PRIORITY> \
  --mode simulate
```

| Flag | Notes |
| - | - |
| `--allocation-weight` | Relative integer. Ignored for Conditional. |
| `--allocation-cap` | Decimal token amount (not lamports). Use `18446744073709.551615` for no cap. |
| `--allocation-type` | `Standard` or `Conditional`. |
| `--priority` | Integer. Default `0`. |
| `--mode` | `simulate` first to verify, then `execute` to send, or `multisig` to emit a Base58 payload for Squads. |

> [!WARNING]
>
> Always run `--mode simulate` first to verify the resulting state.

**Example — adding a Conditional allocation to a fixed-rate reserve:**

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault 67dqmR76uAbjX6e81A1ganKv3ou31WUMEdeWJkwVfeXy \
  --reserve 9GJ9GBRwCp4pHmWrQ43L5xpc9Vykg7jnfwcFGN8FoHYu \
  --allocation-weight 0 \
  --allocation-cap 10000000 \
  --allocation-type Conditional \
  --priority 0 \
  --mode simulate
```

### Remove an allocation

```bash theme={null}
yarn kamino-manager remove-vault-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --mode simulate
```

### Multisig mode

For multisig-controlled vaults, append `--mode multisig --multisig <MULTISIG_PUBKEY>`. The CLI emits a Base58-encoded transaction string that you import into [Squads](https://squads.so) for proposal and approval.

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --allocation-weight <WEIGHT> \
  --allocation-cap <CAP> \
  --allocation-type Standard \
  --mode multisig \
  --multisig <MULTISIG_PUBKEY>
```

> [!NOTE]
>
> Batch editing of multiple allocation weights in a single transaction is not available via CLI. Use the SDK or UI for batch operations.

## Sync after changes

Allocations are *targets*. After updating an allocation, the vault doesn't immediately rebalance — a permissionless sync brings actual allocation toward target. The sync bot runs every \~15 minutes; you can also trigger it manually via the UI's "Sync Allocations" action or the SDK's `investAllReservesIxs` / `investSingleReserveIxs` methods.

The underlying vault operation is `invest`. It compares the reserve's current allocation with its weight/cap target and then either:

* deposits vault liquidity into the reserve if the reserve is under target, or
* withdraws available liquidity from the reserve back into the vault if the reserve is over target.

### Partial moves with `invest_with_max_amount`

`invest_with_max_amount` is a capped variant of `invest`: weights and allocation caps still determine whether funds move into or out of the reserve, but the caller can cap the amount of liquidity moved toward that target. Use it when the full target move is larger than the liquidity currently available, or when you want to move funds in controlled chunks.

This instruction is available on-chain and in `@kamino-finance/klend-sdk` `9.1.0+` as `investSingleReserveWithMaxAmountIxs`. The SDK argument is `maxAmountLamports`: the maximum vault-token lamports to move in or out of the selected reserve.

**Example — partial rebalance when one reserve cannot fully deallocate:**

* Vault has two allocations, 50% each, with 1M total tokens: 500K in reserve 1 and 500K in reserve 2.
* The manager changes weights to reserve 1: 90%, reserve 2: 10%.
* The target move is to withdraw 400K from reserve 2, but reserve 2 only has 300K available.
* Call `invest_with_max_amount` on reserve 2 with `max_amount = 300K`. This withdraws 300K from reserve 2 into the vault.
* Call `invest_with_max_amount` on reserve 1 with `max_amount = 300K`. This deposits that 300K into reserve 1.
* Final state: reserve 1 has 800K and reserve 2 has 200K. The vault is closer to the 900K / 100K target, and reserve 2 utilization may rise to 100%, incentivizing borrowers to repay so more liquidity becomes withdrawable.

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const payer = await parseKeypairFile('/path/to/payer.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);

const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const reserveAddress = address('<RESERVE_ADDRESS>');
const vaultState = await vault.getState();
const vaultReservesMap = await kaminoManager.loadVaultReserves(vaultState);
const reserve = vaultReservesMap.get(reserveAddress);
if (!reserve) {
  throw new Error(`Reserve ${reserveAddress} not found in vault allocations`);
}

const maxAmountLamports = '300000000000'; // 300,000 USDC with 6 decimals
const cappedInvestIxs = await kaminoManager.investSingleReserveWithMaxAmountIxs(
  payer,
  vault,
  { address: reserveAddress, state: reserve.state },
  maxAmountLamports,
  vaultReservesMap,
);
```

If `cappedInvestIxs` is empty, the computed move was below the vault's `minInvestAmount` or there was no eligible liquidity to move.

Sync may still not reach the exact target if the reserve has no available liquidity left after the capped move. When you need to exit capital that is not currently withdrawable, use the [withdrawal queue](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md).

## What's next

> **[Allocations (concept)](https://kamino.com/docs/curators/vaults/concepts/allocations.md)**
>
> The model behind weights, caps, types, and priority.

> **[Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md)**
>
> The focused step-by-step for adding an FR allocation, with FR-specific parameter choices.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.