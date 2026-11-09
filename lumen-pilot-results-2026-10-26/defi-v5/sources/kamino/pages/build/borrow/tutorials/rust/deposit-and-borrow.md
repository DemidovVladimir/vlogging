> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deposit and Borrow

> Deposit collateral and borrow assets using the klend-interface Rust crate

## Deposit Collateral

Deposit assets as collateral to enable borrowing.

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

Derive the obligation PDA, fetch its account data along with all associated reserves, and build an `ObligationContext`.

```rust theme={null}
use klend_interface::ObligationContext;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let lending_market = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF").unwrap();
let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();

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

> [!NOTE]
>
> `ObligationContext` is the recommended approach for obligation-based operations. It fetches the obligation and its associated reserves, then provides convenient `.deposit()`, `.borrow()`, `.repay()`, and `.withdraw()` methods.

**Step 4**

### Derive Token Accounts

```rust theme={null}
use spl_associated_token_account::get_associated_token_address;

// User's ATA for the deposit token (e.g. USDC)
let liquidity_mint = Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
let user_source_liquidity = get_associated_token_address(&owner, &liquidity_mint);
```

**Step 5**

### Build Instructions

```rust theme={null}
let instructions = ctx.deposit(
    owner,
    &reserve_pubkey,
    user_source_liquidity,
    3_000_000, // 3 USDC (6 decimals)
)?;
// Returns: [refresh_reserves..., refresh_obligation, deposit_and_collateral_v2]
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
println!("Deposit successful! Signature: {signature}");
```

> [!TIP]
>
> The deposit is complete. Your collateral has been supplied and your borrow position is open.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.