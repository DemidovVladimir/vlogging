> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Curator Markets

> Deploy and operate isolated lending markets on Kamino

A Kamino market is a deployable, isolated instance of the Kamino lending program (klend). You own it, you configure its reserves, you set its risk parameters, you choose its oracles, you transfer it to a multisig, and you run it.

Each market is independent. Liquidations, interest accrual, and risk surface all stay inside its boundaries — a position in your market has no exposure to any other Kamino market.

<video aria-label="Kamino curators markets landing page" poster="/docs/images/curators/markets/markets-landing-light-poster.jpg" autoPlay loop muted playsInline>
  <source src="https://mintcdn.com/kamino-3d73a151/haghBe_kakXD8Wdp/videos/curators/markets/markets-landing-light.mp4?fit=max&auto=format&n=haghBe_kakXD8Wdp&q=85&s=b2260ae61440f7fe166bd35b00385751" type="video/mp4" />

  ![Kamino curators markets landing page](https://mintcdn.com/kamino-3d73a151/MXDfwKWrBd8H1KRf/images/curators/markets/markets-landing-light-poster.jpg?fit=max\&auto=format\&n=MXDfwKWrBd8H1KRf\&q=85\&s=687786a6a1225239ce0a781ad370994d)
</video>

## Anatomy of a market

A Kamino market is composed of three layers.

The **`LendingMarket`** is the top-level account you own. It holds the configuration that applies across the market: name, owner, emergency flags, the elevation-group definitions, the close-factor and other liquidation tunables, the cosigner authority for permissioning. Every reserve underneath it inherits these settings.

A **reserve** is a per-asset lending pool listed inside the market. Each reserve sets its own LTV, liquidation threshold, borrow factor, IR curve, oracle config, and deposit/borrow capacity. A market holds one reserve per token; a market that lists USDC, USDT, SOL, mSOL, and JLP has five reserves.

A **`KaminoVault`** is an optional layer that sits on top. A vault accepts a single deposit token, routes capital across one or more reserves according to allocation weights, and issues a single receipt token to depositors. Vaults exist outside the market account itself; deploy a vault when your depositors should see a single-token deposit UX, with allocation across reserves handled automatically.

## Who deploys a market

> **Institutions**
>
> Run a lending venue with risk parameters, asset selection, and oracle configuration tuned to your mandate. Transfer ownership to a multisig and operate via signed proposals.

> **Asset issuers**
>
> Scale on-chain usage of your token by listing it as collateral or debt with parameters you control. Supports SPL Token and SPL Token-2022, including transfer hooks for permissioned tokens.

> **Fintechs**
>
> Deploy a market for the assets your app supports, surface it in your own UI, and offload program correctness, oracle integrity, and liquidator economics to klend.

> **Curators with a thesis**
>
> Run a market expressing a specific view on assets, leverage, and risk. Add reserves selectively, tune the IR curves, layer farms for incentives.

## What you control

| Surface | Examples |
| - | - |
| Asset selection | Which reserves exist, mint program (SPL Token or Token-2022), transfer hook compatibility |
| Risk parameters | LTV, liquidation threshold, borrow factor, deposit and borrow caps, IR curve |
| Oracle configuration | Scope, TWAP guards, staleness limits, price heuristic bands |
| Liquidation behavior | Close factor, max debt liquidatable per tx, bonus min/max, bad-debt bonus |
| Optional features | Withdrawal queue, borrow orders, obligation orders, eMode groups, permissioning, fixed rate reserves |
| Incentives | Collateral and debt farms per reserve, reward emissions |
| Governance | Owner pubkey (single key or multisig), emergency council, immutability |
| Operations | Updating reserves, pausing the market, withdrawing protocol fees, transferring obligations |

## What klend gives you

| Layer | Provided by klend |
| - | - |
| Program correctness | Audited Anchor program with formal verification and fuzzing |
| Interest accrual | Per-reserve compound interest, host-fixed rate optional |
| Liquidator economy | Permissionless liquidations across all markets sharing the program |
| Oracle plumbing | Scope aggregator, multi-source TWAP, staleness checks |
| Risk safeguards | Auto-deleverage, daily withdrawal caps, eMode |
| Composability | Any wallet, vault, or program can integrate with the on-chain market accounts |

## Market vs. vault

Both are curator-deployed. The decision tree:

| You want to... | Deploy a... |
| - | - |
| Create a new lending venue with your own reserve set and risk model | Market |
| List an asset that doesn't exist on any market today | Market (with that reserve) |
| Run a strategy that allocates capital across reserves on existing markets | Vault |
| Wrap your strategy in a single-token deposit / receipt-token withdraw UX | Vault on top of one or more markets |
| Provide gated access to a curated set of reserves for your users | Vault (Whitelisted Reserves feature) |

A vault on top of a market is a common composition. The market does the lending mechanics; the vault does the depositor UX, allocation logic, and fee collection.

See the [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md) guide for vault-specific documentation.

## Where to go next

> **[Lifecycle overview](https://kamino.com/docs/curators/markets/lifecycle.md)**
>
> The full path from create → operate → migrate, in one page.

> **[Quickstart](https://kamino.com/docs/curators/markets/quickstart.md)**
>
> Stand up a working market on staging in \~10 minutes.

> **[Create a market](https://kamino.com/docs/curators/markets/creating-a-market.md)**
>
> The single CLI command and what it does on-chain.

> **[Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md)**
>
> How to choose LTV, thresholds, IR curves, and caps for a new asset.

> **[Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md)**
>
> FIFO redemption when reserves are fully utilized.

> **[Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md)**
>
> Maturity-based debt, host fixed rate, rollover windows, early-repay penalties.

> [!NOTE]
>
> All market creation and configuration runs through the Kamino Manager CLI (`kamino-manager`). The web app at [manage.kamino.com](https://manage.kamino.com) is for managing existing vaults; market deployment is CLI-driven and signed via a [Squads](https://squads.so) multisig in production.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.