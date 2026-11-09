> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Smart Contract Risk

> How the code quality and security posture of listed tokens' underlying contracts are evaluated

Many tokens listed on Kamino derive their value from an underlying smart contract. A liquid staking token like JitoSOL depends on the Jito staking vault contract. A wrapped token depends on the bridge contract. A vault token depends on the vault's accounting logic. If that underlying contract is exploited, the token's value can drop to zero — regardless of market conditions.

Smart contract risk evaluates the probability and potential impact of such an exploit. It is one of the most consequential dimensions of the [asset risk framework](https://kamino.com/docs/risk/asset-risk), because a smart contract failure can cause total loss of value — not a gradual decline, but an immediate collapse.

## Why This Matters for a Lending Protocol

When Kamino accepts a token as collateral, it is implicitly trusting the smart contract that backs that token. If the contract is exploited and the token's value drops to zero, every loan collateralized by that token becomes undercollateralized instantly. Liquidators cannot execute profitably because there is no market for a worthless token. The result is bad debt — socialized among lenders.

This is not theoretical. Smart contract exploits have caused billions in losses across DeFi:

* **Euler Finance (2023):** \$197M drained via a flash loan exploit in the lending contract itself
* **Mango Markets (2022):** \$114M drained via oracle manipulation combined with thin liquidity
* **Wormhole (2022):** \$320M drained from the bridge contract, affecting all wrapped tokens

Each of these events would have caused catastrophic bad debt on any lending protocol that listed the affected tokens as collateral without adequate risk controls.

## Evaluation Criteria

### Audit History

Has the token's underlying contract been audited? How many times? By which firms? The assessment distinguishes between:

* **Multiple audits by reputable firms:** Highest confidence. Different auditors catch different classes of bugs. Multiple independent reviews significantly reduce the probability of undetected critical vulnerabilities.
* **Single audit by a reputable firm:** Good baseline, but a single auditor may have blind spots.
* **No audit or audit by unknown firms:** Significantly elevated risk. The contract may contain undiscovered vulnerabilities.

The assessment also considers the scope of the audit — a full-scope audit of the entire codebase is more valuable than a narrow review of a single module.

### Open Source

Is the contract's source code publicly verifiable? Open-source contracts benefit from community review — thousands of developers and security researchers can inspect the code, report issues, and contribute to security. Closed-source contracts require trusting the development team exclusively.

For tokens that depend on verified on-chain bytecode, the assessment checks whether the deployed bytecode matches the published source code (verifiable builds).

### Immutability vs. Upgradability

* **Immutable contracts** cannot be changed after deployment. Once audited, the security properties are permanent — but bugs cannot be fixed either.
* **Upgradable contracts** (via proxy patterns or multisig authority) can be modified. This allows bug fixes, but also introduces risk: the upgrade authority can change the contract's behavior, potentially draining funds.

The assessment evaluates the upgrade mechanism: Who holds the upgrade authority? Is it a multisig? How many signers are required? Is there a timelock? A 5-of-9 multisig with a 48-hour timelock is substantially lower risk than a single-signer upgrade authority with no delay.

### Battle-Testing

How long has the contract been live on mainnet? How much value has it secured over that period? A contract that has held \$500M for two years without incident provides stronger evidence of security than one deployed last month, even if both have been audited.

Battle-testing is not a substitute for auditing — it is complementary. Audits catch bugs before deployment; battle-testing reveals whether any bugs were missed in production conditions. The longer a contract operates under real economic conditions without exploit, the higher the confidence in its security.

### Bug Bounty

Does the project operate an active bug bounty program? Bug bounties create an ongoing economic incentive for white-hat security researchers to find and report vulnerabilities rather than exploit them.

The assessment considers:

* **Bounty size:** A \$1M bounty attracts more research attention than a \$10K bounty
* **Scope:** Does the bounty cover the specific contracts that back the token?
* **Program maturity:** How long has the bounty been active? Has it paid out?

## Risk Mitigation for High-Risk Tokens

Tokens that score poorly on smart contract risk are not necessarily excluded from Kamino. They can still be listed, but with strict risk controls:

### Supply Caps

Total protocol exposure to any single token is limited by supply caps. If a token's underlying contract is exploited, losses are bounded by the cap amount — not the total protocol TVL.

### Isolation Modes

High smart contract risk tokens can be restricted to [isolated collateral](https://kamino.com/docs/risk/asset-risk#isolated-collateral) mode. A position using isolated collateral is ring-fenced: problems with that token's contract cannot cascade into other positions or affect the broader protocol.

### Conservative LTV

Tokens with elevated smart contract risk receive lower Max LTV limits. This creates a larger buffer between the collateral value and the liquidation threshold, providing more time and margin for liquidations to execute if the token's value begins to decline due to a partial exploit or loss of confidence.

## The Assessment in Practice

A well-established token like SOL scores highly on smart contract risk: the Solana runtime is battle-tested across years, the token is native (no underlying contract dependency), and the validator ecosystem is mature.

A newer liquid staking token might score moderately: it has been audited by one or two firms, it is open source, but it has only been live for six months and has a relatively small bug bounty. This token would likely receive a moderate Max LTV with supply caps, or be placed in isolated mode until its battle-testing track record improves.

A vault token from an unaudited protocol with a single-signer upgrade authority would score poorly: the underlying contract risk is unacceptably high. This token would either not be listed or be restricted to isolated mode with very conservative parameters.

Smart contract risk is reassessed when material events occur — if a listed token's underlying protocol suffers an exploit on another chain, or if audit findings on a related codebase raise concerns, the assessment is updated and parameters may be tightened.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.