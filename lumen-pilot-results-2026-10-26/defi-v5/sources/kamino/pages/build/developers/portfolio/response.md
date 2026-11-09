> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Kamino Portfolio Data

> Query Portfolio API response fields across all seven Kamino products

The portfolio response returns a top level object with a timestamp, a `sections` object that reports indexing status and freshness for each product, and one array for each product section. Each position is returned already valued, with its own value and price included.

> [!TIP]
>
> Run the endpoints live in the API playground: [portfolio](https://kamino.com/docs/build/api-reference/portfolio/portfolio-source-data.md) and [pending rewards](https://kamino.com/docs/build/api-reference/portfolio/portfolio-rewards.md).

## Parameters

| Parameter | In | Required | Description |
| - | - | - | - |
| `pubkey` | path | Yes | Wallet address (base58). |
| `programId` | query | No | KLend program ID to scope results. |

## Response object

| Field | Type | Description |
| - | - | - |
| `timestamp` | string | ISO timestamp of the response. |
| `sections` | object | Indexing status and freshness per product. See [Section state](#shared-building-blocks). |
| `lending` `multiply` `leverage` | array | Borrow-side obligations (see the **Position fields** tabs). |
| `liquidity` `earn` `privateCredit` `staking` | array | The remaining product positions. |

## Position fields by product

**Lending, Multiply & Leverage**

One entry per obligation. The `tag` field distinguishes the kind (`Vanilla`, `Multiply`, and so on). Multiply and leverage entries add `depositMint` and `borrowMint`.

| Field | Type | Description |
| - | - | - |
| `obligation` | string | Obligation pubkey. |
| `market` | string | Lending market pubkey. |
| `tag` | string | Obligation kind (`Vanilla`, `Multiply`, …). |
| `netValue` | string | USD net value (deposits minus borrows). |
| `totalDepositValue` | string | USD value of all deposits. |
| `totalBorrowValue` | string | USD value of all borrows. |
| `ltv` | string | Current loan-to-value (for example `"0.38"`). |
| `maxLtv` | string | Maximum borrowing LTV. |
| `liquidationLtv` | string | LTV at which liquidation triggers. |
| `leverage` | string | Position leverage (for example `"1.56"`). |
| `deposits` | array | Deposited assets ([Token object](#shared-building-blocks)). |
| `borrows` | array | Borrowed assets ([Token object](#shared-building-blocks)). |
| `depositMint` | string | Multiply and leverage only: collateral mint. |
| `borrowMint` | string | Multiply and leverage only: debt mint. |

**Liquidity**

| Field | Type | Description |
| - | - | - |
| `strategy` | string | Strategy pubkey. |
| `shareMint` | string | Share token mint. |
| `shares` | string | Share balance. |
| `netValue` | string | USD value of the position. |
| `tokenA` | object | First pool token ([Token object](#shared-building-blocks)). |
| `tokenB` | object | Second pool token ([Token object](#shared-building-blocks)). |

**Earn & Private Credit**

| Field | Type | Description |
| - | - | - |
| `vault` | string | Vault pubkey. |
| `tokenMint` | string | Deposit token mint. |
| `symbol` | string | Token symbol. |
| `name` | string | Vault name (for example `Steakhouse USDC`). |
| `netValue` | string | USD value of the position. |
| `shares` | string | Vault shares held. |
| `amount` | string | Underlying token amount. |

**Staking**

| Field | Type | Description |
| - | - | - |
| `mint` | string | Staked token mint. |
| `symbol` | string | Token symbol. |
| `farm` | string | Farm pubkey. |
| `amount` | string | Staked amount. |
| `value` | string | USD value. |
| `price` | string | Token price. |

## Shared building blocks

> **Token object (deposits, borrows, tokenA, tokenB)**
>
> Entries in `deposits`, `borrows`, and the liquidity `tokenA` / `tokenB` share a common shape, with a few context-specific extras.
>
> | Field | Type | Description |
> | - | - | - |
> | `mint` | string | Token mint. |
> | `symbol` | string | Token symbol. |
> | `amount` | string | Token amount. |
> | `value` | string | USD value. |
> | `price` | string | Token price. |
> | `reserve` | string | Reserve pubkey (deposits and borrows). |
> | `maxLtv` | string | Deposits only: collateral max LTV. |
> | `liquidationLtv` | string | Deposits only: collateral liquidation LTV. |
> | `borrowFactor` | string | Borrows only: borrow factor. |

> **Section state (sections object)**
>
> Each product key in `sections` reports whether the wallet has data and how fresh it is. A section with `indexed: false` has no data for this wallet.
>
> | Field | Type | Description |
> | - | - | - |
> | `indexed` | boolean | `false` means no data for this wallet and product. |
> | `positionsRefreshedOn` | string \| null | ISO timestamp positions were last refreshed. |
> | `pricesRefreshedOn` | string \| null | ISO timestamp prices were last refreshed. |
> | `errors` | array | Errors encountered while loading this section. |

## Pending rewards

`GET /portfolio/{pubkey}/rewards` returns pending farm rewards across products: a `timestamp` and a `farms` array. Each farm entry lists its pending `rewards`.

| Field | Type | Description |
| - | - | - |
| `farm` | string | Farm pubkey. |
| `userState` | string | User state pubkey. |
| `delegatee` | string | Wallet pubkey. |
| `positionType` | string | Human-readable source (for example `Borrow Markets`). |
| `activeStakeAmount` | string | Active staked amount. |
| `tokenMints` | array | Associated token mints. |
| `rewards` | array | Pending rewards (see below). |

> **Reward entry fields**
>
> | Field | Type | Description |
> | - | - | - |
> | `mint` | string | Reward token mint. |
> | `amount` | string | Pending amount. |
> | `index` | number | Reward index. |
> | `type` | number | Reward type. |
> | `tokenProgram` | string | Token program of the reward mint. |

## Examples

**Step 1**

### Calculate LTV and liquidation headroom for each lending position

Compare `ltv` against `liquidationLtv` to measure how close a position is to liquidation.

```typescript icon="typescript" lendingPositions theme={null}
const WALLET = 'YOUR_WALLET_ADDRESS';
const API = 'https://api.kamino.finance';

const portfolio = await (await fetch(`${API}/portfolio/${WALLET}`)).json();

(portfolio.lending || []).forEach((pos, i) => {
  const ltvPct = (parseFloat(pos.ltv) * 100).toFixed(2);
  const liqPct = (parseFloat(pos.liquidationLtv) * 100).toFixed(2);
  const headroom = ((parseFloat(pos.liquidationLtv) - parseFloat(pos.ltv)) * 100).toFixed(2);

  console.log(`\n--- Lending position ${i + 1} (${pos.tag}) ---`);
  console.log(`  Net value: $${parseFloat(pos.netValue).toFixed(2)}`);
  console.log(`  LTV:       ${ltvPct}% (liq ${liqPct}%)`);
  console.log(`  Headroom:  ${headroom}% before liquidation`);
});
```

**Step 2**

### List earn vault positions with shares and USD value

```typescript icon="typescript" earnPositions theme={null}
const portfolio = await (await fetch(`${API}/portfolio/${WALLET}`)).json();

(portfolio.earn || []).forEach((pos) => {
  console.log({
    vault: pos.vault,
    name: pos.name,
    symbol: pos.symbol,
    shares: pos.shares,
    amount: parseFloat(pos.amount).toFixed(6),
    netValueUsd: '$' + parseFloat(pos.netValue).toFixed(4),
  });
});
```

**Step 3**

### Check which product sections are stale or failed to load

Use `sections` to decide whether positions are stale or a product failed to load.

```typescript icon="typescript" sectionFreshness theme={null}
const portfolio = await (await fetch(`${API}/portfolio/${WALLET}`)).json();
const now = Date.now();

Object.entries(portfolio.sections).forEach(([name, sec]) => {
  if (!sec.indexed) return console.log(`${name}: not indexed`);

  const age = (ts) => (ts ? ((now - new Date(ts).getTime()) / 60_000).toFixed(1) + 'm ago' : 'never');
  const errors = sec.errors.length ? ` ⚠ ${sec.errors.length} error(s)` : '';

  console.log(`${name}: positions ${age(sec.positionsRefreshedOn)}, prices ${age(sec.pricesRefreshedOn)}${errors}`);
});
```

**Step 4**

### List pending farm rewards across all products

```typescript icon="typescript" pendingRewards theme={null}
const rewards = await (await fetch(`${API}/portfolio/${WALLET}/rewards?rewardTypes=0,1,2,3`)).json();
const farms = rewards.farms || [];

console.log(`Pending rewards across ${farms.length} farm(s):`);

farms.forEach((f) => {
  console.log(`\n  Farm: ${f.farm} (${f.positionType})`);
  (f.rewards || []).forEach((r) => console.log(`    ${r.amount} (mint ${r.mint}, type ${r.type})`));
});
```

**Step 5**

### Sum total portfolio value and break it down per product

Sum `netValue` from each section (and `value` for staking) for a portfolio total, then break it down per product.

```typescript icon="typescript" totalValue theme={null}
const portfolio = await (await fetch(`${API}/portfolio/${WALLET}`)).json();

const products = ['lending', 'multiply', 'leverage', 'liquidity', 'earn', 'privateCredit', 'staking'];

let totalValue = 0;
const breakdown = [];

products.forEach((p) => {
  const positions = portfolio[p] || [];
  const value = positions.reduce((sum, pos) => sum + parseFloat((p === 'staking' ? pos.value : pos.netValue) || '0'), 0);
  totalValue += value;
  if (positions.length) breakdown.push({ product: p, value, count: positions.length });
});

console.log(`Total portfolio value: $${totalValue.toFixed(2)}`);
breakdown
  .sort((a, b) => b.value - a.value)
  .forEach((b) => console.log(`  ${b.product}: $${b.value.toFixed(2)} (${b.count} position(s))`));
```

## Calculate portfolio totals

The API returns valued positions but no portfolio-wide rollups, so you compose them:

* **Net worth:** sum `netValue` across every section, except **staking**, which exposes `value` instead. Multiply and leverage `netValue` is already deposits minus borrows, so totals reflect real equity.
* **USD conversion:** positions carry `value` and `price`, but for any raw amounts you price yourself, use the [Oracle prices](https://kamino.com/docs/build/developers/oracle/data/prices.md) endpoint.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.