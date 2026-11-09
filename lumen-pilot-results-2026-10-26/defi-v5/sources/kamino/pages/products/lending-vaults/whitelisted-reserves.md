> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Whitelisted Reserves

> Protocol-level restriction on which reserves a vault can allocate to

## What are Whitelisted Reserves?

Whitelisted Reserves is a smart contract-level restriction that ensures a vault's funds can only be allocated into reserves that Kamino has explicitly verified. Any attempt to allocate into a non-whitelisted reserve is rejected by the smart contract, regardless of who signs the transaction.

All vaults on Kamino's UI have Whitelisted Reserves enabled, and this is a requirement for any vault to be featured on the Kamino interface.

## How it works

Whitelisted Reserves enforces two independent on-chain restrictions:

| Restriction | What it does |
| - | - |
| **Allocation control** | A curator cannot create or increase allocations to any reserve outside the whitelist |
| **Investment control** | Depositor funds cannot flow into any unvetted reserve via the vault |

Both restrictions are enforced at the smart contract level. Both are **irreversible** once activated — they cannot be turned off by the curator or anyone else.

Kamino maintains the whitelist at the protocol level. Curators can activate Whitelisted Reserves on their vault and manage allocations within it, but they have no control over the whitelist itself.

## What it protects against

In a scenario where a curator's keys are compromised, the attacker could gain operational control of the vault. Without whitelisting, the attacker could redirect funds to a malicious or unvetted market and drain the vault's liquidity.

With Whitelisted Reserves, that attack path is closed. The smart contract rejects any allocation or investment into a reserve that Kamino has not explicitly whitelisted — even with full admin access, there is no path to drain funds into a fraudulent market.

This is **protocol-level security**, not operational security. The constraint is enforced by the smart contract itself, independent of the curator's key management practices or multisig configuration.

## Withdrawals

Withdrawals are always permitted, regardless of whitelist status. Curators can de-allocate from any reserve at any time. Depositors are free to enter or exit vaults at any time, subject to available liquidity.

## What depositors see

All vaults on Kamino's UI have Whitelisted Reserves enabled. This means:

| Guarantee | Description |
| - | - |
| Restricted allocation | The vault can only deploy capital into Kamino-verified reserves |
| Immutable setting | The restriction cannot be reversed, even by the vault admin |
| Protocol enforcement | The constraint is enforced at the smart contract level, not by policy |

> [!NOTE]
>
> Whitelisted Reserves is a security feature, not a guarantee of returns. A vault with whitelisting enabled is protected against allocation into fraudulent markets, but the whitelisted reserves themselves still carry normal lending risks (utilization, bad debt, liquidity).

## Vault security

Kamino's Vaults smart contract has undergone extensive security review since its launch in early 2025, including 6 external audits, formal verification, and on-chain verification. All reports are available on the [Security](https://kamino.com/docs/security.md) page.

Whitelisted Reserves is a significant step beyond smart contract security — it adds a layered risk mitigation that protects depositors even in scenarios where operational keys are compromised.

Every vault on Kamino's frontend has Whitelisted Reserves activated today, including all major curators — Sentora, Gauntlet, Steakhouse, Allez, Rockaway, and more.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.