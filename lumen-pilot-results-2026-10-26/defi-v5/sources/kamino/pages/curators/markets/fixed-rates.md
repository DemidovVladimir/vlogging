> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fixed Rates

> Creating and configuring fixed-rate reserves and the market-level settings that govern them

Fixed-rate reserves are a distinct reserve type within a Kamino lending market. Each fixed-rate reserve has a constant borrow rate and a fixed term (e.g. `USDC 5.5% 3M`) and exists alongside the floating-rate reserve for the same debt token. This section is for **market managers** — the curators who create reserves, set rates and terms, configure rollover and liquidation windows, and decide when fixed-rate features go live on a market.

For the allocator-side view (curators allocating capital into fixed-rate reserves), see [Fixed Rates (Vaults)](https://kamino.com/docs/curators/vaults/fixed-rates.md).

## Read in this order

> **[Reserve Configuration](https://kamino.com/docs/curators/markets/fixed-rates/reserve-configuration.md)**
>
> Anatomy of a fixed-rate reserve, the four fields that pin rate and term, and how to create one via CLI.

> **[Market Settings](https://kamino.com/docs/curators/markets/fixed-rates/market-settings.md)**
>
> Feature flags, rollover windows, the post-maturity liquidation throttle, and the recommended enablement sequence.

> **[Lifecycle Operations](https://kamino.com/docs/curators/markets/fixed-rates/lifecycle-operations.md)**
>
> Updating an existing reserve, what can and cannot be changed, soft and hard sunsetting, and operational notes.

> **[Risk Considerations](https://kamino.com/docs/curators/markets/fixed-rates/risk.md)**
>
> Risks specific to running fixed-rate reserves and how to set parameters that mitigate them.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.