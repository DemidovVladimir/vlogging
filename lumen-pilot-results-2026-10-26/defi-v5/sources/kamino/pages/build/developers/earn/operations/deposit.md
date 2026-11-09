> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deposit

> Deposit assets into Kamino Earn vaults

Deposit assets into Kamino Earn vaults to start earning yield. The SDK handles transaction building, instruction creation, and vault interaction.

## Complete Flow

Implement the full deposit flow either in an off-chain TypeScript client or via on-chain Rust CPI within your Anchor program.

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

Initialize the vault and load its state, reserves, and farm state once. The deposit instructions need all three.

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
```

**Step 4**

### Set Slippage Protection

Estimate the shares the deposit will mint, minus a slippage tolerance. The deposit reverts if fewer shares would be minted.

```typescript theme={null}
const depositAmount = new Decimal(1.0); // 1 USDC
const minSharesOut = manager.estimateSharesFromTokens(
  vaultState,
  depositAmount,
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  10 // 0.1% slippage
);
```

> [!NOTE]
>
> The deposit amount is in tokens (`1.0` is 1 USDC), not lamports.

**Step 5**

### Build Deposit Instructions

Generate the deposit instructions, plus the instructions that stake the new shares in the vault's farm.

```typescript theme={null}
const bundle = await vault.depositIxs(
  signer,
  depositAmount,
  vaultReservesMap,
  farmState,
  null, // first-loss capital farm
  undefined, // payer
  undefined, // memo
  minSharesOut
);
const instructions = [...bundle.depositIxs, ...bundle.stakeInFarmIfNeededIxs];
```

> [!NOTE]
>
> If the vault has a rewards farm, `stakeInFarmIfNeededIxs` stakes the minted shares in it so the position earns farm rewards. Shares staked here are unstaked automatically when you withdraw.

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
> Every vault has its own lookup table. Compressing with it cuts the deposit from about 1,021 to 528 bytes, well under Solana's 1,232-byte transaction limit.

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

Send the deposit transaction and wait for confirmation.

```typescript theme={null}
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Deposit successful! Signature:', signature);
```

> [!TIP]
>
> Once the deposit transaction is confirmed, your assets are deposited into the vault and you start earning yield. Vault shares are minted to represent your position.

**Rust**

> [!NOTE]
>
> A standalone off-chain Rust client that deposits into a Kamino Vault using the [`kvault-interface`](https://crates.io/crates/kvault-interface) crate. The crate's `helpers` build the instruction for you — deriving every PDA and the per-reserve `remaining_accounts` from the on-chain vault state — so you never hand-assemble account lists or discriminators.

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

> [!NOTE]
>
> `kvault-interface` re-exports `ReserveInfo`, `VaultInfo`, `Fraction`, and the program IDs, so you don't need to depend on `klend-interface` directly for client code.

**Step 2**

### Set Up RPC Client and Wallet

Load the Solana CLI wallet from `~/.config/solana/id.json` and create an RPC client.

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

> [!NOTE]
>
> The wallet needs at least \~0.01 SOL (transaction fees + ATA rent) and enough USDC to cover the deposit amount configured below.

**Step 3**

### Fetch Vault and Reserve Data

Load the vault account, then fetch every reserve the vault actively allocates to. The on-chain refresh that runs inside `deposit` needs each reserve **and** its lending market, so `VaultInfo` collects them up front.

```rust theme={null}
// Steakhouse USDC vault
let vault_pubkey = Pubkey::from_str("HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E").unwrap();

let vault_data = rpc.get_account(&vault_pubkey).unwrap();

let vault_state = from_account_data::<VaultState>(&vault_data.data).unwrap();
let mut reserve_infos = Vec::new();
for reserve_pubkey in VaultInfo::active_reserve_addresses(vault_state) {
    let reserve_data = rpc.get_account(&reserve_pubkey).unwrap();
    reserve_infos.push(ReserveInfo::from_account_data(reserve_pubkey, &reserve_data.data).unwrap());
}

let vault = VaultInfo::from_account_data(vault_pubkey, &vault_data.data, &reserve_infos).unwrap();
```

**Step 4**

### Derive User Token Accounts

Compute the user's ATA for the underlying token (USDC) and for the vault shares mint. The shares mint is a PDA of the vault state, derived with `pda::shares_mint`.

```rust theme={null}
let user_token_ata = get_associated_token_address(&owner, &vault.token_mint);

let (shares_mint, _bump) = pda::shares_mint(&KVAULT_PROGRAM_ID, &vault_pubkey);
let user_shares_ata = get_associated_token_address(&owner, &shares_mint);
```

> [!NOTE]
>
> Create these ATAs with `spl_associated_token_account::instruction::create_associated_token_account_idempotent` if they may not exist yet, and prepend those instructions to the transaction below.

**Step 5**

### Build the Deposit Instruction

`helpers::deposit::deposit` returns a single instruction with the PDAs and per-reserve `remaining_accounts` already derived from `VaultInfo`.

```rust theme={null}
let ix = helpers::deposit::deposit(
    &vault,
    owner,
    user_token_ata,  // source: user's token account
    user_shares_ata, // destination: user's shares account
    1_000_000,       // 1 USDC (6 decimals)
);
```

**Step 6**

### Send the Deposit Transaction

```rust theme={null}
let message = solana_sdk::message::Message::new(&[ix], Some(&owner));
let recent_blockhash = rpc.get_latest_blockhash().unwrap();
let tx = solana_sdk::transaction::Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc.send_and_confirm_transaction(&tx).unwrap();
println!("Deposit successful! Signature: {signature}");
```

> [!NOTE]
>
> Depositing only mints shares to your share ATA. If the vault has a share farm (`VaultState::vault_farm` is set), you must also **stake** those shares into the farm to earn vault-level rewards — staking is a separate Kamino Farms instruction, appended after this deposit.

> [!TIP]
>
> The deposit is complete. Your USDC has been transferred to the vault, and you've received kVUSDC shares redeemable at the current share price.

[View Code](https://github.com/Kamino-Finance/kvault/blob/master/libs/kvault-interface/examples/deposit.rs)

**Rust (CPI)**

> [!NOTE]
>
> This example shows how an **on-chain Anchor program** can CPI into a Kamino Vault to deposit assets, using the [`kvault-interface`](https://crates.io/crates/kvault-interface) `instructions` builders. A PDA authority owns the user token and shares accounts and signs the CPI via `invoke_signed` — the builder assembles the discriminator and account metas, so you never hand-roll them.

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
use kvault_interface::instructions::deposit::{deposit, DepositAccounts};

declare_id!("YourProgram1111111111111111111111111111111111");

const AUTHORITY_SEED: &[u8] = b"vault_authority";

// Mainnet program IDs — see accordion below for devnet equivalents
pub const KVAULT_PROGRAM_ID: Pubkey = pubkey!("KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd");
pub const KLEND_PROGRAM_ID: Pubkey = pubkey!("KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD");

#[program]
pub mod vault_deposit {
    use super::*;

    pub fn deposit_into_vault<'info>(
        ctx: Context<'_, '_, '_, 'info, Deposit<'info>>,
        max_amount: u64,
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

Klend reserve allocations live in `remaining_accounts` — writable reserve metas followed by readonly lending-market metas, in allocation-slot order. Forward them to the builder unchanged.

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

### Build the Deposit Instruction

`deposit` takes a `DepositAccounts` struct, the `max_amount`, and the refresh list. It derives the event-authority PDA and packs the discriminator + args for you.

```rust theme={null}
        let ix = deposit(
            DepositAccounts {
                user: ctx.accounts.authority.key(),
                vault_state: ctx.accounts.vault_state.key(),
                token_vault: ctx.accounts.token_vault.key(),
                token_mint: ctx.accounts.token_mint.key(),
                base_vault_authority: ctx.accounts.base_vault_authority.key(),
                shares_mint: ctx.accounts.shares_mint.key(),
                user_token_ata: ctx.accounts.user_token_ata.key(),
                user_shares_ata: ctx.accounts.user_shares_ata.key(),
                klend_program: ctx.accounts.klend_program.key(),
                token_program: ctx.accounts.token_program.key(),
                shares_token_program: ctx.accounts.shares_token_program.key(),
            },
            max_amount,
            remaining_metas,
        );
```

**Step 5**

### Invoke Signed with the PDA

The `AccountInfo`s are supplied in the order the builder emits metas — the 11 named accounts, then the event-authority and kvault program (appended by the builder), then the forwarded `remaining_accounts`.

```rust theme={null}
        let mut account_infos = vec![
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.vault_state.to_account_info(),
            ctx.accounts.token_vault.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.base_vault_authority.to_account_info(),
            ctx.accounts.shares_mint.to_account_info(),
            ctx.accounts.user_token_ata.to_account_info(),
            ctx.accounts.user_shares_ata.to_account_info(),
            ctx.accounts.klend_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.shares_token_program.to_account_info(),
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

```rust expandable title="Deposit accounts" theme={null}
#[derive(Accounts)]
pub struct Deposit<'info> {
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
    /// CHECK: Token vault owned by the Kvault program.
    #[account(mut)]
    pub token_vault: UncheckedAccount<'info>,
    /// CHECK: Underlying token mint.
    pub token_mint: UncheckedAccount<'info>,
    /// CHECK: Kvault base vault authority PDA.
    pub base_vault_authority: UncheckedAccount<'info>,
    /// CHECK: Shares mint.
    #[account(mut)]
    pub shares_mint: UncheckedAccount<'info>,
    /// CHECK: Event-emit PDA owned by the Kvault program.
    pub event_authority: UncheckedAccount<'info>,

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

const depositAmount = new Decimal(1.0); // 1 USDC
const minSharesOut = manager.estimateSharesFromTokens(
  vaultState,
  depositAmount,
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  10 // 0.1% slippage
);

const bundle = await vault.depositIxs(
  signer,
  depositAmount,
  vaultReservesMap,
  farmState,
  null, // first-loss capital farm
  undefined, // payer
  undefined, // memo
  minSharesOut
);
const instructions = [...bundle.depositIxs, ...bundle.stakeInFarmIfNeededIxs];

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

console.log('Deposit successful! Signature:', signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.