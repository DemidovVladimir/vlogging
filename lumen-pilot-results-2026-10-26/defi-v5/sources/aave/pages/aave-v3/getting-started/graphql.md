# GraphQL

The Aave Protocol exposes a comprehensive GraphQL API that allows you to query market data, user positions, and execute transactions. This low-level API is perfect for custom integrations, data analysis, and building integrations for which the TypeScript SDK is not suitable.

## Getting Started

The Aave Protocol GraphQL API is available at:

```bash
https://api.v3.aave.com/graphql
```

> [!TIP]
> The URL above works also as a GraphQL playground you can use to test your
> queries.

You can query the API directly using any HTTP client. Here's a basic example using curl:

```bash
curl -X POST https://api.v3.aave.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query Chains { chains { name chainId icon } }"
  }'
```

## Query Operations

AaveKit API is constituted by just two types of queries:

- **Read queries** – queries that return data from the Aave Protocol.
- **Transactions queries** – queries that prepare transactions to be executed on the Aave Protocol.

The transactions queries are in turn divided into two categories:

- **Simple transactions** – single-step transactions that can be sent directly to the wallet.
- **Complex transactions** – transactions that may require prior approvals before they can be executed.

### Simple Transactions

Simple transactions query returns a `TransactionRequest` object that can be used to send the transaction to the wallet.

```graphql title="TransactionRequest"
type TransactionRequest {
  to: EvmAddress!
  from: EvmAddress!
  data: BlockchainData!
  value: BigInt!
  chainId: ChainId!
  operation: OperationType
}
```

### Complex Transactions

Complex transactions query returns an `ExecutionPlan` union.

The `ExecutionPlan` union represents the different scenarios that can occur when preparing a transaction:

- **TransactionRequest**: The transaction can be executed directly.
- **ApprovalRequired**: An approval transaction must be sent first, then the original transaction can be executed.
- **InsufficientBalanceError**: The user doesn't have enough balance of the token to be used in the transaction.

```graphql title="ExecutionPlan"
union ExecutionPlan =
    TransactionRequest
  | ApprovalRequired
  | InsufficientBalanceError
```

```graphql title="ApprovalRequired"
type ApprovalRequired {
  approval: TransactionRequest!
  reason: String!
  requiredAmount: DecimalValue!
  currentAllowance: DecimalValue!
  originalTransaction: TransactionRequest!
}
```

```graphql title="InsufficientBalanceError"
type InsufficientBalanceError {
  required: DecimalValue!
  available: DecimalValue!
}
```

## Transaction Monitoring

After sending a transaction, AaveKit API may take a short time to process and reflect the new state in its responses due to caching and background invalidation. To reliably know when your transaction has been processed and data is up to date, use the `hasProcessedKnownTransaction` query.

This query lets you check if a transaction (by hash and operation type) has been indexed and processed by the API, so you can safely fetch updated user or market data. Note that this can only be used with transactions where the `TransactionRequest` has a non-null `operation` field.

```graphql title="Query"
query {
  value: hasProcessedKnownTransaction(
    request: { operations: [SUPPLY], txHash: "0x1234…" }
  )
}
```

```json title="Response"
{
  "data": {
    "value": true // or false
  }
}
```

- Returns `true` if the transaction has been processed and data is fresh.
- Returns `false` if the transaction is not yet processed (wait and retry).

**When to use:**

- After sending a transaction, poll this query until it returns `true` before fetching updated positions or balances.
- This avoids race conditions with cached data and ensures your UI reflects the latest state.

---

## Scalars

A non comprehensive list of the custom scalars used in the Aave Protocol GraphQL API.

<tabgroup>
<tab label="BlockchainData">

A string representing binary data as a hex string.

```text
0x0000000000000000000000000000000000000000000000000000000000000020
```

</tab>
<tab label="BigInt">

A string representing a big integer in decimal format.

```text
1000000000000000000000
```

</tab>
<tab label="BigDecimal">

A string representing a decimal number with arbitrary precision.

```text
1.0000000000000000001
```

</tab>
<tab label="ChainId">

A number representing a Chain ID.

```text
1
8453
42161
```

</tab>
<tab label="EvmAddress">

A string representing an EVM address.

```text
0x0000000000000000000000000000000000000000
```

</tab>
<tab label="TxHash">

A string representing an EVM transaction hash.

```text
0x0000000000000000000000000000000000000000000000000000000000000000
```

</tab>
<tab label="DateTime">

A string representing a date and time.

```text
2021-01-01T00:00:00Z
```

</tab>
</tabgroup>
## Common Types

Some of the common types used in the Aave Protocol GraphQL API.

<tabgroup>
<tab label="Currency">

A `Currency` object represents an ERC20 token.

```graphql
type Currency {
  """
  The token address
  """
  address: EvmAddress!

  """
  The chain id
  """
  chainId: ChainId!

  """
  The token name
  """
  name: String!

  """
  The token image
  """
  imageUrl: String!

  """
  The token symbol
  """
  symbol: String!

  """
  The token decimals
  """
  decimals: Int!
}
```

</tab>
<tab label="DecimalValue">

A `DecimalValue` object represents a decimal value with arbitrary precision.

```graphql
type DecimalValue {
  """
  The raw none formatted value
  """
  raw: BigInt!

  """
  The decimals the value formatted into
  """
  decimals: Int!

  """
  The formatted value
  """
  value: BigDecimal!
}
```

</tab>
<tab label="TokenAmount">

A `TokenAmount` object represents an amount of a token.

```graphql
type TokenAmount {
  """
  The USD exchange rate for the token
  """
  usdPerToken: BigDecimal!

  """
  The amount
  """
  amount: DecimalValue!

  """
  The amount in USD
  """
  usd: BigDecimal!
}
```

  </tab>
<tab label="PercentValue">

A `PercentValue` object represents a percentage value with precision and formatting.

```graphql
type PercentValue {
  """
  The raw none normalized percentage (the value that lives onchain)
  """
  raw: BigInt!

  """
  The decimals representing the precision of the onchain raw value
  """
  decimals: Int!

  """
  The normalized percentage (1.0 = 100%)
  """
  value: BigDecimal!

  """
  The human-readable formatted value you can render on a UI straight away.
  For example, this will turn `0.01232343` to `1.23`, it will always round to `2` decimal points.
  """
  formatted: BigDecimal!
}
```

</tab>
<tab label="Chain">

A `Chain` object represents a blockchain network supported by the Aave Protocol.

```graphql
type Chain {
  """
  The chain name
  """
  name: String!

  """
  The chain icon
  """
  icon: String!

  """
  The chain id
  """
  chainId: ChainId!
}
```

</tab>
</tabgroup>
## Utility Queries

### Supported Chains

Use the `chains` query to list the chains supported by the Aave Protocol v3.

```graphql title="Query"
query Chains {
  chains {
    __typename
    name
    chainId
    icon
  }
}
```

```json title="Response"
{
  "data": {
    "chains": [
      {
        "__typename": "Chain",
        "chainId": 1,
        "icon": "https://statics.aave.com/ethereum.svg",
        "name": "Ethereum"
      },
      {
        "__typename": "Chain",
        "chainId": 42161,
        "icon": "https://statics.aave.com/arbitrum.svg",
        "name": "Arbitrum"
      },
      {
        "__typename": "Chain",
        "chainId": 8453,
        "icon": "https://statics.aave.com/base.svg",
        "name": "Base"
      }
    ]
  }
}
```

### USD Exchange Rates

Use the `usdExchangeRates` query to get the USD exchange rate for a list of tokens.

```graphql title="Query"
query UsdExchangeRates($request: UsdExchangeRatesRequest!) {
  usdExchangeRates(request: $request) {
    __typename
    currency {
      symbol
      name
      address
      decimals
    }
    rate
  }
}
```

```json title="Variables"
{
  "request": {
    "market": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "underlyingTokens": ["0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"],
    "chainId": 1
  }
}
```

```json title="Response"
{
  "data": {
    "usdExchangeRates": [
      {
        "__typename": "UsdExchangeRate",
        "currency": {
          "symbol": "USDC",
          "name": "USD Coin",
          "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          "decimals": 6
        },
        "rate": 1.0
      }
    ]
  }
}
```

## Next Steps

- [Aave Markets](../markets/overview) - Learn how to interact with Aave markets.
- [Aave Earn](../vaults/overview) - Learn how to interact with Aave Earn Vaults.
