> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Depeg Risk

> How depegging risk is evaluated for stablecoins, liquid staking tokens, and wrapped assets

A depeg event occurs when a pegged asset's price becomes substantially detached from its intended peg. A stablecoin that should trade at \$1.00 drops to \$0.90. A liquid staking token that should track the SOL stake rate trades at a persistent discount. A wrapped token that should be redeemable 1:1 for the underlying asset loses that guarantee.

Depeg risk is particularly consequential for Kamino because of how the protocol handles pegged asset pairs.

## Why Depeg Risk is Elevated on Kamino

Kamino's [E-Mode mechanism](https://kamino.com/docs/risk/safeguards/e-mode-caps.md) allows higher loan-to-value ratios for pegged asset pairs. For example, a position borrowing USDT against USDC collateral can achieve a much higher LTV than a position borrowing USDC against SOL — because two USD stablecoins are expected to maintain their pegs and therefore have minimal relative price movement.

This design is economically efficient under normal conditions. But if a depeg occurs, these high-LTV positions are at elevated liquidation risk. The margin between collateral value and liquidation threshold is thin by design — a depeg erodes that margin quickly.

A 5% depeg on a standard cross-margin position with 75% LTV leaves substantial buffer. The same 5% depeg on an E-Mode position with 95% LTV may immediately breach the liquidation threshold.

## Asset Types Affected

### USD Stablecoins

Stablecoins like USDC, USDT, and PYUSD maintain their peg through reserve backing — each token is redeemable for \$1.00 worth of reserves (cash, treasuries, or equivalent). Depeg risk arises when:

* **Reserve adequacy is questioned.** If the market suspects that reserves are insufficient to redeem all outstanding tokens, confidence drops and the token trades below \$1.00.
* **Counterparty failure.** If the entity holding reserves experiences financial distress — as when USDC depegged to \$0.90 in March 2023 after Silicon Valley Bank's collapse exposed \$3.3B of Circle's reserves — the token can depeg rapidly.
* **Regulatory action.** Freezing or seizing reserves can impair redeemability.

### Liquid Staking Tokens

LSTs like JitoSOL, mSOL, and bSOL are pegged to SOL via the stake rate — the ratio of SOL staked to LST tokens minted. Depeg can occur from:

* **Market liquidity imbalances.** Large sell orders on DEXes can temporarily push the market price below the theoretical stake-rate price. This is a market depeg — the underlying backing is intact.
* **Smart contract exploits.** If the staking vault is compromised and SOL is drained, the stake rate itself drops. This is a fundamental depeg — the backing is genuinely impaired.
* **Unstaking delays.** Solana staking has epoch-based delays (\~2 days). During volatile periods, the inability to instantly redeem LSTs for SOL can cause market price dislocations.

Kamino mitigates market depegs for LSTs through [stake-rate oracle pricing](https://kamino.com/docs/security/oracles/lst-oracles.md) — the protocol values LSTs at their stake rate, not their market price. This eliminates liquidations triggered by temporary market noise but does not protect against fundamental depegs caused by smart contract exploits.

### Wrapped and Bridged Tokens

Wrapped tokens (e.g., bridged assets from Ethereum) maintain their peg through the bridge contract — each wrapped token is backed by a locked token on the source chain. Bridge exploits (e.g., Wormhole's \$320M exploit in 2022) can break this peg entirely, as wrapped tokens become unbacked.

## Causes of Depeg Events

| Cause | Mechanism | Severity |
| - | - | - |
| **Reserve depletion** | Issuer's reserves are insufficient to honor redemptions | High — can be permanent |
| **Smart contract exploit** | Backing assets drained from vault or bridge | Critical — instant and total |
| **Counterparty insolvency** | Entity managing reserves fails | High — recovery uncertain |
| **Confidence crisis** | Market participants sell preemptively, even if reserves are adequate | Medium — typically temporary |
| **Liquidity imbalance** | Large sell order in thin DEX pool | Low — temporary, arbitrageurs restore |

## How Kamino Evaluates Depeg Risk

The assessment considers:

### Reserve Backing Quality

For stablecoins: What are the reserves composed of? Cash and short-duration treasuries are lower risk than commercial paper, crypto-backed reserves, or algorithmic mechanisms. How frequently are reserves attested? Are attestations from independent third parties?

For LSTs: What is the stake pool structure? How many validators? Is the smart contract audited and battle-tested?

### Smart Contract Exposure

Does the peg mechanism depend on a smart contract? Has that contract been audited? How much value has it secured? A stablecoin backed by reserves in a traditional bank has different (lower) smart contract risk than an LST backed by a Solana staking vault, which in turn has different risk than an algorithmic stablecoin backed entirely by code.

### Historical Stability

Has the asset depegged before? How severe was the depeg? How quickly did it recover? USDC's March 2023 depeg to \$0.90 — caused by external banking sector stress, not a protocol failure — recovered within 48 hours after the Fed backstopped SVB. This suggests robust recovery mechanisms. An asset that has experienced a fundamental depeg (backing drained) and not fully recovered presents much higher ongoing risk.

### Arbitrage and Redemption Mechanisms

How quickly can the peg be restored? Direct redemption mechanisms (e.g., redeeming USDC for \$1.00 from Circle) provide a hard floor. LSTs can be unstaked for SOL at the stake rate, providing an arbitrage mechanism. Tokens without direct redemption mechanisms rely entirely on market forces to maintain the peg — which may fail under stress.

## How Depeg Risk Maps to Parameters

| Depeg Risk | Protocol Response |
| - | - |
| **Low** (strong reserves, audited, battle-tested, direct redemption) | E-Mode eligible, higher LTV for pegged pairs |
| **Medium** (adequate reserves, limited history, indirect redemption) | Lower E-Mode LTV, tighter caps |
| **High** (unproven reserves, new contract, no direct redemption) | No E-Mode eligibility, standard LTV, potential isolation |

## Mitigation Mechanisms

* **[LST stake-rate oracles](https://kamino.com/docs/security/oracles/lst-oracles.md):** Remove market depeg liquidation risk for liquid staking tokens
* **[Price bands](https://kamino.com/docs/security/oracles/price-protection.md#price-bands):** Reject stablecoin prices outside expected range, preventing flash-crash exploits
* **[E-Mode caps](https://kamino.com/docs/risk/safeguards/e-mode-caps.md):** Limit total exposure in high-LTV pegged-pair positions
* **Supply caps:** Bound total protocol exposure to any single pegged asset
* **Active monitoring:** Continuous tracking of peg stability, reserve attestations, and on-chain redemption activity

Depeg risk is reassessed whenever a material event occurs — a reserve attestation reveals composition changes, a smart contract exploit affects a related protocol, or market conditions produce sustained price deviation from the peg.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.