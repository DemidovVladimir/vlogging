> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Updating Reserves

> Edit reserve configurations after launch: parameters, caps, status, oracles

After a reserve is live, every parameter on its `ReserveConfig` is editable through the same fetch → mutate → apply pattern as market settings. This page covers the day-to-day workflow.

**SDK**

## Update a reserve via SDK

The SDK exposes `kaminoManager.updateReserveIxs(signer, marketWithAddress, reserveAddress, newReserveConfig)` for full reserve config updates. Fetch the current config, mutate, pass the new value in.

**1. Initialize KaminoManager and fetch the reserve**

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
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket, Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const adminSigner = await parseKeypairFile('/path/to/admin.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketAddress = address('<MARKET_ADDRESS>');
const reserveAddress = address('<RESERVE_ADDRESS>');

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };

const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');
```

**2. Mutate the fields you want to change**

```typescript theme={null}
const newConfig = { ...reserve.config };

// Examples — mix and match per your update:
newConfig.loanToValuePct = 80;
newConfig.liquidationThresholdPct = 85;
newConfig.borrowFactorPct = 100n;
newConfig.depositLimit = 5_000_000_000_000n;
newConfig.borrowLimit = 4_500_000_000_000n;
newConfig.utilizationLimitBlockBorrowingAbovePct = 90;
newConfig.protocolTakeRatePct = 10;
newConfig.status = 0;  // 0 Active, 1 Obsolete, 2 Hidden
```

For oracle changes, see [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md). For elevation groups, see [Elevation groups](https://kamino.com/docs/curators/markets/elevation-groups.md).

**3. Apply the update**

```typescript theme={null}
const updateIxs = await kaminoManager.updateReserveIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  newConfig,
);

async function buildAndSendTx(ixs: any[]) {
  const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  const signed = await signTransactionMessageWithSigners(
    pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(adminSigner, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
      (tx) => appendTransactionMessageInstructions(ixs, tx)
    )
  );
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
    commitment: 'confirmed',
  });
}

for (const { ixs } of updateIxs) {
  await buildAndSendTx(ixs);
}
```

`updateReserveIxs` returns the update split into chunks for transaction size; submit each chunk in order.

### Cloning a reserve config

To duplicate an existing reserve's config onto a new reserve, see [Add reserves → Cloning an existing reserve config via SDK](https://kamino.com/docs/curators/markets/adding-reserves.md#cloning-an-existing-reserve-config-via-sdk).

### Multisig mode

Replace the admin signer with `noopSigner(multisigPubkey)` and submit the resulting transactions as Squads proposals.

**API**

> [!NOTE]
>
> **Reserve configuration updates are not available via the REST API.** The Kamino API supports reading reserve metrics and historical data; reserve configuration is an admin operation available through the **SDK** or **Kamino CLI**.

To update reserve configurations, use the **SDK** or **Kamino CLI** tabs.

For reading reserve metrics, see [Read market data](https://kamino.com/docs/curators/markets/market-data.md).

**Kamino CLI**

## Update a reserve via CLI

The standard edit flow:

**1. Download the current config**

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE_ADDRESS>.json
```

**2. Edit the JSON**

Change only the fields you intend to change. The CLI computes the diff against on-chain state on `inspect`.

**3. Inspect**

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE_ADDRESS>.json \
  --mode inspect
```

Open the printed Solana Explorer URL; verify the diff matches your intent.

**4. Execute or propose**

Hot-wallet-owned: re-run with `--mode execute`.

Multisig-owned: re-run with `--mode multisig --multisig <SQUADS_PUBKEY>`. Submit the printed base58 transaction as a Squads proposal.

### Focused command for the borrow cap

For just adjusting `borrowLimit` (the most-frequent change):

```bash theme={null}
yarn kamino-manager update-reserve-config-debt-cap \
  --reserve <RESERVE_ADDRESS> \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

Faster to review than a full config update; useful when ramping a maturing reserve.

## Common edits

### Adjust LTV / liquidation threshold / borrow factor

Edit `loanToValuePct`, `liquidationThresholdPct`, `borrowFactorPct`. Existing positions continue using the new values from the next refresh.

> [!WARNING]
>
> Lowering `liquidationThresholdPct` below the LTV of existing positions causes those positions to become liquidatable on the next refresh. Communicate parameter tightening publicly in advance, or set the change to take effect only after a cooldown.

### Adjust deposit / borrow caps

Edit `depositLimit` and/or `borrowLimit`. The CLI's focused `update-reserve-config-debt-cap` command exists for the borrow cap.

### Change the IR curve

Edit `borrowRateCurve.points`. The change takes effect from the next interest accrual; current debts continue accruing at the new rate.

### Update oracle config

Edit fields under `tokenInfo`. The on-chain validator confirms the new oracle accounts match what was passed in the instruction; mismatches return `InvalidScopePriceAccount`.

For a full oracle migration, do it as a single update: clear old fields, set new fields, apply. See [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md).

### Pause a reserve

Set `status: 1` (Obsolete) or `status: 2` (Hidden).

| Status | Effect |
| - | - |
| `0` Active | Normal operation |
| `1` Obsolete | Existing positions continue; signals integrators not to surface for new activity |
| `2` Hidden | Hidden from default UIs |

For a stronger pause that blocks operations program-side, use `block_price_usage: 1` on the reserve's `tokenInfo` (rejects every operation that needs the price) or `emergency_mode: 1` on the reserve. See [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md).

### Enable / disable advanced features

Most advanced features have flags at the **market** level — withdrawal queue, borrow orders, obligation orders, fixed-term rollover windows. The reserve-level fixed-term parameters (`debt_term_seconds`, `host_fixed_interest_rate_bps`, `early_repay_remaining_interest_pct`) live on `ReserveConfig` and use the standard reserve update flow.

See:

* [Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md) (market-level)
* [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md) (reserve-level + market-level)
* [Borrow orders](https://kamino.com/docs/curators/markets/borrow-orders.md) (market-level)
* [Obligation orders](https://kamino.com/docs/curators/markets/obligation-orders.md) (market-level + reserve-level fee)

## Multisig considerations

For multisig-owned markets, every reserve update is a Squads proposal subject to the configured timelock. Plan parameter changes accordingly — a 12-hour timelock means an LTV adjustment proposed at 9:00 AM executes at 9:00 PM.

For changes that need to land faster (e.g., closing a reserve in response to an oracle incident), use [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md) — `borrow_disabled` or `block_price_usage` flips can be batched into a single emergency proposal that takes precedence over slower-cadence parameter tuning.

## Common errors

| Error | Cause |
| - | - |
| `InvalidConfig` | A field is out of range (e.g., `loanToValuePct > 100`, or `liquidationThresholdPct < loanToValuePct`). |
| `InvalidOracleConfig` / `InvalidScopePriceAccount` | Oracle pubkey in `tokenInfo` doesn't match the account passed to the instruction. |
| `MarketImmutable` | Market has `immutable: 1`. No further updates are possible. |
| `Unauthorized` | The signer isn't the `lending_market_owner`. Check ownership with `get-market-or-vault-admin-info`. |

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — every editable field
* [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md) — choosing values
* [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md) — pause and freeze flows
* [`market-operations` CLI reference](https://kamino.com/docs/build/cli/market-operations) — full CLI flag detail


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.