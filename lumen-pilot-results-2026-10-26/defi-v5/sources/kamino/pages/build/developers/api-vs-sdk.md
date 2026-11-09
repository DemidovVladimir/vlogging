> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# API vs SDK vs Rust Crate

> Access data and build transactions through the API, the TypeScript SDK, or the Rust interface crate

## Overview

Kamino provides three integration options:

| Option | Description |
| - | - |
| REST API | HTTPS endpoints for data, analytics, and unsigned transactions. Language-agnostic. |
| TypeScript SDK | On-chain state reads and transaction building. TS/JS only. |
| Rust Interface Crate | Lightweight instruction builder for Rust clients, bots, and on-chain CPI. |

## Core Differences

Comparison of API, SDK, and Rust crate capabilities.

| Capability | REST API | TypeScript SDK | Rust Interface Crate |
| - | - | - | - |
| Data queries (vaults, reserves) | Ready-made endpoints | On-chain reads | On-chain reads (raw account parsing) |
| User position tracking | Rich endpoints | Real-time account lookup | Real-time account lookup |
| Historical metrics & charts | Built-in history endpoints | Not available | Not available |
| Transaction building (deposit, borrow) | Unsigned transaction endpoints | Instruction builders | Instruction builders |
| Vault creation | Not supported | Admin-level creation tools | Not supported |
| On-chain CPI | Not applicable | Not applicable | Direct CPI from Solana programs |
| Language/runtime | Any (via HTTP) | TypeScript/JavaScript only | Rust (client-side or on-chain) |

## Data & Analytics

Retrieve vault, market, and historical performance data.

> **Historical Performance**
>
> **REST API**
>
> Fetch historical APY data for lending market reserves.
>
> ```typescript theme={null}
> const options = {method: 'GET'};
> fetch('https://api.kamino.finance/kamino-market/{market-id}/rates/history', options)
>   .then(response => response.json())
>   .then(response => console.log(response))
>   .catch(err => console.error(err));
> ```
>
> **TypeScript SDK**
>
> No history tracking. Developers must persist snapshots manually if needed.

## On-Chain Transactions

Build and execute deposit, borrow, repay, and withdraw operations.

> **Deposit Liquidity**
>
> **REST API**\\
>
> Get unsigned Solana transactions to deposit liquidity into a Kamino Lend market reserve. Returns transaction that must be signed client-side.
>
> ```typescript theme={null}
> const depositRequest = {
>   wallet: 'YOUR_WALLET_ADDRESS',
>   market: 'DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek',
>   reserve: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
>   amount: '1.0', // 1 USDC (decimal format, not lamports)
> };
>
> const res = await fetch('https://api.kamino.finance/ktx/klend/deposit', {
>   method: 'POST',
>   headers: { 'Content-Type': 'application/json' },
>   body: JSON.stringify(depositRequest),
> });
>
> const { transaction } = await res.json();
> // Sign and send transaction client-side
> ```
>
> **TypeScript SDK**\\
>
> Build and execute deposit transactions directly on-chain.
>
> ```typescript theme={null}
> import { KaminoMarket, KaminoAction, VanillaObligation, PROGRAM_ID } from '@kamino-finance/klend-sdk';
> import { createSolanaRpc, address } from '@solana/kit';
> import BN from 'bn.js';
>
> const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
> const market = await KaminoMarket.load(
>   rpc,
>   address('DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek'),
>   100
> );
>
> const depositAction = await KaminoAction.buildDepositTxns(
>   market,
>   new BN(1_000_000), // 1 USDC
>   address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
>   signer,
>   new VanillaObligation(PROGRAM_ID),
>   true
> );
> // Build, sign, and send transaction
> ```
>
> **Rust Interface Crate**\\
>
> Build deposit instructions from a Rust client. Ideal for bots and backend services.
>
> ```rust theme={null}
> use klend_interface::{helpers, pda, ReserveInfo, KLEND_PROGRAM_ID};
> use spl_associated_token_account::get_associated_token_address;
>
> let reserve = ReserveInfo::from_account_data(reserve_pubkey, &reserve_data.data)?;
> let user_source_liquidity = get_associated_token_address(&owner, &reserve.liquidity_mint);
> let (collateral_mint, _) = pda::reserve_collateral_mint(&KLEND_PROGRAM_ID, &reserve_pubkey);
> let user_destination_collateral = get_associated_token_address(&owner, &collateral_mint);
>
> let instructions = helpers::deposit::deposit(
>     owner,
>     &reserve,
>     user_source_liquidity,
>     user_destination_collateral,
>     1_000_000, // 1 USDC (6 decimals)
> );
> // Build and send transaction
> ```

> **Deposit into an Earn Vault**
>
> **TypeScript SDK**\\
>
> Build a vault deposit with the SDK.
>
> ```typescript theme={null}
> import { KaminoManager, KaminoVault, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
> import { createSolanaRpc, address } from '@solana/kit';
> import { Decimal } from 'decimal.js';
>
> const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
> const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
> const manager = new KaminoManager(rpc, slotDuration);
> const vault = new KaminoVault(rpc, address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), slotDuration); // USDC vault
>
> const vaultState = await vault.getState();
> const bundle = await vault.depositIxs(
>   signer,
>   new Decimal(1.0),
>   await manager.loadVaultReserves(vaultState),
>   await manager.loadVaultFarmState(vaultState),
>   null
> );
> ```
>
> **Rust Interface Crate**\\
>
> Build a vault deposit with the [`kvault-interface`](https://crates.io/crates/kvault-interface) crate. The helper derives the PDAs and per-reserve remaining accounts from the on-chain vault state.
>
> ```rust theme={null}
> use kvault_interface::{helpers, pda, VaultInfo, KVAULT_PROGRAM_ID};
> use spl_associated_token_account::get_associated_token_address;
>
> let vault = VaultInfo::from_account_data(vault_pubkey, &vault_data.data, &reserve_infos)?;
>
> let user_token_ata = get_associated_token_address(&owner, &vault.token_mint);
> let (shares_mint, _) = pda::shares_mint(&KVAULT_PROGRAM_ID, &vault_pubkey);
> let user_shares_ata = get_associated_token_address(&owner, &shares_mint);
>
> let instruction = helpers::deposit::deposit(
>     &vault,
>     owner,
>     user_token_ata,
>     user_shares_ata,
>     1_000_000, // 1 USDC (6 decimals)
> );
> // Build and send transaction
> ```

> **Borrow & Repay**
>
> **REST API**\\
>
> Get unsigned transactions for borrow and repay operations.
>
> ```typescript theme={null}
> // Borrow
> const borrowRequest = {
>   wallet: 'YOUR_WALLET_ADDRESS',
>   market: '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF',
>   reserve: 'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59',
>   amount: '1.0',
> };
>
> const borrowRes = await fetch('https://api.kamino.finance/ktx/klend/borrow', {
>   method: 'POST',
>   headers: { 'Content-Type': 'application/json' },
>   body: JSON.stringify(borrowRequest),
> });
>
> // Repay
> const repayRequest = {
>   wallet: 'YOUR_WALLET_ADDRESS',
>   market: '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF',
>   reserve: 'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59',
>   amount: '1.0',
> };
>
> const repayRes = await fetch('https://api.kamino.finance/ktx/klend/repay', {
>   method: 'POST',
>   headers: { 'Content-Type': 'application/json' },
>   body: JSON.stringify(repayRequest),
> });
> ```
>
> **TypeScript SDK** \\
>
> Build borrow and repay transactions directly.
>
> ```typescript theme={null}
> import { KaminoAction, VanillaObligation, PROGRAM_ID } from '@kamino-finance/klend-sdk';
> import BN from 'bn.js';
>
> const borrowAction = await KaminoAction.buildBorrowTxns(
>   market,
>   new BN(1_000_000),
>   tokenMint,
>   signer,
>   new VanillaObligation(PROGRAM_ID),
>   true,
>   undefined,
>   1_000_000,
>   true,
>   false
> );
> ```
>
> **Rust Interface Crate**\\
>
> Build borrow instructions using `ObligationContext` which handles reserve refresh automatically.
>
> ```rust theme={null}
> use klend_interface::{ObligationContext, pda, KLEND_PROGRAM_ID};
> use spl_associated_token_account::get_associated_token_address;
>
> // Build context from on-chain obligation + its reserves
> let ctx = ObligationContext::from_account_data(
>     obligation_pubkey, &obligation_data.data, &reserves
> )?;
>
> let user_dest_liquidity = get_associated_token_address(&owner, &borrow_mint);
> let instructions = ctx.borrow(
>     owner,
>     &reserve_pubkey,
>     user_dest_liquidity,
>     1_000_000, // 1 USDC (6 decimals)
> )?;
> // Build and send transaction
> ```

> **Vault Creation**
>
> **TypeScript SDK**\\
>
> ```typescript theme={null}
> const { vault: vaultSigner, initVaultIxs: instructions } =
>   await kaminoManager.createVaultIxs(kaminoVaultConfig);
> ```

## Recommended Usage Patterns

Choose the right tool for your use case.

| Use Case | Best Tool |
| - | - |
| Display vault list with APR & TVL | API |
| Chart vault APY over 30 days | API |
| Fetch a user's historical rewards | API |
| Build transactions for client signing | API |
| Execute transactions with full customization | SDK |
| Create a new liquidity vault | SDK |
| Build in non-JS backend (e.g. Python) | API |
| Require zero rate limits | SDK with private RPC |
| Build a Rust bot | Rust Crate |
| CPI from an on-chain Solana program | Rust Crate |

## Summary

Use the Kamino REST API for fast data integration, history tracking, and building unsigned transactions across any backend. Use the TypeScript SDK for advanced transaction composition, simulation, and vault creation with full on-chain control. Use the Rust interface crate for Rust-native clients, high-performance bots, and CPI from on-chain Solana programs.

## Relevant links

> **[API Documentation](https://api-docs.kamino.com/)**
>
> Explore REST API endpoints and response schemas

> **[SDK Documentation](https://github.com/Kamino-Finance/klend-sdk)**
>
> Learn how to integrate the TypeScript SDK

> **[Lending Rust Crate](https://crates.io/crates/klend-interface)**
>
> Lightweight Rust instruction builder for Kamino Lending clients and CPI

> **[Vaults Rust Crate](https://crates.io/crates/kvault-interface)**
>
> Lightweight Rust instruction builder for Kamino Vaults clients and CPI

> **[Borrow Operations](https://kamino.com/docs/build/developers/borrow/operations/deposit.md)**
>
> Step-by-step guides for deposit, withdraw, borrow, and repay

> **[Earn Operations](https://kamino.com/docs/build/developers/earn/operations/deposit.md)**
>
> Step-by-step guides for vault deposit and withdraw

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples)**
>
> View code examples in the GitHub repository


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.