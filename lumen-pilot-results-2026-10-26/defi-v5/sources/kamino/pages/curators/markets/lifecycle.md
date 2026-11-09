> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Lifecycle Overview

> The full path from market creation to day-2 operations

Setting up a Kamino market splits cleanly into two phases. Phase 1 is **market setup**: a small, fixed set of global, one-time actions that bring a market into existence and put it under multisig control. Phase 2 is **reserve setup**: the per-asset configuration work, repeated once for each token you want to list. Almost every meaningful risk decision a curator makes is at the reserve level.

After that, you operate the market: ongoing reserve updates, optional feature toggles, incident response.

## Phase 1 · Market setup (global)

Three actions, done once. Nothing here touches a specific asset.

**1. Create the market**

Run `create-market`. The CLI returns a market address. The market exists on-chain but has no reserves yet, so it accepts nothing.

→ [Create a market](https://kamino.com/docs/curators/markets/creating-a-market.md)

**2. Set market-wide config**

Set the market name, referral fee, emergency council, and any other market-level fields you want to override from defaults. Most curators take defaults and revisit this only when a specific market-wide flag needs flipping.

→ [Market settings](https://kamino.com/docs/curators/markets/market-settings.md)

**3. Transfer ownership to a multisig**

Move the `lending_market_owner` from your hot wallet to a Squads multisig. Two-step: cache the new owner, then promote it. From here on, every market or reserve update goes through a multisig proposal.

→ [Transfer to multisig](https://kamino.com/docs/curators/markets/transfer-to-multisig.md)

## Phase 2 · Reserve setup (per asset)

The bulk of curator work. Repeat for each token you want to list. Each reserve has its own LTV, liquidation threshold, IR curve, oracle config, capacity caps, fees, and farm wiring; risk decisions are made here, per asset.

**1. Add the reserve**

Submit `add-asset-to-market` with a reserve config JSON for the asset's mint. The reserve account is created on-chain with its initial parameters.

→ [Add a reserve](https://kamino.com/docs/curators/markets/adding-reserves.md)

**2. Configure the oracle**

Wire the reserve to a Scope price feed and set TWAP and staleness guards.

→ [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)

**3. Set risk parameters**

LTV, liquidation threshold, borrow factor, IR curve, deposit and borrow caps, liquidation bonus min/max.

→ [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md)

**4. Set withdrawal caps (optional)**

Per-interval flow limits on the reserve. Useful for newly-listed assets and regulated tokens.

→ [Withdrawal caps](https://kamino.com/docs/curators/markets/withdrawal-caps.md)

**5. Wire farms and rewards**

Most curators set up at least a collateral farm at launch to attract depositors. Debt farms are optional, used to subsidize borrowing.

→ [Farms & rewards](https://kamino.com/docs/curators/markets/farms-and-rewards.md)

**6. Make it a fixed rate reserve (optional)**

For lending venues that offer fixed-rate / fixed-term debt: set `debt_term_seconds`, `host_fixed_interest_rate_bps`, and the early-repay penalty on the reserve, and the rollover windows on the market.

→ [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md)

## Phase 3 · Optional features

Features that toggle on top of a market. Most curators leave them off by default; enable per the use case.

| Feature | When it makes sense |
| - | - |
| [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) | Tuning beyond defaults — close factor, value caps, pause flags. Most curators take defaults |
| [Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md) | Reserves expected to run at high utilization, or institutional vaults sitting on top |
| [Borrow orders](https://kamino.com/docs/curators/markets/borrow-orders.md) | Peer-to-peer fixed-rate matching between borrowers and lenders |
| [Obligation orders](https://kamino.com/docs/curators/markets/obligation-orders.md) | Letting users set their own price-triggered self-deleverage rules |
| [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md) | Niche: markets where you specifically want a margin-call grace window before liquidations open up |
| [Elevation groups (eMode)](https://kamino.com/docs/curators/markets/elevation-groups.md) | Niche: correlated-asset clusters where higher LTV is appropriate |
| [Permissioned markets](https://kamino.com/docs/curators/markets/permissioned-markets.md) | Gated venues — KYC'd depositor base, accredited-investor restrictions, app-internal markets |

A minimal market (one reserve, defaults across the board, no advanced features) is fully functional. Reach for these only when there's a use case.

## Phase 4 · Operate

After the market is live, the recurring operations:

| Cadence | Action |
| - | - |
| Daily / weekly | Monitor utilization, oracle health, liquidations, fee accrual |
| Weekly / monthly | Adjust deposit and borrow caps as TVL grows |
| As needed | Update IR curve, add a new reserve, enable a new feature, rotate the multisig signer set |
| Quarterly | Withdraw protocol fees |
| Incident | Pause the market via `borrow_disabled` or `emergency_mode`; run socialize-loss if a position becomes irrecoverable |

Every change after the multisig transfer goes through a Squads proposal subject to the configured timelock.

→ [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) · [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md) · [Withdrawing protocol fees](https://kamino.com/docs/curators/markets/protocol-fees)

## What's mandatory before deposits can happen

Phase 1 + at least one reserve fully through Phase 2:

| Requirement | Where it's set |
| - | - |
| Market account exists | `create-market` |
| At least one reserve added | `add-asset-to-market` |
| Reserve has a working Scope oracle | Reserve config `tokenInfo` |
| Reserve `status = 0` (Active) | Reserve config `status` |
| Reserve `depositLimit > 0` | Reserve config |
| Reserve `borrowLimit > 0` (if borrows allowed) | Reserve config |
| Owner is the wallet (or multisig) you intend to operate from | `update-lending-market-owner` |

Multisig ownership transfer is not strictly enforced by the program. It is the production prerequisite Kamino recommends before any external user touches the market.

## Where the work happens

| Surface | Use it for |
| - | - |
| `kamino-manager` CLI | All market and reserve creation, configuration, and updates |
| [Squads](https://squads.so) | Multisig proposal creation, signing, execution |
| Solana Explorer | Verifying transactions, inspecting account state |
| `manage.kamino.com` | Vault-side curator UI (for vaults sitting on top of your market) |
| `app.kamino.com` | Public-facing UI for users (markets surface here only after listing in Kamino's resources file) |

## Continue

> **[Quickstart](https://kamino.com/docs/curators/markets/quickstart.md)**
>
> Stand up a working market on staging in \~10 minutes.

> **[Create a market](https://kamino.com/docs/curators/markets/creating-a-market.md)**
>
> The single CLI command and what it does on-chain.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.