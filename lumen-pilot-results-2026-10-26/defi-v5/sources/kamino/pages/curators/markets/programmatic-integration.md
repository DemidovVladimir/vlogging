> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Programmatic Integration

> Where to go for SDK, API, and direct RPC integration with a Kamino market

Curator markets expose the same on-chain primitives as every other Kamino market. Anything you can do with the public Kamino API or SDK against the main markets, you can do against your curator market by passing your market address.

This page is a routing index: it points to the existing developer documentation that covers each integration surface in depth.

## Building deposit / borrow / repay / withdraw transactions

For an app that lets users deposit, borrow, repay, or withdraw on your market:

> **[Borrow developer docs](https://kamino.com/docs/build/developers/borrow/index.md)**
>
> Overview of operations, data, rewards, position management

> **[Borrow tutorials](https://kamino.com/docs/build/tutorials/borrow/deposit-and-borrow.md)**
>
> Step-by-step walkthroughs of common operations

> **[Borrow API recipes](https://kamino.com/docs/build/recipes/borrow/deposit-via-api.md)**
>
> REST-API-only patterns, no SDK

> **[Borrow API reference](https://kamino.com/docs/build/api-reference/borrow/market-data/markets-list.md)**
>
> OpenAPI reference for every Borrow endpoint

Each of these works against any klend market — pass your market address as the `--market` parameter (CLI), the `marketPubkey` argument (SDK), or the `market` URL parameter (API).

## Reading market and reserve data

For dashboards, alerts, and read-only integrations:

> **[Read market data](https://kamino.com/docs/curators/markets/market-data.md)**
>
> The curator's view: API + SDK + RPC examples for market state

> **[API reference (market data endpoints)](https://kamino.com/docs/build/api-reference/borrow/market-data/markets-list.md)**
>
> Full OpenAPI reference

## Earn / vault integration on top of your market

If a vault sits on top of your market and you want to integrate the vault layer:

> **[Earn developer docs](https://kamino.com/docs/build/developers/earn/index.md)**
>
> Vault data and operations

> **[Earn tutorials](https://kamino.com/docs/build/tutorials/earn/earn-and-withdraw.md)**
>
> Vault deposit / withdraw walkthroughs

## Rewards and farms

For computing APYs, claiming rewards, building reward dashboards:

> **[Rewards tutorials](https://kamino.com/docs/build/tutorials/borrow/calculate-reserve-reward-apy.md)**
>
> Calculate reserve reward APY, claim rewards

> **[Rewards API reference](https://kamino.com/docs/build/api-reference/borrow/rewards/rewards-list.md)**
>
> REST endpoints for active rewards and user claimables

> **[Farms & rewards (curator side)](https://kamino.com/docs/curators/markets/farms-and-rewards.md)**
>
> How a curator initializes and operates farms

## Curator-specific tooling

These surfaces are specific to curator workflows (separate from end-user app integrations):

> **[kamino-manager CLI](https://kamino.com/docs/build/cli/index.md)**
>
> All curator operations: create market, add reserves, update configs, propose multisig transactions

> **[CLI command index](https://kamino.com/docs/curators/markets/cli-command-index.md)**
>
> Quick lookup of every market-related command

## Program-level integration

For a custom program (Anchor / native) that interacts with your market on-chain:

| Resource | Use for |
| - | - |
| [klend repository](https://github.com/Kamino-Finance/klend) | Program source, IDL, Rust types, error definitions |
| [klend-sdk repository](https://github.com/Kamino-Finance/klend-sdk) | TypeScript bindings + helper utilities + the kamino-manager CLI |
| [KFarms repository](https://github.com/Kamino-Finance/kfarms) | Farms program source |
| [farms-sdk repository](https://github.com/Kamino-Finance/farms-sdk) | TypeScript bindings for farms |
| [Program addresses](https://kamino.com/docs/build/resources/program-addresses.md) | All Kamino program IDs (mainnet + staging + devnet) |

## Reference

* [Read market data](https://kamino.com/docs/curators/markets/market-data.md) — read examples
* [CLI command index](https://kamino.com/docs/curators/markets/cli-command-index.md) — every market-related CLI command
* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — every editable reserve field
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — every editable market field


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.