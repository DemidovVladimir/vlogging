> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Counterparty Risk

> How governance decentralization, holder concentration, and trust assumptions are evaluated

Counterparty risk is a qualitative governance evaluation — it asks how much trust is required in the entities that control a token's protocol, and what happens if that trust is violated.

A fully decentralized protocol with no admin keys requires zero trust in any single entity. A token controlled by a single company with a single-signer upgrade authority requires maximum trust. Most tokens fall somewhere in between. The counterparty risk assessment maps this spectrum to protocol parameters.

## Why Counterparty Risk Matters

A token's value can go to zero if the entity controlling it acts maliciously, becomes insolvent, or makes a catastrophic governance decision. Unlike smart contract risk (where the threat is a code bug) or market risk (where the threat is price volatility), counterparty risk is about human decisions and organizational integrity.

Historical examples:

* **Algorithmic stablecoin failures:** UST/LUNA collapsed in May 2022 when the algorithmic peg mechanism failed and governance could not respond quickly enough — erasing \$40B in value.
* **Centralized token rugs:** Tokens where a single entity controls minting or upgrade authority have been exploited when that entity acts maliciously or is compromised.
* **Governance attacks:** Protocols with concentrated token holdings have experienced hostile governance proposals that redirect treasury funds or modify critical parameters.

For a lending protocol, counterparty risk translates directly to collateral risk. If Kamino accepts a token as collateral and the governing entity behind that token acts in a way that destroys its value, every loan backed by that collateral is at risk of bad debt.

## Evaluation Dimensions

### Degree of Decentralization

The assessment maps each token's governance on a centralization spectrum:

| Level | Structure | Trust Required |
| - | - | - |
| **Fully decentralized** | No admin keys, immutable contracts, on-chain governance only | None |
| **DAO-governed** | Multisig or on-chain voting controls upgrades, timelock delays | Low — trust the governance process |
| **Multisig-controlled** | Small group (e.g., 3-of-5) holds upgrade/mint authority | Medium — trust the signers |
| **Single entity** | One company or individual controls key functions | High — trust that entity completely |

The key question is: *who can change the rules, and how quickly?* A 7-of-12 multisig with a 72-hour timelock provides meaningful protection — even if the multisig holders are compromised, the timelock gives the community time to react. A single-signer authority with no delay provides no protection at all.

### Number of Controlling Parties

Beyond the governance structure, the assessment considers how many independent parties participate in governance decisions. A 3-of-5 multisig where all 5 signers work at the same company is effectively single-entity control. A 3-of-5 multisig with signers from independent organizations is genuinely distributed.

### Token Holder Distribution

Concentrated token holdings create manipulation and dump risk:

* **Whale concentration:** If a small number of wallets hold a large percentage of the token supply, those wallets can influence price through large sales, or control governance through voting power.
* **Vesting and unlock schedules:** Large upcoming token unlocks can create selling pressure. The assessment considers how much of the total supply is locked, when unlocks occur, and whether unlock events could meaningfully affect liquidity.
* **Team and investor allocations:** What percentage of the supply is held by the founding team and early investors? Are there lockup restrictions?

A token where the top 10 wallets hold 80% of the circulating supply has fundamentally different counterparty risk than one where the top 10 wallets hold 15%.

### Entity Track Record

The assessment evaluates the reputation, track record, and regulatory standing of the entity or community governing the token:

* **Operating history:** How long has the entity been operating? Has it honored commitments?
* **Transparency:** Does it publish regular reports? Are its operations verifiable?
* **Regulatory standing:** Is the entity operating within applicable regulatory frameworks? Has it faced enforcement actions?
* **Incident response:** If past issues occurred, how were they handled? Prompt, transparent response builds confidence; silence or obfuscation reduces it.

## The Centralization Spectrum — Examples

### Low Counterparty Risk

A native blockchain token like SOL has minimal counterparty risk in the governance sense — there is no single entity that can mint new SOL, freeze accounts, or modify the token's behavior. Governance of the Solana network is distributed across thousands of validators. While the Solana Foundation has influence, it does not have unilateral control over the token.

Similarly, well-established stablecoins from regulated entities with public reserve attestations, multisig governance, and long operating histories score well on counterparty risk — the required trust is backed by institutional accountability.

### Medium Counterparty Risk

A liquid staking token from an established DeFi protocol with a well-structured multisig, public team, and 12+ months of operation represents moderate counterparty risk. The protocol team controls upgrades, but the multisig structure, timelock, and public accountability provide meaningful safeguards.

### High Counterparty Risk

A new token from an anonymous team with a single-signer upgrade authority, concentrated holdings, and no operating history represents high counterparty risk. Even if the smart contract is audited and the market liquidity is adequate, the governance structure means a single point of failure exists.

## How Counterparty Risk Maps to Parameters

Tokens with higher counterparty risk receive:

* **Lower Max LTV:** Larger buffer between collateral value and liquidation threshold, accounting for the possibility of sudden governance-related value loss
* **Higher Borrow Factors:** The protocol treats debt in high-counterparty-risk tokens as riskier than its face value
* **Supply and borrow caps:** Limit total protocol exposure to any single token with elevated counterparty risk
* **Potential isolation mode:** Tokens with the highest counterparty risk may be restricted to [isolated collateral](https://kamino.com/docs/risk/asset-risk#isolated-collateral) or [isolated debt](https://kamino.com/docs/risk/asset-risk#isolated-debt) mode, ring-fencing them from affecting other positions

## Ongoing Assessment

Counterparty risk is inherently dynamic. Governance structures change, team members leave, regulatory environments shift, and token distributions evolve over time. The risk framework monitors:

* Governance proposals and execution (particularly those affecting upgrade authority or minting)
* Changes in token holder distribution (whale accumulation or distribution events)
* Regulatory developments affecting listed token issuers
* Team and organizational changes at token-governing entities

Material changes trigger reassessment and potential parameter adjustments. A token that was low-risk at listing may become higher-risk if its governance becomes more centralized, or vice versa.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.