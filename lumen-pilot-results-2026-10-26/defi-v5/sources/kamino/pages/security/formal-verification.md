> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Formal Verification

> Mathematical proofs of correctness for Kamino's core smart contracts

Formal verification is fundamentally different from auditing. Where an audit is a human-driven review that checks for known vulnerability patterns, formal verification uses mathematical provers to exhaustively verify that specific properties hold for *all possible inputs and states* — not just the ones a human thinks to test. If a property is formally verified, it is mathematically guaranteed to hold.

Kamino has completed 4 formal verifications on its most critical contracts.

## Verified Contracts

| Component | Firm | Date | Link |
| - | - | - | - |
| Kamino Lend | OtterSec | 6 October 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_osec_formal_verification.pdf) |
| Kamino Earn Vaults | Certora | 27 June 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_certora.pdf) |
| Kamino Lend | Certora | 13 May 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_certora.pdf) |
| Kamino Limit Orders | Certora | 21 February 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_formal_verification_certora.pdf) |

## What Was Proved

For Kamino Lend, the Certora Prover used symbolic execution to verify two critical invariants:

### Reserve Solvency Invariant

The number of issued shares (cTokens representing depositor claims) must always be less than or equal to the number of underlying assets held by the reserve. This means the protocol cannot create claims on liquidity that doesn't exist. No sequence of transactions — deposits, withdrawals, borrows, repayments, liquidations, or any combination — can violate this property.

### Share Value Monotonicity

The ratio of liquidity to collateral supply must remain non-decreasing across all transactions. In practical terms: no user operation should ever decrease the value of a depositor's share. Interest accrues, share value goes up — but it should never go down as a result of protocol operations. This property ensures that depositors cannot be diluted by any transaction sequence.

## Zero Critical Vulnerabilities

Across all 4 formal verifications, no critical invariant violations were identified in the core lending, liquidation, or vault mechanics. The reserve solvency and share value invariants hold unconditionally.

## How Certora's Prover Works

The Certora Prover translates smart contract code into a mathematical model and then uses SMT (Satisfiability Modulo Theories) solvers to check whether any execution path can violate a specified property. Unlike testing, which checks specific inputs, the prover checks all possible inputs simultaneously. If the prover cannot find any counterexample, the property is proven to hold.

For Kamino, the properties were specified as invariants — conditions that must be true before and after every possible transaction. The prover then exhaustively searches for any transaction or sequence of transactions that could violate them.

[Read the full Certora blog post on Kamino Lend verification →](https://www.certora.com/blog/securing-kamino-lending)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.