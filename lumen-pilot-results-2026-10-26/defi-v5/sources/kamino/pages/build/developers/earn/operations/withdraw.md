> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdraw

> Withdraw assets from Kamino Earn vaults

Withdraw assets from Kamino Earn vaults to redeem your shares for underlying tokens. The SDK handles transaction building and vault interaction.

## Complete Flow

Implement the full withdrawal flow either in an off-chain TypeScript client or via on-chain Rust CPI within your Anchor program.

**TypeScript**

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, and Kit transaction building.

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
  compressTransactionMessageUsingAddressLookupTables,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { Decimal } from 'decimal.js';
```

> [!NOTE]
>
> `@solana/kit` provides modern utilities for RPC, transaction building, and signing. `@kamino-finance/klend-sdk` contains vault operation methods.

**Step 2**

### Load Signer and Initialize RPC

Load your keypair from a file and initialize RPC connections.

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
```

> [!NOTE]
>
> Replace `/path/to/your/keypair.json` with the actual path to your keypair file. `parseKeypairFile` loads an existing keypair from a JSON file. The `rpcSubscriptions` enables real-time transaction confirmation.

**Step 3**

### Load the Vault

Initialize the vault and load its state, reserves, and farm state once. The withdraw instructions need all three.

```typescript theme={null}
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);
const ledgerInstant = await getCurrentLedgerInstant(rpc);
```

**Step 4**

### Convert Tokens to Shares

Convert the token amount you want back into vault shares, capped at the shares you hold.

```typescript theme={null}
const withdrawAmount = new Decimal(1.0); // 1 USDC

const userShares = await vault.getUserShares(signer.address);
const tokensPerShare = await manager.getTokensPerShareSingleVault(vault, ledgerInstant, vaultReservesMap, ledgerInstant);
const sharesToWithdraw = Decimal.min(withdrawAmount.div(tokensPerShare), userShares.totalShares);
```

> [!NOTE]
>
> `withdrawIxs` takes an amount of **vault shares**, not tokens. Shares grow in value as interest accrues, so one share is worth more than one token. To withdraw everything, pass `userShares.totalShares`.

**Step 5**

### Build Withdraw Instructions

Generate the unstake and withdraw instructions.

```typescript theme={null}
const bundle = await vault.withdrawIxs(
  signer,
  sharesToWithdraw,
  ledgerInstant,
  vaultReservesMap,
  farmState,
  null // first-loss capital farm
);
const instructions = [...bundle.unstakeFromFarmIfNeededIxs, ...bundle.withdrawIxs, ...bundle.postWithdrawIxs];
```

> [!NOTE]
>
> Deposits stake shares in the vault's farm, so `unstakeFromFarmIfNeededIxs` must come before `withdrawIxs`. Without it, withdrawing staked shares fails with `CannotWithdrawZeroShares`.

**Step 6**

### Load the Vault's Lookup Table

Fetch the vault's address lookup table to keep the transaction small.

```typescript theme={null}
const lookupTables = await fetchAllAddressLookupTable(rpc, [vaultState.vaultLookupTable]);
const lutsByAddress: Record<Address, Address[]> = {};
for (const lut of lookupTables) lutsByAddress[lut.address] = lut.data.addresses;
```

> [!NOTE]
>
> Some vaults need the lookup table for a withdraw to fit in one transaction. Without it, a withdraw from one vault we tested was 1,274 bytes, over Solana's 1,232-byte limit.

**Step 7**

### Build and Sign Transaction

Use Kit's functional pipe pattern to build, compress, and sign the transaction with a fresh blockhash.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress)
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
```

**Step 8**

### Send and Confirm Transaction

Send the withdraw transaction and wait for confirmation.

```typescript theme={null}
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Withdraw successful! Signature:', signature);
```

> [!TIP]
>
> Once the withdraw transaction is confirmed, your vault shares are burned and you receive the underlying tokens plus any accrued interest.

**Rust**

> [!NOTE]
>
> A standalone off-chain Rust client that burns vault shares to redeem the underlying tokens, using the [`kvault-interface`](https://crates.io/crates/kvault-interface) crate. If the vault's available balance is too low, `withdraw` automatically disinvests from a Klend reserve — the helper assembles every account needed for that path. Uses the same `Cargo.toml` and wallet setup as the [deposit client](#).

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
kvault-interface = "0.1.0"
solana-client = "2.3"
solana-sdk = "2.3"
solana-pubkey = "2.1"
spl-associated-token-account = "6"
```

**Step 2**

### Set Up RPC Client and Wallet

```rust theme={null}
use std::str::FromStr;

use kvault_interface::{
    from_account_data, helpers, pda, state::VaultState, ReserveInfo, VaultInfo, KVAULT_PROGRAM_ID,
};
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use solana_sdk::signer::{keypair::read_keypair_file, Signer};
use spl_associated_token_account::get_associated_token_address;

let rpc = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());

let home = std::env::var("HOME").unwrap();
let signer = read_keypair_file(format!("{home}/.config/solana/id.json"))
    .expect("Failed to load wallet from ~/.config/solana/id.json");
let owner = signer.pubkey();
```

**Step 3**

### Fetch Vault and Reserve Data

Load the vault and the reserve to disinvest from, plus every active reserve (each with its lending market) so the on-chain refresh has everything it needs. The disinvest target is reused from the set already fetched.

```rust theme={null}
let vault_pubkey = Pubkey::from_str("HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E").unwrap();
let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();

let vault_data = rpc.get_account(&vault_pubkey).unwrap();

let reserve_data = rpc.get_account(&reserve_pubkey).unwrap();
let reserve = ReserveInfo::from_account_data(reserve_pubkey, &reserve_data.data).unwrap();

let vault_state = from_account_data::<VaultState>(&vault_data.data).unwrap();
let mut reserve_infos = Vec::new();
for active_reserve in VaultInfo::active_reserve_addresses(vault_state) {
    if active_reserve == reserve.address {
        reserve_infos.push(ReserveInfo::from_account_data(reserve.address, &reserve_data.data).unwrap());
    } else {
        let data = rpc.get_account(&active_reserve).unwrap();
        reserve_infos.push(ReserveInfo::from_account_data(active_reserve, &data.data).unwrap());
    }
}

let vault = VaultInfo::from_account_data(vault_pubkey, &vault_data.data, &reserve_infos).unwrap();
```

**Step 4**

### Derive User Token Accounts

```rust theme={null}
let user_token_ata = get_associated_token_address(&owner, &vault.token_mint);

let (shares_mint, _bump) = pda::shares_mint(&KVAULT_PROGRAM_ID, &vault_pubkey);
let user_shares_ata = get_associated_token_address(&owner, &shares_mint);
```

**Step 5**

### Build the Withdraw Instruction

`helpers::withdraw::withdraw` takes the disinvest-target `ReserveInfo` and the number of shares to burn, and derives the rest.

```rust theme={null}
let ix = helpers::withdraw::withdraw(
    &vault,
    owner,
    user_token_ata,
    user_shares_ata,
    &reserve,
    1_000_000, // shares to burn
);
```

**Step 6**

### Send the Withdraw Transaction

```rust theme={null}
let message = solana_sdk::message::Message::new(&[ix], Some(&owner));
let recent_blockhash = rpc.get_latest_blockhash().unwrap();
let tx = solana_sdk::transaction::Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc.send_and_confirm_transaction(&tx).unwrap();
println!("Withdrawal successful! Signature: {signature}");
```

> [!NOTE]
>
> If the vault has a share farm (`VaultState::vault_farm` is set), your shares are staked in the farm and must be **unstaked first** — `withdraw` can only burn shares held in your share ATA. A complete flow prepends a Kamino Farms unstake instruction before the withdraw.

> [!TIP]
>
> The withdrawal is complete. Your kVUSDC shares have been burned and the underlying USDC has been transferred to your wallet at the current share price.

[View Code](https://github.com/Kamino-Finance/kvault/blob/master/libs/kvault-interface/examples/withdraw.rs)

**Rust (CPI)**

> [!NOTE]
>
> This example shows how an **on-chain Anchor program** can CPI into a Kamino Vault to withdraw assets, using the [`kvault-interface`](https://crates.io/crates/kvault-interface) `instructions` builders. A PDA authority owns the user token and shares accounts and signs the CPI via `invoke_signed`. The `withdraw` builder flattens the "withdraw from available" and "withdraw from invested" account groups for you, so you don't hand-assemble the 25-account meta list.

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
kvault-interface = "0.1.0"
anchor-lang = "0.31"
anchor-spl = "0.31"
solana-program = "2.1"
```

> [!NOTE]
>
> Use Anchor **0.31+** here: `kvault-interface` is built on the Solana 2.x crates (`solana-pubkey`/`solana-instruction`), and Anchor 0.31 is the first release on that line — so its `Pubkey` type matches the crate's. Older Anchor (0.30) pulls Solana 1.x and won't type-check against the builders.

**Step 2**

### Define Program IDs, PDA Authority, and Handler

```rust theme={null}
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::AccountMeta;
use anchor_spl::token::{Token, TokenAccount};
use kvault_interface::instructions::withdraw::{withdraw, WithdrawAccounts};

declare_id!("YourProgram1111111111111111111111111111111111");

const AUTHORITY_SEED: &[u8] = b"vault_authority";

pub const KVAULT_PROGRAM_ID: Pubkey = pubkey!("KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd");
pub const KLEND_PROGRAM_ID: Pubkey = pubkey!("KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD");

#[program]
pub mod vault_withdraw {
    use super::*;

    pub fn withdraw_from_vault<'info>(
        ctx: Context<'_, '_, '_, 'info, Withdraw<'info>>,
        shares_amount: u64,
    ) -> Result<()> {
        let vault_state_key = ctx.accounts.vault_state.key();
        let authority_seeds: &[&[u8]] = &[
            AUTHORITY_SEED,
            vault_state_key.as_ref(),
            &[ctx.bumps.authority],
        ];
```

> **Mainnet Program IDs**
>
> | Constant | Address |
> | - | - |
> | `KVAULT_PROGRAM_ID` | `KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd` |
> | `KLEND_PROGRAM_ID` | `KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD` |

> **Devnet Program IDs**
>
> | Constant | Address |
> | - | - |
> | `KVAULT_PROGRAM_ID` | `devkRngFnfp4gBc5a3LsadgbQKdPo8MSZ4prFiNSVmY` |
> | `KLEND_PROGRAM_ID` | `KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD` |

**Step 3**

### Forward the Refresh Accounts

The refresh list — writable reserve metas followed by readonly lending-market metas, in allocation-slot order — is forwarded from `remaining_accounts` to the builder unchanged.

```rust theme={null}
        let remaining_metas: Vec<AccountMeta> = ctx
            .remaining_accounts
            .iter()
            .map(|a| AccountMeta {
                pubkey: *a.key,
                is_signer: a.is_signer,
                is_writable: a.is_writable,
            })
            .collect();
```

**Step 4**

### Build the Withdraw Instruction

`withdraw` takes a `WithdrawAccounts` struct covering both the available and invested phases, the `shares_amount` to burn, and the refresh list. Pass `u64::MAX` to burn the caller's entire balance.

```rust theme={null}
        let ix = withdraw(
            WithdrawAccounts {
                // withdraw-from-available
                user: ctx.accounts.authority.key(),
                vault_state: ctx.accounts.vault_state.key(),
                global_config: ctx.accounts.global_config.key(),
                token_vault: ctx.accounts.token_vault.key(),
                base_vault_authority: ctx.accounts.base_vault_authority.key(),
                user_token_ata: ctx.accounts.user_token_ata.key(),
                token_mint: ctx.accounts.token_mint.key(),
                user_shares_ata: ctx.accounts.user_shares_ata.key(),
                shares_mint: ctx.accounts.shares_mint.key(),
                token_program: ctx.accounts.token_program.key(),
                shares_token_program: ctx.accounts.shares_token_program.key(),
                klend_program: ctx.accounts.klend_program.key(),
                // withdraw-from-invested (vault_state repeats)
                invested_vault_state: ctx.accounts.vault_state.key(),
                reserve: ctx.accounts.reserve.key(),
                ctoken_vault: ctx.accounts.ctoken_vault.key(),
                lending_market: ctx.accounts.lending_market.key(),
                lending_market_authority: ctx.accounts.lending_market_authority.key(),
                reserve_liquidity_supply: ctx.accounts.reserve_liquidity_supply.key(),
                reserve_collateral_mint: ctx.accounts.reserve_collateral_mint.key(),
                reserve_collateral_token_program: ctx.accounts.reserve_collateral_token_program.key(),
                instruction_sysvar_account: ctx.accounts.instruction_sysvar_account.key(),
            },
            shares_amount,
            remaining_metas,
        );
```

**Step 5**

### Invoke Signed with the PDA

The `AccountInfo`s are supplied in the order the builder emits metas. `vault_state`, `event_authority`, and `kvault_program` each appear twice — once per account group — so they're repeated here too.

```rust theme={null}
        let mut account_infos = vec![
            // withdraw-from-available
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.vault_state.to_account_info(),
            ctx.accounts.global_config.to_account_info(),
            ctx.accounts.token_vault.to_account_info(),
            ctx.accounts.base_vault_authority.to_account_info(),
            ctx.accounts.user_token_ata.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.user_shares_ata.to_account_info(),
            ctx.accounts.shares_mint.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.shares_token_program.to_account_info(),
            ctx.accounts.klend_program.to_account_info(),
            ctx.accounts.event_authority.to_account_info(),
            ctx.accounts.kvault_program.to_account_info(),
            // withdraw-from-invested
            ctx.accounts.vault_state.to_account_info(),
            ctx.accounts.reserve.to_account_info(),
            ctx.accounts.ctoken_vault.to_account_info(),
            ctx.accounts.lending_market.to_account_info(),
            ctx.accounts.lending_market_authority.to_account_info(),
            ctx.accounts.reserve_liquidity_supply.to_account_info(),
            ctx.accounts.reserve_collateral_mint.to_account_info(),
            ctx.accounts.reserve_collateral_token_program.to_account_info(),
            ctx.accounts.instruction_sysvar_account.to_account_info(),
            ctx.accounts.event_authority.to_account_info(),
            ctx.accounts.kvault_program.to_account_info(),
        ];
        account_infos.extend(ctx.remaining_accounts.iter().cloned());

        solana_program::program::invoke_signed(&ix, &account_infos, &[authority_seeds])?;
        Ok(())
    }
}
```

**Step 6**

### Account Validation Struct

```rust expandable title="Withdraw accounts" theme={null}
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [AUTHORITY_SEED, vault_state.key().as_ref()],
        bump,
    )]
    pub authority: SystemAccount<'info>,

    #[account(mut, token::authority = authority)]
    pub user_token_ata: Account<'info, TokenAccount>,

    #[account(mut, token::authority = authority)]
    pub user_shares_ata: Account<'info, TokenAccount>,

    /// CHECK: Kvault state account.
    #[account(mut)]
    pub vault_state: UncheckedAccount<'info>,
    /// CHECK: Kvault global config account.
    pub global_config: UncheckedAccount<'info>,
    /// CHECK: Token vault owned by the Kvault program.
    #[account(mut)]
    pub token_vault: UncheckedAccount<'info>,
    /// CHECK: Kvault base vault authority PDA.
    pub base_vault_authority: UncheckedAccount<'info>,
    /// CHECK: Underlying token mint.
    #[account(mut)]
    pub token_mint: UncheckedAccount<'info>,
    /// CHECK: Shares mint.
    #[account(mut)]
    pub shares_mint: UncheckedAccount<'info>,
    /// CHECK: Event-emit PDA owned by the Kvault program.
    pub event_authority: UncheckedAccount<'info>,

    /// CHECK: Klend reserve account.
    #[account(mut)]
    pub reserve: UncheckedAccount<'info>,
    /// CHECK: cToken vault owned by the Kvault program.
    #[account(mut)]
    pub ctoken_vault: UncheckedAccount<'info>,
    /// CHECK: Klend lending market.
    pub lending_market: UncheckedAccount<'info>,
    /// CHECK: Klend lending market authority PDA.
    pub lending_market_authority: UncheckedAccount<'info>,
    /// CHECK: Reserve's underlying liquidity supply vault.
    #[account(mut)]
    pub reserve_liquidity_supply: UncheckedAccount<'info>,
    /// CHECK: Reserve's cToken mint.
    #[account(mut)]
    pub reserve_collateral_mint: UncheckedAccount<'info>,
    /// CHECK: Reserve's cToken program.
    pub reserve_collateral_token_program: UncheckedAccount<'info>,
    /// CHECK: Solana instructions sysvar.
    #[account(address = solana_program::sysvar::instructions::ID)]
    pub instruction_sysvar_account: UncheckedAccount<'info>,

    /// CHECK: The Kvault program.
    #[account(address = KVAULT_PROGRAM_ID)]
    pub kvault_program: UncheckedAccount<'info>,
    /// CHECK: The Klend program.
    #[account(address = KLEND_PROGRAM_ID)]
    pub klend_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub shares_token_program: Program<'info, Token>,
}
```

[View API](https://docs.rs/kvault-interface/latest/kvault_interface/instructions/index.html)

#### Full Code Example

**TypeScript**

```typescript expandable theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compressTransactionMessageUsingAddressLookupTables,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { Decimal } from 'decimal.js';

const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);
const ledgerInstant = await getCurrentLedgerInstant(rpc);

const withdrawAmount = new Decimal(1.0); // 1 USDC

const userShares = await vault.getUserShares(signer.address);
const tokensPerShare = await manager.getTokensPerShareSingleVault(vault, ledgerInstant, vaultReservesMap, ledgerInstant);
const sharesToWithdraw = Decimal.min(withdrawAmount.div(tokensPerShare), userShares.totalShares);

const bundle = await vault.withdrawIxs(
  signer,
  sharesToWithdraw,
  ledgerInstant,
  vaultReservesMap,
  farmState,
  null // first-loss capital farm
);
const instructions = [...bundle.unstakeFromFarmIfNeededIxs, ...bundle.withdrawIxs, ...bundle.postWithdrawIxs];

const lookupTables = await fetchAllAddressLookupTable(rpc, [vaultState.vaultLookupTable]);
const lutsByAddress: Record<Address, Address[]> = {};
for (const lut of lookupTables) lutsByAddress[lut.address] = lut.data.addresses;

const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress)
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Withdraw successful! Signature:', signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.