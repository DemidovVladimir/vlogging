> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Insurance Pool

> Curator-backed loss backstop that compensates depositors after vault losses

## What is the Insurance Pool?

The Insurance Pool is a mechanism where a vault curator locks their own capital into the vault as a **loss backstop**. If the vault incurs bad debt and losses are socialized, the curator's locked capital is used to make depositors whole — compensating them for the losses they incurred.

In simple terms: the curator puts their own money on the line. When things go wrong, depositors are compensated from the Insurance Pool after the fact.

## How it works

A curator deposits capital into the vault and receives vault shares (kTokens), just like any depositor. These shares are then staked into a dedicated Insurance Pool with a mandatory 30-day cooldown — during which the curator cannot withdraw.

**1. Curator deposits**

The curator deposits capital (e.g. USDC) into their own vault and receives vault shares.

**2. Shares are locked**

The shares are staked into the Insurance Pool with a mandatory 30-day cooldown.

**3. Capital serves as a backstop**

If the vault incurs bad debt, losses are socialized across the vault. The curator's Insurance Pool capital is then used to compensate affected depositors.

**4. Cooldown enforces commitment**

The curator cannot withdraw during the cooldown window, ensuring their capital remains available through adverse conditions.

## Why it matters

**Skin in the game with a real backstop.** The Insurance Pool financially aligns the curator with depositors:

* If the vault incurs bad debt, the curator's locked capital is used to compensate depositors after losses are socialized
* If the curator makes poor allocation decisions, **their capital is on the line**
* The cooldown prevents the curator from quietly exiting before depositors can react
* Accountability is enforced by code, not just promised

## What depositors see

Depositors can verify the following on-chain:

| Detail | Why it matters |
| - | - |
| Whether the vault has an Insurance Pool | Indicates the curator has committed capital as a loss backstop |
| How much capital is locked | A larger pool means more capacity to compensate depositors after a loss event |
| The cooldown period | The mandatory 30-day cooldown prevents the curator from exiting before depositors can react |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.