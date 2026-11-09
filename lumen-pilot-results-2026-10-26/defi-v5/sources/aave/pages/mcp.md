# Aave MCP

Aave MCP gives AI agents a single interface to Aave v3 and v4. Compatible clients can discover markets, inspect positions, simulate protocol actions, and prepare transactions for a user's wallet to review and sign.

Server endpoint: `https://mcp.aave.com`

## What You Can Do

- **Explore markets:** Retrieve supported chains, reserves, available liquidity, protocol structure, and current or historical rates.
- **Review positions:** Inspect a wallet's supplies, borrows, health factor, activity, and rewards.
- **Prepare actions:** Simulate and build supply, borrow, withdraw, repay, collateral, reward, and liquidation transactions.
- **Use specialized capabilities:** Work with token swaps, Aave v4 hub data, Savings GHO, and Aave DAO governance data.

See the [Tools](/mcp/tools) reference for the complete tool inventory, parameters, and response schemas.

## Action Lifecycle

Build actions in five stages.

> [!WARNING]
> Aave MCP never holds private keys or signs transactions. Action tools return an
> unsigned transaction or EIP-712 typed data for the user's wallet. For swaps,
> the server can relay an order only after the user has signed it.

1. **Discover:** `get_markets` returns the reserve, narrowed with a `symbols` filter to the asset in question. The ids it returns are what every later stage takes.
2. **Inspect:** `get_reserve_details` for rates, caps and risk parameters. `get_user_summary` for the wallet's position and health factor.
3. **Simulate:** `preview_action` reports what the action would leave behind, and warns when it cannot succeed. Never skip it before a borrow or a withdraw.
4. **Build:** `prepare_action` returns an unsigned transaction, preceded by an approval step where the token needs one.
5. **Sign:** The user's wallet signs and submits. `get_transaction_processed` says when Aave has caught up, which is what a dependent follow-up should wait on.

### Safety

Reads are side-effect-free and `prepare_*` tools commit nothing, so nothing moves until the user signs. [Safety](/mcp/safety) covers the guarantees, the warnings that stop an action, and the reserve flags that block some actions but not others.

## Integrate Aave

### Quick Start

Every call is a `tools/call` with a tool name and its arguments. These are the `params` an agent sends, and [Getting Started](/mcp/getting-started) has the full request envelope.

<tabgroup>
<tab label="Market Data">

```json title="get_markets"
{
  "name": "get_markets",
  "arguments": {
    "version": "all",
    "symbols": ["USDC"]
  }
}
```

One call covers both versions and every chain each of them serves, and the result names those chains under `chainsCovered`.

</tab>
<tab label="Account Data">

```json title="get_user_summary"
{
  "name": "get_user_summary",
  "arguments": {
    "version": "all",
    "user": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
  }
}
```

v4 returns one cross-chain summary with the lowest health factor. v3 has no cross-market aggregate, so it returns an entry per market the wallet holds a position in.

</tab>
<tab label="Supply">

### Simulate

`sender` is the wallet that will sign. `reserveId` is the opaque id from a `get_markets` row, so fetch one first rather than constructing it.

```json title="preview_action"
{
  "name": "preview_action",
  "arguments": {
    "action": "supply",
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "amount": "500",
    "reserveId": "MTo6MHg5NGU3...Ojo1",
    "enableCollateral": true
  }
}
```

### Build

The same arguments with an explicit `version` return the transaction to sign.

```json title="prepare_action"
{
  "name": "prepare_action",
  "arguments": {
    "version": "v4",
    "action": "supply",
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "amount": "500",
    "reserveId": "MTo6MHg5NGU3...Ojo1",
    "enableCollateral": true
  }
}
```

### Sign

The result is an execution plan. `TransactionRequest` is ready for the wallet to sign; an approval step comes back first when the allowance is missing. [Building an Action](/mcp/tools#building-an-action) covers every branch.

</tab>
</tabgroup>
Building in code rather than through an agent? AaveKit covers the same operations.

  <IconCard
    href="/aave-v4/getting-started/react"
    icon="ReactIcon"
    title="React"
  />
  <IconCard
    href="/aave-v4/getting-started/typescript"
    icon="TypescriptIcon"
    title="TypeScript"
  />
  <IconCard
    href="/aave-v4/getting-started/graphql"
    icon="GraphqlIcon"
    title="GraphQL"
  />
