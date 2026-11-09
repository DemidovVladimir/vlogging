# GraphQL

Get started with AaveKit API

---

AaveKit API exposes a comprehensive GraphQL interface that allows you to query liquidity data, user positions, and faciliates the execution of transactions. This low-level API is perfect for custom integrations, data analysis, and building integrations for which the TypeScript SDK is not suitable.

## Getting Started

AaveKit API for Aave v4 is available at:

```bash
https://api.v4.aave.com/graphql
```

> [!TIP]
> The URL above works also as a GraphQL playground you can use to test your
> queries.

You can query the API directly using any HTTP client. Here's a basic example using curl to query supported chains:

```bash
curl -X POST https://api.v4.aave.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query Chains { chains(request: { query: { filter: ALL } }) { name chainId icon } }"
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
  operations: [OperationType!]!
}
```

### Complex Transactions

Complex transactions query returns an `ExecutionPlan` union.

The `ExecutionPlan` union represents the different scenarios that can occur when preparing a transaction:

- **TransactionRequest**: The transaction can be executed directly.
- **Erc20ApprovalRequired**: One or more ERC-20 approvals are required first, then the original transaction can be executed.
- **PreContractActionRequired**: A pre-contract action must be sent first, then the original transaction can be executed.
- **InsufficientBalanceError**: The user doesn't have enough balance of the token to be used in the transaction.

```graphql title="ExecutionPlan"
union ExecutionPlan =
  | TransactionRequest
  | Erc20ApprovalRequired
  | PreContractActionRequired
  | InsufficientBalanceError
```

```graphql title="Erc20ApprovalRequired"
type Erc20ApprovalRequired {
  approvals: [Erc20Approval!]!
  reason: String!
  requiredAmount: DecimalNumber!
  currentAllowance: DecimalNumber!
  originalTransaction: TransactionRequest!
}
```

```graphql title="Erc20Approval"
type Erc20Approval {
  byTransaction: TransactionRequest!
  bySignature: PermitTypedData
}
```

```graphql title="PermitTypedData"
type PermitTypedData {
  types: JSON!
  primaryType: String!
  domain: DomainData!
  message: JSON!
  signedAmount: BigDecimal!
}
```

```graphql title="PreContractActionRequired"
type PreContractActionRequired {
  action: TransactionRequest!
  reason: String!
  originalTransaction: TransactionRequest!
}
```

```graphql title="InsufficientBalanceError"
type InsufficientBalanceError {
  required: DecimalNumber!
  available: DecimalNumber!
}
```

> [!NOTE]
> **Multiple Approvals:** Some tokens (like USDT) don't allow increasing an
> existing allowance. For these tokens, the API returns multiple approvals in
> sequence: first to reset the allowance to 0, then to set it to the required
> amount.

## Transaction Monitoring

After sending a transaction, AaveKit API may take a short time to process and reflect the new state in its responses due to caching and background invalidation. To reliably know when your transaction has been processed and data is up to date, use the `hasProcessedKnownTransaction` query.

This query lets you check if a transaction (by hash and operations type) has been indexed and processed by the API, so you can safely fetch updated user or market data. Note that this can only be used with transactions where the `TransactionRequest` has a non-null `operations` field.

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
<tab label="DecimalNumber">

A `DecimalNumber` object represents a decimal value with arbitrary precision.

```graphql
type DecimalNumber {
  """
  The on-chain representation of `value`, stored as an integer.
  """
  onChainValue: BigInt!

  """
  The number of decimals defining how many fractional digits the number supports.
  """
  decimals: Int!

  """
  The normalized value computed as `onChainValue / 10^decimals`.
  """
  value: BigDecimal!
}
```

</tab>
<tab label="PercentNumber">

A `PercentNumber` object represents a percentage value.

```graphql
type PercentNumber {
  """
  The on-chain representation of the percentage, stored in basis points (bps).
  """
  onChainValue: BigInt!

  """
  The number of decimals defining the precision of `bps`.
  """
  decimals: Int!

  """
  The normalized percentage value where 1.0 represents 100%.
  """
  value: BigDecimal!

  """
  The human-friendly percentage value where 100.0 represents 100%
  """
  normalized: BigDecimal!
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

  """
  The blockchain explorer URL
  """
  explorerUrl: String!

  """
  Whether this is a testnet chain
  """
  isTestnet: Boolean!

  """
  The native wrapped token address (e.g., WETH address)
  """
  nativeWrappedToken: EvmAddress!

  """
  The native token information
  """
  nativeInfo: TokenInfo!
  """
  The native gateway address
  """
  nativeGateway: EvmAddress!
  """
  The signature gateway address
  """
  signatureGateway: EvmAddress!
}
```

</tab>
<tab label="TokenInfo">

A `TokenInfo` object contains basic metadata about a token.

```graphql
type TokenInfo {
  """
  The token name
  """
  name: String!

  """
  The token symbol
  """
  symbol: String!

  """
  The token icon URL
  """
  icon: String!

  """
  The token decimals
  """
  decimals: Int!
}
```

</tab>
<tab label="Erc20Token">

An `Erc20Token` object represents an ERC-20 token with its metadata and chain information.

```graphql
type Erc20Token {
  """
  The token contract address
  """
  address: EvmAddress!

  """
  The chain this token is deployed on
  """
  chain: Chain!

  """
  The token metadata
  """
  info: TokenInfo!

  """
  Whether this token is a wrapped native token (e.g., WETH)
  """
  isWrappedNativeToken: Boolean!
}
```

</tab>
<tab label="Erc20Amount">

An `Erc20Amount` object represents an amount of an ERC-20 token.

```graphql
type Erc20Amount {
  """
  The amount
  """
  amount: DecimalNumber!

  """
  Get the fiat amount for this token amount
  """
  exchange(currency: Currency! = USD): ExchangeAmount!

  """
  Get the fiat rate for this token
  """
  exchangeRate(currency: Currency! = USD): DecimalNumber!

  """
  The token information
  """
  token: Erc20Token!
}
```

</tab>
<tab label="ExchangeAmount">

An `ExchangeAmount` object represents a monetary value in a fiat currency.

```graphql
type ExchangeAmount {
  """
  The numerical value
  """
  value: BigDecimal!

  """
  The currency name
  """
  name: String!

  """
  The currency symbol (e.g., $, €, £)
  """
  symbol: String!

  """
  The currency icon URL
  """
  icon: String!

  """
  The number of decimals for the currency
  """
  decimals: Int!
}
```

</tab>
</tabgroup>
