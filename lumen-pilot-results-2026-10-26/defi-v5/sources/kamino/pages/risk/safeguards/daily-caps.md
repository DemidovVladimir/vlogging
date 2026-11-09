> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Daily Caps

> How daily flow limits prevent outsized position buildup and bound potential damage from exploits

Daily caps limit the rate at which assets can flow in and out of the protocol within a 24-hour window. They serve two critical purposes: bounding the potential damage from oracle exploits, and preventing outsized positions from building up faster than the risk framework can monitor.

## Two Cap Types

Each asset reserve on Kamino has two daily caps:

### New Debt Cap

The maximum **net new borrowing** of an asset within a 24-hour period. This limits how quickly debt exposure can accumulate.

If an attacker discovers an oracle vulnerability, the new debt cap bounds the maximum amount they can borrow before the exploit is detected and patched. Without daily caps, an attacker could borrow the entire supply in a single transaction.

### Collateral Withdrawal Cap

The maximum **net collateral outflow** within a 24-hour period. This limits how quickly deposited collateral can leave the system.

This prevents a scenario where an attacker (or a panicking whale) drains collateral from the protocol faster than the system can respond — whether through legitimate withdrawals or exploit-driven extraction.

## Net Flow Mechanics

Daily caps measure **net flows**, not gross flows. This is an important distinction:

**Example:** In a 24-hour window:

* \$10M USDC is borrowed by various users
* \$8M USDC is repaid by other users
* **Net new debt = \$2M**

The net approach prevents legitimate market activity from being unnecessarily restricted. Normal borrowing and repayment can continue at high volumes as long as the net change stays within the cap. Only genuine one-directional accumulation triggers the limit.

Similarly, for collateral:

* \$5M SOL is deposited by new users
* \$3M SOL is withdrawn by existing users
* **Net collateral outflow = \$0** (net inflow of \$2M)

Inflows do not consume cap capacity — the caps only limit net outflows.

## Protection Against Oracle Exploits

Oracle exploits are among the most damaging attack vectors in DeFi lending. A successful oracle manipulation can allow an attacker to:

1. Artificially inflate the value of worthless collateral
2. Borrow large amounts of valuable tokens against the inflated collateral
3. Withdraw the borrowed tokens before the manipulation is detected

Without daily caps, the attacker's potential gain is limited only by the total supply in the protocol. **With daily caps, the maximum damage is bounded by the daily cap amount** — regardless of how severe the oracle manipulation is.

This turns a potentially protocol-ending exploit into a bounded loss that can be detected, investigated, and remediated.

### In Practice: Step Finance Incident (2026)

Daily caps proved their value in a real-world incident when the [Step Finance treasury was compromised via social engineering](https://x.com/StepFinance_/status/2018379876642804213). The attacker gained access to Step's multisig and began draining assets — including a large vSOL position held on Kamino.

Kamino's daily withdrawal caps stopped the attacker from extracting the full vSOL balance. Once the daily cap was reached, no further withdrawals were possible regardless of the attacker's access. The cap bought time for the incident to be detected and for response measures to be taken — limiting the total damage to the capped amount rather than the full position.

This is exactly the scenario daily caps are designed for: an external compromise (not a Kamino vulnerability) where an unauthorized party attempts to rapidly drain assets. The cap converted what could have been a complete loss into a bounded one.

## Protection Against Outsized Positions

Large positions — whether legitimate or malicious — introduce systemic risk. A single borrower with a \$100M position in a market with \$200M total supply represents 50% concentration risk. If that position becomes unhealthy, liquidating it requires finding buyers for \$100M of collateral — which may exceed available market depth.

Daily caps prevent such positions from appearing overnight. An outsized position can only be built over multiple days, giving the risk monitoring system time to:

* Detect the accumulating concentration
* Assess the impact on protocol health metrics
* Adjust parameters (caps, LTV, borrow factors) if the accumulation creates risk
* Alert the Risk Council if intervention is needed

This temporal buffer is critical. Without daily caps, a sophisticated actor could build a dangerously large position in a single block — before any monitoring system could react.

## Supply and Borrow Caps

Separate from daily caps, Kamino enforces **global supply and borrow caps** per reserve. These are absolute limits on total deposits and total outstanding debt for each asset:

| Cap Type | What It Limits | How It's Set |
| - | - | - |
| **Supply Cap** | Total amount of an asset that can be deposited as collateral | Based on on-chain liquidity — the cap ensures that the maximum collateral position is liquidatable |
| **Borrow Cap** | Total outstanding debt for an asset | Based on debt token liquidity and market depth |
| **Daily New Debt Cap** | Net new borrowing per 24 hours | Based on risk tolerance for oracle exploit damage |
| **Daily Withdrawal Cap** | Net collateral outflow per 24 hours | Based on liquidity reserve requirements |

Global caps limit total exposure; daily caps limit the rate of change. Together, they ensure that protocol exposure is bounded in both magnitude and velocity.

## How Caps Are Calibrated

Daily caps are set by the Risk Council based on:

* **On-chain liquidity depth:** Higher liquidity supports higher daily caps (larger positions can be absorbed by the market)
* **Oracle robustness:** Assets with multiple oracle providers and strong [price protection mechanisms](https://kamino.com/docs/security/oracles/price-protection.md) can have higher daily caps (exploitation is harder)
* **Market conditions:** During elevated volatility or reduced liquidity, daily caps may be temporarily lowered
* **Historical analysis:** [KRAF Dashboard](https://kamino.com/docs/risk/kraf-dashboard.md) data on typical daily flows informs cap calibration — caps should be high enough not to restrict normal activity, but low enough to meaningfully limit exploit damage

Caps are publicly visible in the Info & Risk section of each asset reserve page on the Kamino app.

## Interaction with Other Safeguards

Daily caps work in concert with other protocol safeguards:

* **[Auto-deleverage](https://kamino.com/docs/risk/safeguards/auto-deleverage.md):** If an asset's risk profile deteriorates, daily caps prevent rapid exposure buildup while the Risk Council evaluates whether to trigger auto-deleverage
* **[E-Mode caps](https://kamino.com/docs/risk/safeguards/e-mode-caps.md):** Per-pair borrow limits provide an additional granularity layer — even within the daily cap, E-Mode caps can restrict how much of a specific debt can be taken against a specific collateral
* **[Interest rate curves](https://kamino.com/docs/risk/safeguards/interest-rates.md):** As utilization increases (potentially approaching daily caps), interest rates spike to create economic disincentives for further borrowing


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.