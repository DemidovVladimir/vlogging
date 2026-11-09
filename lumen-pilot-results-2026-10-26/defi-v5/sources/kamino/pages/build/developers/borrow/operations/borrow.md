> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrow

> Borrow assets against collateral

Borrow assets against your collateral in Kamino lending markets. The SDK handles transaction building, instruction creation, and obligation management for borrowing operations.

## Borrow

Borrow assets against your collateral.

**TypeScript**

**Step 1**

### Import Dependencies

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import BN from 'bn.js';
```

**Step 2**

### Load Market and Initialize RPC

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Load the Obligation

Load the wallet's borrow position so the SDK refreshes every reserve it uses.

```typescript theme={null}
const obligation = await market!.getObligationByWallet(signer.address, new VanillaObligation(PROGRAM_ID));

if (!obligation) {
  console.log('No borrow position found for', signer.address);
}
```

**Step 4**

### Build Borrow Instructions

Borrow USDT from its variable-rate reserve against the collateral in the position.

```typescript theme={null}
const usdtMint = address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const usdtReserve = market!.getExistingFloatRateReserveByMint(usdtMint);

const borrowAction = await KaminoAction.buildBorrowTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdtReserve.address,
  owner: signer,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!NOTE]
>
> The borrow must keep the position under its borrow limit, or the program rejects it. Fixed-rate loans go through borrow orders instead: see [Fixed-Rate Borrowing](https://kamino.com/docs/build/borrow/tutorials/fixed-rate-borrowing.md).

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(borrowAction), tx)
);
```

**Step 6**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Borrow successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The borrow is complete. The USDT is in the wallet and the debt is recorded in the borrow position.

**Rust**

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
klend-interface = "0.6.0"
solana-pubkey = "2.1"
solana-instruction = "2.1"
solana-sdk = "~2.3"
solana-client = "~2.3"
spl-token = "7"
spl-associated-token-account = "6"
```

> [!NOTE]
>
> `klend-interface` is a lightweight Rust instruction builder that creates `Vec<Instruction>` with required refresh instructions prepended automatically.

**Step 2**

### Set Up RPC Client

```rust theme={null}
use solana_client::rpc_client::RpcClient;
use solana_sdk::signer::keypair::read_keypair_file;
use solana_sdk::signer::Signer;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let signer = read_keypair_file("/path/to/your/keypair.json")
    .expect("Failed to read keypair file");
let owner = signer.pubkey();
```

**Step 3**

### Build Obligation Context

The obligation must already have deposited collateral before you can borrow.

```rust theme={null}
use klend_interface::ObligationContext;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let lending_market = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF").unwrap();
let borrow_reserve_pubkey = Pubkey::from_str("FBSyPnxtHKLBZ4UeeUyAnbtFuAmTHLtso9YtsqRDRWpM").unwrap();

// Derive the obligation PDA
let (obligation_pubkey, _) = pda::obligation(
    &KLEND_PROGRAM_ID, 0, 0, &owner, &lending_market,
    &Pubkey::default(), &Pubkey::default(),
);

// Fetch the obligation account
let obligation_data = rpc_client.get_account(&obligation_pubkey)?;

// Discover which reserves the obligation references
let reserve_addrs = ObligationContext::reserve_addresses_for_obligation(&obligation_data.data)?;

// Fetch all reserve accounts in one RPC call
let reserve_accounts = rpc_client.get_multiple_accounts(&reserve_addrs)?;

// Build the context
let reserves: Vec<(Pubkey, &[u8])> = reserve_addrs.iter()
    .zip(reserve_accounts.iter())
    .filter_map(|(addr, acc)| acc.as_ref().map(|a| (*addr, a.data.as_slice())))
    .collect();
let ctx = ObligationContext::from_account_data(
    obligation_pubkey, &obligation_data.data, &reserves
)?;
```

> [!WARNING]
>
> You must have an existing obligation with deposited collateral before you can borrow.

> [!NOTE]
>
> `ObligationContext` is the recommended approach for obligation-based operations. It fetches the obligation and its associated reserves, then provides convenient `.deposit()`, `.borrow()`, `.repay()`, and `.withdraw()` methods.

**Step 4**

### Derive Token Accounts

```rust theme={null}
use spl_associated_token_account::get_associated_token_address;

// User's ATA for the borrow token (e.g. USDT)
let borrow_liquidity_mint = Pubkey::from_str("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB").unwrap();
let user_dest_liquidity = get_associated_token_address(&owner, &borrow_liquidity_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
let instructions = ctx.borrow(
    owner,
    &borrow_reserve_pubkey,
    user_dest_liquidity,
    1_000_000, // 1 USDT (6 decimals)
)?;
// Returns: [refresh_reserves..., refresh_obligation, borrow_obligation_liquidity_v2]
```

**Step 6**

### Build and Send Transaction

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Borrow successful! Signature: {signature}");
```

> [!NOTE]
>
> Borrowing increases your debt and LTV ratio. Monitor your position to avoid liquidation risk.

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/borrow.rs)

**Rust (CPI)**

> [!NOTE]
>
> This example shows how an **on-chain Anchor program** can CPI into Kamino Lending using `klend-interface` instruction builders. A PDA authority owns the vaults and obligation, and signs all CPI calls via `invoke_signed`. The full flow: init obligation → deposit collateral (Token A) → borrow (Token B).

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
klend-interface = "0.6.0"
anchor-lang = "0.30"
anchor-spl = "0.30"
solana-program = "2.1"
```

**Step 2**

### Define PDA Authority and Handler

```rust theme={null}
use anchor_lang::prelude::*;
use klend_interface::{
    instructions::{borrow, deposit, obligation},
    pda as klend_pda,
    types::InitObligationArgs,
    KLEND_PROGRAM_ID,
};

declare_id!("YourProgram1111111111111111111111111111111111");

const AUTHORITY_SEED: &[u8] = b"authority";

#[program]
pub mod cpi_example {
    use super::*;

    pub fn deposit_and_borrow(
        ctx: Context<DepositAndBorrow>,
        deposit_amount: u64,
        borrow_amount: u64,
    ) -> Result<()> {
        let lending_market_key = ctx.accounts.lending_market.key();
        let authority_seeds: &[&[u8]] = &[
            AUTHORITY_SEED,
            lending_market_key.as_ref(),
            &[ctx.bumps.authority],
        ];
```

**Step 3**

### Init Obligation (skip if already initialized)

```rust theme={null}
        let init_ix = obligation::init_obligation(
            obligation::InitObligationAccounts {
                obligation_owner: ctx.accounts.authority.key(),
                fee_payer: ctx.accounts.payer.key(),
                obligation: ctx.accounts.obligation.key(),
                lending_market: ctx.accounts.lending_market.key(),
                seed1_account: ctx.accounts.system_program.key(),
                seed2_account: ctx.accounts.system_program.key(),
                owner_user_metadata: ctx.accounts.owner_user_metadata.key(),
            },
            InitObligationArgs { tag: 0, id: 0 },
        );

        solana_program::program::invoke_signed(
            &init_ix,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.obligation.to_account_info(),
                ctx.accounts.lending_market.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.owner_user_metadata.to_account_info(),
                ctx.accounts.rent.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[authority_seeds],
        )?;
```

**Step 4**

### Deposit Token A as Collateral

```rust theme={null}
        let deposit_ix =
            deposit::deposit_reserve_liquidity_and_obligation_collateral_v2(
                deposit::DepositReserveLiquidityAndObligationCollateralV2Accounts {
                    owner: ctx.accounts.authority.key(),
                    obligation: ctx.accounts.obligation.key(),
                    lending_market: ctx.accounts.lending_market.key(),
                    lending_market_authority: ctx.accounts.lending_market_authority.key(),
                    reserve: ctx.accounts.deposit_reserve.key(),
                    reserve_liquidity_mint: ctx.accounts.deposit_reserve_liquidity_mint.key(),
                    reserve_liquidity_supply: ctx.accounts.deposit_reserve_liquidity_supply.key(),
                    reserve_collateral_mint: ctx.accounts.deposit_reserve_collateral_mint.key(),
                    reserve_destination_deposit_collateral: ctx
                        .accounts
                        .deposit_reserve_collateral_supply
                        .key(),
                    user_source_liquidity: ctx.accounts.vault_a.key(),
                    placeholder_user_destination_collateral: None,
                    liquidity_token_program: ctx.accounts.token_program.key(),
                    obligation_farm_user_state: None,
                    reserve_farm_state: None,
                },
                deposit_amount,
            );

        solana_program::program::invoke_signed(
            &deposit_ix,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.obligation.to_account_info(),
                ctx.accounts.lending_market.to_account_info(),
                ctx.accounts.lending_market_authority.to_account_info(),
                ctx.accounts.deposit_reserve.to_account_info(),
                ctx.accounts.deposit_reserve_liquidity_mint.to_account_info(),
                ctx.accounts.deposit_reserve_liquidity_supply.to_account_info(),
                ctx.accounts.deposit_reserve_collateral_mint.to_account_info(),
                ctx.accounts.deposit_reserve_collateral_supply.to_account_info(),
                ctx.accounts.vault_a.to_account_info(),
                ctx.accounts.klend_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.instructions_sysvar.to_account_info(),
                ctx.accounts.klend_program.to_account_info(),
                ctx.accounts.klend_program.to_account_info(),
                ctx.accounts.farms_program.to_account_info(),
            ],
            &[authority_seeds],
        )?;
```

**Step 5**

### Borrow Token B

The `remaining_accounts` must include the deposit reserve so Klend can verify collateral.

```rust theme={null}
        let remaining = vec![AccountMeta {
            pubkey: ctx.accounts.deposit_reserve.key(),
            is_signer: false,
            is_writable: true,
        }];

        let borrow_ix = borrow::borrow_obligation_liquidity_v2(
            borrow::BorrowObligationLiquidityV2Accounts {
                owner: ctx.accounts.authority.key(),
                obligation: ctx.accounts.obligation.key(),
                lending_market: ctx.accounts.lending_market.key(),
                lending_market_authority: ctx.accounts.lending_market_authority.key(),
                borrow_reserve: ctx.accounts.borrow_reserve.key(),
                borrow_reserve_liquidity_mint: ctx
                    .accounts
                    .borrow_reserve_liquidity_mint
                    .key(),
                reserve_source_liquidity: ctx
                    .accounts
                    .borrow_reserve_liquidity_supply
                    .key(),
                borrow_reserve_liquidity_fee_receiver: ctx
                    .accounts
                    .borrow_reserve_fee_receiver
                    .key(),
                user_destination_liquidity: ctx.accounts.vault_b.key(),
                referrer_token_state: None,
                token_program: ctx.accounts.token_program.key(),
                obligation_farm_user_state: None,
                reserve_farm_state: None,
            },
            borrow_amount,
            remaining,
        );

        solana_program::program::invoke_signed(
            &borrow_ix,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.obligation.to_account_info(),
                ctx.accounts.lending_market.to_account_info(),
                ctx.accounts.lending_market_authority.to_account_info(),
                ctx.accounts.borrow_reserve.to_account_info(),
                ctx.accounts.borrow_reserve_liquidity_mint.to_account_info(),
                ctx.accounts.borrow_reserve_liquidity_supply.to_account_info(),
                ctx.accounts.borrow_reserve_fee_receiver.to_account_info(),
                ctx.accounts.vault_b.to_account_info(),
                ctx.accounts.klend_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.instructions_sysvar.to_account_info(),
                ctx.accounts.klend_program.to_account_info(),
                ctx.accounts.klend_program.to_account_info(),
                ctx.accounts.farms_program.to_account_info(),
                ctx.accounts.deposit_reserve.to_account_info(),
            ],
            &[authority_seeds],
        )?;

        Ok(())
    }
}
```

**Step 6**

### Account Validation Struct

```rust expandable title="DepositAndBorrow accounts" theme={null}
#[derive(Accounts)]
pub struct DepositAndBorrow<'info> {
    /// PDA authority that owns the vaults and the Klend obligation.
    #[account(
        seeds = [AUTHORITY_SEED, lending_market.key().as_ref()],
        bump,
    )]
    pub authority: SystemAccount<'info>,

    /// Token A vault — holds the collateral token, owned by `authority`.
    #[account(mut, token::authority = authority)]
    pub vault_a: Account<'info, TokenAccount>,

    /// Token B vault — receives the borrowed token, owned by `authority`.
    #[account(mut, token::authority = authority)]
    pub vault_b: Account<'info, TokenAccount>,

    /// Fee payer for obligation init.
    #[account(mut)]
    pub payer: Signer<'info>,

    // -- Klend accounts --
    /// CHECK: Klend lending market account.
    pub lending_market: UncheckedAccount<'info>,
    /// CHECK: Klend lending market authority PDA.
    pub lending_market_authority: UncheckedAccount<'info>,
    /// CHECK: Obligation PDA owned by `authority`.
    #[account(mut)]
    pub obligation: UncheckedAccount<'info>,
    /// CHECK: User metadata PDA for `authority`.
    pub owner_user_metadata: UncheckedAccount<'info>,

    // -- Deposit reserve (Token A) --
    /// CHECK: Klend reserve for Token A.
    #[account(mut)]
    pub deposit_reserve: UncheckedAccount<'info>,
    /// CHECK: Token A mint.
    pub deposit_reserve_liquidity_mint: UncheckedAccount<'info>,
    /// CHECK: Reserve's Token A supply vault.
    #[account(mut)]
    pub deposit_reserve_liquidity_supply: UncheckedAccount<'info>,
    /// CHECK: Reserve's cToken mint.
    #[account(mut)]
    pub deposit_reserve_collateral_mint: UncheckedAccount<'info>,
    /// CHECK: Reserve's cToken supply vault.
    #[account(mut)]
    pub deposit_reserve_collateral_supply: UncheckedAccount<'info>,

    // -- Borrow reserve (Token B) --
    /// CHECK: Klend reserve for Token B.
    #[account(mut)]
    pub borrow_reserve: UncheckedAccount<'info>,
    /// CHECK: Token B mint.
    pub borrow_reserve_liquidity_mint: UncheckedAccount<'info>,
    /// CHECK: Borrow reserve's Token B supply vault.
    #[account(mut)]
    pub borrow_reserve_liquidity_supply: UncheckedAccount<'info>,
    /// CHECK: Borrow reserve's fee receiver vault.
    #[account(mut)]
    pub borrow_reserve_fee_receiver: UncheckedAccount<'info>,

    // -- Programs and sysvars --
    /// CHECK: The Klend program.
    #[account(address = KLEND_PROGRAM_ID)]
    pub klend_program: UncheckedAccount<'info>,
    /// CHECK: Kamino Farms program.
    pub farms_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: Sysvar instructions (required by Klend).
    #[account(address = solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,
}
```

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/docs/cpi_deposit_and_borrow.rs)

> **What Happens When You Borrow?**
>
> 1. USDT is withdrawn from the reserve pool and sent to your wallet
> 2. Your borrow amount increases in your obligation
> 3. You start accruing interest on the borrowed amount
> 4. Your loan-to-value (LTV) ratio increases
> 5. Your available borrowing capacity decreases

> **How Much Can You Borrow?**
>
> **Your maximum borrow amount depends on:**
>
> 1. Your collateral value
>
> 2. Loan-to-Value (LTV) ratio
>
> 3. Current borrows
>
> 4. Reserve liquidity

> **Interest and Repayment**
>
> **Interest:**
>
> * Accrues continuously based on the reserve's borrow APY
> * Compounds over time
> * Varies based on reserve utilization
>
> **Repayment:**
>
> * You must repay borrowed amount + accrued interest
> * Repay anytime to reduce debt and improve your position health

> **LTV**
>
> **Keep LTV well below maximum:**
>
> * Monitor your position regularly
> * Repay borrows or add collateral if LTV increases
> * Be aware of price volatility


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.