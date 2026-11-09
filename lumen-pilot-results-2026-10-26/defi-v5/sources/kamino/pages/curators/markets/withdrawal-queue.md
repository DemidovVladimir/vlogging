> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdrawal Queue

> FIFO redemption mechanism for reserves at high utilization

The withdrawal queue is a market-level mechanism that lets depositors hold a place in line for liquidity when a reserve is fully utilized. Instead of a withdrawal reverting because the available pool is empty, the depositor enqueues a `WithdrawTicket` and is paid out FIFO as borrowers repay, deposits arrive, or liquidations free liquidity.

The queue is opt-in per market, controlled by three boolean flags on the `LendingMarket` account.

## When to enable the queue

| Curator situation | Enable the queue |
| - | - |
| Reserves run at high utilization (>90% sustained) | Yes |
| A vault sits on top, holding institutional capital subject to redemption requests | Yes |
| Reserves typically run at moderate utilization with deep buffers | Optional |
| Long-tail asset where exits are rare but should be predictable | Yes |
| Reserves where you want every withdrawal to be instant or revert | Leave disabled |

## Three flags, three operations

| Flag | What it gates |
| - | - |
| `withdraw_ticket_issuance_enabled` | `enqueue-to-withdraw`: a depositor can submit collateral and receive a ticket |
| `withdraw_ticket_redemption_enabled` | `withdraw-queued-liquidity`: a ticket holder can claim their share when capacity is available |
| `withdraw_ticket_cancellation_enabled` | `cancel-withdraw-ticket`: a ticket holder can exit the queue |

Curators flip these together when launching the queue. The most useful intermediate state is `issuance + redemption` enabled, `cancellation` disabled — depositors can join the line and be paid, but cannot back out, which simplifies accounting for vaults sitting on top.

## The minimum queued value threshold

`min_withdraw_queued_liquidity_value` sets the minimum USD value (scaled fraction) a single ticket may represent. Below the threshold, `enqueue-to-withdraw` reverts with `WithdrawTicketValueTooSmall`.

| Value | Effect |
| - | - |
| `0` | No floor. Any-size tickets allowed (risk: dust spam) |
| Reasonable floor (e.g., \$1 equivalent) | Filters dust, keeps the queue economically meaningful |
| Aggressive floor (e.g., \$1000 equivalent) | Restricts the queue to sizable depositors only |

**SDK**

## Configure the queue via SDK

Enabling the queue is a market-level config update. Use `kaminoManager.updateLendingMarketIxs` and toggle the relevant fields.

```typescript theme={null}
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { address } from '@solana/kit';

// ... rpc setup, adminSigner ...

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);
const marketAddress = address('<MARKET_ADDRESS>');

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };

const newLendingMarket = { ...marketState };
newLendingMarket.withdrawTicketIssuanceEnabled = 1;
newLendingMarket.withdrawTicketRedemptionEnabled = 1;
newLendingMarket.withdrawTicketCancellationEnabled = 1;
newLendingMarket.minWithdrawQueuedLiquidityValue = 100_000n;  // adjust per asset

const updateIxs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

### User-side queue operations

The user-facing queue instructions (`enqueueToWithdraw`, `withdrawQueuedLiquidity`, `cancelWithdrawTicket`, `recoverInvalidTicketCollateral`) are part of the on-chain klend program. The current public klend-sdk does not yet expose dedicated TypeScript helpers for these.

Until the helpers ship, end-user apps integrate the queue via:

* A direct kvault deposit/redeem flow when a vault sits on top of the market (the vault submits the ticket on the user's behalf via its own kvault tooling)
* The Kamino webapp surface for queue-enabled markets that are listed in `resources.json`
* Building the ixes manually from the program IDL

For curator-side enablement, the SDK flow above is the only thing you need.

**API**

> [!NOTE]
>
> **Configuring the queue is not available via the REST API.** The flags live on `LendingMarket` and are flipped through the **SDK** or **Kamino CLI**. The REST API exposes read access to ticket and queue state for monitoring.

To enable or configure the queue, use the **SDK** or **Kamino CLI** tabs.

To monitor queue state, query the on-chain reserve and any open `WithdrawTicket` accounts directly, or use the [API reference](https://kamino.com/docs/build/api-reference/introduction.md) for reserve metrics.

**Kamino CLI**

## Configure the queue via CLI

The queue flags live on the market config. Apply via the standard `update-lending-market-from-config` flow.

```bash theme={null}
# 1. Download
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>

# 2. Edit ./configs/<MARKET>/market-<MARKET>.json — set:
#    "withdraw_ticket_issuance_enabled": 1
#    "withdraw_ticket_redemption_enabled": 1
#    "withdraw_ticket_cancellation_enabled": 1
#    "min_withdraw_queued_liquidity_value": "<scaled fraction>"

# 3. Inspect
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode inspect

# 4. Apply via multisig
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

## Anatomy of a ticket

When a depositor calls `enqueue-to-withdraw`, the program:

1. Burns their collateral cTokens from their wallet
2. Increments the reserve's `WithdrawQueue.queued_collateral_amount`
3. Creates a `WithdrawTicket` account with:
   * `sequence_number` (monotonically increasing per reserve)
   * `owner` (the depositor's wallet)
   * `reserve` (the reserve being withdrawn from)
   * `queued_collateral_amount` (the cTokens held in queue)
   * `created_at_timestamp`
   * `progress_callback_type` and `progress_callback_custom_accounts` (optional callback hook)

The ticket is a Solana account. The depositor (or whoever submitted on their behalf) holds the right to redeem when their sequence number is up.

### Sequence numbers and FIFO order

The reserve tracks two counters:

```rust theme={null}
struct WithdrawQueue {
    queued_collateral_amount: u64,
    next_issued_ticket_sequence_number: u64,
    next_withdrawable_ticket_sequence_number: u64,
}
```

| Counter | What it tracks |
| - | - |
| `next_issued_ticket_sequence_number` | The number the **next** new ticket will receive. Increments on `enqueue-to-withdraw` |
| `next_withdrawable_ticket_sequence_number` | The smallest number that has not yet been redeemed. Increments on `withdraw-queued-liquidity` after a ticket is fully closed |

A ticket with sequence number `N` is redeemable when `next_withdrawable_ticket_sequence_number == N`, provided the reserve has enough liquidity to satisfy it.

## The redemption flow

The reserve gains liquidity over time through borrower repayments, new deposits, liquidations, and (for markets with a vault sitting on top) the vault's `invest` operation routing capital in. Whenever liquidity is available, the holder of the next-eligible ticket can call `withdraw-queued-liquidity`. The program checks the ticket's `sequence_number` against the reserve's `next_withdrawable_ticket_sequence_number`; if they match, it pays out as much of the queued collateral as the available liquidity covers. Partial fills are allowed: a ticket that asks for \$100k against a reserve with \$30k free liquidity is paid \$30k now and waits for the rest.

When a ticket is fully drained, the program closes its account and increments `next_withdrawable_ticket_sequence_number` so the next ticket in line becomes eligible. Holders watch the queue and submit the redemption transaction when liquidity allows; in practice, off-chain bots monitor and submit on behalf of users, which is how the standard Kamino UX surfaces the queue to depositors.

## Cancellation

When `withdraw_ticket_cancellation_enabled = 1`, a ticket holder can call `cancel-withdraw-ticket` to back out of the queue:

* The remaining `queued_collateral_amount` is converted back to cTokens and returned to the holder
* The ticket is marked `invalid = 1` and closed
* `next_withdrawable_ticket_sequence_number` does not advance — the cancelled slot is skipped on the next redemption

Cancellation is a depositor-friendly feature. Disable it for institutional vaults where queue position is sold or transferred contractually under the off-chain agreement.

### Recovering invalid tickets

If a ticket gets stuck in an invalid state (the program detects this on certain edge cases), the curator or emergency authority can call `recover-invalid-ticket-collateral` to drain its queued collateral and restore queue progression.

## Vault integration: progress callback

A `WithdrawTicket` can carry an optional progress callback. When the ticket completes redemption, the program invokes the callback to notify a corresponding program — most commonly a Kamino vault.

```rust theme={null}
enum ProgressCallbackType {
    None = 0,
    KlendQueueAccountingHandlerOnKvault = 1,
}
```

If a kvault submits the `enqueue-to-withdraw` on behalf of one of its depositors, the ticket can carry `KlendQueueAccountingHandlerOnKvault` so that on redemption, the kvault is automatically notified to credit the depositor's vault share. This is the standard pattern for institutional vaults sitting on top of a queue-enabled market.

## Common errors

| Error | Cause |
| - | - |
| `WithdrawTicketValueTooSmall` | The ticket's value is below `min_withdraw_queued_liquidity_value`. Either reduce the threshold or have the depositor combine smaller withdrawals |
| `WithdrawTicketIssuanceDisabled` | `withdraw_ticket_issuance_enabled = 0`. Enable the flag |
| `WithdrawTicketRedemptionDisabled` | `withdraw_ticket_redemption_enabled = 0`. Enable the flag |
| `WithdrawTicketCancellationDisabled` | `withdraw_ticket_cancellation_enabled = 0`. Enable the flag, or accept that cancellation is intentionally disabled |
| Redemption returns less than expected | Reserve liquidity is partially available — the program pays out what it can; the ticket carries the remainder |

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — queue-related fields
* [Troubleshooting](https://kamino.com/docs/curators/markets/troubleshooting) — `WithdrawTicketValueTooSmall` and related dust edge cases
* [Permissioned markets](https://kamino.com/docs/curators/markets/permissioned-markets.md) — gated venues where queue mechanics often pair with allowlist enforcement


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.