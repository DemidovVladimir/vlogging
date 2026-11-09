> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fuzzing & Testing

> Automated fuzzing campaigns and verifiable builds for Kamino's smart contracts

Fuzzing discovers vulnerabilities by generating millions of random or semi-random inputs and verifying that the system behaves correctly under all of them. Unlike unit tests that validate known scenarios and formal verification that proves specific properties, fuzzing explores the unexpected — edge cases, race conditions, and interaction sequences that developers did not anticipate.

Fuzzing is particularly valuable for smart contracts, where the combinatorial space of possible transaction sequences is vast and the cost of an undiscovered bug is catastrophic.

## Ackee Blockchain Partnership

Kamino partnered with [Ackee Blockchain](https://ackee.xyz/) for an extensive fuzzing campaign on the core lending contracts. Ackee developed [Trident](https://github.com/Ackee-Blockchain/trident), a Rust-based fuzzing framework purpose-built for Solana programs, which they applied to Kamino Lend.

| Report | Date | Link |
| - | - | - |
| Ackee Blockchain Fuzz Tests — Kamino Lend | 22 September 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_ackee_blockchain_fuzz_tests.pdf) |

## Testing Methodology

The fuzzing campaign covered three distinct approaches:

### Instruction Handler Fuzzing

The fuzzer generates random sequences of Kamino Lend program instructions — deposits, withdrawals, borrows, repayments, liquidations — in arbitrary orders with arbitrary parameters. Each sequence is executed against the program, and the fuzzer checks whether the program panics, produces unexpected state, or violates any assertion.

This approach tests the program's robustness against inputs that no human tester would think to try. It catches issues like integer overflows, underflows, unhandled edge cases in account validation, and unexpected interactions between instructions.

### Invariant Testing

Beyond checking for crashes, invariant testing verifies that protocol-level properties hold after every instruction in every sequence. For Kamino Lend, invariants include:

* Reserve balances remain consistent with tracked deposits and borrows
* Collateral ratios are correctly computed after any operation
* Interest accrual does not produce negative values or overflow
* Liquidation eligibility is correctly determined regardless of prior operations

If any randomly generated sequence violates an invariant, the fuzzer captures the minimal reproduction case for debugging.

### Regression Detection

As the codebase evolves, fuzzing ensures that fixes and new features do not reintroduce previously resolved issues. The fuzzer maintains a corpus of interesting inputs from prior campaigns and re-runs them against new code versions to detect regressions.

## Campaign Results

The fuzzing campaign executed millions of instruction sequences over a months-long period. Results:

* **Zero insolvency risks identified** — no sequence of instructions could create a state where the protocol's liabilities exceeded its assets
* **Zero economic bugs** — no sequence could extract more value than deposited, bypass collateral requirements, or manipulate interest calculations
* **Integrated into ongoing development** — fuzzing is now a permanent part of Kamino's security stack, run continuously as part of the development and review process

## Verifiable Builds

A separate but related concern: how do users know that the program deployed on-chain is the same code that was audited? A compromised deployment pipeline could insert malicious code after auditing.

Verifiable builds solve this by cryptographically linking the deployed on-chain bytecode to the audited source code. Anyone can independently rebuild the program from source and verify that the hash matches the deployed program. If they don't match, the discrepancy is immediately detectable.

Kamino Lend, Vaults, and Farms are all verifiable builds. Verification is available on Solscan:

| Program | Solscan |
| - | - |
| Kamino Lend | [KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD](https://solscan.io/account/KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD) |
| Kamino Vaults | [kvauTFR8qm1dhniz6pYuBZkuene38GZMyALHMLo2EoP](https://solscan.io/account/kvauTFR8qm1dhniz6pYuBZkuene38GZMyALHMLo2EoP) |
| Kamino Farms | [FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr](https://solscan.io/account/FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr) |

This means the deployed code is not just audited — it is independently verifiable by anyone, at any time, without trusting Kamino's deployment process.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.