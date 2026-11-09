> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Kamino Portfolio API

> Fetch a wallet's entire Kamino footprint across lending, multiply, leverage, liquidity, earn, private credit, and staking

The Portfolio API returns a wallet's positions across **every Kamino product in one call**: lending, multiply, leverage, liquidity, earn, private credit, and staking. It's the single request a dashboard makes to paint the whole picture, plus a companion endpoint for pending farm rewards.

> [!NOTE]
>
> **Source data, composed by you.** Positions arrive already valued (each carries `value`/`price`), but portfolio-wide totals, net worth, and PnL are intentionally left to client composition, so you build exactly the rollups your app needs. See [Calculate portfolio totals](https://kamino.com/docs/build/developers/portfolio/response.md#calculate-portfolio-totals).

> [!NOTE]
>
> **No API key required.** All Portfolio endpoints are public on `https://api.kamino.finance`.

## Endpoints

| Method | Endpoint | Returns |
| - | - | - |
| `GET` | `/portfolio/{pubkey}` | All positions across the seven product sections |
| `GET` | `/portfolio/{pubkey}/rewards` | Pending farm rewards across all products |

See the full field reference in [Portfolio response](https://kamino.com/docs/build/developers/portfolio/response.md).

## What you can build

* **Portfolio dashboards:** render every position a wallet holds across Kamino from one request.
* **Liquidation and health monitors:** read `ltv` against `liquidationLtv` on lending, multiply, and leverage positions to alert before liquidation.
* **Net-worth and PnL tools:** sum `netValue` across sections and convert to USD with the [Oracle prices](https://kamino.com/docs/build/developers/oracle/data/prices.md) endpoint.
* **Reward trackers:** surface pending farm rewards across lending, borrowing, and liquidity in one view.

## Quickstart

Fetch a wallet's full portfolio and count positions per product.

```typescript theme={null}
const WALLET = 'YOUR_WALLET_ADDRESS'; // replace with your wallet pubkey
const API = 'https://api.kamino.finance';

const portfolio = await (await fetch(`${API}/portfolio/${WALLET}`)).json();

console.log('Timestamp:', portfolio.timestamp);

const products = ['lending', 'multiply', 'leverage', 'liquidity', 'earn', 'privateCredit', 'staking'] as const;
products.forEach((p) => console.log(`  ${p}: ${(portfolio[p] || []).length} position(s)`));
```

> [!NOTE]
>
> Numeric fields are returned as **strings** (for example `"0.38"`, `"100.05"`). Parse them with `parseFloat` before doing math.

## Next steps

> **[Portfolio response](https://kamino.com/docs/build/developers/portfolio/response.md)**
>
> Full field reference for every product section, plus runnable examples.

> **[API reference](https://kamino.com/docs/build/api-reference/portfolio/portfolio-source-data.md)**
>
> The raw OpenAPI spec for both Portfolio endpoints.

> **[Oracle prices](https://kamino.com/docs/build/developers/oracle/data/prices.md)**
>
> Convert position amounts to USD when composing totals.

> **[Rewards](https://kamino.com/docs/build/developers/portfolio/response.md#pending-rewards)**
>
> Read and aggregate pending farm rewards across products.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.