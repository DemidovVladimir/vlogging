> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Liquidity

> Automated concentrated liquidity vaults for Solana DEX pools

Automated liquidity vaults were Kamino's first product, launched in August 2022, and remain the leading LP primitive on Solana.

> [!WARNING]
>
> Providing liquidity involves [impermanent loss](https://kamino.com/docs/products/liquidity/concepts.md#impermanent-loss) — the difference in value between holding assets vs. providing them as liquidity. This is a structural consequence of how AMMs work and affects all LP positions. See [Concepts](https://kamino.com/docs/products/liquidity/concepts.md) for a full explanation before depositing.

> **[Features](https://kamino.com/docs/products/liquidity/features.md)**
>
> How auto-swap, auto-compound, and auto-rebalance work

> **[Concepts](https://kamino.com/docs/products/liquidity/concepts.md)**
>
> AMMs, concentrated liquidity, impermanent loss, and kTokens explained

## How yield is earned

When a Kamino Liquidity Vault deploys capital into a CLMM pool, it earns trading fees proportional to its share of pool liquidity within the active price range. Any trade that passes through the pool incurs a fee distributed to liquidity providers. Additionally, many pools distribute reward tokens to liquidity providers — Kamino collects and compounds these automatically.

Yield depends on trading volume in the pool and whether the vault's position is in range. An out-of-range position earns no fees until it is rebalanced.

## kTokens

[kTokens](https://kamino.com/docs/products/liquidity/concepts.md#ktokens) are the fungible SPL token receipts issued when depositing into a Kamino liquidity vault. The exchange rate between kTokens and the underlying assets increases as fees and rewards are compounded back into the position.

## Concentrated liquidity

[Concentrated liquidity](https://kamino.com/docs/products/liquidity/concepts.md#concentrated-liquidity) allows liquidity providers to concentrate capital within a specific price range rather than spreading it uniformly across all prices. This makes capital far more efficient — earning more fees per dollar deployed — but requires active management to keep positions in range as prices move. Kamino's automation solves this management burden.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.