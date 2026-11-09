> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Glossary

> Definitions for terms used across Kamino Markets documentation

| Term | Definition |
| - | - |
| **Auto-Deleverage** | Margin-call mechanism that gives a borrower a grace period to self-deleverage before forced liquidation. Configured per reserve and at the market level. |
| **Bad Debt** | A position where debt value exceeds collateral value; even a fully-priced liquidation cannot make the depositor whole. Triggers the `badDebtLiquidationBonusBps` and may require socialize-loss to clear. |
| **Borrow Factor** | A multiplier on the debt-side valuation of an asset (`borrowFactorPct`). `100` = no adjustment; values above `100` make borrowing the asset more expensive in risk terms. |
| **Borrow Order** | A limit-order request placed by a borrower specifying max acceptable rate, min term, and expiry. Lenders fill it via `fill-borrow-order`. One open order per obligation. |
| **Borrow Rate Curve** | Piecewise linear function mapping reserve utilization to borrow rate. Defined as up to 11 `(utilizationRateBps, borrowRateBps)` breakpoints. |
| **Cached Owner** | The `lending_market_owner_cached` field. A staging slot used in the two-step ownership transfer flow. |
| **Close Factor** | The maximum portion of debt a liquidator can repay in a single liquidation round. Configured market-wide via `liquidation_max_debt_close_factor_pct`. |
| **Collateral Farm** | A reward farm attached to a reserve that distributes incentives to depositors. |
| **Crank** | Off-chain bot that triggers on-chain state updates (interest accrual, oracle refreshes, queue progression). |
| **cToken** | Receipt token issued to depositors representing their share of a reserve's deposits. Burned on withdrawal. |
| **Debt Farm** | A reward farm attached to a reserve that distributes incentives to borrowers. |
| **Debt Maturity Timestamp** | The Unix timestamp at which all debt on a fixed-term reserve matures. `0` = per-borrow rolling term. |
| **Debt Reserve** (in eMode) | The single reserve that members of an elevation group are permitted to borrow. |
| **Debt Term Seconds** | Duration of fixed-term borrows on a reserve. `0` = open-term (no maturity). |
| **Early Repay Penalty** | A penalty (`earlyRepayRemainingInterestPct`) applied when a fixed-term borrower repays during the first term before maturity. Charged as a percentage of remaining interest. After rollover, no penalty applies. |
| **Elevation Group** (eMode) | A cluster of correlated assets with relaxed risk parameters when used together. Up to 32 groups per market. |
| **Emergency Council** | A separate authority (often a fast-response multisig) configured via `emergency_council` to call emergency-only handlers. |
| **Emergency Mode** | Market-wide or reserve-level pause. Halts most operations until reset. Reversible. |
| **Flash Loan** | An uncollateralized loan that must be borrowed and repaid within the same transaction. |
| **Heuristic** (price) | Sanity bounds for an oracle price. Set via `tokenInfo.heuristic.{lower, upper, exp}`. Rejects prices outside the band. |
| **Host Fixed Interest Rate** | A fixed-rate add-on (`hostFixedInterestRateBps`) on top of the IR curve, charged on fixed-term reserves. |
| **Immutable** | A one-way market flag (`immutable: 1`) that permanently blocks all curator-side updates. Irreversible. |
| **Insolvency Risk LTV** | The LTV (`insolvency_risk_unhealthy_ltv_pct`) at which a position is considered to be in insolvency-risk territory and may be marked for auto-deleverage. |
| **IR Curve** | See **Borrow Rate Curve**. |
| **Kink** | The breakpoint on the borrow rate curve where rates start climbing steeply. Used to keep utilization at a target level. |
| **klend** | The Kamino lending program. The on-chain Anchor program that defines markets, reserves, obligations, and the lending operations. |
| **kvault** | The Kamino vault program. Optional layer that sits on top of klend markets, aggregating depositor capital and routing it across reserves. |
| **KFarms** | The Kamino farms program. Manages reward distribution to klend depositors and borrowers. |
| **Lamports** | The smallest unit of a token on Solana. `1 SOL = 10^9 lamports`. Reserve caps and on-chain values are denominated in token base units (lamports for SOL, smallest unit for other mints). |
| **Lending Market** | The top-level on-chain account that groups reserves. Has its own owner, settings, and reserve set. The `LendingMarket` Rust struct. |
| **Liquidation Threshold** | The LTV at which a position becomes liquidatable. Per-reserve via `liquidationThresholdPct`; can be overridden by an elevation group. |
| **Loan-to-Value (LTV)** | Maximum borrowing capacity against collateral, as a percent of collateral USD value. Per-reserve via `loanToValuePct`. |
| **Margin Call Period** | Grace period (`deleveragingMarginCallPeriodSecs`) between when a position is marked for auto-deleverage and when liquidation becomes available. |
| **Mature Debt** | Fixed-term debt that has passed its `debt_maturity_timestamp`. Liquidatable as mature debt if the relevant flags are set. |
| **Min Initial Deposit** | Market-level threshold (`min_initial_deposit_amount`) for the first deposit on an obligation. Prevents dust-spam attacks. |
| **Min Net Obligation Value** | Market-level threshold (`min_net_value_in_obligation_sf`) for the residual value after any operation. Operations that would leave less are rejected. |
| **Mirror Token** | An on-chain token that represents an off-chain asset 1:1. Typically minted in full at issuance with mint authority subsequently revoked. |
| **Multisig** | Multi-signature wallet requiring multiple approvals to execute transactions. Kamino recommends [Squads v4](https://squads.so) for production market ownership. |
| **Obligation** | The on-chain account tracking a user's deposits and borrows in a market. Per-user, per-market, per-obligation-type. |
| **Obligation Order** | A user-set, price-triggered self-deleverage instruction stored on an obligation. Fired by permissionless executors when the condition is met. |
| **Oracle** | External price feed providing asset valuations. Kamino prices reserves through Scope, configured per reserve via `tokenInfo`. |
| **Origination Fee** | Fee charged at borrow time, configured via `fees.borrowFee`. |
| **Permissioned Market** | A market where access is gated. On-chain klend has no allowlist field; permissioning today is achieved via Token-2022 transfer hooks, UI gating, or vault-layer terms acceptance. First-class support is on the roadmap. |
| **Price Heuristic** | See **Heuristic**. |
| **Progress Callback** | An optional callback on `WithdrawTicket` invoked when a ticket is fully redeemed. Used by kvault to update vault-side accounting. |
| **Proposer Authority** | An authority (`proposer_authority`) that can propose certain config updates without holding full owner privileges. |
| **Protocol Fee** | Fees accrued by the curator from interest take rate, origination, flash loans, liquidations, and order executions. Withdrawn via `redeem-fees`. |
| **Quote Currency** | The reference unit for prices on a market. Stored on `LendingMarket.quote_currency`. Almost always `"USD"`. |
| **Receipt Token** | Token issued by a vault to depositors representing their share of vault assets. Distinct from cTokens (which are reserve-level deposit receipts inside klend). |
| **Referral Fee** | Portion of borrow interest, in basis points (`referral_fee_bps`), routed to integrators registered as referrers. |
| **Reserve** | A specific lending pool inside a market for a single token. Holds deposits, borrows, the IR curve, oracle config, and risk parameters for that asset. |
| **Reserve Status** | Reserve-level flag with values `0` Active, `1` Obsolete, `2` Hidden. |
| **Rollover** | Migrating a fixed-term position to a new term (fixed→fixed, fixed→open, or open→fixed). Subject to market-level rollover window settings. |
| **Scope** | Kamino's oracle aggregator. Combines Chainlink and Pyth Pro into a manipulation-resistant chain of price indices. |
| **Sequence Number** (queue) | The position number assigned to a `WithdrawTicket` when it enters the queue. Tickets are redeemable in FIFO sequence-number order. |
| **Socialize Loss** | The `socialize_loss` instruction that distributes unrecoverable bad debt across a reserve's depositors. Last-resort, irreversible. |
| **Squads** | Solana multisig product. Kamino's recommended multisig solution for production market ownership. |
| **Take Rate** | Protocol's cut of interest accrual, configured per reserve via `protocolTakeRatePct`. |
| **Timelock** | Delay between proposal creation and execution on a Squads multisig. Kamino reference: 12h on SOL/BTC Market, 4h on satellite markets. |
| **Token-2022** | The SPL Token-2022 program. Supports token extensions including transfer hooks. Used for regulated and compliance-constrained tokens on klend. |
| **Transfer Hook** | A Token-2022 extension that invokes an external program on every transfer. The hook program can approve or reject the transfer based on custom logic. |
| **TWAP** | Time-Weighted Average Price. A smoothed price that mitigates manipulation. Configured via `maxAgeTwapSeconds` and `maxTwapDivergenceBps`. |
| **Utilization Rate** | The ratio `borrowed / deposited` on a reserve. Drives the borrow rate via the IR curve. |
| **Withdrawal Cap** | Per-reserve, per-interval limit on net flow. Two independent caps: `depositWithdrawalCap` (collateral side), `debtWithdrawalCap` (debt side). |
| **Withdraw Queue** | Reserve-level FIFO queue for withdrawals when a reserve is fully utilized. Counters: `next_issued_ticket_sequence_number`, `next_withdrawable_ticket_sequence_number`. |
| **Withdraw Ticket** | Per-user account representing a position in the withdrawal queue. Holds the depositor's queued collateral and their sequence number. |

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md)
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md)
* [Lifecycle overview](https://kamino.com/docs/curators/markets/lifecycle.md)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.