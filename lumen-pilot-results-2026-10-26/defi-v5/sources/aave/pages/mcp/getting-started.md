# Getting Started

Aave MCP is a remote server, so there is nothing to install and no key to manage. Point a client at `https://mcp.aave.com` and the tools appear in the next session.

## Connect a Client

<tabgroup>
<tab label="Claude Code">

```bash
claude mcp add --transport http aave https://mcp.aave.com
```

</tab>
<tab label="Claude">

Open **Settings**, then **Connectors**, then **Add custom connector**, and enter `https://mcp.aave.com`.

</tab>
<tab label="ChatGPT">

Open **Settings**, then **Connectors** in developer mode, and add an MCP server at `https://mcp.aave.com`.

</tab>
<tab label="Cursor">

```json title="~/.cursor/mcp.json"
{
  "mcpServers": {
    "aave": {
      "url": "https://mcp.aave.com"
    }
  }
}
```

</tab>
<tab label="VS Code">

```bash
code --add-mcp '{"name":"aave","type":"http","url":"https://mcp.aave.com"}'
```

</tab>
<tab label="Codex CLI">

```toml title="~/.codex/config.toml"
[mcp_servers.aave]
url = "https://mcp.aave.com"
```

</tab>
<tab label="Other clients">

Every client that takes a remote MCP server asks for the same three values:

| Field          | Value                  |
| :------------- | :--------------------- |
| Server URL     | `https://mcp.aave.com` |
| Authentication | None                   |
| Transport      | Streamable HTTP        |

Choose Streamable HTTP wherever a client offers a transport dropdown. The server answers a `GET` asking for `text/event-stream` with a 405, so a connector configured for SSE never connects.

Perplexity, Mistral Le Chat, Windsurf, Cline, LM Studio and Goose all take those three values, most of them under a settings screen named Connectors or Extensions.

</tab>
</tabgroup>
## Your First Questions

Ask in plain language. None of these need a chain or a market named first.

Read a wallet, or the protocol:

- "What does wallet `0x…` hold on Aave?"
- "Am I net earning or net paying on this position?"
- "Which Aave governance proposals are open for voting, and has each one met quorum?"

Compare venues, rates and history:

- "Where can I earn the most on stablecoins across Aave right now? Tell me what you ruled out and why."
- "I have 10,000 GHO idle. sGHO, or supply it to a market?"
- "Has USDC's supply rate on Ethereum been stable this year?"

Simulate against the position, which commits nothing:

- "What is the health factor of `0x…` and how far can BTC fall before liquidation?"
- "Review what `0x…` holds on Aave v4, then simulate borrowing another 5,000 USDC and show the health factor before and after."
- "Explain e-mode, and tell me whether it would help my position."

Build a transaction to sign:

- "Prepare a borrow of 1,000 USDC for `0x…` on Aave v4."
- "Repay all of my USDC debt."
- "Swap 1 ETH for USDC and show me what it actually costs."

Reads answer with live protocol data. Actions come back as an unsigned transaction for the user to sign in their own wallet.

## Prompts and Guides

Clients that surface MCP prompts get five ready-made workflows: `check_health`, `best_stablecoin_yield`, `prepare_supply`, `gho_savings`, and `review_position`. Their arguments support completion, so a client can offer values as the user types.

The server also carries its own guidance for the model calling it. `get_started` answers a cold turn where the user has not asked for anything specific, and `get_aave_guide` serves one topic at a time:

| Topic                          | Covers                                                        |
| :----------------------------- | :------------------------------------------------------------ |
| `overview`                     | What Aave is and the shape of a typical flow                   |
| `v3`, `v4`                     | What each version needs in order to act                        |
| `positions`, `health-factor`   | The rules that decide whether an action is possible            |
| `risks`                        | What a passive supplier is exposed to                          |
| `ids`, `amounts`, `signing`    | Argument formats and the execution-plan branches               |
| `prices`                       | Whose price every USD figure is, and what follows from that    |
| `swaps`, `gho`, `governance`, `rewards` | The flows that have their own tools                  |
| `tools`, `docs`                | The capability list, and where the protocol documentation lives |

Each topic is also readable as an MCP resource at `aave://guide/<topic>`.

## Call the Server Directly

The MCP endpoint is `POST /`, with `/mcp` as an alias. A plain `GET` there returns the server card as JSON, the same document served at `/.well-known/mcp/server-card.json`. A `GET` that asks for `text/event-stream` gets 405, since the server offers no SSE stream. `GET /health` returns a JSON status.

```bash
curl -s -X POST https://mcp.aave.com/ -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_user_summary","arguments":{"user":"0x...","version":"v4"}}}'
```

`tools/list` on the same endpoint returns every tool with its parameter schema, which is the authority on arguments at any moment.

### Protocol Revisions

The server serves both the 2025-era and 2026-era revisions of the Model Context Protocol, and the 2025 list is what an `initialize` handshake negotiates. Most clients handle this themselves. A client written against the 2026 revision must send the `Mcp-Method` header, and `Mcp-Name` on a `tools/call`, or the request is refused.

### Limits

The endpoint needs no key today. It is a shared service, so cache reads where a client can, poll `get_transaction_processed` and `get_order_status` at a sensible interval rather than in a tight loop, and handle `401` and `429` responses rather than assuming they cannot occur.

## Where to Go Next

  <IconCard
    href="/mcp/tools"
    icon="AppIcon"
    title="Tools"
    description="Every tool, and how to build an action."
  />
  <IconCard
    href="/mcp/safety"
    icon="ShieldIcon"
    title="Safety"
    description="What the server will and will not do."
  />
