> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Emergency Council

> The market-level authority for one-way, risk-reducing emergency actions, and exactly what it can and cannot do

The emergency council is a market-level authority stored on `LendingMarket.emergency_council`. It is intentionally limited to one-way, risk-reducing actions: the council can enable circuit breakers or set limits to zero, but it cannot restore normal operation, relax risk parameters, or change ownership and admin settings.

The market owner sets or rotates the council via `UpdateLendingMarketMode::UpdateEmergencyCouncil`. Pairing a fast emergency-council multisig with a slower, timelocked `lending_market_owner` keeps incident response quick while routine changes stay deliberate.

> [!NOTE]
>
> Every council power is one-way. The council can only tighten (enable a breaker, zero a limit), never loosen. Only the `lending_market_owner` can reverse an emergency action.

## Market-level actions

When signing `update_lending_market`, the emergency council can:

* Enable global emergency mode: `UpdateEmergencyMode = true`.
* Disable all new borrowing at the market level: `UpdateBorrowingDisabled = true`.
* Disable price-triggered liquidations: `UpdatePriceTriggeredLiquidationDisabled = true`.

It cannot set any of those flags back to `false`. Only the lending market owner can do that.

Global emergency mode is broad: most user-facing instructions are guarded by `emergency_mode_disabled`, including refreshes, deposits, withdrawals, borrows, repays, liquidations, flash loans, obligation orders, rollover and fill flows, and queued-withdrawal flows.

## Reserve-level actions

When signing `update_reserve_config`, the emergency council can only make the following restrictive config changes:

| Mode | Allowed value | Effect |
| - | - | - |
| `UpdateBorrowLimit` | `0` | Blocks new borrows from the reserve. |
| `UpdateDepositLimit` | `0` | Blocks new deposits into the reserve. |
| `UpdateLoanToValuePct` | `0` | Disables using the reserve as collateral for borrowing. |
| `UpdateBlockPriceUsage` | `1` | Marks the reserve price as unusable. |
| `UpdateReserveEmergencyMode` | `1` | Enables reserve emergency mode. |
| `UpdateDisableUsageAsCollateralOutsideEmode` | `1` | Disables use as collateral outside e-mode. |

For all other reserve config modes, or for the opposite values above, the emergency council is not authorized. The lending market owner remains the fallback authority for normal reserve config changes, while global-admin-only reserve modes still require the global admin.

Reserve emergency mode blocks most user operations involving that reserve. Refreshing a reserve in emergency mode does not update the oracle price and clears the saved price status instead. The reserve-level flag can still be enabled even if the market has been made immutable; disabling it requires the normal owner path.

## Not emergency council powers

The emergency council cannot:

* Change the lending market owner, emergency council, global admin, proposer authority, or permissioning authority.
* Disable global or reserve emergency mode after it was enabled.
* Raise borrow, deposit, or LTV limits, or re-enable price usage or collateral usage.
* Execute owner-only operations such as `socialize_loss`.
* Bypass global-admin-only reserve config ownership for protocol fees, take rates, flash-loan fees, fixed-interest host fees, order execution fees, or cToken blocking.

> [!WARNING]
>
> Enabling emergency mode or zeroing a limit has effects the council cannot undo. Confirm the action on a multisig review before signing; reversing it requires the `lending_market_owner`.

## Code references

* Market allowlist: `programs/klend/src/handlers/handler_update_lending_market.rs`
* Reserve allowlist: `programs/klend/src/lending_market/lending_operations.rs`
* Reserve emergency mode behavior: `programs/klend/src/state/reserve.rs`, `programs/klend/src/lending_market/lending_checks.rs`
* Global emergency mode guard: `programs/klend/src/utils/constraints.rs`, `programs/klend/src/lib.rs`

## Reference

* [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md) — the operational switches and incident playbook
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — every market-level field
* [Reserve parameters](https://kamino.com/docs/curators/markets/reserve-parameters.md) — reserve config fields


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.