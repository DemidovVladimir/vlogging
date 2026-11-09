> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Concepts

> Reserves, utilization, auto-compounding, curators, and bad debt — how Lending Vaults work under the hood

## What is a lending reserve

A reserve is a single-asset pool within a lending market. Capital deposited into a reserve is lent to borrowers; the interest borrowers pay is the source of all lender yield. There is no separate yield source — if borrowers aren't paying interest, lenders aren't earning.

Each asset has its own reserve because different assets carry different risk profiles and warrant different rates. USDC in the SOL/BTC Market is a different reserve from USDC in the JLP Market — different borrowers, different collateral, different rates.

Reserves exist for both lending models:

* **Variable-rate reserves** — one reserve per asset per market; rate fluctuates with utilization
* **Fixed-rate reserves** — one reserve per rate/duration pair (USDC at 5.0%/3-month is a separate reserve from USDC at 5.5%/6-month)

The reserve is the fundamental unit of both models.

***

## Utilization

Utilization is the fraction of a reserve's deposits currently borrowed:

```
Utilization = Borrowed / Total Deposited
```

This is the signal that drives variable borrow rates — and the key determinant of lender yield.

**Lender yield formula:**

```
Supply APY ≈ Borrow Rate × Utilization × (1 − Protocol Spread)
```

**Worked example:** \$1M pool, \$750k borrowed (75% utilization), 10% borrow rate, 15% protocol spread:

```
Interest generated: &#36;750,000 × 10% = &#36;75,000/year
After protocol spread: &#36;75,000 × 0.85 = &#36;63,750
Supply APY (distributed over &#36;1M): 63,750 / 1,000,000 = 6.375%
```

The idle \$250k earns nothing but sits in the denominator — this is why supply APY is always materially lower than the borrow rate.

**Why high utilization benefits lenders:** More of your capital is working. At 75% utilization you earn \~6.4%; at 50% utilization on the same pool and rates, you'd earn \~4.25%.

**Why extreme utilization is a problem:** At 95%+, very little capital is available for withdrawal. Kamino's rate curves are designed to prevent this — borrow rates escalate sharply above the kink point, pushing borrowers to repay and attracting new deposits.

***

## What a vault does

A Lending Vault is a capital allocator, not a lending pool itself. It holds your deposit and deploys that capital across multiple reserves according to the curator's strategy. You interact only with the vault; the vault handles everything underneath:

* Which reserves to allocate to and in what proportion
* When to rebalance (e.g., if a reserve's utilization drops sharply)
* When to pull back from a reserve showing stress

One deposit. One share balance. One blended yield. Allocation decisions happen entirely at the vault layer.

***

## Share price and auto-compounding

When you deposit, you receive vault shares. Your position is tracked by share count, not a fixed token balance.

```
Share Price = Total Vault Assets / Total Shares Outstanding
```

As interest accrues in the underlying reserves, total vault assets grow while shares outstanding stay fixed — so share price rises. Your share count never changes between deposit and withdrawal; what changes is what each share is worth.

This is auto-compounding. You don't receive periodic interest payments and manually reinvest them — your shares silently appreciate. Reinvestment is continuous and requires no action.

**Example:**

| Event | Share price | Your shares | Value |
| - | - | - | - |
| Deposit 1,000 USDC | \$1.00 | 1,000 | \$1,000 |
| 6 months at 9% APY | \$1.044 | 1,000 | \$1,044 |
| 12 months at 9% APY | \$1.090 | 1,000 | \$1,090 |

Withdrawing at any point redeems your shares at the current share price.

***

## Blended APY

Vault yield is the weighted average of the APYs earned across all active reserve allocations:

```
Vault APY = Σ (Reserve APY_i × Allocation_i)
```

**Example — a USDC vault with three allocations:**

| Reserve | Allocation | APY |
| - | - | - |
| USDC SOL/BTC Market | 60% | 8% |
| USDC JLP Market | 30% | 12% |
| Fixed Rate (3-month) | 10% | 6% |

```
Blended APY = (60% × 8%) + (30% × 12%) + (10% × 6%) = 9.0%
```

**What makes the blended APY move:**

* Utilization shifts in any underlying reserve
* Curator rebalancing capital between reserves
* Emission programs starting or ending
* Large new deposits or withdrawals

**What the displayed APY includes:** Base interest from borrowers + KMNO emissions when active.

**What it typically does NOT include:** Farm rewards (displayed separately), external partner incentives, points programs. A 9% APY with 3% from KMNO emissions is not the same as 9% paid entirely in USDC interest — the first embeds token price risk in the headline figure.

**APY vs. APR:** APY accounts for compounding; APR does not. Lending Vaults auto-compound, so the displayed figure is APY. At 2% per month, APR = 24% and APY = 26.8%. Always confirm which metric a platform displays before comparing.

***

## What curators do

The curator is the vault's active manager. They set and update allocation targets — which reserves to use, what proportion for each, when to rebalance. This requires ongoing monitoring and judgment, not a one-time configuration.

Active curators:

* Monitor utilization rates across reserves
* Move capital toward higher-yielding reserves as conditions change
* Pull back from reserves approaching extreme utilization or showing stress
* Adjust fixed-rate allocations based on available rate/duration opportunities

**[Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md):** Curators can lock their own capital into the vault via a dedicated Insurance Pool with a cooldown period (typically 30 days). This capital gives the curator direct financial exposure to their own allocation decisions — if the vault takes losses, the curator's locked position is at risk alongside depositors, and the cooldown prevents them from exiting before depositors can react.

A curator with meaningful capital locked in the Insurance Pool for 30+ days has direct financial skin in the game. This is the strongest alignment signal available.

***

## Bad debt

Bad debt occurs when a borrower's position is liquidated but the collateral proceeds are insufficient to cover the full debt. The shortfall is absorbed proportionally by lenders in that reserve — their share price is reduced to reflect the loss.

**Example:** A reserve has \$10M in deposits. A liquidation produces \$500k in bad debt. A lender with 5% of the reserve loses \$25k of effective value via share price reduction.

Kamino's track record: **\$0 bad debt across all protocol markets since launch.** This reflects conservative parameter-setting, the dynamic liquidation penalty design (which incentivizes early liquidation before positions go deeply underwater), and active monitoring.

> [!NOTE]
>
> Vaults where the curator has locked capital in an [Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md) provide a buffer: the curator has direct financial exposure to the vault's performance and cannot exit during the cooldown window.

***

## Variable vs. fixed reserves

A vault can allocate to both variable and fixed-rate reserves simultaneously.

| | Variable reserves | Fixed-rate reserves |
| - | - | - |
| Rate | Fluctuates with utilization | Locked for the term duration |
| When yield is earned | Continuous | Variable while waiting; fixed once matched to a borrower |
| Withdrawal | Anytime (subject to utilization) | Capital may be committed for the term |
| Best for | Flexible allocation, capturing rate spikes | Predictable yield on a portion of the portfolio |

The blended vault APY reflects both types. A vault with partial fixed allocation has more predictable yield on that portion. This mix is one tool curators use to manage yield volatility.

***

## Comparing yields across vaults

Headline APY numbers are not directly comparable without decomposing what they contain:

1. **Yield sources** — base interest vs. emissions vs. farm rewards. Emissions carry token price risk.
2. **Reserve concentration** — a vault heavy in one high-APY reserve takes more allocation risk than a distributed vault.
3. **Collateral in underlying reserves** — yield in markets accepting riskier collateral (e.g., JLP) is higher because the lending market accepts more risk. Higher yield reflects accepted risk, not a free lunch.
4. **Curator track record** — allocation decisions drive how the vault responds to rate changes and market conditions.

A 10% APY in organic USDC interest from a broadly distributed vault is a materially different product from a 12% APY concentrated in one high-utilization reserve with token emissions.

For stablecoin vaults specifically, the [Benchmark Rate](https://kamino.com/docs/products/lending-vaults/benchmark-rate.md) provides an objective baseline to compare against — a deposit-weighted average of yields across the largest DeFi lending protocols.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.