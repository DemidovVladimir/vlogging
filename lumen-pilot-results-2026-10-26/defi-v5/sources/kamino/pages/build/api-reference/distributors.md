> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Distributor codes

A distributor is a third party that directs deposit flow into Kamino Earn vaults or Kamino Lend reserves. Deposits and withdrawals are attributed to a distributor by a 5-character code carried in the SPL Memo instruction of the transaction.

## Generating codes

### Getting credentials

Registering codes and reading their analytics require API credentials. The Kamino team issues a username and password on request. These are sent as HTTP basic auth on the calls below.

### Registering a code

Each code is registered under a unique name of 1 to 64 characters. The name should describe the purpose of the code, as the distributor is responsible for maintaining the mapping from name to code.

```bash theme={null}
curl -u '<user>:<password>' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Example Wallet - mobile app"}' \
  https://api.kamino.finance/distributors
```

```json theme={null}
{ "code": "abcde" }
```

The code is active immediately. A name that already exists returns `409`.

## Tagging transactions

The code is passed as the `memo` field of the deposit and withdraw endpoints. For Kamino Earn:
[`POST /ktx/kvault/deposit`](https://kamino.com/docs/build/api-reference/earn/actions/deposit/kvault-deposit),
[`POST /ktx/kvault/deposit-instructions`](https://kamino.com/docs/build/api-reference/earn/actions/deposit/kvault-deposit-instructions),
[`POST /ktx/kvault/withdraw`](https://kamino.com/docs/build/api-reference/earn/actions/withdraw/kvault-withdraw) or
[`POST /ktx/kvault/withdraw-instructions`](https://kamino.com/docs/build/api-reference/earn/actions/withdraw/kvault-withdraw-instructions):

```json theme={null}
{
  "wallet": "<wallet pubkey>",
  "kvault": "<kvault address>",
  "amount": "0.1234",
  "memo": "abcde"
}
```

For Kamino Lend:
[`POST /ktx/klend/deposit`](https://kamino.com/docs/build/api-reference/borrow/actions/deposit/klend-deposit) or
[`POST /ktx/klend/deposit-instructions`](https://kamino.com/docs/build/api-reference/borrow/actions/deposit/klend-deposit-instructions):

```json theme={null}
{
  "wallet": "<wallet pubkey>",
  "market": "<market address>",
  "reserve": "<reserve address>",
  "amount": "0.1234",
  "memo": "abcde"
}
```

When the transaction is built manually, an SPL Memo instruction whose data is the code must be included in the same transaction as the deposit or withdraw instruction.

* The memo must be exactly the code. Matching is case-insensitive.
* Use one code per transaction.
* The `memo` field accepts up to 64 UTF-8 bytes. Longer values return `400`.
* Codes use the alphabet `23456789abcdefghjkmnpqrstuvwxyz`, so `0`, `1`, `o`, `l` and `i` never appear.

## Analytics

Four endpoints report the deposits and withdrawals attributed to distributor codes. They are private: send the same basic auth credentials used to register codes, or the call returns `401`. They cover Kamino Earn vaults only; tagged Kamino Lend transactions are not reported yet.

| Endpoint | Scope |
| - | - |
| [`GET /kvaults/vaults/{pubkey}/distributor-transactions`](https://kamino.com/docs/build/api-reference/earn/distributors/vault-distributor-transactions) | every tagged transaction on one vault, across all codes |
| [`GET /kvaults/distributors/{code}/transactions`](https://kamino.com/docs/build/api-reference/earn/distributors/distributor-transactions) | every transaction tagged with one code, across all vaults |
| [`GET /kvaults/distributors/{code}/vaults/{vault}/transactions`](https://kamino.com/docs/build/api-reference/earn/distributors/distributor-vault-transactions) | every transaction tagged with one code on one vault |
| [`GET /kvaults/distributors/{code}/wallets`](https://kamino.com/docs/build/api-reference/earn/distributors/distributor-wallets) | per-wallet totals for one code, split by token and direction |

Rules that apply to all four:

* Each flow has a `type`: `deposit` for the `deposit` and `buy` instructions, `withdraw` for the `withdraw`, `withdrawFromAvailable`, `sell` and `redeemInKind` instructions. Admin and crank instructions are never counted, even when their transaction carries a code.
* `type` is an optional query parameter. `type=deposit` or `type=withdraw` returns only that direction; omitted, both are returned.
* `start` and `end` are optional query parameters, given as ISO 8601 strings or epoch milliseconds, and either can be given on its own. A missing `start` means the beginning of history and a missing `end` means now. `start` is inclusive and `end` is exclusive, and `start` must be before `end` once the missing one is filled in, so an `end` before 1970 or a `start` in the future returns `400`.
* On the three code-based endpoints the code is matched case-insensitively, and an unregistered code returns `404`.
* Responses are cached for 60 seconds.

All four endpoints page with a cursor. `limit` accepts 1 to 1000 and defaults to 100. When more rows remain, the response carries a `paginationToken`; the last page has none. Pass it back unchanged on the next call together with the same `start`, `end` and `type`. The transaction endpoints return the newest rows first. On the wallets endpoint the token also pins the `start`, `end` and `type` the first page aggregated over, filling in an omitted bound at the moment of the first page, so later pages total the same set of transactions even while new ones arrive. A wallets token sent with a different `start`, `end` or `type` returns `400`.

```bash theme={null}
curl -u '<user>:<password>' \
  'https://api.kamino.finance/kvaults/distributors/abcde/transactions?start=2026-01-01T00:00:00Z&end=2026-02-01T00:00:00Z&limit=2'
```

```json theme={null}
{
  "result": [
    {
      "createdOn": "2026-01-20T14:03:11.000Z",
      "tx": "<transaction signature>",
      "code": "abcde",
      "type": "withdraw",
      "instruction": "withdraw",
      "wallet": "<wallet pubkey>",
      "vault": "<kvault address>",
      "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "tokenSymbol": "USDC",
      "amount": "2500"
    },
    {
      "createdOn": "2026-01-18T09:41:57.000Z",
      "tx": "<transaction signature>",
      "code": "abcde",
      "type": "deposit",
      "instruction": "deposit",
      "wallet": "<wallet pubkey>",
      "vault": "<kvault address>",
      "tokenMint": "So11111111111111111111111111111111111111112",
      "tokenSymbol": "SOL",
      "amount": "10.5"
    }
  ],
  "paginationToken": "eyJjcmVhdGVkT24iOiIyMDI2LTAxLTE4VDA5OjQxOjU3LjAwMFoiLCJsYXN0SWQiOiI0MjE3In0="
}
```

The three transaction endpoints return one row per instruction, not per transaction, so a transaction with several tagged vault instructions gives one row each. `amount` is a decimal string in the underlying token, not in vault shares, and is always positive; the `type` gives the direction. For `redeemInKind`, which pays out cTokens of a reserve, the cTokens are converted to the underlying token at the reserve exchange rate at that time. `instruction` is the Kamino Earn vault instruction that moved the tokens. `tokenSymbol` is `null` when the token is not known to Kamino.

The wallets endpoint aggregates the same transactions by wallet, ordered by wallet address. Each wallet lists one entry per token and direction, with the total amount moved. A wallet that both deposited and withdrew a token gets two entries for it, one with `type` `deposit` and one with `type` `withdraw`; the two are never netted. The `type` query parameter restricts the totals to one direction.

```bash theme={null}
curl -u '<user>:<password>' \
  'https://api.kamino.finance/kvaults/distributors/abcde/wallets?start=2026-01-01T00:00:00Z&end=2026-02-01T00:00:00Z'
```

```json theme={null}
{
  "result": [
    {
      "wallet": "<wallet pubkey>",
      "tokens": [
        { "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "tokenSymbol": "USDC", "type": "deposit", "amount": "4000" },
        { "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "tokenSymbol": "USDC", "type": "withdraw", "amount": "2500" },
        { "tokenMint": "So11111111111111111111111111111111111111112", "tokenSymbol": "SOL", "type": "deposit", "amount": "10.5" }
      ]
    }
  ]
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.