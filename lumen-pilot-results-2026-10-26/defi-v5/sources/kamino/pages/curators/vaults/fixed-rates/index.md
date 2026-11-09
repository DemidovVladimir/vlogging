> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fixed Rates

> Allocating vault capital into fixed-rate reserves — the FR-specific guide for curators

Fixed-rate reserves are a distinct reserve type within Kamino lending markets. Each reserve has a constant borrow rate and a fixed term (e.g. `USDC 5.5% 3M`) and exists alongside the floating-rate reserve for the same debt token.

Curators have **two ways to allocate** into a fixed-rate reserve:

* **Direct (Standard) allocation** — capital is committed into the reserve immediately. Visible liquidity, available for direct borrows from the moment it lands.
* **Conditional allocation** — capital stays in floating-rate reserves earning variable yield, and is atomically moved into the fixed-rate reserve only when borrow demand arrives.

Both are valid. Conditional is the capital-efficient default for most fixed-rate exposure; direct allocation is the right call when you want capital visibly committed and immediately available, or when you're seeding a reserve where bootstrapping liquidity matters more than yield optimisation.

Borrow demand reaches the reserve through two paths: a **direct borrow** (an instant atomic transaction against available reserve liquidity, just like any normal borrow) or a **borrow order** (a standing on-chain intent that fills when matching liquidity arrives). Both consume the same reserve liquidity — your allocation responds to either path.

## Read in this order

> **[Concepts](https://kamino.com/docs/curators/vaults/fixed-rates/concepts.md)**
>
> The rate grid, term premium, and how borrowers consume fixed-rate liquidity.

> **[Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md)**
>
> Standard vs. Conditional in the FR context, fill mechanics, and priority.

> **[Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md)**
>
> Step-by-step UI / SDK / CLI walkthrough for adding an FR allocation.

> **[Lifecycle](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md)**
>
> What your capital experiences from fill through term, rollover, repayment, post-maturity liquidation, and exits via the withdrawal queue.

> **[Strategy](https://kamino.com/docs/curators/vaults/fixed-rates/strategy.md)**
>
> Postures, sizing, monitoring, and a worked \$100M vault example.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.