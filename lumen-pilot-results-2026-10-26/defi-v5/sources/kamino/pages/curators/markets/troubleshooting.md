> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Troubleshooting

> Common errors curators and their users hit, and how to resolve them

A catalog of recurring errors observed in production curator markets, organized by symptom. Each entry covers the cause and the fix.

## Reserve-creation errors

### `InvalidOracleConfig`, `InvalidScopePriceAccount`

**Symptom:** `add-asset-to-market` or `update-reserve-config` reverts with one of these.

**Cause:** The oracle pubkey in the reserve config's `tokenInfo` doesn't match the account passed to the instruction. The on-chain validator strictly checks that what's passed matches what's configured.

**Fix:** Run `get-oracle-mappings` to retrieve the canonical oracle addresses for the asset. Update `tokenInfo.scopeConfiguration.priceFeed` to match. Re-run.

### `InvalidTwapConfig`

**Symptom:** Reserve creation or oracle update reverts with this error.

**Cause:** TWAP is enabled (`maxTwapDivergenceBps > 0`) but either `maxAgeTwapSeconds` is `0`, or the configured oracle source doesn't expose a TWAP.

**Fix:** Either disable TWAP (`maxTwapDivergenceBps: 0`) or ensure the oracle source has a TWAP available and `maxAgeTwapSeconds` is set to a non-zero value.

### `Reserve already exists for this mint`

**Symptom:** `add-asset-to-market` reverts.

**Cause:** A reserve for this (mint, market) pair already exists. Each market can have at most one reserve per mint.

**Fix:** Use `update-reserve-config` for the existing reserve, or deploy a new market if you need a separate reserve for the same mint (e.g., a different fixed-term track).

## Withdrawal queue errors

### `WithdrawTicketValueTooSmall`

**Symptom:** A user calls `enqueue-to-withdraw` and the transaction reverts.

**Cause:** The ticket value (the user's withdrawal amount, valued in USD) is below the market-level `min_withdraw_queued_liquidity_value`.

**Fix:** Either lower `min_withdraw_queued_liquidity_value` on the market config, or have the user enqueue a larger amount. The default value is intended to filter dust; if a real depositor is hitting it, the threshold may be too high.

### `WithdrawTicketIssuanceDisabled` / `WithdrawTicketRedemptionDisabled` / `WithdrawTicketCancellationDisabled`

**Symptom:** A user calls one of `enqueue-to-withdraw`, `withdraw-queued-liquidity`, or `cancel-withdraw-ticket` and gets the corresponding "disabled" error.

**Cause:** The relevant flag on the market is set to `0`.

**Fix:** Set `withdraw_ticket_issuance_enabled`, `withdraw_ticket_redemption_enabled`, or `withdraw_ticket_cancellation_enabled` to `1` on the market config and re-deploy. See [Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md).

### Redemption returns less than expected

**Symptom:** A user redeems their ticket but receives a partial amount.

**Cause:** The reserve has only partial liquidity available. The program pays out what it can; the ticket carries the remaining amount and stays in the queue for the next round.

**Fix:** Working as designed. The user re-submits `withdraw-queued-liquidity` after additional liquidity becomes available (borrower repayment, new deposit, liquidation).

## Repay / withdraw errors

### `MinNetValueInObligationViolated`

**Symptom:** A borrower partial-repay or partial-withdraw reverts.

**Cause:** After the operation, the obligation would hold less than `min_net_value_in_obligation_sf` (default approximately `$0.000001`). The program rejects operations that would leave dust positions.

**Fix:** The user must either:

* Repay the full debt (close the position cleanly), or
* Repay enough that the remaining debt is comfortably above the threshold

For curators: communicate this constraint to users. The protocol-wide default is sensible; raising it on your market would make the issue more frequent.

### "Withdraw amount is less than withdrawal penalty"

**Symptom:** A user attempts a withdrawal and the SDK rejects with this error.

**Cause:** The withdrawal would leave less than the SDK's penalty floor in available liquidity (sub-cent dust). The SDK guards against creating uneconomical withdrawals.

**Fix:** The user adjusts the withdrawal amount to either fully exit or leave a meaningful balance. UI integrators may treat sub-cent residuals as "absolute zero" and round display values accordingly.

## Liquidation issues

### Sub-\$2 obligations not liquidating cleanly

**Symptom:** A position with very small debt is underwater but liquidators aren't successfully clearing it.

**Cause:** Below `min_full_liquidation_value_threshold`, the close-factor cap is bypassed and full liquidation is allowed — but liquidator gas economics may not justify clearing a sub-\$2 position. Above the threshold, partial liquidations apply, which are uneconomical at this scale.

**Fix:** Tune `min_full_liquidation_value_threshold` to a value that aligns with liquidator gas economics on your network. A higher threshold lets more positions be fully liquidated cleanly. Combine with `min_value_skip_liquidation_ltv_checks` to skip LTV health checks for tiny positions.

### Liquidations on a fixed-term reserve don't fire at maturity

**Symptom:** A fixed-term position passes its `debt_maturity_timestamp` but isn't liquidatable.

**Cause:** Either `mature_reserve_debt_liquidation_enabled` or `obligation_borrow_debt_term_liquidation_enabled` is `0` on the market.

**Fix:** Set both flags to `1` on the market config. See [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md#market-level-rollover-settings).

## Borrow order errors

### `BorrowOrderAlreadyExists`

**Symptom:** A user calls `set-borrow-order` and it reverts.

**Cause:** The obligation already has an open borrow order. The program enforces one open order per obligation.

**Fix:** Cancel the existing order first. Each obligation can hold one borrow order at a time by deliberate design.

### `BorrowOrderFillValueTooSmall`

**Symptom:** A lender calls `fill-borrow-order` and it reverts.

**Cause:** The fill amount is below `min_borrow_order_fill_value`.

**Fix:** Increase the fill size, or lower the market's threshold if it's set too high for the asset's economics.

## Vault interaction errors

### Vault `invest` doesn't create withdrawal tickets

**Symptom:** A vault manager decreases a reserve's allocation weight, expecting the program to enqueue tickets. Nothing happens.

**Cause:** Vault-side automatic ticket creation on `invest` is currently a user-initiated flow on the underlying klend market. The vault does not auto-enqueue tickets when a manager rebalances.

**Fix:** End users withdraw via the standard kvault `redeem_in_kind` → receive cTokens → enqueue ticket flow. Vault-level rebalancing affects target allocation but doesn't preemptively queue user withdrawals.

## CLI errors

### `Unauthorized` on a config update

**Symptom:** `update-reserve-config` or `update-lending-market-from-config` reverts with `Unauthorized`.

**Cause:** The signer's pubkey doesn't match `lending_market_owner`.

**Fix:** Verify ownership with `get-market-or-vault-admin-info`. If the market was transferred to a multisig, use `--mode multisig --multisig <PUBKEY>` (every update on a multisig-owned market goes through proposals).

### `MarketImmutable`

**Symptom:** Any update returns this error.

**Cause:** `immutable: 1` was previously set on the market. No further updates are possible.

**Fix:** None available. The flag is irreversible. To deploy a fresh configuration, create a new market.

### Public RPC rate limits

**Symptom:** Transactions fail to land, the CLI reports timeouts, simulations fail with rate-limit errors.

**Cause:** The `RPC` URL in `.env` is the public Solana endpoint, which is rate-limited.

**Fix:** Use a private RPC provider (Helius, Triton, QuickNode, etc.). Public mainnet RPC is for casual use; production curator operations should run against a dedicated endpoint.

## Visibility issues

### Market doesn't appear in `app.kamino.com`

**Symptom:** The market is on-chain and operational, but doesn't show up in the public Kamino app.

**Cause:** The Kamino app filters markets by a curated whitelist (`resources.json` in the kamino-resources repo). Markets not on the list don't surface in the public UI.

**Fix:** If you want the market on the public app, coordinate with the Kamino team to add it. If not, the market is accessible via direct deep-link (`?market=<MARKET_ADDRESS>`) and via your own UI.

## When the page above doesn't help

If you're hitting an error that isn't here:

1. Check the on-chain state with `download-lending-market-config` and `download-reserve-config` — confirm what's actually configured.
2. Re-run the failing operation with `--mode inspect` and open the simulator — the explorer often gives a more specific reason than the CLI's surface error.
3. Cross-reference field names against the [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) and [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — reserve config JSON uses camelCase; market config JSON uses snake\_case (mirrors the on-chain Rust).
4. Check the [klend repository](https://github.com/Kamino-Finance/klend) for the error name in the program's error list.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.