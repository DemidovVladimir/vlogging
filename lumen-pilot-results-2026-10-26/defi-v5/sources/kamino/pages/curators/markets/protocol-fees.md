> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdrawing Protocol Fees

> Withdraw accumulated curator fees from interest, origination, and liquidations

A market accumulates protocol fees over time from several sources. The curator (or a designated fee recipient) periodically withdraws these to a destination account.

## Sources of protocol fees

Each reserve generates fees independently based on its config. The fees are stored on-chain in the reserve's `liquidity` substructure as `accumulated_protocol_fees_sf` (scaled fraction).

| Source | Configured by | Accrues from |
| - | - | - |
| Interest take rate | `protocolTakeRatePct` (reserve, 0–100) | Each interest accrual: this percentage of accrued interest is routed to protocol fees; depositors receive the remainder |
| Origination fee | `fees.borrowFee` (reserve, decimal string) | Each new borrow: the configured fraction of the principal is added to debt and paid to protocol fees |
| Flash loan fee | `fees.flashLoanFee` (reserve) | Each flash loan: the configured fraction of the borrowed amount |
| Liquidation fee | `protocolLiquidationFeePct` (reserve, 0–100) | Each liquidation: this percentage of liquidation proceeds |
| Order execution fee | `protocolOrderExecutionFeePct` (reserve, 0–100) | Each obligation order fill: this percentage of execution proceeds |
| Referral fees | `referral_fee_bps` (market) | Borrows referred by registered referrers: the configured bps is shared with the referrer |

All fees accumulate in the reserve's fee vault on the same liquidity mint as the reserve. A USDC reserve's fees are accumulated in USDC.

## Two withdrawal handlers

| Instruction | Used for |
| - | - |
| `redeemFees` | The standard curator fee withdrawal. Drains `accumulated_protocol_fees_sf` from the reserve to the configured fee recipient |
| `withdrawProtocolFee` | A more general withdrawal handler for specific fee accounting buckets |

For routine curator operations, `redeemFees` is the relevant instruction.

**SDK**

## Withdraw fees via SDK

The SDK exposes the raw `redeemFees` and `withdrawProtocolFee` instructions via the codegen module. Build the instructions with the relevant accounts and submit from the curator's wallet (or multisig).

```typescript theme={null}
import { redeemFees } from '@kamino-finance/klend-sdk/dist/@codegen/klend/instructions';
import { PROGRAM_ID } from '@kamino-finance/klend-sdk';

// Build args and accounts per the instruction's signature, then:
const ix = redeemFees(args, accounts, PROGRAM_ID);
// Sign with the curator's wallet (or build as a multisig proposal) and submit
```

For full args / accounts shapes, see the auto-generated source at `klend-sdk/src/@codegen/klend/instructions/redeemFees.ts` and `withdrawProtocolFee.ts`.

**API**

> [!NOTE]
>
> **Withdrawing protocol fees is not available via the REST API.** Fee withdrawal is an admin operation executed via the on-chain klend program through the **SDK** or **Kamino CLI**.

To inspect accumulated fees, fetch the reserve account state and read `liquidity.accumulated_protocol_fees_sf`. See [Read market data](https://kamino.com/docs/curators/markets/market-data.md) for read paths.

**Kamino CLI**

## Withdraw fees via CLI

Routine fee withdrawal via the kamino-manager CLI is not exposed as a dedicated wrapper command in the current toolchain. Curators withdraw fees by:

* Building and submitting the `redeemFees` instruction directly via the SDK (see SDK tab)
* Wrapping the instruction in a multisig proposal and submitting through Squads

For multisig-owned markets, the proposal is constructed with the relevant accounts (reserve, market, fee receiver, etc.) and signed by the multisig members.

## Fee recipient

The fee recipient is configured at the program level. For most curator markets, this is the `lending_market_owner` (or its multisig). In specialized configurations, it can be a separate dedicated address — useful when the curator wants ops to flow to one signer set and fee revenue to flow to another.

Confirm the recipient by inspecting the market's accounts via `get-market-or-vault-admin-info`.

## When to withdraw

Fees accrue continuously but withdrawing them is a discrete event. A common cadence:

| Cadence | Reasoning |
| - | - |
| Quarterly | Standard for established markets. Reduces operational overhead |
| Monthly | Higher-volume markets where fee accumulation is meaningful |
| Event-driven | Markets that receive a one-off fee event (large flash loan, large liquidation) may withdraw immediately |
| Pre-migration | Before transferring market ownership or going `immutable`, drain pending fees so the new state starts clean |

## Operational considerations

| Consideration | What to watch |
| - | - |
| Reserve liquidity | Withdrawals require the reserve to have enough available liquidity. If the reserve is at high utilization, a large withdrawal may need to wait until liquidity is freed by repayments or new deposits |
| Multisig timelock | For multisig-owned markets, the withdrawal goes through the standard proposal flow with the configured timelock |
| Reporting | Fee withdrawals are visible on-chain. Keep records that align on-chain transfers with the curator's accounting |

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — all fee-related fields
* [Risk parameters → Fees](https://kamino.com/docs/curators/markets/risk-parameters.md#fees) — how to set fee rates
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `referral_fee_bps`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.