> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrow Orders

> Peer-to-peer fixed-rate matching between borrowers and lenders

Borrow orders let a borrower place a limit-style order specifying the rate they're willing to pay, the term, and the size — lenders then fill it directly, bypassing the IR curve. They are most useful on fixed-term reserves where pricing is set by direct counterparty matching.

When a borrow order is filled, the matched debt is locked in at the agreed rate for the agreed term. The fill creates a normal fixed-term position; from that point forward, the position behaves like any other fixed-term borrow on the reserve.

## Market-level enablement

| Field | What it does |
| - | - |
| `borrow_order_creation_enabled` | If `1`, borrowers can place new orders |
| `borrow_order_execution_enabled` | If `1`, lenders can fill placed orders |
| `min_borrow_order_fill_value` | Minimum USD value (scaled fraction) for any single fill. Applies both at order placement and on partial fills |

A typical `min_borrow_order_fill_value` is large enough to make fills economically meaningful (e.g., \$50–\$1,000 equivalent). Set it to filter out dust orders that would crowd the orderbook.

**SDK**

## Enable borrow orders via SDK

Curator-side: flip the market flags via `updateLendingMarketIxs`. End-user-side: place orders via the `setBorrowOrder` instruction; lenders fill via `fillBorrowOrder`.

### Curator: enable on the market

```typescript theme={null}
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { address } from '@solana/kit';

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };

const newLendingMarket = { ...marketState };
newLendingMarket.borrowOrderCreationEnabled = 1;
newLendingMarket.borrowOrderExecutionEnabled = 1;
newLendingMarket.minBorrowOrderFillValue = 50_000n;  // adjust per asset

const ixs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

### Borrower: place an order

The SDK exposes the raw `setBorrowOrder` instruction builder via the codegen module. Build the instruction with the order parameters and submit it from the borrower's wallet.

```typescript theme={null}
import { setBorrowOrder } from '@kamino-finance/klend-sdk/dist/@codegen/klend/instructions';

// Build args and accounts per the instruction's signature, then:
const ix = setBorrowOrder(args, accounts, PROGRAM_ID);
// Sign with the borrower's wallet and submit
```

### Lender: fill an order

```typescript theme={null}
import { fillBorrowOrder } from '@kamino-finance/klend-sdk/dist/@codegen/klend/instructions';

const ix = fillBorrowOrder(args, accounts, PROGRAM_ID);
// Sign with the lender's wallet and submit
```

For full args / accounts shapes, see the auto-generated source at `klend-sdk/src/@codegen/klend/instructions/setBorrowOrder.ts` and `fillBorrowOrder.ts`.

**API**

> [!NOTE]
>
> **Configuring borrow orders is not available via the REST API.** The curator-side flags live on `LendingMarket` and are flipped through the **SDK** or **Kamino CLI**. User-facing order creation and filling happen on-chain via the program's instructions.

To configure borrow orders, use the **SDK** or **Kamino CLI** tabs.

Live order data may be surfaced through Kamino's indexer / API for whitelisted markets. For non-whitelisted curator markets, run your own indexer.

**Kamino CLI**

## Enable borrow orders via CLI

```bash theme={null}
# 1. Download
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>

# 2. Edit ./configs/<MARKET>/market-<MARKET>.json — set:
#    "borrow_order_creation_enabled": 1
#    "borrow_order_execution_enabled": 1
#    "min_borrow_order_fill_value": "<scaled fraction>"

# 3. Inspect
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode inspect

# 4. Apply
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

User-side order creation and filling are not currently exposed through the kamino-manager CLI; users place orders via the Kamino webapp or via SDK-built transactions.

## The order itself

A borrow order is stored on the borrower's obligation account. Each order specifies:

| Field | What it does |
| - | - |
| `remaining_debt_amount` | The principal still seeking a fill. Decreases as partial fills happen |
| `max_borrow_rate_bps` | The highest interest rate (bps) the borrower will accept. A lender can fill at any rate ≤ this value |
| `min_debt_term_seconds` | The minimum term (seconds) the borrower will accept. Lenders' fills must use a fixed-term reserve with `debt_term_seconds >= min_debt_term_seconds` |
| `fillable_until_timestamp` | Order expires after this timestamp |
| `enable_auto_rollover_on_filled_borrows` | If `1`, filled borrows from this order auto-roll on maturity (subject to market-level rollover settings) |

**Hard limit**: each obligation can hold **one open borrow order at a time**. This is a deliberate business-logic constraint enforced by the program; it keeps the orderbook clean and the matching logic simple.

## The matching flow

The borrower calls `set-borrow-order` on their obligation, specifying the parameters above. At this stage no target reserve is named: the order is a pure expression of "what I'm willing to take" — max rate, min term, expiry, size.

A lender (or filler bot, or vault) finds the order, picks a fixed-term reserve whose `debt_term_seconds` and current borrow rate sit inside the order's `min_debt_term_seconds` and `max_borrow_rate_bps` bounds, and calls `fill-borrow-order` referencing the borrower's obligation, the chosen reserve, and the amount to fill. The program verifies expiry, term, rate, and fill-size constraints; on success, principal flows from the reserve to the borrower's debt position with the matched fixed term.

The order's `remaining_debt_amount` decreases by the filled size. When it reaches zero, the order closes. The borrower can also cancel the order at any time, and the order is automatically void after `fillable_until_timestamp` passes.

## Three liquidity flows that fill orders

| Flow | Source of liquidity |
| - | - |
| **Repaid liquidity matching** | Repayments into a fixed-term reserve free up liquidity. Bots monitor and fill outstanding borrow orders against that reserve |
| **Vault-driven fills** | A Kamino vault sitting on top can route deposits into a fixed-term reserve to fill matching orders, capturing the rate as yield for the vault's depositors |
| **Direct seeding** | A privileged lender deposits directly into a fixed-term reserve. The deposit sits as available liquidity until a borrow order fills it |

## Cancelling an order

A borrower can cancel their open order at any time (subject to no in-flight partial fill). Cancellation closes the order without affecting the borrows that have already been filled — those positions persist as normal fixed-term debt.

## Interaction with obligation ownership transfer

When a borrower has an open borrow order, transferring obligation ownership has a constraint: the order's debt destination is tied to the original owner's authority. If the new owner accepts the obligation while an order is open, the order becomes unfillable.

**Recommended flow**: cancel any open borrow orders before initiating an obligation transfer. See [Obligation ownership transfer](https://kamino.com/docs/curators/markets/obligation-ownership-transfer).

## Off-chain infrastructure

Borrow orders are useful in proportion to the off-chain matching infrastructure around them. A typical setup:

* **Order indexer**: an off-chain service watches `set-borrow-order` events and maintains an orderbook view per reserve
* **Filler bot**: a service that detects fillable orders and submits `fill-borrow-order` transactions
* **UI**: the borrower's UI shows the orderbook and lets them place / cancel orders

Curators running their own market typically rely on Kamino's existing infrastructure (for whitelisted markets) or build their own around the on-chain primitives.

## Common errors

| Error | Cause |
| - | - |
| `BorrowOrderCreationDisabled` | `borrow_order_creation_enabled = 0`. Enable |
| `BorrowOrderExecutionDisabled` | `borrow_order_execution_enabled = 0`. Enable |
| `BorrowOrderAlreadyExists` | The obligation already has an open order. Cancel the existing one first |
| `BorrowOrderFillValueTooSmall` | Fill amount is below `min_borrow_order_fill_value` |
| `BorrowOrderExpired` | `now > fillable_until_timestamp`. Borrower must place a new order |
| `BorrowOrderTermNotAcceptable` | Lender's chosen reserve has `debt_term_seconds < order.min_debt_term_seconds` |
| `BorrowOrderRateNotAcceptable` | Fill rate exceeds `max_borrow_rate_bps` |

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `borrow_order_*` flags and `min_borrow_order_fill_value`
* [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md) — the underlying lending mechanics
* [Obligation ownership transfer](https://kamino.com/docs/curators/markets/obligation-ownership-transfer) — interaction with open orders


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.