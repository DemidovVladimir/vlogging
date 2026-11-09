# Tools

Aave MCP groups its tools into reads, action builders, orders (token swaps), Savings GHO, DAO governance and guidance. `tools/list` on the endpoint returns the live inventory with each tool's full parameter schema, and is the authority whenever it disagrees with this page.

## Conventions

- **Version.** Most tools take `version` as `v3`, `v4`, or `all`. Where a tool is fixed to one version, the tables below say so.
- **Reserve selectors.** A v4 call takes the opaque `reserveId`. A v3 call takes `market`, `token` and `chainId`. Both come from `get_markets` in the same session, as described in [Identifiers](#identifiers).
- **Amounts.** Main units, never base units, as described in [Amounts](#amounts).
- **Send only what applies.** Leave an argument out of the call entirely when it does not apply. An empty string or a near-zero number in its place is not universally read as unset, and several arguments reject it.
- **Rejected input stays rejected.** When the API refuses an argument, the reason comes back verbatim and marked non-retryable. Fix the arguments instead of repeating the call.
- **A filter narrows the whole response.** Asking `get_markets` for one symbol returns that reserve and the data around it, not a full chain listing with one row highlighted.

## Markets and Reserves

| Tool                   | Version | Description                                                                                        |
| :--------------------- | :------ | :------------------------------------------------------------------------------------------------- |
| `get_chains`           | v3, v4  | Chains Aave supports, flagging the ones this API holds no market on                                |
| `get_markets`          | v3, v4  | Reserves for a chain with rates, caps and liquidity left; `symbols` narrows it, `user` adds wallet balances |
| `get_reserve_details`  | v3, v4  | Deep detail for a single reserve, including token decimals                                          |
| `get_emode_categories` | v3      | eMode categories, which group correlated assets for higher borrowing power                          |
| `get_apy_history`      | v3, v4  | Supply or borrow APY for a reserve over a window                                                    |
| `get_protocol_history` | v4      | Protocol-wide market size and borrows over a window                                                 |
| `get_hubs`             | v4      | Hub-level liquidity and global accounting                                                           |
| `get_hub_assets`       | v4      | The assets one hub holds, with hub-wide supplied and borrowed totals                                |

## Positions

| Tool                        | Version | Description                                                                      |
| :-------------------------- | :------ | :------------------------------------------------------------------------------- |
| `get_user_positions`        | v3, v4  | A wallet's supplies and borrows, with per-position health on v4                   |
| `get_position_items`        | v4      | The individual supplies or borrows inside one spoke, each with a `positionItemId` |
| `get_user_summary`          | v3, v4  | Aggregate position and health factor                                             |
| `get_user_summary_history`  | v4      | One wallet's net worth, supplied, debt and health factor over a window           |
| `get_user_activity`         | v3, v4  | Transaction history, paginated                                                   |
| `get_transaction_processed` | v4      | Whether Aave has observed a transaction yet                                      |

## Actions

| Tool                     | Version | Description                                                                        |
| :----------------------- | :------ | :--------------------------------------------------------------------------------- |
| `preview_action`         | v3, v4  | Simulate a supply, borrow, withdraw or repay without executing                     |
| `prepare_action`         | v3, v4  | Build an unsigned supply, borrow, withdraw or repay                                |
| `prepare_set_collateral` | v3, v4  | Build an unsigned change to whether a supplied asset backs borrowing               |
| `prepare_set_emode`      | v3      | Build an unsigned switch of a wallet's eMode category, `0` to disable              |
| `prepare_liquidation`    | v3, v4  | Build an unsigned liquidation of a position whose health factor is under 1          |

## Rewards

| Tool                    | Version | Description                                                                        |
| :---------------------- | :------ | :--------------------------------------------------------------------------------- |
| `get_user_rewards`      | v3, v4  | Claimable rewards on every supported chain, Merit programmes included; the v3 response also carries the claim transaction |
| `prepare_claim_rewards` | v4      | Build an unsigned rewards claim                                                    |

## Swaps and Orders

Token swaps move tokens in the wallet. They are protocol-agnostic, take no `version`, and run on the v4 backend.

A swap runs an order lifecycle: a quote mints a `quoteId`, `prepare_order` returns what the user signs, `submit_signed_order` relays the signed order, and `get_order_status` tracks it until it settles.

| Tool                          | Version | Description                                                                   |
| :---------------------------- | :------ | :---------------------------------------------------------------------------- |
| `get_swappable_tokens`        | Neither | The chains and tokens a swap can be quoted on                                 |
| `get_swap_quote`              | Neither | Quote a token swap and return a `quoteId`; `slippagePct` caps slippage        |
| `prepare_order`               | Neither | What the user signs for a quoted order: EIP-712 typed data, or the transaction a native-token sell takes |
| `submit_signed_order`         | Neither | Relay an order the user has already signed                                    |
| `get_order_status`            | Neither | Poll a submitted order until it settles                                       |
| `get_pending_orders`          | Neither | A wallet's orders, newest first, across the chains the backend serves         |
| `prepare_cancel_order`        | Neither | The EIP-712 cancellation for the user to sign                                 |
| `cancel_order`                | Neither | Relay a signed cancellation, or return the on-chain cancel transaction        |

Some swaps need a token approval first. Prefer the gasless `bySignature` permit the quote offers and pass the signature back to `prepare_order` as `permitSignature` and `permitDeadline`; a `byTransaction` approval has to be sent and mined before the order can be prepared.

## Savings GHO

Savings GHO is an ERC-4626 vault on Ethereum that pays a target rate on deposited GHO. It is a product of its own rather than a reserve, so it has its own tools.

| Tool                     | Version      | Description                                                                            |
| :----------------------- | :----------- | :------------------------------------------------------------------------------------- |
| `get_sgho_vault`         | v3, Ethereum | Vault state and a wallet's position: target rate, supply cap, `maxDeposit`, `maxWithdraw` |
| `get_sgho_preview`       | v3, Ethereum | Convert between GHO and sGHO shares at the current vault index                          |
| `prepare_sgho_action`    | v3, Ethereum | Build an unsigned deposit or withdrawal                                                |
| `prepare_stkgho_migrate` | v3, Ethereum | Build an unsigned migration of an entire stkGHO position into sGHO                     |

> [!WARNING]
> An sGHO withdrawal is denominated in **vault shares**, not in GHO. It is the
> one place in this server where an amount is not the token the user is thinking
> in. Convert with `get_sgho_preview`, or pass `max`.

A wallet's `maxDeposit` is already the smaller of its GHO balance and the remaining cap, so size a deposit against that rather than against the cap. sGHO earns yield but is not collateral: it cannot be supplied or borrowed against, and it does not appear in a health factor.

## Aave DAO Governance

These take no `version`. Governance V3 is the DAO's own contract generation, unrelated to the v3 and v4 markets. Vote tallies, quorum and per-voter power are all denominated in AAVE, so they compare directly.

| Tool                          | Description                                                                                |
| :---------------------------- | :----------------------------------------------------------------------------------------- |
| `search_governance_proposals` | List proposals by lifecycle state, or search them full-text                                |
| `get_governance_proposal`     | One proposal in full, with the `quorumMet` and `differentialMet` conditions it must satisfy |
| `get_proposal_votes`          | Who voted and with how much power, largest first, plus totals                               |
| `get_user_vote`               | How one wallet voted on one proposal, or that it did not                                    |
| `get_proposal_payloads`       | What a proposal executes per target chain, and whether it has landed everywhere             |

## Guidance

| Tool             | Description                                                                                   |
| :--------------- | :-------------------------------------------------------------------------------------------- |
| `get_started`    | What the server can do, for a turn where the user has not asked for anything specific         |
| `get_aave_guide` | Protocol and usage guidance by topic, also readable as a resource at `aave://guide/<topic>`    |

## Response Envelope

Every successful result is the same envelope, returned both as JSON text and as `structuredContent`:

```json title="Result"
{
  "data": {},
  "next_actions": ["get_user_summary to confirm the resulting health factor"]
}
```

Read the payload from `data` and follow `next_actions`. A result may also carry `warnings`, each with a `level`, a stable `code`, and a message:

| Level     | Meaning                                                                                          |
| :-------- | :----------------------------------------------------------------------------------------------- |
| `error`   | The action cannot succeed as built. Fix the arguments or tell the user, rather than building past it. |
| `warning` | The action will succeed, and the user should hear about it first.                                  |
| `info`    | Context worth passing on.                                                                         |

## Chain Coverage

A read covers every chain it can and names them under `chainsCovered`, so there is no need to loop over chains by hand. Where the full sweep would be too large to return, the read narrows and names what it left out under `chainsNotCovered`, which is the only case that needs a second call.

`chainsNotServed` means something else. Those are chains this API holds no market on, so an empty result there is an absence of data rather than an answer about the chain, and asking again returns the same nothing. `get_chains` flags them too.

## Building an Action

`prepare_action` returns an execution plan, and its `__typename` says what to do next.

| `__typename`                                      | What it means                                                                                  |
| :------------------------------------------------ | :--------------------------------------------------------------------------------------------- |
| `TransactionRequest`                              | Ready to sign and send: `to`, `from`, `data`, `value`, `chainId`                                |
| `Erc20ApprovalRequired` (v4), `ApprovalRequired` (v3) | The allowance is missing, and the plan carries the approval                                  |
| `PreContractActionRequired`                       | Two transactions, in order: `transaction` first, then `originalTransaction`, which is the action |
| `InsufficientBalanceError`                        | The sender lacks the funds                                                                     |

Both versions offer the same gasless route, and offer it the same way. When an approval plan carries `bySignature` permit typed data, sign that and call `prepare_action` again with `permitSignature` and `permitDeadline`, the `deadline` from the message that was signed. The call then returns the action transaction with no approval transaction at all. v4 offers this on a supply; v3 offers it on a supply, a repay or a withdraw, and not on a borrow, since nothing leaves the wallet there.

> [!NOTE]
> Only send `permitSignature` when replaying a call after an approval handed back
> a permit. It is not part of a first attempt.

A plan with no `bySignature` is a token without permit support, so the on-chain route is the only one. Submit the `byTransaction` approval and wait for it to be mined before running `prepare_action` again: the action transaction is only issued once the allowance is visible on chain, so calling again too early returns the approval step a second time.

Supplying a chain's native gas token, with `native`, usually takes the `PreContractActionRequired` path, where the first transaction lets the native gateway act and the second performs the supply.

## Amounts

Amounts are in main, human units. `"10.5"` is 10.5 USDC, and token decimals are handled for you. The format is a plain positive decimal string, so `1e5` and hex are rejected, and `get_reserve_details` carries the decimals when a conversion is needed. 100000 base units of a 6-decimal token is `"0.1"`, not `"100"`.

- Rates and percentages carry a `Pct` suffix and are percentages rounded to four decimal places, so `"3.32"` means 3.32%. Plain ratios such as the health factor are unchanged.
- For a withdraw or a repay, `max` uses the whole balance or debt instead of an amount.
- `native` acts with the chain's native gas token instead of its wrapped ERC-20. The two do not always combine: a v3 repay has no native `max` form, so send an explicit amount there, or drop `native` and repay the wrapped token with `max`.
- Aggregate USD figures on `get_user_summary` are rounded to four decimals, so never compare them against dust. Use the per-item principal and interest from `get_position_items`.

## Identifiers

On v4 every id is URL-safe base64 of a `::`-joined tuple, so they all look alike and several differ only in how many segments they carry.

| Id                | Shape                                       | Returned by                                     |
| :---------------- | :------------------------------------------ | :---------------------------------------------- |
| Spoke             | `chain::spokeAddress`                       | `get_user_positions`                            |
| Reserve           | `chain::spokeAddress::onChainReserveId`     | `get_markets`, `get_reserve_details`, `get_position_items` |
| User position     | `chain::spokeAddress::user`                 | position reads                                  |
| Hub asset         | `chain::hubAddress::onChainHubAssetId`      | `get_hubs`, `get_hub_assets`                    |

Carry ids verbatim from whichever tool returned them, and never assemble one. They are opaque by contract, the on-chain reserve id is a 256-bit number rather than a small index, and a value that was built by hand is rejected even when it looks right. The same asset also appears on several spokes at very different rates, which is why the `reserveId` matters and a symbol will not do.

v3 does not work this way. There a reserve is addressed as `market` plus `token` plus `chainId`, three plain values with no encoding, and an Aave pool address recognised from elsewhere belongs to another deployment and is rejected.

## What Can Block an Action

Four rules decide whether an action is possible at all. Each one otherwise surfaces as a different error.

1. **A supply is not collateral** unless `prepare_action` was given `enableCollateral`. Without collateral the borrowing power is zero, so a borrow is refused, and `preview_action` reports a resulting health factor of 0, which means no borrowing power rather than liquidatable. `prepare_set_collateral` turns an existing supply into collateral.
2. **Collateral pinned by an open borrow cannot be withdrawn,** so a withdraw repays first. The `withdrawableIgnoringDebt` field reflects liquidity and caps only, and does not subtract collateral backing a borrow, so asking for all of it is refused for dropping the health factor below 1.
3. **Debt cannot be repaid to exactly zero.** Interest accrues between computing the amount and the transaction landing, so a few units always remain, and `max` is refused when the wallet holds exactly what was borrowed, because it is then one unit short. Treat a zero principal as repaid, or repay with a surplus in the wallet.
4. **The API lags the chain.** After sending a transaction, poll `get_transaction_processed` before building a dependent follow-up rather than waiting a fixed time.

A clean simulation says the position allows the action. It says nothing about token allowances, so an approval step can still be outstanding.
