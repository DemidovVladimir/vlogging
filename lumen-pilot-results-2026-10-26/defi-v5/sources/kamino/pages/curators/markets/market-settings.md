> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Settings

> Configure market-level parameters: name, fees, flags, and global thresholds

Market-level settings live on the `LendingMarket` account itself, separate from per-reserve config. They control the market's name, quote currency, referral fees, and dozens of feature flags and thresholds that apply to every reserve and every position.

This page covers the routine settings. Topic-specific settings such as liquidation tunables, eMode groups, the withdrawal queue, fixed-term rollover windows, and borrow / obligation orders live on their own pages.

**SDK**

## Update market settings via SDK

The SDK exposes `kaminoManager.updateLendingMarketIxs(signer, marketWithAddress, newLendingMarket)` for full market config updates. Fetch the current state, mutate the fields you care about, pass the new state in.

**1. Initialize KaminoManager and fetch the market**

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
  encodeTokenName,
} from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const adminSigner = await parseKeypairFile('/path/to/admin.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketAddress = address('<MARKET_ADDRESS>');
const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };
```

**2. Mutate the fields you want to change**

```typescript theme={null}
// Build the new state from the current state, change only what you intend to change
const newLendingMarket = { ...marketState };

// Examples — mix and match per your update:
newLendingMarket.name = encodeTokenName('My Market');                  // up to 32 bytes UTF-8
newLendingMarket.referralFeeBps = 100;                                  // 1% referral fee
newLendingMarket.borrowDisabled = 1;                                    // pause borrowing
newLendingMarket.minInitialDepositAmount = 1000n;                       // u64
newLendingMarket.individualAutodeleverageMarginCallPeriodSecs = 86400n; // 24 hours
newLendingMarket.emergencyCouncil = address('<EMERGENCY_PUBKEY>');
```

**3. Build and submit the update**

```typescript theme={null}
const updateIxs = kaminoManager.updateLendingMarketIxs(
  adminSigner,
  marketWithAddress,
  newLendingMarket,
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

// The SDK splits large updates into multiple transactions for size reasons
for (const ix of updateIxs) {
  await buildAndSendTx([ix]);
}
```

The update only emits instructions for fields that actually changed against on-chain state.

### Multisig mode

When the market is owned by a multisig, replace the admin signer with `noopSigner(multisigPubkey)`:

```typescript theme={null}
import { noopSigner } from '@kamino-finance/klend-sdk';

const multisigSigner = noopSigner(address('<SQUADS_MULTISIG_PUBKEY>'));
const updateIxs = kaminoManager.updateLendingMarketIxs(multisigSigner, marketWithAddress, newLendingMarket);
// Encode each ix as a base58 transaction and submit it as a Squads proposal
```

**API**

> [!NOTE]
>
> **Updating market settings is not available via the REST API.** The Kamino API supports reading market state and reserve metrics; market configuration is an admin operation available through the **SDK** or **Kamino CLI**.

To update market settings, use the **SDK** or **Kamino CLI** tabs.

For reading market data via API, see [Read market data](https://kamino.com/docs/curators/markets/market-data.md).

**Kamino CLI**

## Update market settings via CLI

All non-trivial market changes follow the download → edit → preview → execute cycle.

**1. Download the current config**

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>
```

Saves to `./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json`. This is the canonical, on-chain truth.

**2. Edit the JSON**

Change only the fields you intend to change. Leave everything else untouched.

**3. Inspect**

```bash theme={null}
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json \
  --mode inspect
```

Open the printed Solana Explorer URL; verify the diff matches your intent.

**4. Execute or propose**

Hot-wallet-owned: re-run with `--mode execute`.

Multisig-owned: re-run with `--mode multisig --multisig <SQUADS_PUBKEY>`. Submit the printed base58 transaction as a Squads proposal.

### Focused commands

For two common updates, focused CLI commands exist that touch fewer fields:

```bash theme={null}
# Rename the market
yarn kamino-manager update-lending-market-name \
  --lending-market <MARKET_ADDRESS> \
  --new-name "My Market" \
  --mode execute

# Promote the cached owner (final step of multisig transfer)
yarn kamino-manager update-lending-market-owner \
  --lending-market <MARKET_ADDRESS> \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

## Common edits

### Set or update the market name

The market name is a 32-byte UTF-8 field (`name` on `LendingMarket`).

### Pause borrowing across the market

Set `borrow_disabled: 1` and apply. Existing positions remain; new borrows are rejected program-side until you flip it back. For broader emergency response, see [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md).

### Change the referral fee

`referral_fee_bps` is a u16 (basis points). It defaults to `0`.

### Set the emergency council

The emergency council is a separate pubkey from the `lending_market_owner`. It has authority for `socialize_loss` and similar emergency-only handlers. Set `emergency_council` to a multisig address dedicated to incident response.

### Update minimum deposit and minimum net obligation value

| Field | What it controls |
| - | - |
| `min_initial_deposit_amount` | The minimum amount required for a brand-new deposit to a reserve. Prevents 1-wei spam attacks. |
| `min_net_value_in_obligation_sf` | The minimum USD value an obligation must hold (as a scaled fraction). Stops dust positions from existing. |

> [!WARNING]
>
> Setting `min_net_value_in_obligation_sf` too high causes user-visible failures on partial repays. A common footgun is repaying down to a sub-threshold debt — the program rejects the operation. Document this for your users, or set the threshold low (the protocol-wide default is around `$0.000001`).

### Freeze the market permanently

Set `immutable: 1` and apply. Once committed, the program rejects every owner-initiated update going forward.

> [!WARNING]
>
> `immutable` is one-way. The program has no recovery path.

## Topic-specific settings (covered elsewhere)

| Topic | Page |
| - | - |
| Liquidation tunables | [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) |
| Auto-deleverage (margin-call grace window) | [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md) |
| Elevation groups | [Elevation groups](https://kamino.com/docs/curators/markets/elevation-groups.md) |
| Withdrawal queue flags | [Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md) |
| Fixed-term rollover windows | [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md) |
| Borrow orders | [Borrow orders](https://kamino.com/docs/curators/markets/borrow-orders.md) |
| Obligation orders | [Obligation orders](https://kamino.com/docs/curators/markets/obligation-orders.md) |
| Per-reserve settings | [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md), [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) |

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — every `LendingMarket` field
* [CLI command index](https://kamino.com/docs/curators/markets/cli-command-index.md) — all market-related commands


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.